/**
 * TACTICAL OSINT | v3.2.0 State Engine Logic
 * Optimized for High-Fidelity "Liquid Glass" Interface
 */

// Global State Store
window.AppStore = {
    activeView: 'diagnostics',
    theme: 'CYAN_PHASE',
    sidebarCollapsed: false,
    telemetry: {
        vram: 64,
        ram: 42,
        temp: 48,
        uptime: '142:08:12',
        load: 0.42
    },
    bots: []
};

// Bootstrap on DOM Load
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initRouter();
    initSidebar();
    initTelemetry();
    initBotFleet();
    initTerminal();
    initChat();
    initClock();
    initModels();
});

/**
 * Theme Engine
 */
function initTheme() {
    const themeBtns = document.querySelectorAll('.theme-btn');
    themeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.getAttribute('data-theme');
            setTheme(theme);
        });
    });
}

function setTheme(theme) {
    window.AppStore.theme = theme;
    document.body.setAttribute('data-theme', theme);
    
    // Update UI Active State
    document.querySelectorAll('.theme-btn').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-theme') === theme);
    });
    
    logToConsole(`System theme shifted to: ${theme}`, 'info');
}

/**
 * Sidebar Logic
 */
function initSidebar() {
    const toggle = document.getElementById('sidebar-toggle');
    const shell = document.getElementById('app-shell');
    
    toggle.addEventListener('click', () => {
        window.AppStore.sidebarCollapsed = !window.AppStore.sidebarCollapsed;
        shell.classList.toggle('sidebar-collapsed', window.AppStore.sidebarCollapsed);
    });
}

/**
 * SPA Router
 */
function initRouter() {
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');

    console.log('Router initialized with', navItems.length, 'nav items and', views.length, 'views');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.getAttribute('data-target');
            console.log('Nav clicked:', target);
            
            if (window.AppStore.activeView === target) {
                console.log('Already on', target);
                return;
            }

            window.AppStore.activeView = target;
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            views.forEach(view => {
                const isActive = view.id === `view-${target}`;
                view.setAttribute('data-active', isActive ? 'true' : 'false');
                console.log(`View ${view.id}: data-active=${isActive ? 'true' : 'false'}`);
                
                if (isActive && target === 'models') {
                    if (typeof loadInstalledModels === 'function') {
                        loadInstalledModels();
                    }
                }
            });

            logToConsole(`Context shifted: ${target.toUpperCase()}`, 'info');
        });
    });
}

/**
 * Telemetry & Circular Gauges
 */
function initTelemetry() {
    updateGauges(); // draw immediately on load
}

function updateGauges() {
    updateGauge('vram-gauge', 'vram-value', window.AppStore.telemetry.vram, '%');
    updateGauge('ram-gauge', 'ram-value', window.AppStore.telemetry.ram, '%');
    updateGauge('temp-gauge', 'temp-value', window.AppStore.telemetry.temp, '°C');
}

function updateGauge(gaugeId, labelId, value, unit) {
    const gauge = document.getElementById(gaugeId);
    const label = document.getElementById(labelId);
    if (!gauge || !label) return;

    const ring = gauge.querySelector('.gauge-ring');
    if (!ring) return;

    const circumference = 264; // 2 * PI * 42
    const offset = circumference - (Math.min(value, 100) / 100) * circumference;
    ring.style.transition = 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)';
    ring.style.strokeDashoffset = offset;

    label.textContent = `${Math.round(value)}${unit}`;

    // Color-code VRAM/RAM by load
    if (unit === '%') {
        ring.style.stroke = value > 80 ? 'var(--clr-critical)' : value > 60 ? 'var(--clr-warning)' : 'var(--accent-primary)';
    }
}

/**
 * Bot Fleet Logic
 */
function initBotFleet() {
    const grid = document.getElementById('bot-fleet-grid');
    if (!grid) return;

    const renderBots = () => {
        grid.innerHTML = window.AppStore.bots.map(bot => `
            <div class="bot-card ${bot.status !== 'STANDBY' ? 'active' : 'idle'} ${bot.status === 'RATE_LIMITED' ? 'warning' : ''}">
                <div class="bot-icon ${bot.type}"></div>
                <div class="bot-info">
                    <span class="bot-name">${bot.id}</span>
                    <span class="bot-status">${bot.status}</span>
                </div>
                ${bot.load > 0 ? `
                    <div class="bot-load-mini" style="height:2px; background: rgba(255,255,255,0.1); margin-top:8px; border-radius:1px; overflow:hidden;">
                        <div style="width:${bot.load}%; height:100%; background:var(--accent-primary);"></div>
                    </div>
                ` : ''}
            </div>
        `).join('');
    };

    renderBots();
}

/**
 * Terminal Collapse
 */
function initTerminal() {
    const btn = document.getElementById('terminal-collapse-btn');
    const deck = document.getElementById('main-terminal');
    if (!btn || !deck) return;

    btn.addEventListener('click', () => {
        deck.classList.toggle('collapsed');
        btn.style.transform = deck.classList.contains('collapsed') ? 'rotate(180deg)' : 'rotate(0deg)';
    });
}

/**
 * Chat Hub Interaction
 */
