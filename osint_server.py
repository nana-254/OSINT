from flask import Flask, request, jsonify
import subprocess
import os
import sys
import requests
import json
from functools import lru_cache
import time
import psutil
import datetime

# Import Tor control module
try:
    from tor_control import TorCircuitMonitor, get_tor_circuit_data
    TOR_AVAILABLE = True
except ImportError:
    TOR_AVAILABLE = False

app = Flask(__name__)

# Directory where scripts are located (default to current directory)
SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))

# Ollama API endpoint
OLLAMA_API = os.getenv('OLLAMA_API', 'http://localhost:11434')

@app.route('/osint', methods=['POST'])
def run_osint():
    # Ensure JSON payload is present
    if not request.is_json:
        return jsonify({"error": "Request body must be JSON"}), 400

    data = request.get_json()
    query = data.get('query')
    tool = data.get('tool', 'robin')  # Default tool is robin

    if not query:
        return jsonify({"error": "Missing required parameter: 'query'"}), 400

    # Map request tools to corresponding script files safely
    tool_map = {
        'robin': 'robin_scraper.py',
        'arkham': 'arkham_scraper.py'
    }

    script_name = tool_map.get(tool.lower())
    if not script_name:
        return jsonify({"error": f"Unsupported or invalid tool: '{tool}'"}), 400

    script_path = os.path.join(SCRIPTS_DIR, script_name)

    # Check if script exists
    if not os.path.isfile(script_path):
        return jsonify({"error": f"Script execution target '{script_name}' not found on server"}), 500

    try:
        # Run script with subprocess passing query as arguments safely (shell=False by default)
        # sys.executable ensures we use the same Python interpreter running this Flask app
        result = subprocess.run(
            [sys.executable, script_path, query],
            capture_output=True,
            text=True,
            check=True,
            timeout=60  # Prevent infinite hangs
        )
        return jsonify({
            "status": "success",
            "tool": tool,
            "stdout": result.stdout,
            "stderr": result.stderr
        })
    except subprocess.CalledProcessError as e:
        return jsonify({
            "status": "error",
            "error": "Script execution failed",
            "exit_code": e.returncode,
            "stdout": e.stdout,
            "stderr": e.stderr
        }), 500
    except subprocess.TimeoutExpired:
        return jsonify({
            "status": "error",
            "error": "Script execution timed out"
        }), 504
    except Exception as e:
        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500

# ============================================================================
# OLLAMA API ENDPOINTS
# ============================================================================

@app.route('/api/v1/ollama/models', methods=['GET'])
def get_installed_models():
    """Get list of installed models from Ollama"""
    try:
        resp = requests.get(f'{OLLAMA_API}/api/tags', timeout=5)
        if resp.status_code != 200:
            return jsonify({"error": "Ollama offline", "models": []}), 503
        
        data = resp.json()
        models = data.get('models', [])
        
        # Enrich with metadata
        enriched = []
        for m in models:
            enriched.append({
                'name': m.get('name', ''),
                'model': m.get('model', ''),
                'size': m.get('size', 0),
                'digest': m.get('digest', ''),
                'modified_at': m.get('modified_at', ''),
                'details': m.get('details', {})
            })
        
        return jsonify({"models": enriched})
    except Exception as e:
        return jsonify({"error": str(e), "models": []}), 503

@app.route('/api/v1/ollama/running', methods=['GET'])
def get_running_models():
    """Get list of currently loaded models"""
    try:
        resp = requests.get(f'{OLLAMA_API}/api/ps', timeout=5)
        if resp.status_code != 200:
            return jsonify({"error": "Ollama offline", "models": []}), 503
        
        data = resp.json()
        models = data.get('models', [])
        
        return jsonify({"models": models})
    except Exception as e:
        return jsonify({"error": str(e), "models": []}), 503

@app.route('/api/v1/ollama/library/search', methods=['GET'])
def search_library():
    """Search Ollama library for models"""
    query = request.args.get('q', '').strip()
    if not query or len(query) < 1:
        return jsonify({"models": []})
    
    try:
        # Fetch from Ollama library registry
        resp = requests.get(
            'https://registry.ollama.ai/v2/_catalog',
            timeout=10,
            headers={'Accept': 'application/json'}
        )
        
        if resp.status_code != 200:
            return jsonify({"models": []})
        
        data = resp.json()
        repos = data.get('repositories', [])
        
        # Filter by query
        query_lower = query.lower()
        filtered = [r for r in repos if query_lower in r.lower()][:20]
        
        # Format response
        models = [{'name': r, 'desc': f'Model: {r}'} for r in filtered]
        
        return jsonify({"models": models})
    except Exception as e:
        return jsonify({"models": []})

@app.route('/api/v1/ollama/library/tags', methods=['GET'])
def get_model_tags():
    """Get available tags/variants for a model"""
    model_name = request.args.get('model', '').strip()
    if not model_name:
        return jsonify({"tags": []})
    
    try:
        # Fetch from Ollama library registry
        resp = requests.get(
            f'https://registry.ollama.ai/v2/{model_name}/tags/list',
            timeout=10,
            headers={'Accept': 'application/json'}
        )
        
        if resp.status_code != 200:
            return jsonify({"tags": ["latest"]})
        
        data = resp.json()
        tags = data.get('tags', ['latest'])
        
        return jsonify({"tags": tags})
    except Exception as e:
        return jsonify({"tags": ["latest"]})

