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
    initNetworkSimulation();
    // Enhanced UI Features
    initHealthSparkline();
    initIntelGraph();
    initN8nChecklist();
    initCrtTerminal();
    initEnhancedModelCards();
    initSettingsMatrix();
    // Tor Integration
    initTorIntegration();
    getTorBridgeInfo();
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
    if (!toggle || !shell) return;

    toggle.addEventListener('click', () => {
        window.AppStore.sidebarCollapsed = !window.AppStore.sidebarCollapsed;
        shell.classList.toggle('sidebar-collapsed', window.AppStore.sidebarCollapsed);
    });
}

/**
 * Zen Mode — collapses sidebar and hides ticker tape for focused work
 */
function toggleZenMode(enabled) {
    document.body.classList.toggle('zen-mode', enabled);
    window.AppStore.zenMode = enabled;
    logToConsole(`Zen Mode ${enabled ? 'ACTIVATED — UI minimized' : 'DEACTIVATED — UI restored'}`, enabled ? 'warn' : 'info');
}

/**
 * Emergency Stop — halts all active OSINT operations and n8n workflows
 */
function emergencyStop() {
    const btn = document.getElementById('emergency-stop-btn');
    if (!btn) return;

    // Visual acknowledgement
    btn.style.color = '#fff';
    btn.style.background = 'rgba(255, 65, 108, 0.18)';

    logToConsole('[EMERGENCY STOP] Halting all OSINT operations...', 'error');

    // Attempt to cancel all in-flight requests via abort signal
    if (window._osintAbortController) {
        window._osintAbortController.abort();
    }
    window._osintAbortController = new AbortController();

    // POST stop signal to backend if available
    const baseUrl = window.location.protocol === 'file:' ? 'http://localhost:5000' : '';
    fetch(`${baseUrl}/api/v1/system/emergency-stop`, {
        method: 'POST',
        signal: window._osintAbortController.signal
    }).catch(() => {/* silent — backend may be offline */});

    // Debounce reset visual after 2s
    setTimeout(() => {
        btn.style.color = '';
        btn.style.background = '';
    }, 2000);
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
    
    // Poll telemetry every 2 seconds
    setInterval(() => {
        const baseUrl = window.location.protocol === 'file:' ? 'http://localhost:5000' : '';
        fetch(`${baseUrl}/api/v1/system/telemetry`)
            .then(r => r.json())
            .then(data => {
                if(data.error) return;
                
                window.AppStore.telemetry.ram = data.ram_percent;
                window.AppStore.telemetry.vram = data.ram_percent; // placeholder until actual vram is supported
                window.AppStore.telemetry.temp = parseInt(data.temp) || 48;
                window.AppStore.telemetry.uptime = data.uptime.split('.')[0];
                window.AppStore.telemetry.load = data.load;
                
                const uptimeEl = document.getElementById('sys-uptime');
                const loadEl = document.getElementById('sys-load');
                if(uptimeEl) uptimeEl.textContent = window.AppStore.telemetry.uptime;
                if(loadEl) loadEl.textContent = window.AppStore.telemetry.load.toFixed(2);
                
                updateGauges();
            })
            .catch(err => console.error("Telemetry error", err));
    }, 2000);
}

function updateGauges() {
    const t = window.AppStore.telemetry;
    // New bento ring elements
    updateBentoRing('vram-ring', 'vram-value', t.vram, '%', 'cyan');
    updateBentoRing('cpu-ring',  'cpu-value',  t.cpu  || 50, '%', 'green');
    updateBentoRing('ram-ring',  'ram-value',  t.ram,  '%', 'cyan');
    updateBentoRing('temp-ring', 'temp-value', t.temp, '°C', 'amber');
    
    // Update canvas wave gauges
    if (window.gaugeInstances) {
        updateWaveGauge('vram-wave-canvas', t.vram);
        updateWaveGauge('cpu-wave-canvas', t.cpu || 50);
        updateWaveGauge('ram-wave-canvas', t.ram);
        updateWaveGauge('temp-wave-canvas', t.temp);
    }
    
    // Update ticker tape values
    const tickerVram = document.getElementById('ticker-vram');
    const tickerTemp = document.getElementById('ticker-temp');
    if (tickerVram) { tickerVram.textContent = `${Math.round(t.vram)}%`; tickerVram.className = `ticker-item-val ${t.vram > 80 ? 'crit' : t.vram > 60 ? 'warn' : 'ok'}`; }
    if (tickerTemp) { tickerTemp.textContent = `${Math.round(t.temp)}°C`; tickerTemp.className = `ticker-item-val ${t.temp > 75 ? 'crit' : t.temp > 65 ? 'warn' : 'ok'}`; }
}

