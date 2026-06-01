import os
import sys
import time
import json
import re
import threading
import subprocess
import urllib.request
import urllib.error
from flask import Flask, request, jsonify, Response, send_from_directory

app = Flask(__name__, static_folder='static', static_url_path='')

# --- UI ROUTES ---
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

# --- CORS MIDDLEWARE & PREFLIGHTS ---
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS'
    return response

@app.route('/<path:path>', methods=['OPTIONS'])
def handle_options(path):
    return '', 200

# --- CONFIGURATION ---
TIMEOUT_SECONDS = 180

TOOL_CONFIG = {
    "darkgpt": {
        "port": 5001,
        "env": {},
        "validate_query": True
    },
    "perplexity": {
        "port": 5002,
        "env": {},
        "validate_query": False
    },
    "robin": {
        "port": 5003,
        "env": {
            "HTTP_PROXY": "socks5h://localhost:9050",
            "HTTPS_PROXY": "socks5h://localhost:9050"
        },
        "validate_query": False
    },
    "arkhammirror": {
        "port": 5004,
        "env": {},
        "validate_query": False
    }
}

# --- GLOBAL TELEMETRY STATE ---
class TelemetryState:
    def __init__(self):
        self.lock = threading.Lock()
        self.active_project = None
        self.current_port = None
        self.start_time = None
        self.last_console_line = ""

    def reset(self):
        with self.lock:
            self.active_project = None
            self.current_port = None
            self.start_time = None
            self.last_console_line = ""

    def set_active(self, project, port):
        with self.lock:
            self.active_project = project
            self.current_port = port
            self.start_time = time.time()
            self.last_console_line = "Initializing..."

    def update_log(self, line):
        with self.lock:
            self.last_console_line = line

    def get_state(self):
        with self.lock:
            duration = int(time.time() - self.start_time) if self.start_time else 0
            return {
                "active_project": self.active_project,
                "current_port": self.current_port,
                "runtime_duration_seconds": duration,
                "last_console_line": self.last_console_line
            }

state = TelemetryState()

# --- UTILITIES ---
def validate_darkgpt_query(query):
    """
    Strict validation: alphanumeric, spaces, hyphens, periods, commas.
    Prevents shell injection or complex malicious parameters.
    """
    if not re.match(r'^[\w\s\-\.,]+$', query):
        return False
    return True

def stream_reader(pipe, log_list):
    """Reads lines from a pipe, updates global state, and appends to log_list."""
    try:
        for line in iter(pipe.readline, ''):
            if line:
                stripped = line.strip()
                log_list.append(stripped)
                state.update_log(stripped)
    finally:
        try:
            pipe.close()
        except Exception:
            pass

# --- ENDPOINTS ---
@app.route('/api/v1/telemetry', methods=['GET'])
def telemetry():
    return jsonify(state.get_state()), 200

