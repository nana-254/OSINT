/**
 * TACTICAL OSINT | v4.1.0 ENHANCED UI FEATURES
 * New components: Health Sparkline, Intel Graph, n8n Checklist, CRT Terminal, etc.
 */

/* ════════════════════════════════════════════════════════════
   1. HEALTH SPARKLINE (Sidebar)
   ════════════════════════════════════════════════════════════ */

const healthSparklineData = [];
const SPARKLINE_MAX_POINTS = 20;

function initHealthSparkline() {
    const canvas = document.getElementById('health-sparkline');
    if (!canvas) return;

    // Initialize with dummy data
    for (let i = 0; i < SPARKLINE_MAX_POINTS; i++) {
        healthSparklineData.push(Math.random() * 50 + 10); // 10-60ms range
    }

    // Poll n8n webhook latency every 2 seconds
    setInterval(() => {
        // Simulate latency measurement
        const latency = Math.random() * 50 + 10;
        healthSparklineData.push(latency);
        if (healthSparklineData.length > SPARKLINE_MAX_POINTS) {
            healthSparklineData.shift();
        }
        drawHealthSparkline(canvas);
    }, 2000);

    drawHealthSparkline(canvas);
}

function drawHealthSparkline(canvas) {
    if (!canvas || healthSparklineData.length === 0) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = 4;
    const graphHeight = height - padding * 2;
    const graphWidth = width - padding * 2;
    const pointSpacing = graphWidth / (healthSparklineData.length - 1 || 1);

    // Clear canvas
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, width, height);

    // Find min/max for scaling
    const max = Math.max(...healthSparklineData, 100);
    const min = Math.min(...healthSparklineData, 0);
    const range = max - min || 1;

    // Draw gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(0, 255, 135, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 255, 135, 0.05)');

    ctx.beginPath();
    ctx.moveTo(padding, height - padding);

    // Draw line path
    healthSparklineData.forEach((value, i) => {
        const x = padding + i * pointSpacing;
        const normalized = (value - min) / range;
        const y = height - padding - (normalized * graphHeight);
        ctx.lineTo(x, y);
    });

    ctx.lineTo(width - padding, height - padding);
    ctx.closePath();

    // Fill area under curve
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.strokeStyle = 'rgba(0, 255, 135, 0.8)';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.beginPath();
    healthSparklineData.forEach((value, i) => {
        const x = padding + i * pointSpacing;
        const normalized = (value - min) / range;
        const y = height - padding - (normalized * graphHeight);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();
}

/* ════════════════════════════════════════════════════════════
   2. INTEL GRAPH (D3.js Visualization)
   ════════════════════════════════════════════════════════════ */

let intelGraphInstance = null;

function initIntelGraph() {
    const container = document.getElementById('intel-graph-container');
    if (!container || typeof d3 === 'undefined') return;

    // Sample intel data
    const sampleData = {
        nodes: [
            { id: '192.168.1.100', type: 'ip-node', label: '192.168.1.100' },
            { id: 'target-acme', type: 'target-node', label: 'ACME Corp' },
            { id: 'john-doe', type: 'entity-node', label: 'John Doe' },
            { id: '10.0.0.5', type: 'ip-node', label: '10.0.0.5' },
            { id: 'evil-vpn', type: 'entity-node', label: 'Evil VPN' }
        ],
        links: [
            { source: '192.168.1.100', target: 'target-acme', value: 3 },
            { source: 'target-acme', target: 'john-doe', value: 2 },
            { source: 'john-doe', target: '10.0.0.5', value: 2 },
            { source: '10.0.0.5', target: 'evil-vpn', value: 1 },
            { source: 'evil-vpn', target: '192.168.1.100', value: 1 }
        ]
    };

    drawIntelGraph(sampleData);
}

function drawIntelGraph(data) {
    const svg = document.getElementById('intel-graph-svg');
    if (!svg || typeof d3 === 'undefined') return;

    const width = svg.clientWidth;
    const height = svg.clientHeight;

    // Create D3 simulation
    const simulation = d3.forceSimulation(data.nodes)
        .force('link', d3.forceLink(data.links).id(d => d.id).distance(80))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(30));

    // Select SVG
    const svgSelect = d3.select(svg);
    svgSelect.selectAll('*').remove(); // Clear

    // Create group for transforms
    const g = svgSelect.append('g');

    // Draw links
    const links = g.selectAll('.intel-graph-link')
        .data(data.links)
        .enter()
        .append('line')
        .attr('class', 'intel-graph-link')
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

    // Draw nodes
    const nodes = g.selectAll('.intel-graph-node')
        .data(data.nodes)
        .enter()
        .append('g')
        .attr('class', 'intel-graph-node')
        .attr('transform', d => `translate(${d.x},${d.y})`)
        .call(d3.drag()
            .on('start', dragStarted)
            .on('drag', dragged)
            .on('end', dragEnded));

    nodes.append('circle')
        .attr('r', 12)
        .attr('fill', d => {
            if (d.type === 'ip-node') return 'rgba(0, 212, 232, 0.8)';
            if (d.type === 'target-node') return 'rgba(247, 201, 72, 0.8)';
            return 'rgba(0, 255, 135, 0.8)';
        });

    nodes.append('text')
        .attr('dy', '0.3em')
        .attr('text-anchor', 'middle')
        .text(d => {
            const label = d.label || d.id;
            return label.length > 12 ? label.substring(0, 10) + '…' : label;
        });

    // Update positions on simulation tick
    simulation.on('tick', () => {
        links
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        nodes.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragStarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragEnded(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    intelGraphInstance = { simulation, data };
}

/* ════════════════════════════════════════════════════════════
   3. n8n PROGRESSIVE LOADING CHECKLIST
   ════════════════════════════════════════════════════════════ */

function initN8nChecklist() {
    const checklist = document.getElementById('n8n-checklist');
    if (!checklist) return;

    // Simulate workflow progression
    const stages = ['refining', 'scraping', 'judging'];
    let currentStage = 0;

    setInterval(() => {
        // Update current stage
        stages.forEach((stage, idx) => {
            const statusEl = document.getElementById(`stage-${stage}`);
            if (!statusEl) return;

            if (idx === currentStage) {
                statusEl.textContent = '🟡';
                statusEl.className = 'checklist-status pending';
            } else if (idx < currentStage) {
                statusEl.textContent = '✓';
                statusEl.className = 'checklist-status complete';
            } else {
                statusEl.textContent = '⚪';
                statusEl.className = 'checklist-status idle';
            }
        });

        currentStage = (currentStage + 1) % stages.length;
    }, 5000);
}

/* ════════════════════════════════════════════════════════════
   4. CRT TERMINAL EFFECTS
   ════════════════════════════════════════════════════════════ */

function initCrtTerminal() {
    const terminal = document.getElementById('main-terminal');
    if (!terminal) return;

    // Add scanlines via CSS (already in styles)
    // Blinking cursor is handled via CSS animation

    // Simulate terminal output
    const lines = [
        '[10:42:03] Kernel initialized. Loading llama3.1-8b-obliterated...',
        '[10:42:05] Context shifted: OSINT',
        '[10:42:07] Success (llama3.1-8b offloaded) ✓',
        '[10:42:08] TOR circuit stable · 3 hops',
        '[10:42:10] Predictor engine online'
    ];

    const consoleOutput = document.querySelector('.crt-terminal');
    if (consoleOutput) {
        lines.forEach((line, idx) => {
            setTimeout(() => {
                const lineEl = document.createElement('div');
                lineEl.className = 'crt-terminal-line';
                lineEl.textContent = line;
                consoleOutput.appendChild(lineEl);
                consoleOutput.scrollTop = consoleOutput.scrollHeight;
            }, idx * 300);
        });
    }
}

/* ════════════════════════════════════════════════════════════
   5. ENHANCED MODEL CARDS
   ════════════════════════════════════════════════════════════ */

function initEnhancedModelCards() {
    // Add click handlers for model cards
    document.querySelectorAll('.model-card-enhanced').forEach(card => {
        card.addEventListener('mouseenter', () => {
            const tags = card.querySelectorAll('.capability-tag');
            tags.forEach(tag => {
                tag.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const filter = tag.textContent;
                    console.log(`Filtering models by: ${filter}`);
                    // Implement filter logic here
                });
            });
        });

        // Add action button handlers
        const actionBtns = card.querySelectorAll('.model-action-btn');
        actionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.textContent.trim();
                const modelName = card.querySelector('.model-name')?.textContent || 'Model';
                
                if (action.includes('LOAD')) {
                    btn.classList.add('loading');
                    setTimeout(() => {
                        btn.classList.remove('loading');
                        btn.textContent = 'LOADED ✓';
                        btn.disabled = true;
                    }, 2000);
                } else if (action.includes('UNLOAD')) {
                    btn.textContent = 'UNLOADED';
                    btn.disabled = true;
                }
                
                console.log(`${action}: ${modelName}`);
            });
        });
    });
}

