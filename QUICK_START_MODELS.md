# Quick Start - Ollama Models Page

## Prerequisites

1. **Ollama Running**
   ```bash
   ollama serve
   ```
   Default: `http://localhost:11434`

2. **Flask Server Running**
   ```bash
   cd /home/nana/Desktop/OSINT
   pip install -r requirements.txt
   python osint_server.py
   ```
   Default: `http://localhost:5000`

3. **Web UI**
   Open browser to your OSINT web interface and navigate to **OLLAMA MODELS** tab

## First Time Setup

### 1. Check Connection
- You should see the models page load
- If you see "OLLAMA OFFLINE" banner, check:
  - Ollama is running: `ollama serve`
  - Port is correct: `http://localhost:11434`
  - No firewall blocking

### 2. Pull Your First Model
- Search for a model: type "llama" in search box
- Click on "llama3.2" from results
- Click "PULL" button
- Watch the progress bar fill up
- Model will appear in "INSTALLED" list when done

### 3. Load a Model
- Find the model in "INSTALLED" list
- Click "⬇ LOAD" button
- Watch VRAM ring fill up on the right
- Model name appears in "PRIMARY" section

### 4. Use the Model
- Model is now ready for inference
- Use it in chat or other features
- VRAM shows how much memory it's using

### 5. Unload When Done
- Click "⬆ UNLOAD" button
- VRAM ring empties
- Model stays installed but not in memory

## Common Tasks

### Search for a Model
```
1. Type model name in search box
2. Results appear instantly
3. Click result to see variants
4. Click PULL to download
```

### View Model Details
```
1. Click on any installed model
2. Drawer opens showing:
   - Model family icon
   - Parameter size
   - Available variants
   - One-click pull for variants
```

### Sort Installed Models
```
Click one of the sort buttons:
- NAME: Alphabetical order
- SIZE: Largest to smallest
- DATE: Newest first
```

### Filter Installed Models
```
Type in the filter box to search installed models
Example: "llama" shows only llama models
```

### Monitor VRAM Usage
```
Right panel shows:
- VRAM ring: Current usage percentage
- PRIMARY: Currently loaded model
- MEMORY: How much VRAM it's using
- EXPIRES: When it will auto-unload
- ALL LOADED: Other models in memory
```

### Delete a Model
```
1. Click DELETE button on model card
2. Confirm in modal
3. Model removed from disk
```

## Popular Models to Try

### Small & Fast (1-3B)
- `llama3.2:1b` - Ultra-fast, good for edge
- `phi3:mini` - Microsoft's lightweight model
- `tinyllama:latest` - Compact assistant

### Balanced (7-8B)
- `llama3.2:3b` - Great speed/quality balance
- `mistral:7b` - Fast and capable
- `qwen2.5:7b` - Multilingual

### Powerful (13-14B)
- `llama3.1:8b` - Versatile and reliable
- `phi4:latest` - Strong reasoning
- `qwen2.5-coder:7b` - Code specialist

### Reasoning (7-32B)
- `deepseek-r1:7b` - Chain-of-thought reasoning
- `deepseek-r1:32b` - Advanced reasoning
- `phi4:latest` - Math and logic

### Vision (7-13B)
- `llava:7b` - Image understanding
- `llava-llama3:8b` - Better vision
- `moondream:1.8b` - Lightweight vision

### Code (7-14B)
- `qwen2.5-coder:7b` - Best code model
- `codellama:7b` - Meta's code specialist
- `starcoder2:7b` - BigCode model

## Troubleshooting

### "OLLAMA OFFLINE"
```
1. Check Ollama is running: ollama serve
2. Check port: http://localhost:11434
3. Click RETRY button
```

### Pull Fails
```
1. Check disk space: df -h
2. Check internet connection
3. Try smaller model first
4. Check Ollama logs: ollama logs
```

### Model Won't Load
```
1. Check available VRAM: nvidia-smi
2. Unload other models first
3. Try smaller model
4. Restart Ollama: killall ollama && ollama serve
```