@app.route('/api/v1/ollama/pull', methods=['POST'])
def pull_model():
    """Pull a model from Ollama library"""
    if not request.is_json:
        return jsonify({"error": "Request body must be JSON"}), 400
    
    data = request.get_json()
    model_name = data.get('model', '').strip()
    
    if not model_name:
        return jsonify({"error": "Missing model name"}), 400
    
    try:
        # Stream pull response
        resp = requests.post(
            f'{OLLAMA_API}/api/pull',
            json={"name": model_name},
            stream=True,
            timeout=3600  # 1 hour timeout for large models
        )
        
        if resp.status_code != 200:
            return jsonify({"error": "Pull failed"}), 503
        
        def generate():
            for line in resp.iter_lines():
                if line:
                    yield line.decode('utf-8') + '\n'
        
        return generate(), 200, {'Content-Type': 'application/x-ndjson'}
    except Exception as e:
        return jsonify({"error": str(e)}), 503

@app.route('/api/v1/ollama/delete', methods=['POST'])
def delete_model():
    """Delete a model"""
    if not request.is_json:
        return jsonify({"error": "Request body must be JSON"}), 400
    
    data = request.get_json()
    model_name = data.get('model', '').strip()
    
    if not model_name:
        return jsonify({"error": "Missing model name"}), 400
    
    try:
        resp = requests.delete(
            f'{OLLAMA_API}/api/delete',
            json={"name": model_name},
            timeout=30
        )
        
        if resp.status_code != 200:
            return jsonify({"error": "Delete failed"}), 503
        
        return jsonify({"status": "deleted"})
    except Exception as e:
        return jsonify({"error": str(e)}), 503

@app.route('/api/v1/ollama/load', methods=['POST'])
def load_model():
    """Load a model into memory"""
    if not request.is_json:
        return jsonify({"error": "Request body must be JSON"}), 400
    
    data = request.get_json()
    model_name = data.get('model', '').strip()
    
    if not model_name:
        return jsonify({"error": "Missing model name"}), 400
    
    try:
        resp = requests.post(
            f'{OLLAMA_API}/api/generate',
            json={"model": model_name, "prompt": "", "stream": False},
            timeout=60
        )
        
        if resp.status_code != 200:
            return jsonify({"error": "Load failed"}), 503
        
        return jsonify({"status": "loaded"})
    except Exception as e:
        return jsonify({"error": str(e)}), 503

@app.route('/api/v1/ollama/unload', methods=['POST'])
def unload_model():
    """Unload a model from memory"""
    if not request.is_json:
        return jsonify({"error": "Request body must be JSON"}), 400
    
    data = request.get_json()
    model_name = data.get('model', '').strip()
    
    if not model_name:
        return jsonify({"error": "Missing model name"}), 400
    
    try:
        # Send empty prompt with keep_alive=0 to unload
        resp = requests.post(
            f'{OLLAMA_API}/api/generate',
            json={"model": model_name, "prompt": "", "stream": False, "keep_alive": 0},
            timeout=30
        )
        
        if resp.status_code != 200:
            return jsonify({"error": "Unload failed"}), 503
        
        return jsonify({"status": "unloaded"})
    except Exception as e:
        return jsonify({"error": str(e)}), 503

