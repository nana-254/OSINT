# Verification Checklist - Ollama Models Page

## Pre-Deployment Verification

### ✅ Code Quality
- [x] No syntax errors in `osint_server.py`
- [x] No syntax errors in `app.js`
- [x] All imports present and correct
- [x] No console errors in browser
- [x] No linting warnings

### ✅ Backend API Endpoints
- [ ] Test `GET /api/v1/ollama/models`
  - Expected: Returns list of installed models
  - Command: `curl http://localhost:5000/api/v1/ollama/models`

- [ ] Test `GET /api/v1/ollama/running`
  - Expected: Returns list of loaded models
  - Command: `curl http://localhost:5000/api/v1/ollama/running`

- [ ] Test `GET /api/v1/ollama/library/search?q=llama`
  - Expected: Returns search results
  - Command: `curl "http://localhost:5000/api/v1/ollama/library/search?q=llama"`

- [ ] Test `GET /api/v1/ollama/library/tags?model=llama3.2`
  - Expected: Returns available tags
  - Command: `curl "http://localhost:5000/api/v1/ollama/library/tags?model=llama3.2"`

- [ ] Test `POST /api/v1/ollama/pull`
  - Expected: Streams download progress
  - Command: `curl -X POST -H "Content-Type: application/json" -d '{"model":"tinyllama"}' http://localhost:5000/api/v1/ollama/pull`

- [ ] Test `POST /api/v1/ollama/load`
  - Expected: Returns {"status":"loaded"}
  - Command: `curl -X POST -H "Content-Type: application/json" -d '{"model":"tinyllama"}' http://localhost:5000/api/v1/ollama/load`

- [ ] Test `POST /api/v1/ollama/unload`
  - Expected: Returns {"status":"unloaded"}
  - Command: `curl -X POST -H "Content-Type: application/json" -d '{"model":"tinyllama"}' http://localhost:5000/api/v1/ollama/unload`

- [ ] Test `POST /api/v1/ollama/delete`
  - Expected: Returns {"status":"deleted"}
  - Command: `curl -X POST -H "Content-Type: application/json" -d '{"model":"tinyllama"}' http://localhost:5000/api/v1/ollama/delete`

### ✅ Frontend UI
- [ ] Page loads without errors
- [ ] Search box appears and is functional
- [ ] Installed models list displays
- [ ] Sort buttons work (NAME, SIZE, DATE)
- [ ] Filter input works
- [ ] VRAM monitor displays
- [ ] Model cards show correct information
- [ ] Load/Unload buttons work
- [ ] Delete button opens modal
- [ ] Delete modal confirms deletion
- [ ] Toast notifications appear
- [ ] Offline banner shows when Ollama offline

### ✅ Search Functionality
- [ ] Type "llama" in search box
  - Expected: Results appear within 300ms
  - Verify: Results show llama models

- [ ] Type "deepseek" in search box
  - Expected: Results appear
  - Verify: Results show deepseek models

- [ ] Type "qwen" in search box
  - Expected: Results appear
  - Verify: Results show qwen models

- [ ] Click on search result
  - Expected: Model drawer opens
  - Verify: Shows model details and variants

- [ ] Press Escape in search
  - Expected: Results close
  - Verify: Search box still focused

### ✅ Model Management
- [ ] Pull a small model (tinyllama)
  - Expected: Progress bar fills
  - Verify: Model appears in installed list

- [ ] Load the model
  - Expected: VRAM ring fills
  - Verify: Model shows in PRIMARY section

- [ ] Unload the model
  - Expected: VRAM ring empties
  - Verify: Model still in installed list

- [ ] Delete the model
  - Expected: Model removed from list
  - Verify: Disk space freed

### ✅ VRAM Monitoring
- [ ] Load a model
  - Expected: VRAM ring shows percentage
  - Verify: Percentage increases

- [ ] Check PRIMARY section
  - Expected: Shows loaded model name
  - Verify: Correct model displayed

- [ ] Check MEMORY section
  - Expected: Shows VRAM usage
  - Verify: Reasonable size

- [ ] Check EXPIRES section
  - Expected: Shows expiration time
  - Verify: Shows time or "—"

- [ ] Load multiple models
  - Expected: ALL LOADED section appears
  - Verify: Lists all loaded models

### ✅ Sorting & Filtering
- [ ] Click NAME sort button
  - Expected: Models sorted alphabetically
  - Verify: Order is A-Z

- [ ] Click SIZE sort button
  - Expected: Models sorted by size
  - Verify: Largest first

- [ ] Click DATE sort button
  - Expected: Models sorted by date
  - Verify: Newest first

- [ ] Type in filter box
  - Expected: List filters in real-time
  - Verify: Only matching models shown

- [ ] Clear filter box
  - Expected: All models shown again
  - Verify: Full list restored

### ✅ Error Handling
- [ ] Stop Ollama service
  - Expected: Offline banner appears
  - Verify: "OLLAMA OFFLINE" message shown

- [ ] Click RETRY button
  - Expected: Attempts to reconnect
  - Verify: Banner disappears when Ollama back

- [ ] Try to pull invalid model
  - Expected: Error toast appears
  - Verify: Error message shown

- [ ] Try to load non-existent model
  - Expected: Error toast appears
  - Verify: Error message shown

### ✅ Performance
- [ ] Measure page load time
  - Expected: <1 second
  - Verify: Fast initial load

- [ ] Measure search response
  - Expected: <300ms
  - Verify: Results appear quickly