### VRAM Not Updating
```
1. Refresh page: F5
2. Click refresh button in VRAM panel
3. Check if model actually loaded: ollama ps
```

### Search Not Working
```
1. Check internet connection (library search needs it)
2. Try searching for exact model name
3. Refresh page and try again
```

## Performance Tips

### Optimize for Speed
1. Use smaller models (1-3B)
2. Unload models when not in use
3. Use quantized versions (Q4, Q5)
4. Monitor VRAM usage

### Optimize for Quality
1. Use larger models (13-70B)
2. Load one model at a time
3. Use full precision versions
4. Increase context window

### Optimize for Memory
1. Use smallest model that works
2. Unload immediately after use
3. Use quantized versions
4. Monitor with `ollama ps`

## Advanced Usage

### Pull Specific Variant
```
Search for "llama3.2" → Click result → See variants
- latest: Default version
- 1b: 1 billion parameters
- 3b: 3 billion parameters
- 8b: 8 billion parameters
- 70b: 70 billion parameters
```

### Batch Operations
```
1. Pull multiple models
2. Load one at a time
3. Use in workflows
4. Unload when done
```

### Monitor with CLI
```bash
# List installed models
ollama list

# See running models
ollama ps

# Check model details
ollama show llama3.2:1b

# View logs
ollama logs
```

## System Requirements

### Minimum
- 4GB RAM
- 2GB disk space
- CPU: Any modern processor

### Recommended
- 16GB RAM
- 50GB disk space
- GPU: NVIDIA with CUDA support

### For Large Models (70B+)
- 64GB+ RAM
- 200GB+ disk space
- GPU: High-end NVIDIA (A100, H100)

## Next Steps

1. **Try different models** to find what works best
2. **Integrate with workflows** using n8n
3. **Monitor performance** and optimize
4. **Set up automation** for model management
5. **Create backups** of important models

## Getting Help

### Check Logs
```bash
# Flask logs
tail -f /tmp/osint_server.log

# Ollama logs
ollama logs

# Browser console
F12 → Console tab
```

### Common Issues
- Model not showing: Refresh page
- Pull stuck: Check internet, restart Ollama
- VRAM full: Unload models, restart
- Slow performance: Use smaller model

### Resources
- Ollama docs: https://ollama.ai
- Model library: https://ollama.ai/library
- N8N docs: https://docs.n8n.io
- OSINT docs: See README.md

## Tips & Tricks

1. **Use keyboard shortcuts**
   - Ctrl+K: Focus search
   - Escape: Close drawer
   - Enter: Pull model

2. **Batch pull models**
   - Pull multiple small models
   - Load one at a time
   - Rotate based on task

3. **Monitor VRAM**
   - Check ring percentage
   - Unload before pulling large model
   - Use `ollama ps` to verify

4. **Optimize for your hardware**
   - Small models for CPU-only
   - Medium models for 8GB VRAM
   - Large models for 24GB+ VRAM

5. **Keep models organized**
   - Use consistent naming
   - Delete unused models
   - Monitor disk usage

## Performance Benchmarks

### Pull Speed (Mbps)
- Fiber: 50-100 Mbps
- Cable: 20-50 Mbps
- DSL: 5-20 Mbps

### Model Load Time
- 1B model: <1 second
- 7B model: 2-5 seconds
- 13B model: 5-10 seconds
- 70B model: 30-60 seconds

### Inference Speed (tokens/sec)
- CPU: 1-5 tokens/sec
- GPU (8GB): 10-50 tokens/sec
- GPU (24GB): 50-200 tokens/sec

## Maintenance

### Weekly
- Check disk usage
- Monitor VRAM patterns
- Review logs for errors

### Monthly
- Delete unused models
- Update Ollama
- Backup important models

### Quarterly
- Performance review
- Optimize model selection
- Plan capacity upgrades

---

**Happy modeling! 🚀**
