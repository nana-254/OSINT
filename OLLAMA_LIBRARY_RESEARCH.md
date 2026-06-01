# Ollama Library API Research

## Ollama Library Structure

### 1. **Official Ollama Library**
- URL: `https://ollama.com/library`
- Models JSON: `https://ollama.com/api/models`
- Model Details: `https://ollama.com/library/{model}`
- Tags/Variants: Available via Ollama API

### 2. **Ollama API Endpoints**
```bash
# List local models
GET http://localhost:11434/api/tags

# Show model info
POST http://localhost:11434/api/show
Body: {"name": "llama3.2"}

# Pull model
POST http://localhost:11434/api/pull
Body: {"name": "llama3.2", "stream": true}

# Generate (to load model)
POST http://localhost:11434/api/generate
Body: {"model": "llama3.2", "prompt": "", "stream": false}

# Running models
GET http://localhost:11434/api/ps
```

### 3. **Open WebUI Approach**
Open WebUI fetches the library from:
- `https://ollama.com/api/models` - Full model list
- Scrapes model pages for details
- Caches model metadata locally

### 4. **Model Metadata Structure**
```json
{
  "name": "llama3.2",
  "description": "Meta's Llama 3.2 model",
  "tags": ["3b", "1b", "latest"],
  "size": "2.0GB",
  "family": "llama",
  "capabilities": ["chat", "instruct"],
  "parameters": "3B",
  "quantization": "Q4_K_M",
  "context_length": 128000,
  "author": "Meta"
}
```

## Implementation Strategy

### Phase 1: Direct Ollama Library Integration
1. Fetch from `https://ollama.com/api/models` or scrape library
2. Cache locally in browser localStorage
3. Enrich with local Ollama API data

### Phase 2: System Detection
```javascript
// Detect system specs
navigator.deviceMemory // RAM in GB
navigator.hardwareConcurrency // CPU cores
// VRAM detection via WebGL
const gl = canvas.getContext('webgl');
const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
```

### Phase 3: Compatibility Calculation
```javascript
function canRunModel(model, systemSpecs) {
  const modelSize = parseSize(model.size);
  const requiredRAM = modelSize * 1.5; // 1.5x for overhead
  return systemSpecs.ram >= requiredRAM;
}
```

## Model Categories
- **Chat**: General conversation models
- **Code**: Programming and code generation
- **Vision**: Image understanding (llava, bakllava)
- **Embedding**: Text embeddings (nomic-embed)
- **Instruct**: Instruction-following models
- **Uncensored**: Unfiltered models
- **Multilingual**: Multi-language support

## Next Steps
1. Create library fetcher module
2. Implement system detection
3. Build compatibility checker
4. Create enhanced UI components