function initChat() {
    const input = document.getElementById('target-inquiry-input');
    const sendBtn = document.getElementById('send-inquiry-btn');
    const stream = document.getElementById('chat-history-stream');

    const handleSend = () => {
        const text = input.value.trim();
        if (!text) return;

        appendMessage('user', text);
        input.value = '';

        // Indicate working state
        const loadingId = 'msg-' + Date.now();
        const stream = document.getElementById('chat-history-stream');
        if (stream) {
            const bubble = document.createElement('div');
            bubble.id = loadingId;
            bubble.className = `chat-bubble ai`;
            bubble.innerHTML = `
                <div class="bubble-meta">OSINT WORKFLOW | ${new Date().toLocaleTimeString()}</div>
                <div class="bubble-content" style="color:var(--text-dim);">Dispatching inquiry to n8n... <span class="cursor"></span></div>
            `;
            stream.appendChild(bubble);
            stream.scrollTop = stream.scrollHeight;
        }

        fetch(`${API_BASE}/api/v1/n8n/webhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                workflow: 'OSINT', 
                payload: { chatInput: text } 
            })
        })
        .then(r => r.json())
        .then(data => {
            const el = document.getElementById(loadingId);
            if (el) el.remove();
            
            // Format response (assumes n8n returns some JSON with a message or text)
            const reply = data.output || data.message || JSON.stringify(data, null, 2);
            appendMessage('ai', reply, 'n8n OSINT');
        })
        .catch(err => {
            const el = document.getElementById(loadingId);
            if (el) el.remove();
            appendMessage('ai', `[ERROR] Workflow unreachable: ${err.message}`, 'SYSTEM ERROR');
        });
    };

    if (sendBtn) sendBtn.addEventListener('click', handleSend);
    if (input) input.addEventListener('keydown', e => e.key === 'Enter' && handleSend());
}

function appendMessage(role, text, sender = 'OPERATOR') {
    const stream = document.getElementById('chat-history-stream');
    if (!stream) return;

    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${role}`;
    bubble.innerHTML = `
        <div class="bubble-meta">${sender} | ${new Date().toLocaleTimeString()}</div>
        <div class="bubble-content"><p>${text}</p></div>
    `;
    stream.appendChild(bubble);
    stream.scrollTop = stream.scrollHeight;
}

/**
 * Utilities
 */
function logToConsole(msg, type = 'info') {
    const body = document.getElementById('console-output');
    if (!body) return;

    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `
        <span class="log-ts">[${new Date().toLocaleTimeString()}]</span>
        <span class="log-msg">${msg}</span>
        ${type === 'success' ? '<span class="log-tag success">OK</span>' : ''}
    `;
    body.appendChild(entry);
    body.scrollTop = body.scrollHeight;
}

function initClock() {
    const el = document.getElementById('tactical-clock');
    if (!el) return;
    setInterval(() => el.textContent = new Date().toLocaleTimeString(), 1000);
}

const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:5000' : '';

// ================================================================
//   MODEL HUB v3 — Dynamic Model Loading (No Mock Data)
// ================================================================

// Extract family from model name
function extractFamily(modelName) {
    const parts = modelName.split(':')[0].split('-');
    const base = parts[0].toLowerCase();
    
    const familyMap = {
        'llama': '🦙', 'deepseek': '🌊', 'qwen': '🐉', 'mistral': '💨',
        'phi': '🔬', 'gemma': '💎', 'tinyllama': '⚡', 'llava': '👁',
        'nomic': '🗺', 'starcoder': '⭐', 'codellama': '🧑‍💻', 'falcon': '🦅',
        'vicuna': '🐴', 'orca': '🐋', 'yi': '🌟', 'solar': '☀️',
        'wizard': '🧙', 'neural': '🧠', 'openchat': '💬', 'starling': '⭐'
    };
    
    return familyMap[base] || '🤖';
}

// ================================================================
//   MODULE STATE
// ================================================================

let mh_activeSuggestionIndex = -1;
let mh_filteredSuggestions = [];
let mh_activeFilter = 'all';
let mh_sortMode = 'name';
let mh_installedModels = [];
let mh_runningModels = [];
let mh_currentDeleteName = null;
let mh_refreshTimer = null;
let mh_pullInProgress = false;

// ================================================================
//   INIT
// ================================================================

function initModels() {
    const searchInput = document.getElementById('model-search-input');
    if (!searchInput) return;

    const clearBtn = document.getElementById('model-search-clear');
    const resultsBox = document.getElementById('mh-search-results');

    // --- Search input with debounce ---
    let searchDebounce;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(() => {
            const query = searchInput.value.trim().toLowerCase();
            mh_activeSuggestionIndex = -1;
            clearBtn.style.display = query ? 'flex' : 'none';

            if (!query) {
                resultsBox.style.display = 'none';
                return;
            }

            // Search installed models first, then library
            searchModels(query);
        }, 300);
    });

    // --- Keyboard navigation ---
    searchInput.addEventListener('keydown', (e) => {
        if (resultsBox.style.display === 'none') return;
        const items = resultsBox.querySelectorAll('.mh-search-result-item');
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            mh_activeSuggestionIndex = (mh_activeSuggestionIndex + 1) % items.length;
            updateSearchActive(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            mh_activeSuggestionIndex = (mh_activeSuggestionIndex - 1 + items.length) % items.length;
            updateSearchActive(items);
        } else if (e.key === 'Enter') {
            if (mh_activeSuggestionIndex >= 0 && mh_activeSuggestionIndex < mh_filteredSuggestions.length) {
                e.preventDefault();
                selectSearchResult(mh_filteredSuggestions[mh_activeSuggestionIndex]);
            } else {
                pullModel(searchInput.value.trim());
                resultsBox.style.display = 'none';
            }
        } else if (e.key === 'Escape') {
            resultsBox.style.display = 'none';
            mh_activeSuggestionIndex = -1;
        }
    });

    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearBtn.style.display = 'none';
        resultsBox.style.display = 'none';
        searchInput.focus();
    });

    document.addEventListener('click', (e) => {
        if (!searchInput.closest('.mh-search-panel')?.contains(e.target)) {
            resultsBox.style.display = 'none';
        }
    });

    // --- Sort buttons ---
    document.querySelectorAll('.mh-sort-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mh-sort-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            mh_sortMode = btn.dataset.sort;
            renderInstalledModels();
        });
    });

    // --- Installed filter input ---
    const installedFilter = document.getElementById('installed-filter-input');
    if (installedFilter) {
        let filterDebounce;
        installedFilter.addEventListener('input', () => {
            clearTimeout(filterDebounce);
            filterDebounce = setTimeout(renderInstalledModels, 120);
        });
    }

    // --- Delete modal confirm ---
    document.getElementById('delete-modal-confirm').addEventListener('click', () => {
        if (mh_currentDeleteName) {
            executeDeleteModel(mh_currentDeleteName);
            closeDeleteModal();
        }
    });

    // Close modal on overlay click
    document.getElementById('delete-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('delete-modal')) closeDeleteModal();
    });

    // --- Initial load ---
    loadInstalledModels();

    // Auto-refresh every 15s
    mh_refreshTimer = setInterval(() => {
        if (document.getElementById('view-models').dataset.active === 'true') {
            loadInstalledModels();
        }
    }, 15000);
}