@app.route('/api/v1/execute', methods=['POST'])
def execute():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400

    tool = data.get('tool')
    query = data.get('query')
    session_id = data.get('session_id', 'unknown')

    if not tool or not query:
        return jsonify({"error": "Missing 'tool' or 'query' parameters"}), 400

    if tool not in TOOL_CONFIG:
        return jsonify({"error": f"Unknown tool profile: {tool}"}), 400

    config = TOOL_CONFIG[tool]

    # Validate DarkGPT
    if config.get("validate_query") and not validate_darkgpt_query(query):
        return jsonify({"error": "Query failed security validation for DarkGPT"}), 400

    # Ensure memory preservation: lock the engine so only 1 tool runs
    with state.lock:
        if state.active_project is not None:
            return jsonify({"error": "Another project is currently active. Engine locked for memory preservation."}), 409

    # Set active state
    state.set_active(tool, config["port"])

    # Prepare subprocess environment
    env = os.environ.copy()
    if config["env"]:
        env.update(config["env"])
    
    # Explicitly set PORT for the tool to pick up internally
    env["PORT"] = str(config["port"])

    # Define the command to run. 
    # NOTE: Since the exact entrypoints of the 4 local OSINT projects are unknown, 
    # we assume they are Python modules in a `bots` directory for this architecture. 
    # You can easily change this list to match actual binary paths or bash scripts.
    cmd = [sys.executable, "-m", f"bots.{tool}", "--query", query, "--session_id", session_id]

    log_capture = []
    process = None
    status = "failed"
    extracted_payload = {}
    
    try:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT, # Merge stderr into stdout
            text=True,
            bufsize=1, # Line buffered
            env=env
        )

        # Start background thread to read stdout without blocking the wait()
        reader_thread = threading.Thread(target=stream_reader, args=(process.stdout, log_capture))
        reader_thread.daemon = True
        reader_thread.start()

        # Wait with strict timeout (180s)
        process.wait(timeout=TIMEOUT_SECONDS)
        
        # If we reach here, process exited naturally before timeout
        reader_thread.join(timeout=2.0)
        
        if process.returncode == 0:
            status = "success"
        else:
            status = "failed"
            state.update_log(f"Process exited with error code {process.returncode}")

    except subprocess.TimeoutExpired:
        status = "timeout"
        state.update_log(f"ERROR: Process hit maximum timeout limit ({TIMEOUT_SECONDS}s). Terminating.")
    
    except Exception as e:
        status = "failed"
        state.update_log(f"System Exception: {str(e)}")
        log_capture.append(f"System Exception: {str(e)}")
    
    finally:
        # ROBUST TEARDOWN & CLEANUP
        if process:
            try:
                # 1. Attempt graceful termination
                process.terminate()
                process.wait(timeout=3.0) 
            except subprocess.TimeoutExpired:
                # 2. Force kill if zombie process persists
                try:
                    process.kill()
                    process.wait(timeout=1.0)
                except Exception:
                    pass
            except Exception:
                pass
        
        # Try parsing final logs as JSON for clean payload extraction
        raw_logs_str = "\n".join(log_capture)
        if log_capture:
            # Look at the very last line, or reverse traverse, to find standard JSON outputs
            last_line = log_capture[-1]
            try:
                extracted_payload = json.loads(last_line)
            except json.JSONDecodeError:
                # It's not valid JSON, leave payload empty and pass raw_logs directly
                extracted_payload = {}

        # Hard reset global telemetry state
        state.reset()

    # Data Normalization Layer
    response = {
        "status": status,
        "project_executed": tool,
        "session_id": session_id,
        "extracted_payload": extracted_payload,
        "raw_logs": raw_logs_str
    }
    
    # Accurate HTTP Status Codes
    if status == "success":
        http_code = 200
    elif status == "timeout":
        http_code = 504 # Gateway Timeout
    else:
        http_code = 500 # Internal Server Error

    return jsonify(response), http_code

# --- OLLAMA INTEGRATION ENDPOINTS ---
OLLAMA_BASE_URL = os.environ.get("OLLAMA_HOST", "http://localhost:11434")

def query_ollama(endpoint, method="GET", data=None):
    url = f"{OLLAMA_BASE_URL}{endpoint}"
    req = urllib.request.Request(url, method=method)
    if data is not None:
        req.add_header('Content-Type', 'application/json')
        jsondata = json.dumps(data).encode('utf-8')
        req.data = jsondata
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            return response.status, json.loads(response.read().decode('utf-8'))
    except urllib.error.URLError as e:
        return 503, {"error": f"Ollama offline: {str(e)}"}
    except Exception as e:
        return 500, {"error": str(e)}

@app.route('/api/v1/ollama/models', methods=['GET'])
def get_models():
    status, res = query_ollama("/api/tags")
    return jsonify(res), status

@app.route('/api/v1/ollama/running', methods=['GET'])
def get_running_models():
    status, res = query_ollama("/api/ps")
    return jsonify(res), status

@app.route('/api/v1/ollama/pull', methods=['GET'])
def pull_model():
    model_name = request.args.get('name')
    if not model_name:
        return jsonify({"error": "Missing model name"}), 400
        
    def generate():
        url = f"{OLLAMA_BASE_URL}/api/pull"
        req = urllib.request.Request(url, method="POST")
        req.add_header('Content-Type', 'application/json')
        jsondata = json.dumps({"name": model_name}).encode('utf-8')
        req.data = jsondata
        try:
            with urllib.request.urlopen(req, timeout=600) as response:
                while True:
                    line = response.readline()
                    if not line:
                        break
                    yield f"data: {line.decode('utf-8').strip()}\n\n"
        except urllib.error.URLError as e:
            yield f"data: {json.dumps({'status': 'error', 'error': f'Ollama offline: {str(e)}'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'status': 'error', 'error': str(e)})}\n\n"
            
    return Response(generate(), mimetype='text/event-stream')