function updateBentoRing(ringId, labelId, value, unit, colorClass) {
    const ring  = document.getElementById(ringId);
    const label = document.getElementById(labelId);
    if (!ring || !label) return;

    const circumference = 264; // 2π * r=42
    const pct    = Math.min(Math.max(value, 0), 100);
    const maxPct = unit === '°C' ? Math.min(value / 100, 1) : pct / 100;
    const offset = circumference - maxPct * circumference;
    ring.style.strokeDashoffset = offset;
    label.textContent = `${Math.round(value)}${unit}`;

    // Dynamic color-coding via class swaps
    ring.classList.remove('ring-cyan', 'ring-green', 'ring-amber', 'ring-crimson');
    if (unit === '%') {
        ring.classList.add(pct > 80 ? 'ring-crimson' : pct > 60 ? 'ring-amber' : `ring-${colorClass}`);
    } else {
        ring.classList.add(value > 75 ? 'ring-crimson' : value > 65 ? 'ring-amber' : `ring-${colorClass}`);
    }
}

/** Legacy fallback for any code still calling updateGauge with old IDs */
function updateGauge(gaugeId, labelId, value, unit) {
    const gauge = document.getElementById(gaugeId);
    const label = document.getElementById(labelId);
    if (!gauge || !label) return;
    const ring = gauge.querySelector('.gauge-ring');
    if (!ring) return;
    const circumference = 264;
    const offset = circumference - (Math.min(value, 100) / 100) * circumference;
    ring.style.transition = 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)';
    ring.style.strokeDashoffset = offset;
    label.textContent = `${Math.round(value)}${unit}`;
}

/**
 * TOR INTEGRATION — Circuit Monitoring & Real-time Data
 */
function initTorIntegration() {
    // Initialize Tor circuit monitor
    updateTorCircuitData();
    
    // Poll Tor circuit every 5 seconds
    setInterval(() => {
        updateTorCircuitData();
    }, 5000);
}

function updateTorCircuitData() {
    const baseUrl = window.location.protocol === 'file:' ? 'http://localhost:5000' : '';
    
    fetch(`${baseUrl}/api/v1/tor/circuit`)
        .then(r => r.json())
        .then(data => {
            if (data.error) {
                logToConsole(`TOR: ${data.error}`, 'warn');
                return;
            }
            
            // Update Tor status badge
            const statusBadge = document.getElementById('tor-status-badge');
            const statusText = document.getElementById('tor-status-text');
            
            if (statusBadge && statusText) {
                statusBadge.classList.remove('error');
                statusBadge.classList.add('connected');
                
                const circuitCount = data.circuit_count || 0;
                statusText.textContent = circuitCount > 0 ? 
                    `CIRCUIT ACTIVE · ${circuitCount} OPEN` : 
                    'AWAITING CONNECTION';
            }
            
            // Update circuit visualization
            if (data.circuits && data.circuits.length > 0) {
                const circuit = data.circuits[0]; // Use first circuit
                updateTorPipelineVisualization(circuit);
            }
            
            // Log status
            logToConsole(`TOR: Circuit refreshed (${data.circuit_count} active)`, 'ok');
        })
        .catch(err => {
            logToConsole(`TOR: Connection failed - ${err.message}`, 'error');
            
            // Update status badge
            const statusBadge = document.getElementById('tor-status-badge');
            const statusText = document.getElementById('tor-status-text');
            
            if (statusBadge && statusText) {
                statusBadge.classList.remove('connected');
                statusBadge.classList.add('error');
                statusText.textContent = 'OFFLINE';
            }
        });
}