// Search models in library
function searchModels(query) {
    const resultsBox = document.getElementById('mh-search-results');
    
    // Show loading
    resultsBox.innerHTML = `<div style="padding:12px;text-align:center;color:var(--text-dim);font-size:11px;">Searching library…</div>`;
    resultsBox.style.display = 'block';

    fetch(`${API_BASE}/api/v1/ollama/library/search?q=${encodeURIComponent(query)}`)
        .then(r => r.json())
        .then(data => {
            mh_filteredSuggestions = data.models || [];
            renderSearchResults(mh_filteredSuggestions, query);
        })
        .catch(() => {
            mh_filteredSuggestions = [];
            renderSearchResults([], query);
        });
}

// Render search results
function renderSearchResults(results, query) {
    const box = document.getElementById('mh-search-results');
    if (!box) return;

    if (results.length === 0) {
        box.innerHTML = `
            <div class="mh-search-result-item" onclick="pullModel('${query}')">
                <span style="color:var(--accent-primary);">↓</span>
                <span>Pull: <strong>${query}</strong></span>
            </div>`;
        box.style.display = 'block';
        return;
    }

    const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi');
    box.innerHTML = results.map((m, idx) => {
        const icon = extractFamily(m.name);
        const displayName = m.name.replace(re, '<mark style="background:rgba(57,197,207,0.25);color:inherit;border-radius:2px;padding:0 1px">$1</mark>');
        return `
            <div class="mh-search-result-item" data-index="${idx}" onclick="selectSearchResult({name:'${m.name}',desc:'${m.desc||''}'})">
                <span class="mh-search-icon">${icon}</span>
                <div class="mh-search-body">
                    <span class="mh-search-name">${displayName}</span>
                    <span class="mh-search-desc">${m.desc || 'Model from Ollama library'}</span>
                </div>
            </div>`;
    }).join('');
    box.style.display = 'block';
}

function updateSearchActive(items) {
    items.forEach((item, idx) => {
        item.classList.toggle('active', idx === mh_activeSuggestionIndex);
        if (idx === mh_activeSuggestionIndex) item.scrollIntoView({ block: 'nearest' });
    });
}

function selectSearchResult(model) {
    const input = document.getElementById('model-search-input');
    const box = document.getElementById('mh-search-results');
    
    if (input) input.value = model.name;
    if (box) box.style.display = 'none';
    
    mh_activeSuggestionIndex = -1;
    document.getElementById('model-search-clear').style.display = 'flex';
}

// ================================================================
//   INSTALLED MODELS — LOAD & RENDER
// ================================================================