@app.route('/api/v1/ollama/load', methods=['POST'])
def load_model():
    data = request.get_json(silent=True) or {}
    model_name = data.get('name')
    if not model_name:
        return jsonify({"error": "Missing model name"}), 400
    
    payload = {
        "model": model_name,
        "prompt": "",
        "keep_alive": "5m"
    }
    status, res = query_ollama("/api/generate", method="POST", data=payload)
    if status == 200:
        return jsonify({"status": "success", "message": f"Model {model_name} loaded successfully"}), 200
    return jsonify(res), status

@app.route('/api/v1/ollama/unload', methods=['POST'])
def unload_model():
    data = request.get_json(silent=True) or {}
    model_name = data.get('name')
    if not model_name:
        return jsonify({"error": "Missing model name"}), 400
        
    payload = {
        "model": model_name,
        "prompt": "",
        "keep_alive": 0
    }
    status, res = query_ollama("/api/generate", method="POST", data=payload)
    if status == 200:
        return jsonify({"status": "success", "message": f"Model {model_name} unloaded successfully"}), 200
    return jsonify(res), status

@app.route('/api/v1/ollama/delete', methods=['DELETE'])
def delete_model():
    data = request.get_json(silent=True) or {}
    model_name = data.get('name')
    if not model_name:
        return jsonify({"error": "Missing model name"}), 400
        
    status, res = query_ollama("/api/delete", method="DELETE", data={"name": model_name})
    if status == 200:
        return jsonify({"status": "success", "message": f"Model {model_name} deleted successfully"}), 200
    return jsonify(res), status

@app.route('/api/v1/ollama/library/search', methods=['GET'])
def search_ollama_library():
    query = request.args.get('q', '')
    if not query:
        try:
            req = urllib.request.Request("https://ollama.com/v1/models")
            with urllib.request.urlopen(req, timeout=5) as response:
                data = json.loads(response.read().decode('utf-8'))
                models = [{"name": m["id"], "desc": "Official Ollama Library Model", "family": "unknown", "caps": []} for m in data.get("data", [])]
                return jsonify({"models": models})
        except Exception:
            return jsonify({"models": []})
    
    try:
        req = urllib.request.Request(f"https://ollama.com/search?q={urllib.parse.quote(query)}")
        with urllib.request.urlopen(req, timeout=5) as response:
            html = response.read().decode('utf-8')
            model_names = set(re.findall(r'href="/library/([^"]+)"', html))
            models = []
            for name in model_names:
                models.append({
                    "name": name,
                    "desc": f"Library model: {name}",
                    "family": "unknown",
                    "caps": []
                })
            return jsonify({"models": models[:15]})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/v1/ollama/library/tags', methods=['GET'])
def get_ollama_tags():
    model = request.args.get('model', '')
    if not model:
        return jsonify({"tags": []})
    try:
        req = urllib.request.Request(f"https://ollama.com/library/{model}/tags")
        with urllib.request.urlopen(req, timeout=5) as response:
            html = response.read().decode('utf-8')
            tags = set(re.findall(f'href="/library/{model}:([^"]+)"', html))
            if not tags:
                tags = ["latest"]
            return jsonify({"tags": list(tags)})
    except Exception:
        return jsonify({"tags": ["latest"]})

if __name__ == '__main__':
    # Start the Controller Hub
    print(f"[*] OSINT Controller Bridge initializing on http://0.0.0.0:5000")
    print(f"[*] Memory Preservation Engine: ACTIVE (Maximum 1 concurrent tool)")
    print(f"[*] Max Execution Timeout: {TIMEOUT_SECONDS}s")
    
    # Run Flask server. Threaded=True allows the execute endpoint to block 
    # while the telemetry endpoint serves parallel requests.
    app.run(host='0.0.0.0', port=5000, threaded=True)