@app.route('/api/v1/system/telemetry', methods=['GET'])
def get_system_telemetry():
    """Get real system telemetry data"""
    try:
        # Boot time
        boot_time = psutil.boot_time()
        uptime_seconds = time.time() - boot_time
        uptime_td = datetime.timedelta(seconds=int(uptime_seconds))
        
        # Load
        load1, load5, load15 = psutil.getloadavg()
        
        # RAM
        virtual_mem = psutil.virtual_memory()
        
        # Temp (best effort)
        temp_c = "N/A"
        if hasattr(psutil, "sensors_temperatures"):
            temps = psutil.sensors_temperatures()
            if temps:
                # Get the first available temperature
                for name, entries in temps.items():
                    if entries:
                        temp_c = f"{int(entries[0].current)}°C"
                        break
        
        return jsonify({
            "uptime": str(uptime_td),
            "load": round(load1, 2),
            "ram_percent": virtual_mem.percent,
            "temp": temp_c
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================================
# TOR INTEGRATION ENDPOINTS
# ============================================================================

@app.route('/api/v1/tor/circuit', methods=['GET'])
def get_tor_circuit():
    """Get current Tor circuit information with real node data"""
    if not TOR_AVAILABLE:
        return jsonify({
            "error": "Tor control module not available",
            "circuits": [],
            "note": "Install tor_control module or check Tor connectivity"
        }), 503
    
    try:
        control_host = request.args.get('host', '127.0.0.1')
        control_port = request.args.get('port', 9051, type=int)
        
        circuit_data = get_tor_circuit_data(control_host, control_port)
        
        if 'error' in circuit_data:
            return jsonify(circuit_data), 503
        
        return jsonify(circuit_data)
    except Exception as e:
        return jsonify({
            "error": str(e),
            "circuits": []
        }), 500

@app.route('/api/v1/tor/status', methods=['GET'])
def get_tor_status():
    """Get Tor daemon status and metrics"""
    if not TOR_AVAILABLE:
        return jsonify({
            "error": "Tor control module not available",
            "connected": False
        }), 503
    
    try:
        control_host = request.args.get('host', '127.0.0.1')
        control_port = request.args.get('port', 9051, type=int)
        
        monitor = TorCircuitMonitor(control_host, control_port)
        
        if not monitor.connect():
            return jsonify({
                "error": "Cannot connect to Tor control port",
                "connected": False,
                "suggestion": f"Check if Tor is running on {control_host}:{control_port}"
            }), 503
        
        try:
            status = monitor.get_status()
            return jsonify({
                **status,
                "connected": True
            })
        finally:
            monitor.close()
    except Exception as e:
        return jsonify({
            "error": str(e),
            "connected": False
        }), 500

@app.route('/api/v1/tor/bridges', methods=['GET', 'POST'])
def manage_tor_bridges():
    """
    Manage Tor bridges (webtunnel and obfs4)
    GET: Returns currently configured bridges
    POST: Add/update bridge configuration
    """
    if request.method == 'GET':
        # Return mock bridge data or parse from torrc
        bridges = {
            "webtunnel": [
                {
                    "addr": "[2001:db8:43cc:d277:5ba1:dcd1:516e:d983]:443",
                    "fingerprint": "AD62C15FAC9C8695F41F4BB5D1F16373F906177F",
                    "url": "https://mitch.pmvl.eu/r9mZqSFwOHSQATtQoPWwZQk9",
                    "version": "0.0.1",
                    "type": "webtunnel"
                },
                {
                    "addr": "[2001:db8:8ed6:e6c9:5fc9:9f20:a373:2374]:443",
                    "fingerprint": "1636A2EFFBAA4B162F5FF461A1663EB55C41AE11",
                    "url": "https://hanoi.delivery/roQFPLtlspWT6yIKeXD6lEci",
                    "version": "0.0.3",
                    "type": "webtunnel"
                }
            ],
            "obfs4": [
                {
                    "addr": "51.83.248.35:25981",
                    "fingerprint": "D08B4760D128C1A65506577E063D9D26C2A71815",
                    "cert": "UJWUh+sIDdOKja/byBM2+qP9AFNl86hkGRFJ/lM1GWKP79eCu3PT4WTXI2gdXYULbQ0EMg",
                    "iat_mode": 0,
                    "type": "obfs4"
                },
                {
                    "addr": "167.235.78.36:40678",
                    "fingerprint": "C8C01639C3333ED20799C69B149641A6568044BC",
                    "cert": "PWxWCoFmK8B+x8WYbgWmTjfXsmRFjL3P5ptPdvzqks7nzMLroLlXc+wG49hpBlF3UG20bA",
                    "iat_mode": 0,
                    "type": "obfs4"
                }
            ]
        }
        
        return jsonify({
            "bridges": bridges,
            "total": len(bridges.get('webtunnel', [])) + len(bridges.get('obfs4', []))
        })
    
    elif request.method == 'POST':
        if not request.is_json:
            return jsonify({"error": "Request body must be JSON"}), 400
        
        data = request.get_json()
        bridge_type = data.get('type', 'obfs4')  # webtunnel or obfs4
        
        if bridge_type not in ['webtunnel', 'obfs4']:
            return jsonify({"error": "Invalid bridge type. Must be 'webtunnel' or 'obfs4'"}), 400
        
        # In a real scenario, this would write to torrc and reload Tor
        # For now, return success acknowledgment
        return jsonify({
            "status": "bridge_configured",
            "type": bridge_type,
            "note": "Bridge configuration would be written to torrc and Tor would be reloaded"
        })

@app.route('/api/v1/tor/relay-info', methods=['GET'])
def get_relay_info():
    """Get detailed information about a specific Tor relay"""
    if not TOR_AVAILABLE:
        return jsonify({
            "error": "Tor control module not available"
        }), 503
    
    fingerprint = request.args.get('fp', '').strip()
    if not fingerprint:
        return jsonify({"error": "Missing fingerprint parameter"}), 400
    
    try:
        control_host = request.args.get('host', '127.0.0.1')
        control_port = request.args.get('port', 9051, type=int)
        
        monitor = TorCircuitMonitor(control_host, control_port)
        
        if not monitor.connect():
            return jsonify({
                "error": "Cannot connect to Tor control port"
            }), 503
        
        try:
            relay_info = monitor.get_relay_info(fingerprint)
            return jsonify(relay_info)
        finally:
            monitor.close()
    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500

if __name__ == '__main__':
    # Listen on localhost (port 5000)
    app.run(host='127.0.0.1', port=5000, debug=True)