function loadInstalledModels() {
    const modelsList = document.getElementById('installed-models-list');
    const offlineBanner = document.getElementById('ollama-offline-banner');

    if (!modelsList) return;

    // Show skeleton while loading
    if (mh_installedModels.length === 0) {
        modelsList.innerHTML = Array(4).fill(0).map(() => `
            <div class="mh-model-card" style="pointer-events:none;">
                <div class="mh-card-header">
                    <div class="mh-card-family-icon mh-skeleton" style="width:32px;height:32px;"></div>
                    <div class="mh-card-title-wrap" style="flex:1;">
                        <div class="mh-skeleton" style="height:12px;width:80%;margin-bottom:6px;"></div>
                        <div class="mh-skeleton" style="height:9px;width:40%;"></div>
                    </div>
                </div>
                <div class="mh-card-meta" style="padding:0 16px 10px;">
                    <div class="mh-skeleton" style="height:16px;width:40px;border-radius:3px;"></div>
                    <div class="mh-skeleton" style="height:16px;width:40px;border-radius:3px;"></div>
                </div>
                <div style="padding:0 16px 14px;">
                    <div class="mh-skeleton" style="height:3px;width:100%;border-radius:2px;"></div>
                </div>
                <div class="mh-card-actions" style="border-top:1px solid rgba(255,255,255,0.04);">
                    <div class="mh-skeleton" style="height:26px;flex:1;border-radius:4px;"></div>
                    <div class="mh-skeleton" style="height:26px;flex:1;border-radius:4px;"></div>
                </div>
            </div>`).join('');
    }

    Promise.all([
        fetch(`${API_BASE}/api/v1/ollama/models`).then(r => { if (!r.ok) throw new Error('Offline'); return r.json(); }),
        fetch(`${API_BASE}/api/v1/ollama/running`).then(r => { if (!r.ok) throw new Error('Offline'); return r.json(); })
    ]).then(([modelsRes, runningRes]) => {
        offlineBanner.style.display = 'none';
        mh_installedModels = modelsRes.models || [];
        mh_runningModels = runningRes.models || [];

        // Update header stats
        const totalBytes = mh_installedModels.reduce((acc, m) => acc + (m.size || 0), 0);
        const hdrCount = document.getElementById('hdr-model-count');
        const hdrDisk = document.getElementById('hdr-disk-usage');
        const hdrVram = document.getElementById('hdr-vram-state');
        const hdrLoaded = document.getElementById('hdr-loaded-count');
        
        if (hdrCount) hdrCount.textContent = mh_installedModels.length;
        if (hdrDisk) hdrDisk.textContent = formatBytes(totalBytes);
        if (hdrLoaded) hdrLoaded.textContent = mh_runningModels.length;
        if (hdrVram) {
            const isActive = mh_runningModels.length > 0;
            hdrVram.textContent = isActive ? 'ACTIVE' : 'IDLE';
            hdrVram.style.color = isActive ? 'var(--clr-nominal)' : 'var(--text-muted)';
        }

        // Count label
        const countLabel = document.getElementById('models-count-label');
        if (countLabel) countLabel.textContent = mh_installedModels.length.toString().padStart(2, '0');

        // Update VRAM monitor
        updateActiveMonitor(mh_runningModels);
        renderInstalledModels();
    }).catch(err => {
        offlineBanner.style.display = 'flex';
        logToConsole(`Ollama offline: ${err.message}`, 'warn');
    });
}

function renderInstalledModels() {
    const modelsList = document.getElementById('installed-models-list');
    const filterInput = document.getElementById('installed-filter-input');
    
    if (!modelsList) return;

    let filtered = mh_installedModels;
    
    // Apply filter
    if (filterInput && filterInput.value) {
        const q = filterInput.value.toLowerCase();
        filtered = filtered.filter(m => (m.name || m.model || '').toLowerCase().includes(q));
    }

    // Apply sort
    if (mh_sortMode === 'size') {
        filtered.sort((a, b) => (b.size || 0) - (a.size || 0));
    } else if (mh_sortMode === 'date') {
        filtered.sort((a, b) => new Date(b.modified_at || 0) - new Date(a.modified_at || 0));
    } else {
        filtered.sort((a, b) => (a.name || a.model || '').localeCompare(b.name || b.model || ''));
    }

    if (filtered.length === 0) {
        modelsList.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px 20px;color:var(--text-dim);font-family:var(--font-mono);font-size:11px;">No models installed. Search and pull one above.</div>`;
        return;
    }

    modelsList.innerHTML = filtered.map(model => {
        const isLoaded = mh_runningModels.some(rm => rm.model === model.model || rm.name === model.name);
        const icon = extractFamily(model.name || model.model || '');
        const modelName = model.name || model.model || 'unknown';
        const size = formatBytes(model.size || 0);
        const digest = (model.digest || '').substring(0, 12);

        return `
            <div class="mh-model-card" onclick="showModelDetails('${modelName}')">
                <div class="mh-card-header">
                    <span class="mh-card-family-icon">${icon}</span>
                    <div class="mh-card-title-wrap">
                        <span class="mh-card-name">${modelName}</span>
                        <span class="mh-card-digest">${digest}</span>
                    </div>
                    ${isLoaded ? '<span class="mh-card-loaded-badge">LOADED</span>' : ''}
                </div>
                <div class="mh-card-meta">
                    <span class="mh-card-size">${size}</span>
                    <span class="mh-card-date">${formatDate(model.modified_at)}</span>
                </div>
                <div class="mh-card-actions">
                    <button class="mh-card-btn" onclick="event.stopPropagation(); ${isLoaded ? `unloadModel('${modelName}')` : `loadModel('${modelName}')`}" title="${isLoaded ? 'Unload' : 'Load'}">
                        ${isLoaded ? '⬆ UNLOAD' : '⬇ LOAD'}
                    </button>
                    <button class="mh-card-btn danger" onclick="event.stopPropagation(); openDeleteModal('${modelName}')" title="Delete">
                        🗑 DELETE
                    </button>
                </div>
            </div>`;
    }).join('');
}