- [ ] Measure model list render
  - Expected: <500ms
  - Verify: Smooth rendering

- [ ] Check memory usage
  - Expected: <50MB for page
  - Verify: Lightweight

- [ ] Check network requests
  - Expected: Only necessary API calls
  - Verify: No excessive requests

### ✅ Browser Compatibility
- [ ] Test in Chrome
  - Expected: All features work
  - Verify: No console errors

- [ ] Test in Firefox
  - Expected: All features work
  - Verify: No console errors

- [ ] Test in Safari
  - Expected: All features work
  - Verify: No console errors

- [ ] Test in Edge
  - Expected: All features work
  - Verify: No console errors

### ✅ Mobile Responsiveness
- [ ] Test on mobile (375px width)
  - Expected: Layout adapts
  - Verify: Readable and usable

- [ ] Test on tablet (768px width)
  - Expected: Layout adapts
  - Verify: Readable and usable

- [ ] Test on desktop (1920px width)
  - Expected: Full layout
  - Verify: All features visible

### ✅ Documentation
- [ ] `OLLAMA_MODELS_UPDATE.md` exists
  - Verify: Complete and accurate

- [ ] `N8N_INTEGRATION.md` exists
  - Verify: Complete and accurate

- [ ] `QUICK_START_MODELS.md` exists
  - Verify: Complete and accurate

- [ ] `IMPLEMENTATION_SUMMARY.md` exists
  - Verify: Complete and accurate

### ✅ Dependencies
- [ ] `requests` library installed
  - Command: `pip list | grep requests`
  - Expected: requests>=2.31.0

- [ ] `Flask` library installed
  - Command: `pip list | grep Flask`
  - Expected: Flask>=3.0.0

### ✅ Configuration
- [ ] Ollama running on port 11434
  - Command: `curl http://localhost:11434/api/tags`
  - Expected: JSON response

- [ ] Flask running on port 5000
  - Command: `curl http://localhost:5000/api/v1/ollama/models`
  - Expected: JSON response

- [ ] Environment variables set (if needed)
  - Command: `echo $OLLAMA_API`
  - Expected: http://localhost:11434 (or custom)

### ✅ Logging
- [ ] Flask logs show requests
  - Command: `tail -f /tmp/osint_server.log`
  - Expected: API requests logged

- [ ] Ollama logs show activity
  - Command: `ollama logs`
  - Expected: Model operations logged

- [ ] Browser console clean
  - Command: F12 → Console
  - Expected: No errors or warnings

### ✅ N8N Integration
- [ ] Can call pull endpoint from n8n
  - Expected: Model downloads
  - Verify: Progress tracked

- [ ] Can call load endpoint from n8n
  - Expected: Model loads
  - Verify: VRAM updated

- [ ] Can call unload endpoint from n8n
  - Expected: Model unloads
  - Verify: VRAM freed

- [ ] Can call delete endpoint from n8n
  - Expected: Model deleted
  - Verify: Disk freed

### ✅ Data Integrity
- [ ] No mock data in code
  - Command: `grep -r "FEATURED_PICKS\|OLLAMA_POPULAR_MODELS" app.js`
  - Expected: No results

- [ ] All models from Ollama library
  - Verify: Models match `ollama list`

- [ ] VRAM usage accurate
  - Command: `ollama ps` and compare with UI
  - Expected: Matches

- [ ] Model sizes accurate
  - Command: `ollama list` and compare with UI
  - Expected: Matches

### ✅ Security
- [ ] No hardcoded credentials
  - Verify: No API keys in code

- [ ] No sensitive data in logs
  - Verify: Logs don't contain secrets

- [ ] CORS properly configured
  - Verify: Only localhost allowed

- [ ] Input validation present
  - Verify: Model names validated

## Post-Deployment Verification

### ✅ Production Readiness
- [ ] All tests passing
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Documentation complete
- [ ] Error handling robust
- [ ] Logging adequate
- [ ] Monitoring in place
- [ ] Backup procedures ready

### ✅ User Acceptance
- [ ] Users can search models
- [ ] Users can pull models
- [ ] Users can manage models
- [ ] Users can monitor VRAM
- [ ] Users understand UI
- [ ] Users find documentation helpful
- [ ] Users report no issues
- [ ] Users satisfied with performance

### ✅ Monitoring
- [ ] Set up error alerts
- [ ] Monitor API response times
- [ ] Monitor VRAM usage
- [ ] Monitor disk usage
- [ ] Monitor network usage
- [ ] Check logs daily
- [ ] Review performance weekly
- [ ] Plan capacity monthly

## Sign-Off

### Development Team
- [ ] Code review completed
- [ ] Tests passing
- [ ] Documentation complete
- [ ] Ready for deployment

### QA Team
- [ ] All tests passed
- [ ] No critical issues
- [ ] Performance acceptable
- [ ] Ready for production

### Operations Team
- [ ] Infrastructure ready
- [ ] Monitoring configured
- [ ] Backup procedures ready
- [ ] Rollback plan ready

### Product Team
- [ ] Requirements met
- [ ] User experience good
- [ ] Documentation adequate
- [ ] Ready for release

---

## Deployment Sign-Off

**Date**: _______________

**Deployed By**: _______________

**Verified By**: _______________

**Status**: ✅ READY FOR PRODUCTION

---

## Notes

Use this space for any additional notes or issues found during verification:

```
[Add notes here]
```

---

*This checklist should be completed before deploying to production.*