function updateTorPipelineVisualization(circuit) {
    // Update the three Tor nodes with real circuit data
    const nodes = circuit.nodes || [];
    
    // Node 1: Entry Guard
    if (nodes[0]) {
        const node1 = nodes[0];
        const entryLabel = document.getElementById('tor-entry-cc');
        if (entryLabel) {
            const country = node1.country || 'XX';
            const type = 'GRD'; // Guard
            entryLabel.textContent = `${country} · ${type}`;
        }
        
        // Tooltip
        const entryNode = document.getElementById('tor-node-entry');
        if (entryNode) {
            entryNode.title = `Entry Guard: ${node1.name || 'Unknown'} (${node1.ip})`;
        }
    }
    
    // Node 2: Middle Relay
    if (nodes[1]) {
        const node2 = nodes[1];
        const relayLabel = document.getElementById('tor-relay-cc');
        if (relayLabel) {
            const country = node2.country || 'XX';
            const type = 'MID'; // Middle
            relayLabel.textContent = `${country} · ${type}`;
        }
        
        const relayNode = document.getElementById('tor-node-relay');
        if (relayNode) {
            relayNode.title = `Middle Relay: ${node2.name || 'Unknown'} (${node2.ip})`;
        }
    }
    
    // Node 3: Exit Node
    if (nodes[2]) {
        const node3 = nodes[2];
        const exitLabel = document.getElementById('tor-exit-cc');
        if (exitLabel) {
            const country = node3.country || 'XX';
            const type = 'EXT'; // Exit
            exitLabel.textContent = `${country} · ${type}`;
        }
        
        const exitNode = document.getElementById('tor-node-exit');
        if (exitNode) {
            exitNode.title = `Exit Node: ${node3.name || 'Unknown'} (${node3.ip})`;
        }
    }
}

function getTorBridgeInfo() {
    const baseUrl = window.location.protocol === 'file:' ? 'http://localhost:5000' : '';
    
    fetch(`${baseUrl}/api/v1/tor/bridges`)
        .then(r => r.json())
        .then(data => {
            logToConsole(`TOR: ${data.total} bridges available`, 'info');
            window.AppStore.torBridges = data.bridges;
        })
        .catch(err => logToConsole(`Failed to fetch bridges: ${err.message}`, 'error'));
}

/**
 * Bot Fleet Logic
 */