function showModelDetails(modelName) {
    // Show model details in drawer
    const drawer = document.getElementById('mh-model-drawer');
    if (!drawer) return;

    const model = mh_installedModels.find(m => (m.name || m.model) === modelName);
    if (!model) return;

    const icon = extractFamily(modelName);
    const details = model.details || {};

    document.getElementById('drawer-icon').textContent = icon;
    document.getElementById('drawer-name').textContent = modelName;
    document.getElementById('drawer-family').textContent = `${details.parameter_size || '—'} | ${details.quantization_level || '—'}`;
    document.getElementById('drawer-desc').textContent = `Digest: ${(model.digest || '').substring(0, 20)}... | Size: ${formatBytes(model.size || 0)}`;

    // Fetch and show variants
    const variantsDiv = document.getElementById('drawer-variants');
    variantsDiv.innerHTML = '<div class="mh-variant-loading">Fetching variants…</div>';

    const baseName = modelName.split(':')[0];
    fetch(`${API_BASE}/api/v1/ollama/library/tags?model=${baseName}`)
        .then(r => r.json())
        .then(data => {
            const tags = data.tags || ['latest'];
            const isLoaded = mh_runningModels.some(rm => rm.model === modelName || rm.name === modelName);
            
            variantsDiv.innerHTML = tags.map(tag => {
                const fullName = `${baseName}:${tag}`;
                const isInstalled = mh_installedModels.some(m => (m.name || m.model) === fullName);
                return `
                    <div class="mh-variant-item ${isInstalled ? 'installed' : ''}">
                        <span class="mh-variant-tag">${tag}</span>
                        <button class="mh-variant-btn" onclick="pullModel('${fullName}')" ${isInstalled ? 'disabled' : ''}>
                            ${isInstalled ? '✓ INSTALLED' : '↓ PULL'}
                        </button>
                    </div>`;
            }).join('');
        })
        .catch(() => {
            variantsDiv.innerHTML = '<div style="padding:12px;color:var(--text-dim);font-size:10px;">Could not fetch variants</div>';
        });

    drawer.style.display = 'block';
}

function closeModelDrawer() {
    const drawer = document.getElementById('mh-model-drawer');
    if (drawer) drawer.style.display = 'none';
}



// ================================================================
//   PULL / DOWNLOAD
// ================================================================

function pullModel(modelName) {
    if (mh_pullInProgress) {
        mhToast('A pull is already in progress', 'warning');
        return;
    }

    const progressPanel = document.getElementById('pull-progress-panel');
    const progressModelName = document.getElementById('progress-model-name');
    const progressBar = document.getElementById('progress-bar');
    const progressPct = document.getElementById('progress-percent');
    const progressStatus = document.getElementById('progress-status');
    const progressSpeed = document.getElementById('progress-speed');
    const stagesEl = document.getElementById('progress-stages');

    if (!progressPanel) return;

    mh_pullInProgress = true;
    progressPanel.style.display = 'block';
    progressModelName.textContent = modelName;
    progressBar.style.width = '0%';
    progressPct.textContent = '0%';
    progressStatus.textContent = 'Connecting to Ollama…';
    progressSpeed.textContent = '—';
    if (stagesEl) stagesEl.innerHTML = '';

    logToConsole(`[MODEL HUB] Initiating pull: ${modelName}`, 'info');
    mhToast(`Pulling ${modelName}…`, 'info');

    const digestMap = {};
    let startTime = null;
    let lastBytes = 0;

    fetch(`${API_BASE}/api/v1/ollama/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelName })
    }).then(r => {
        if (!r.ok) throw new Error('Pull request failed');
        return r.body.getReader();
    }).then(reader => {
        const decoder = new TextDecoder();
        let buffer = '';

        function read() {
            reader.read().then(({ done, value }) => {
                if (done) {
                    progressBar.style.width = '100%';
                    progressPct.textContent = '100%';
                    progressStatus.textContent = '✓ Download complete';
                    logToConsole(`[MODEL HUB] ${modelName} successfully downloaded.`, 'success');
                    mhToast(`${modelName} ready`, 'success');
                    mh_pullInProgress = false;
                    setTimeout(loadInstalledModels, 1000);
                    return;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop();

                lines.forEach(line => {
                    if (!line.trim()) return;
                    try {
                        const data = JSON.parse(line);
                        if (data.error) {
                            progressStatus.textContent = `ERROR: ${data.error}`;
                            logToConsole(`Pull failed: ${data.error}`, 'error');
                            mhToast(`Pull failed: ${data.error}`, 'error');
                            mh_pullInProgress = false;
                            return;
                        }

                        if (data.digest) {
                            if (!digestMap[data.digest]) {
                                digestMap[data.digest] = { name: data.status, completed: 0, total: 0, done: false };
                            }
                            const entry = digestMap[data.digest];
                            entry.name = data.status || entry.name;
                            if (data.total) entry.total = data.total;
                            if (data.completed) entry.completed = data.completed;
                            if (data.status === 'pulling' && data.completed >= data.total && data.total > 0) entry.done = true;
                            if (data.status === 'verifying sha256 digest' || data.status === 'writing manifest') entry.done = true;

                            if (stagesEl) {
                                stagesEl.innerHTML = Object.entries(digestMap).map(([digest, info]) => {
                                    const dotClass = info.done ? 'done' : info.completed > 0 ? 'active' : 'pending';
                                    const pct = info.total > 0 ? Math.round(info.completed / info.total * 100) : 0;
                                    return `
                                        <div class="mh-stage-row">
                                            <div class="mh-stage-dot ${dotClass}"></div>
                                            <span class="mh-stage-name">${info.name || digest.slice(7, 19)}</span>
                                            <span class="mh-stage-pct">${info.done ? '✓' : info.total > 0 ? pct + '%' : '—'}</span>
                                        </div>`;
                                }).join('');
                            }
                        }

                        progressStatus.textContent = data.status || '—';

                        if (data.total && data.completed) {
                            const pct = Math.min(100, Math.round(data.completed / data.total * 100));
                            progressBar.style.width = `${pct}%`;
                            progressPct.textContent = `${pct}%`;

                            const now = Date.now();
                            if (!startTime) startTime = now;
                            const duration = (now - startTime) / 1000;
                            const bytesDelta = data.completed - lastBytes;
                            lastBytes = data.completed;
                            if (duration > 0.5 && bytesDelta > 0) {
                                const mbSec = (bytesDelta / 0.8 / 1024 / 1024).toFixed(1);
                                progressSpeed.textContent = `${mbSec} MB/s`;
                            }
                        }
                    } catch (e) {
                        console.error('Parse error:', e);
                    }
                });

                read();
            }).catch(err => {
                progressStatus.textContent = `ERROR: ${err.message}`;
                logToConsole(`Pull stream error: ${err.message}`, 'error');
                mhToast(`Pull failed: ${err.message}`, 'error');
                mh_pullInProgress = false;
            });
        }

        read();
    }).catch(err => {
        progressStatus.textContent = `ERROR: ${err.message}`;
        logToConsole(`Pull request failed: ${err.message}`, 'error');
        mhToast(`Pull failed: ${err.message}`, 'error');
        mh_pullInProgress = false;
    });
}

// ================================================================
//   LOAD / UNLOAD
// ================================================================

function loadModel(name) {
    logToConsole(`Loading model into memory: ${name}`, 'info');
    mhToast(`Loading ${name}…`, 'info');
    fetch(`${API_BASE}/api/v1/ollama/load`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: name })
    }).then(r => r.json())
      .then(res => {
          if (res.status === 'loaded' || res.status === 'success') {
              logToConsole(`Model ${name} loaded successfully.`, 'success');
              mhToast(`${name} loaded into VRAM`, 'success');
          } else {
              logToConsole(`Load failed — ${res.error || 'unknown error'}`, 'error');
              mhToast(`Load failed: ${res.error || 'unknown error'}`, 'error');
          }
          loadInstalledModels();
      }).catch(err => {
          logToConsole(`Load request failed: ${err.message}`, 'error');
          mhToast(`Load failed: ${err.message}`, 'error');
      });
}

function unloadModel(name) {
    logToConsole(`Unloading model: ${name}`, 'info');
    mhToast(`Unloading ${name}…`, 'warning');
    fetch(`${API_BASE}/api/v1/ollama/unload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: name })
    }).then(r => r.json())
      .then(res => {
          if (res.status === 'unloaded' || res.status === 'success') {
              logToConsole(`Model ${name} unloaded from memory.`, 'success');
              mhToast(`${name} unloaded from VRAM`, 'success');
          } else {
              logToConsole(`Unload failed — ${res.error || 'unknown error'}`, 'error');
              mhToast(`Unload failed: ${res.error || 'unknown error'}`, 'error');
          }
          loadInstalledModels();
      }).catch(err => {
          logToConsole(`Unload request failed: ${err.message}`, 'error');
          mhToast(`Unload failed: ${err.message}`, 'error');
      });
}

