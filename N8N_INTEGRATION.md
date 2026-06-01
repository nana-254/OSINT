# N8N Workflow Integration - OSINT Model Hub

## Overview
The Ollama Models page is designed to integrate seamlessly with the **OSINT** n8n workflow. All model operations are centralized through the Flask backend API.

## Webhook Endpoints

### Model Operations Webhook
All model operations can be triggered from n8n workflows:

```
POST http://localhost:5000/api/v1/ollama/pull
POST http://localhost:5000/api/v1/ollama/load
POST http://localhost:5000/api/v1/ollama/unload
POST http://localhost:5000/api/v1/ollama/delete
```

## N8N Workflow Nodes

### 1. Pull Model Node
Trigger a model download from n8n:

```json
{
  "method": "POST",
  "url": "http://localhost:5000/api/v1/ollama/pull",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "model": "llama3.2:1b"
  }
}
```

**Response**: Streams NDJSON progress events
```json
{"status":"pulling","digest":"sha256:abc...","completed":1024,"total":2048}
{"status":"verifying sha256 digest"}
{"status":"writing manifest"}
{"status":"success"}
```

### 2. Load Model Node
Load a model into VRAM:

```json
{
  "method": "POST",
  "url": "http://localhost:5000/api/v1/ollama/load",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "model": "llama3.2:1b"
  }
}
```

**Response**:
```json
{"status":"loaded"}
```

### 3. Unload Model Node
Unload a model from VRAM:

```json
{
  "method": "POST",
  "url": "http://localhost:5000/api/v1/ollama/unload",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "model": "llama3.2:1b"
  }
}
```

**Response**:
```json
{"status":"unloaded"}
```

### 4. Delete Model Node
Delete a model:

```json
{
  "method": "POST",
  "url": "http://localhost:5000/api/v1/ollama/delete",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "model": "llama3.2:1b"
  }
}
```

**Response**:
```json
{"status":"deleted"}
```

### 5. Get Installed Models Node
List all installed models:

```json
{
  "method": "GET",
  "url": "http://localhost:5000/api/v1/ollama/models"
}
```

**Response**:
```json
{
  "models": [
    {
      "name": "llama3.2:1b",
      "model": "llama3.2:1b",
      "size": 1396818944,
      "digest": "sha256:abc123...",
      "modified_at": "2024-06-01T10:42:05Z",
      "details": {
        "parameter_size": "1B",
        "quantization_level": "Q4_0"
      }
    }
  ]
}
```

### 6. Get Running Models Node
List currently loaded models:

```json
{
  "method": "GET",
  "url": "http://localhost:5000/api/v1/ollama/running"
}
```

**Response**:
```json
{
  "models": [
    {
      "name": "llama3.2:1b",
      "model": "llama3.2:1b",
      "size": 1396818944,
      "size_vram": 1396818944,
      "expires_at": "2024-06-01T11:42:05Z"
    }
  ]
}
```

### 7. Search Library Node
Search for models in Ollama library:

```json
{
  "method": "GET",
  "url": "http://localhost:5000/api/v1/ollama/library/search?q=llama"
}
```

**Response**:
```json
{
  "models": [
    {
      "name": "llama3.2",
      "desc": "Meta's latest Llama 3.2 model"
    },
    {
      "name": "llama3.1",
      "desc": "Meta's Llama 3.1 model"
    }
  ]
}
```

### 8. Get Model Tags Node
Get available variants for a model:

```json
{
  "method": "GET",
  "url": "http://localhost:5000/api/v1/ollama/library/tags?model=llama3.2"
}
```

**Response**:
```json
{
  "tags": ["latest", "1b", "3b", "8b", "70b"]
}
```

## Example N8N Workflow: Auto-Pull Models

```
[Trigger] → [Get Model List] → [Filter Missing] → [Pull Each] → [Notify]
```

### Step 1: Trigger
Manual trigger or schedule

### Step 2: Get Model List
HTTP Request to `/api/v1/ollama/models`

### Step 3: Filter Missing
JavaScript node to filter models not yet installed

### Step 4: Pull Each
Loop through missing models and call `/api/v1/ollama/pull`

### Step 5: Notify
Send notification when complete

## Error Handling

All endpoints return error responses:

```json
{
  "error": "Model not found",
  "status": 503
}
```

Common errors:
- **503**: Ollama offline or unreachable
- **400**: Missing required parameters
- **500**: Server error

## Performance Considerations

- **Pull Operations**: Can take minutes to hours depending on model size
- **Streaming**: Use streaming for pull operations to get real-time progress
- **Timeouts**: Set n8n timeout to 3600s (1 hour) for large models
- **Concurrency**: Only one pull operation at a time (enforced by frontend)

## Security Notes

- All endpoints are local-only (localhost:5000)
- No authentication required (assumes trusted network)
- For production, add authentication layer
- Consider rate limiting for library search

## Workflow Best Practices

1. **Always check if model exists** before pulling
2. **Load model before using** in inference
3. **Unload when done** to free VRAM
4. **Monitor VRAM usage** to prevent OOM
5. **Use appropriate model size** for available resources

## Example: Conditional Model Loading

```
[Start] → [Check if model loaded] → 
  [If not loaded] → [Pull model] → [Load model] →
  [Use model] → [Unload] → [End]
```

## Debugging

Enable logging in Flask:
```python
app.logger.setLevel(logging.DEBUG)
```

Check Ollama logs:
```bash
ollama logs
```

Monitor VRAM:
```bash
ollama ps
```

## Integration Checklist

- [ ] Flask server running on port 5000
- [ ] Ollama running on port 11434
- [ ] N8N can reach Flask API
- [ ] Test pull endpoint with small model
- [ ] Test load/unload endpoints
- [ ] Monitor VRAM during operations
- [ ] Set up error handling in workflows
- [ ] Document model requirements
- [ ] Create backup/restore procedures
- [ ] Set up monitoring/alerts

## Future Enhancements

- [ ] Batch pull operations
- [ ] Model scheduling (pull at specific times)
- [ ] Automatic model cleanup (delete old versions)
- [ ] Model performance metrics
- [ ] Integration with inference endpoints
- [ ] Model versioning and rollback