function initBotFleet() {
    const list = document.getElementById('bot-fleet-list');
    if (!list) return;

    // 1. Initial State Definition
    const bots = [
        { id: 'BOT_01_ALPHA', target: 'Scraping LeakDB...' },
        { id: 'BOT_02_BRAVO', target: 'Parsing JSON...' },
        { id: 'BOT_03_CHARLIE', target: 'Verifying Hash...' },
        { id: 'BOT_04_DELTA', target: 'Bypassing CAPTCHA...' }
    ];

    // 2. DOM Rendering
    list.innerHTML = bots.map((bot, i) => `
        <div class="fleet-unit" id="fleet-unit-${i}">
            <div class="unit-head">
                <span class="unit-name">${bot.id}</span>
                <span class="status-chip secure">ACTIVE</span>
            </div>
            <div class="unit-body">
                <div class="unit-task" id="fleet-task-${i}">${bot.target}</div>
                <div class="unit-progress-row">
                    <div class="unit-progress-label">
                        <div class="micro-dots-track">
                            <div class="micro-dots"></div>
                        </div>
                    </div>
                    <div class="unit-percent" id="fleet-pct-${i}">0%</div>
                </div>
                <div class="unit-progress-bar">
                    <div class="progress-fill pulse-glow" id="fleet-bar-${i}" style="width: 0%;"></div>
                </div>
            </div>
        </div>
    `).join('');

    // 3. DOM Selection Strategy (Cache elements to avoid re-querying)
    const uiElements = bots.map((_, i) => ({
        container: document.getElementById(`fleet-unit-${i}`),
        taskEl: document.getElementById(`fleet-task-${i}`),
        pctEl: document.getElementById(`fleet-pct-${i}`),
        barEl: document.getElementById(`fleet-bar-${i}`),
        progress: Math.floor(Math.random() * 80) // Stagger initial progress
    }));

    const mockTasks = [
        'Parsing JSON...', 'Bypassing CAPTCHA...', 'Verifying Hash...', 
        'Scraping LeakDB...', 'Extracting PGP...', 'Analyzing Network...',
        'Compiling Dossier...', 'Decrypting Payload...'
    ];

    // 4. Update Loop
    setInterval(() => {
        uiElements.forEach(ui => {
            // Increment progress by a random float between 1.0 and 3.0
            ui.progress += Math.random() * 2 + 1;
            
            if (ui.progress >= 100) {
                ui.progress = 0;
                ui.taskEl.textContent = mockTasks[Math.floor(Math.random() * mockTasks.length)];
                
                // Flash neon green
                ui.container.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
                setTimeout(() => {
                    ui.container.style.backgroundColor = '';
                }, 300);
            }
            
            const p = Math.floor(ui.progress);
            ui.pctEl.textContent = p + '%';
            ui.barEl.style.width = p + '%';
        });
    }, 150);
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
let logLineCount = 0;
const MAX_LOGS = 500;
let logStreamPaused = false;
let logAutoscroll = true;
let currentLogFilter = 'all';
let currentSearchTerm = '';
let useRegex = false;
let logSimInterval = null;

function initLogStream() {
    const consoleOutput = document.getElementById('console-output');
    const pauseBtn = document.getElementById('log-pause-btn');
    const autoscrollCb = document.getElementById('log-autoscroll');
    const clearBtn = document.getElementById('log-clear-btn');
    const searchInput = document.getElementById('log-search-input');
    const regexBtn = document.getElementById('log-regex-toggle');
    const searchClear = document.getElementById('log-search-clear');
    const filterChips = document.querySelectorAll('.log-chip');
    
    if (!consoleOutput) return;

    // Clear initial mock data
    consoleOutput.innerHTML = '';
    
    // Autoscroll toggle
    if (autoscrollCb) {
        autoscrollCb.addEventListener('change', (e) => {
            logAutoscroll = e.target.checked;
            consoleOutput.dataset.autoscroll = logAutoscroll.toString();
            if (logAutoscroll) consoleOutput.scrollTop = consoleOutput.scrollHeight;
        });
    }

    // Manual scroll overrides autoscroll
    consoleOutput.addEventListener('scroll', () => {
        if (!logAutoscroll) return;
        const isAtBottom = Math.abs(consoleOutput.scrollHeight - consoleOutput.clientHeight - consoleOutput.scrollTop) < 10;
        if (!isAtBottom && autoscrollCb) {
            logAutoscroll = false;
            autoscrollCb.checked = false;
            consoleOutput.dataset.autoscroll = 'false';
        }
    });

    // Pause toggle
    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            logStreamPaused = !logStreamPaused;
            consoleOutput.dataset.paused = logStreamPaused.toString();
            pauseBtn.classList.toggle('active', logStreamPaused);
            pauseBtn.setAttribute('aria-pressed', logStreamPaused);
            
            const lsbStream = document.getElementById('lsb-stream');
            if (lsbStream) {
                lsbStream.innerHTML = logStreamPaused ? '&#10074;&#10074; PAUSED' : '&#9679; STREAMING';
                lsbStream.classList.toggle('paused', logStreamPaused);
            }
        });
    }

    // Clear
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            consoleOutput.innerHTML = '';
            logLineCount = 0;
            updateLogStatus();
        });
    }

    // Filters
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => {
                c.classList.remove('active');
                c.setAttribute('aria-pressed', 'false');
            });
            chip.classList.add('active');
            chip.setAttribute('aria-pressed', 'true');
            
            currentLogFilter = chip.dataset.filter;
            const lsbFilter = document.getElementById('lsb-filter');
            if (lsbFilter) lsbFilter.textContent = `FILTER: ${currentLogFilter.toUpperCase()}`;
            
            applyLogFilters();
        });
    });

    // Search
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchTerm = e.target.value;
            if (searchClear) searchClear.style.display = currentSearchTerm ? 'block' : 'none';
            applyLogFilters();
        });
    }
    if (regexBtn) {
        regexBtn.addEventListener('click', () => {
            useRegex = !useRegex;
            regexBtn.classList.toggle('active', useRegex);
            regexBtn.setAttribute('aria-pressed', useRegex);
            applyLogFilters();
        });
    }
    if (searchClear) {
        searchClear.addEventListener('click', () => {
            if(searchInput) searchInput.value = '';
            currentSearchTerm = '';
            searchClear.style.display = 'none';
            applyLogFilters();
        });
    }

    // Start Simulation
    scheduleNextLog();
}

