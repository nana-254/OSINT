from flask import Flask, request, jsonify
import subprocess
import os
import sys
import requests
import json
from functools import lru_cache
import time

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

if __name__ == '__main__':
    # Listen on localhost (port 5000)
    app.run(host='127.0.0.1', port=5000, debug=True)