// ================================================================
//   DELETE MODAL
// ================================================================

function openDeleteModal(name) {
    mh_currentDeleteName = name;
    const nameEl = document.getElementById('delete-modal-name');
    if (nameEl) nameEl.textContent = name;
    document.getElementById('delete-modal').style.display = 'flex';
}

function closeDeleteModal() {
    document.getElementById('delete-modal').style.display = 'none';
    mh_currentDeleteName = null;
}

function executeDeleteModel(name) {
    logToConsole(`Deleting model: ${name}`, 'info');
    fetch(`${API_BASE}/api/v1/ollama/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: name })
    }).then(r => r.json())
      .then(res => {
          if (res.status === 'deleted' || res.status === 'success') {
              logToConsole(`Model ${name} deleted successfully.`, 'success');
              mhToast(`${name} deleted`, 'success');
          } else {
              logToConsole(`Deletion failed — ${res.error || 'unknown error'}`, 'error');
              mhToast(`Delete failed: ${res.error || 'unknown error'}`, 'error');
          }
          loadInstalledModels();
      }).catch(err => {
          logToConsole(`Delete request failed: ${err.message}`, 'error');
          mhToast(`Delete failed: ${err.message}`, 'error');
      });
}

// ================================================================
//   VRAM MONITOR
// ================================================================

function updateActiveMonitor(runningModels) {
    const vramRing = document.getElementById('vram-ring-fill');
    const vramPct = document.getElementById('vram-ring-pct');
    const activeModelName = document.getElementById('active-model-name');
    const activeModelVram = document.getElementById('active-model-vram');
    const activeModelExpire = document.getElementById('active-model-expire');
    const unloadBtn = document.getElementById('active-unload-btn');
    const runningList = document.getElementById('mh-running-list');
    const runningRows = document.getElementById('mh-running-rows');

    if (!runningModels || runningModels.length === 0) {
        if (vramPct) vramPct.textContent = '0%';
        if (activeModelName) activeModelName.textContent = 'NONE';
        if (activeModelVram) activeModelVram.textContent = '—';
        if (activeModelExpire) activeModelExpire.textContent = '—';
        if (unloadBtn) unloadBtn.style.display = 'none';
        if (runningList) runningList.style.display = 'none';
        return;
    }

    const primary = runningModels[0];
    const totalVram = runningModels.reduce((acc, m) => acc + (m.size_vram || 0), 0);
    const maxVram = 24 * 1024 * 1024 * 1024; // Assume 24GB
    const vramPercent = Math.min(100, Math.round(totalVram / maxVram * 100));

    if (vramRing) {
        const offset = 264 - (vramPercent / 100) * 264;
        vramRing.style.strokeDashoffset = offset;
    }
    if (vramPct) vramPct.textContent = `${vramPercent}%`;
    if (activeModelName) activeModelName.textContent = primary.model || primary.name || 'UNKNOWN';
    if (activeModelVram) activeModelVram.textContent = formatBytes(primary.size_vram || 0);
    if (activeModelExpire) activeModelExpire.textContent = formatTime(primary.expires_at || 0);
    if (unloadBtn) {
        unloadBtn.style.display = 'block';
        unloadBtn.onclick = () => unloadModel(primary.model || primary.name);
    }

    if (runningModels.length > 1 && runningList && runningRows) {
        runningList.style.display = 'block';
        runningRows.innerHTML = runningModels.slice(1).map(m => `
            <div class="mh-running-row">
                <div class="mh-running-dot"></div>
                <span class="mh-running-name">${m.model || m.name}</span>
                <span class="mh-running-mem">${formatBytes(m.size_vram || 0)}</span>
                <button class="mh-running-unload" onclick="unloadModel('${m.model || m.name}')">⬆</button>
            </div>`).join('');
    }
}

function mhRefresh() {
    loadInstalledModels();
}

function mhToast(msg, type = 'info') {
    const toast = document.getElementById('mh-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = `mh-toast ${type}`;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

// ================================================================
//   UTILITIES
// ================================================================

function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
        return '—';
    }
}

function formatTime(expiresAt) {
    if (!expiresAt) return '—';
    try {
        const d = new Date(expiresAt);
        const now = new Date();
        const diff = d - now;
        if (diff < 0) return 'expired';
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h`;
        return `${Math.floor(hours / 24)}d`;
    } catch {
        return '—';
    }
}