function createJsonTree(obj, isRoot = true) {
    if (obj === null) return '<span class="json-null">null</span>';
    if (typeof obj === 'number') return `<span class="json-number">${obj}</span>`;
    if (typeof obj === 'boolean') return `<span class="json-boolean">${obj}</span>`;
    if (typeof obj === 'string') return `<span class="json-string">"${obj.replace(/"/g, '\\"')}"</span>`;
    
    if (Array.isArray(obj)) {
        if (obj.length === 0) return '<span class="json-bracket">[]</span>';
        let html = `<span class="json-toggle expanded"></span><span class="json-bracket">[</span><ul class="json-tree">`;
        obj.forEach((val, i) => {
            html += `<li>${createJsonTree(val, false)}${i < obj.length - 1 ? ',' : ''}</li>`;
        });
        html += `</ul><span class="json-bracket">]</span>`;
        return html;
    }
    
    if (typeof obj === 'object') {
        const keys = Object.keys(obj);
        if (keys.length === 0) return '<span class="json-bracket">{}</span>';
        let html = (isRoot ? `<div class="json-tree">` : '') + `<span class="json-toggle expanded"></span><span class="json-bracket">{</span><ul>`;
        keys.forEach((key, i) => {
            html += `<li><span class="json-key">"${key}"</span>: ${createJsonTree(obj[key], false)}${i < keys.length - 1 ? ',' : ''}</li>`;
        });
        html += `</ul><span class="json-bracket">}</span>` + (isRoot ? `</div>` : '');
        return html;
    }
    return String(obj);
}

// Global click handler for JSON toggles
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('json-toggle')) {
        const toggle = e.target;
        const ul = toggle.nextElementSibling.nextElementSibling; // Span bracket, then UL
        if (ul && ul.tagName === 'UL') {
            const isExpanded = toggle.classList.contains('expanded');
            toggle.classList.toggle('expanded', !isExpanded);
            toggle.classList.toggle('collapsed', isExpanded);
            ul.style.display = isExpanded ? 'none' : 'block';
        }
    }
});


function parseLogTokens(msg) {
    let parsed = msg;
    // URL highlight
    parsed = parsed.replace(/(https?:\/\/[^\s]+)/g, '<span class="ll-token url">$1</span>');
    // Numbers
    parsed = parsed.replace(/\b(\d+(?:\.\d+)?(?:ms|s|gb|mb|kb)?)\b/gi, '<span class="ll-token num">$1</span>');
    // Common tags
    parsed = parsed.replace(/\[(OK|SEC)\]/g, '[<span class="ll-token ok">$1</span>]');
    parsed = parsed.replace(/\[(WARN|BLOCK)\]/g, '[<span class="ll-token warn">$1</span>]');
    parsed = parsed.replace(/\[(ERR|FAIL)\]/g, '[<span class="ll-token err">$1</span>]');
    // Context tokens
    parsed = parsed.replace(/\{([^}]+)\}/g, '<span class="ll-token ctx">$1</span>');
    return parsed;
}