/* ════════════════════════════════════════════════════════════
   6. SETTINGS 50-CONFIG MATRIX
   ════════════════════════════════════════════════════════════ */

function initSettingsMatrix() {
    const settingsView = document.getElementById('view-settings');
    if (!settingsView) return;

    // Add dynamic validation for settings
    document.querySelectorAll('.tactical-input').forEach(input => {
        input.addEventListener('blur', (e) => {
            // Validate and prevent trailing slash errors
            if (e.target.value.includes('http') && e.target.value.endsWith('/')) {
                e.target.value = e.target.value.slice(0, -1);
            }
        });
    });

    // Add live validation feedback
    document.querySelectorAll('[data-setting]').forEach(el => {
        el.addEventListener('change', () => {
            // Flash telemetry update
            el.parentElement?.classList.add('telemetry-flash');
            setTimeout(() => {
                el.parentElement?.classList.remove('telemetry-flash');
            }, 200);
        });
    });
}

/* ════════════════════════════════════════════════════════════
   7. ORCHESTRATION PAGE ENHANCEMENTS
   ════════════════════════════════════════════════════════════ */

function initOrchestrationEnhancements() {
    const m3Table = document.querySelector('.m3-table');
    if (!m3Table) return;

    // Add hover effects to M3 Judge table
    m3Table.querySelectorAll('tbody tr').forEach(row => {
        row.addEventListener('click', () => {
            // Highlight command network tree connectors
            const connector = document.querySelector('.network-connector');
            if (connector) {
                connector.classList.add('active');
                setTimeout(() => connector.classList.remove('active'), 600);
            }
        });
    });
}

/* ════════════════════════════════════════════════════════════
   8. UTILITY FUNCTIONS FOR ENHANCED FEATURES
   ════════════════════════════════════════════════════════════ */

// Flash telemetry update when data is injected
function flashTelemetryUpdate(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
        el.classList.add('telemetry-flash');
        setTimeout(() => el.classList.remove('telemetry-flash'), 200);
    }
}

// Trigger button depression effect
function triggerButtonDepression(button) {
    button.style.transform = 'scale(0.98)';
    setTimeout(() => {
        button.style.transform = 'scale(1)';
    }, 150);
}

// Export functions for global use
window.initHealthSparkline = initHealthSparkline;
window.initIntelGraph = initIntelGraph;
window.initN8nChecklist = initN8nChecklist;
window.initCrtTerminal = initCrtTerminal;
window.initEnhancedModelCards = initEnhancedModelCards;
window.initSettingsMatrix = initSettingsMatrix;
window.drawHealthSparkline = drawHealthSparkline;
window.drawIntelGraph = drawIntelGraph;
window.flashTelemetryUpdate = flashTelemetryUpdate;
window.triggerButtonDepression = triggerButtonDepression;