// ================================================================
//   ENHANCED MODEL STORE INTEGRATION
// ================================================================

// Load the enhanced model store module
(function() {
    const script = document.createElement('script');
    script.src = 'app-models-enhanced.js';
    script.onload = () => {
        console.log('[MODEL STORE] Enhanced module loaded');
        if (typeof initEnhancedModelStore === 'function') {
            initEnhancedModelStore();
        }
    };
    document.head.appendChild(script);
})();

// Initialize enhanced model store
function initEnhancedModelStore() {
    console.log('[MODEL STORE] Initializing enhanced features...');
    
    // Detect system specs
    SystemDetector.detect().then(specs => {
        console.log('[MODEL STORE] System specs detected:', specs);
        updateSystemInfo(specs);
    });

    // Setup library browser
    setupLibraryBrowser();
    
    // Setup natural language search
    setupNaturalLanguageSearch();
    
    // Setup category filters
    setupCategoryFilters();
}

// Setup library browser
function setupLibraryBrowser() {
    const libraryGrid = document.getElementById('library-models-grid');
    if (!libraryGrid) return;

    renderLibraryModels(OllamaLibrary.models);
}

// Render library models
function renderLibraryModels(models) {
    const grid = document.getElementById('library-models-grid');
    if (!grid) return;

    if (models.length === 0) {
        grid.innerHTML = `
            <div class="mh-empty-state">
                <div class="mh-empty-icon">🔍</div>
                <div class="mh-empty-title">NO MODELS FOUND</div>
                <div class="mh-empty-sub">Try a different search or category</div>
            </div>`;
        return;
    }

    grid.innerHTML = models.map(model => {
        const icon = extractFamily(model.name);
        const compat = SystemDetector.canRunModel(model);
        const compatClass = compat.can ? 'compatible' : 'incompatible';
        const compatIcon = compat.can ? '✓' : '⚠';
        
        return `
            <div class="mh-library-card ${compatClass}" onclick="showLibraryModelDetails('${model.name}')">
                <div class="mh-lib-card-header">
                    <span class="mh-lib-icon">${icon}</span>
                    <div class="mh-lib-info">
                        <span class="mh-lib-name">${model.name}</span>
                        <span class="mh-lib-author">by ${model.author}</span>
                    </div>
                    <span class="mh-compat-badge ${compatClass}" title="${compat.reason}">
                        ${compatIcon}
                    </span>
                </div>
                <p class="mh-lib-desc">${model.desc}</p>
                <div class="mh-lib-tags">
                    ${model.bestFor.slice(0, 2).map(tag => `<span class="mh-lib-tag">${tag}</span>`).join('')}
                </div>
                <div class="mh-lib-meta">
                    <span class="mh-lib-params">${model.params}</span>
                    <span class="mh-lib-pop">★ ${model.popular}</span>
                </div>
                <button class="mh-lib-download-btn" onclick="event.stopPropagation(); showVariantSelector('${model.name}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    DOWNLOAD
                </button>
            </div>`;
    }).join('');
}