function applyLogFilters() {
    const consoleOutput = document.getElementById('console-output');
    if (!consoleOutput) return;
    
    const lines = consoleOutput.querySelectorAll('.log-line');
    let visibleCount = 0;
    
    let regex = null;
    if (currentSearchTerm) {
        try {
            regex = useRegex ? new RegExp(currentSearchTerm, 'i') : new RegExp(currentSearchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        } catch(e) {}
    }

    lines.forEach(line => {
        const source = line.dataset.source || 'system';
        const msgEl = line.querySelector('.ll-msg');
        const rawText = msgEl ? (msgEl.textContent || '') : '';
        
        // Filter check
        let show = currentLogFilter === 'all' || source === currentLogFilter;
        
        // Search check
        if (show && regex) {
            show = regex.test(rawText) || regex.test(line.textContent || '');
        }

        line.style.display = show ? 'flex' : 'none';
        
        // Highlight logic
        if (show) {
            visibleCount++;
            if (msgEl) {
                // Reset to un-highlighted parsed tokens first
                msgEl.innerHTML = line.dataset.parsedMsg || msgEl.innerHTML;
                
                if (regex && currentSearchTerm) {
                    // Primitive highlighting - could be improved to not break HTML tags
                    // For now, only highlight if not matching inside tags
                    const walker = document.createTreeWalker(msgEl, NodeFilter.SHOW_TEXT, null, false);
                    const nodesToReplace = [];
                    let n;
                    while(n = walker.nextNode()) nodesToReplace.push(n);
                    
                    nodesToReplace.forEach(node => {
                        if(node.nodeValue.trim() && regex.test(node.nodeValue)) {
                            const span = document.createElement('span');
                            span.innerHTML = node.nodeValue.replace(regex, match => `<span class="log-match">${match}</span>`);
                            node.parentNode.replaceChild(span, node);
                        }
                    });
                }
            }
        }
    });

    const lsbMatched = document.getElementById('lsb-matched');
    if (lsbMatched) {
        lsbMatched.textContent = (currentSearchTerm || currentLogFilter !== 'all') ? `MATCHED: ${visibleCount}` : '';
    }
}

function logToConsole(msg, type = 'info', source = 'system') {
    if (logStreamPaused) return;

    const body = document.getElementById('console-output');
    if (!body) return;

    logLineCount++;
    const id = logLineCount.toString().padStart(4, '0');
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
    
    let badge = 'info';
    let badgeText = 'INFO';
    if (type === 'success') { badge = 'ok'; badgeText = 'OK'; }
    if (type === 'warn') { badge = 'warn'; badgeText = 'WARN'; }
    if (type === 'error') { badge = 'err'; badgeText = 'ERR'; source = 'error'; }

    let sourceLabel = source.toUpperCase();
    if (sourceLabel.length > 10) sourceLabel = sourceLabel.substring(0, 10);

    let parsedMsg = '';
    if (typeof msg === 'object' && msg !== null) {
        parsedMsg = createJsonTree(msg, true);
    } else {
        parsedMsg = parseLogTokens(String(msg));
    }

    const entry = document.createElement('div');
    entry.className = 'log-line';
    entry.dataset.source = source;
    entry.dataset.parsedMsg = parsedMsg; // Store for filter resets
    entry.innerHTML = `
        <span class="ll-ln">${id}</span>
        <span class="ll-ts">${ts}</span>
        <span class="ll-src">[${sourceLabel}]</span>
        <span class="ll-msg">${parsedMsg}</span>
        <span class="ll-badge ${badge}">${badgeText}</span>
    `;

    body.appendChild(entry);

    // Enforce MAX_LOGS
    while (body.children.length > MAX_LOGS) {
        body.removeChild(body.firstChild);
    }

    if (logAutoscroll) {
        body.scrollTop = body.scrollHeight;
    }

    // If there is an active filter or search, apply it to the new log
    if (currentLogFilter !== 'all' || currentSearchTerm) {
        applyLogFilters();
    } else {
        updateLogStatus();
    }
}

function updateLogStatus() {
    const lsbCount = document.getElementById('lsb-count');
    const body = document.getElementById('console-output');
    if (lsbCount && body) {
        lsbCount.textContent = `${body.children.length} LINES`;
    }
}

// ── Simulation Logic ──
const simSources = ['system', 'ml', 'scraper'];
const simLogs = [
    { text: "Crawling darkweb market {DREAD_HUB} — page depth 4", type: "info", source: "scraper" },
    { text: "Encountered CAPTCHA on endpoint /api/v2/intel. Solving via proxy...", type: "warn", source: "scraper" },
    { text: "Extracted 1,402 PGP keys from target node.", type: "success", source: "scraper" },
    { text: "Context shifted: {OSINT_DEEP_DIVE} — injecting prompt templates", type: "info", source: "ml" },
    { text: "Llama3 offloading tensor slices... 24/32 layers in VRAM", type: "info", source: "system" },
    { text: "Connection timeout on Tor circuit IS->DE. Rebuilding...", type: "error", source: "system" },
    { text: { target: "0x4F92B...", nodes_discovered: 12, malicious: true, signatures: ["C2", "RANSOM"] }, type: "info", source: "ml" },
    { text: "Analyzed 450 posts. Found 3 positive matches for target handle.", type: "success", source: "ml" },
    { text: "Network latency spike: 425ms", type: "warn", source: "system" }
];

function scheduleNextLog() {
    const delay = Math.floor(Math.random() * 500) + 300; // 300-800ms
    logSimInterval = setTimeout(() => {
        if (!logStreamPaused) {
            const log = simLogs[Math.floor(Math.random() * simLogs.length)];
            logToConsole(log.text, log.type, log.source);
        }
        scheduleNextLog();
    }, delay);
}

document.addEventListener('DOMContentLoaded', () => {
    initLogStream();
});

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

    const icon = extractFamily(modelName);
    const selectorName = document.getElementById('variant-selector-name');
    const selectorSubtitle = document.getElementById('variant-selector-subtitle');
    const selectorIcon = document.getElementById('variant-selector-icon');
    const selectorList = document.getElementById('variant-selector-list');
    const selectorModal = document.getElementById('variant-selector-modal');

    if (!selectorList || !selectorModal) return;

    selectorIcon.textContent = icon;
    selectorName.textContent = model.name;
    selectorSubtitle.textContent = 'Choose a version to download';

    const renderVariants = (sizes) => {
        if (!sizes || sizes.length === 0) {
            selectorList.innerHTML = '<div class="mh-variant-loading">No download versions available</div>';
            return;
        }

        selectorList.innerHTML = sizes.map(size => {
            const fullName = `${model.name}:${size}`;
            return `
                <button class="modal-variant-btn" onclick="closeVariantSelector(); pullModel('${fullName}')">
                    <span class="variant-name">${fullName}</span>
                    <span class="variant-download">↓</span>
                </button>`;
        }).join('');
    };

    if (model.sizes && model.sizes.length > 0) {
        renderVariants(model.sizes);
        selectorModal.style.display = 'flex';
        return;
    }

    selectorList.innerHTML = '<div class="mh-variant-loading">Loading versions…</div>';
    fetch(`${API_BASE}/api/v1/ollama/library/tags?model=${encodeURIComponent(model.name)}`)
        .then(response => response.json())
        .then(data => {
            const tags = Array.isArray(data.tags) && data.tags.length ? data.tags : ['latest'];
            renderVariants(tags);
            selectorModal.style.display = 'flex';
        })
        .catch(() => {
            selectorList.innerHTML = '<div class="mh-variant-loading">Could not load versions</div>';
            selectorModal.style.display = 'flex';
        });
}

function closeVariantSelector() {
    const modal = document.getElementById('variant-selector-modal');
    if (modal) modal.style.display = 'none';
}


/**
 * Network Simulation
 */
function initNetworkSimulation() {
    setInterval(() => {
        // Random throughput 2.0 to 8.5 MB/s
        const throughput = (Math.random() * (8.5 - 2.0) + 2.0).toFixed(1);
        const tEls = [document.getElementById('ticker-throughput'), document.getElementById('tor-throughput')];
        tEls.forEach(el => {
            if (el) {
                el.textContent = `${throughput} MB/s`;
                el.classList.remove('flash-update');
                void el.offsetWidth; // trigger reflow
                el.classList.add('flash-update');
            }
        });

        // Random latency 12 to 45 ms
        const latency = Math.floor(Math.random() * (45 - 12) + 12);
        const lEls = [document.getElementById('ticker-latency'), document.getElementById('tor-latency')];
        lEls.forEach(el => {
            if (el) {
                el.textContent = `${latency} ms`;
                el.classList.remove('flash-update');
                void el.offsetWidth; // trigger reflow
                el.classList.add('flash-update');
            }
        });
    }, 1200);
}
