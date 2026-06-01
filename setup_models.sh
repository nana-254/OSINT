#!/bin/bash

# ==============================================================================
# OSINT Pipeline Model Initialization Script
# ==============================================================================
# Verification Logic:
# - Validates Ollama installation and service status.
# - Pulls llama3.2:3b, llama3.1:8b, and phi3.5:latest directly via Ollama CLI.
# - Automatically handles the Q4 quantization sizes natively defaulted by Ollama for these tags.
# ==============================================================================

set -e

echo "[*] Initializing OSINT Agentic Pipeline Models..."

# Ensure Ollama is running
if ! systemctl is-active --quiet ollama; then
    echo "[!] Ollama service is not running. Attempting to start..."
    sudo systemctl start ollama || { echo "[!] Failed to start Ollama. Ensure it is installed."; exit 1; }
fi

echo "[*] Ollama service is active. Proceeding with model pulls."

# 1. Tier 1: The Conversationalist (llama3.2:3b)
echo "[*] Pulling Tier 1 Model: llama3.2:3b (Handles intent extraction & data parsing)..."
ollama pull llama3.2:3b

# 2. Tier 2: The Architect (llama3.1:8b)
echo "[*] Pulling Tier 2 Model: llama3.1:8b (Handles deep reasoning & OSINT planning)..."
ollama pull llama3.1:8b

# 3. Tier 3: The Validator (phi3.5:latest)
echo "[*] Pulling Tier 3 Model: phi3.5:latest (Handles fact-checking & malicious content scanning)..."
ollama pull phi3.5:latest

echo "[*] Model verification..."
ollama list | grep -E "llama3.2|llama3.1|phi3.5"

echo "[SUCCESS] All required models for the 90-minute OSINT durable loop have been pulled and are ready."