// Setup natural language search
function setupNaturalLanguageSearch() {
    const searchInput = document.getElementById('model-search-input');
    if (!searchInput) return;

    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        searchTimeout = setTimeout(() => {
            if (query.length > 0) {
                const results = OllamaLibrary.search(query);
                showSearchSuggestions(results, query);
            } else {
                hideSearchSuggestions();
                renderLibraryModels(OllamaLibrary.models);
            }
        }, 300);
    });
}

// Show search suggestions
function showSearchSuggestions(results, query) {
    const resultsBox = document.getElementById('mh-search-results');
    if (!resultsBox) return;

    if (results.length === 0) {
        resultsBox.innerHTML = `
            <div class="mh-no-results">
                <span>No models found for "${query}"</span>
            </div>`;
        resultsBox.style.display = 'block';
        return;
    }

    resultsBox.innerHTML = results.slice(0, 8).map(model => {
        const icon = extractFamily(model.name);
        const compat = SystemDetector.canRunModel(model);
        
        return `
            <div class="mh-suggestion-item" onclick="selectLibraryModel('${model.name}')">
                <span class="mh-sug-icon">${icon}</span>
                <div class="mh-sug-body">
                    <span class="mh-sug-name">${model.name}</span>
                    <span class="mh-sug-desc">${model.desc}</span>
                </div>
                <div class="mh-sug-tags">
                    <span class="mh-sug-tag ${compat.can ? 'cap' : 'warn'}">${compat.can ? '✓' : '⚠'}</span>
                    <span class="mh-sug-tag size">${model.params}</span>
                </div>
            </div>`;
    }).join('');
    
    resultsBox.style.display = 'block';
    
    // Also update library grid
    renderLibraryModels(results);
}

// Hide search suggestions
function hideSearchSuggestions() {
    const resultsBox = document.getElementById('mh-search-results');
    if (resultsBox) resultsBox.style.display = 'none';
}

// Select library model
function selectLibraryModel(modelName) {
    hideSearchSuggestions();
    showLibraryModelDetails(modelName);
}

// Show library model details
function showLibraryModelDetails(modelName) {
    const model = OllamaLibrary.getModel(modelName);
    if (!model) return;

    const modal = document.getElementById('library-model-modal');
    if (!modal) return;

    const icon = extractFamily(model.name);
    const compat = SystemDetector.canRunModel(model);

    document.getElementById('modal-icon').textContent = icon;
    document.getElementById('modal-name').textContent = model.name;
    document.getElementById('modal-author').textContent = `by ${model.author}`;
    document.getElementById('modal-desc').textContent = model.desc;
    document.getElementById('modal-category').textContent = model.category.toUpperCase();
    document.getElementById('modal-params').textContent = model.params;
    document.getElementById('modal-popular').textContent = `★ ${model.popular}/100`;
    
    // Best for tags
    const bestForEl = document.getElementById('modal-best-for');
    bestForEl.innerHTML = model.bestFor.map(use => `<span class="modal-tag">${use}</span>`).join('');
    
    // System requirements
    document.getElementById('modal-req-ram').textContent = `${model.minRAM}GB`;
    document.getElementById('modal-req-vram').textContent = model.minVRAM > 0 ? `${model.minVRAM}GB` : 'Optional';
    
    // Compatibility
    const compatEl = document.getElementById('modal-compat');
    compatEl.className = `modal-compat ${compat.can ? 'compatible' : 'incompatible'}`;
    compatEl.innerHTML = `
        <span class="compat-icon">${compat.can ? '✓' : '⚠'}</span>
        <span>${compat.reason}</span>`;
    
    // Variants
    const variantsEl = document.getElementById('modal-variants');
    variantsEl.innerHTML = model.sizes.map(size => `
        <button class="modal-variant-btn" onclick="pullModel('${model.name}:${size}')">
            <span class="variant-name">${model.name}:${size}</span>
            <span class="variant-download">↓</span>
        </button>`).join('');
    
    modal.style.display = 'flex';
}

// Close library model modal
function closeLibraryModal() {
    const modal = document.getElementById('library-model-modal');
    if (modal) modal.style.display = 'none';
}

// Setup category filters
function setupCategoryFilters() {
    const filterBtns = document.querySelectorAll('.mh-category-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;
            ModelStore.activeCategory = category;
            
            // Update active state
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Filter models
            const models = OllamaLibrary.getByCategory(category);
            renderLibraryModels(models);
        });
    });
}

// Update system info display
function updateSystemInfo(specs) {
    const sysInfoEl = document.getElementById('system-info-display');
    if (!sysInfoEl) return;

    sysInfoEl.innerHTML = `
        <div class="sys-info-item">
            <span class="sys-label">RAM</span>
            <span class="sys-value">${specs.ram}GB</span>
        </div>
        <div class="sys-info-item">
            <span class="sys-label">VRAM</span>
            <span class="sys-value">${specs.vram}GB</span>
        </div>
        <div class="sys-info-item">
            <span class="sys-label">CPU</span>
            <span class="sys-value">${specs.cpu} cores</span>
        </div>
        <div class="sys-info-item">
            <span class="sys-label">GPU</span>
            <span class="sys-value" title="${specs.gpu}">${specs.gpu.split(' ').slice(0, 3).join(' ')}</span>
        </div>`;
}

// Show variant selector
function showVariantSelector(modelName) {
    const model = OllamaLibrary.getModel(modelName);
    if (!model) return;
    
    showLibraryModelDetails(modelName);
}

