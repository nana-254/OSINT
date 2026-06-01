#!/bin/bash
# Tactical OSINT Start Script

echo "Starting OSINT Backend Infrastructure..."
sg docker -c "docker compose -f /home/nana/Desktop/OSINT/docker-compose.yml up -d"

echo "Checking Ollama Service..."
if ! systemctl is-active --quiet ollama; then
    echo "Starting Ollama natively..."
    sudo systemctl start ollama
fi

echo "Starting Controller Bridge & UI Server..."
# Kill any existing controller process on port 5000
fuser -k 5000/tcp 2>/dev/null

# Activate venv and run controller bridge
cd /home/nana/Desktop/OSINT
source .venv/bin/activate
nohup python -u controller_bridge.py > controller.log 2>&1 &

echo "================================================="
echo "ALL SYSTEMS ONLINE!"
echo "UI is accessible at: http://localhost:5000"
echo "n8n is accessible at: http://localhost:5678"
echo "Ollama is running on: http://localhost:11434"
echo "================================================="
