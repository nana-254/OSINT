# Tactical OSINT Enhanced UI | Implementation Guide v4.1.0

## Overview
This document describes the comprehensive UI/UX enhancements implemented for the Tactical OSINT system. The implementation focuses on creating a high-fidelity, glass-morphic interface with real-time telemetry, advanced visualizations, and user-friendly controls.

## 📋 Implementation Summary

### Phase 1: Library Dependencies ✅
- **D3.js v7** - Force-directed graph visualization for Intel Graph
- **Chart.js v4.4** - Real-time metric visualization (for future use)
- **Interact.js** - Touch and drag handling (fallback)

**Files Modified:**
- `index.html` - Added library scripts to `<head>` section

### Phase 2: Core UI Enhancements ✅

#### 1. Enhanced Sidebar with Health Sparkline
**Components:**
- Live health sparkline canvas showing n8n webhook latency (last 20 seconds)
- Glassmorphic design with `backdrop-filter: blur(12px)`
- Green/red color coding for latency status

**Files:**
- `index.html` - Added `<canvas id="health-sparkline">` to sidebar footer
- `app-enhanced.js` - `initHealthSparkline()` function
- `styles-enhanced.css` - Sparkline styling and animations

**Features:**
- Polls latency every 2 seconds
- Renders smooth line chart with gradient fill
- Maintains 20-point rolling window

#### 2. Zen Mode Toggle
**Components:**
- Checkbox toggle at bottom of sidebar
- Hides sidebar and ticker tape for focused work
- Dedicates 95% of viewport to data

**Implementation:**
```css
.zen-mode .sidebar,
.zen-mode .ticker-tape { display: none !important; }
```

**Files:**
- `styles-enhanced.css` - Zen Mode styling
- `app.js` - `toggleZenMode()` function (enhanced)

#### 3. CRT-Styled Terminal
**Components:**
- Scanline overlay via CSS `repeating-linear-gradient`
- Blinking cursor animation (`▮`)
- Green-on-black monospace terminal aesthetic
- Full-width terminal log stream (50vh height)

**Files:**
- `styles-enhanced.css` - CRT terminal styling
- `app-enhanced.js` - `initCrtTerminal()` function

**CSS Details:**
```css
.crt-terminal::before {
    background: repeating-linear-gradient(
        0deg,
        rgba(0, 0, 0, 0.15),
        rgba(0, 0, 0, 0.15) 1px,
        transparent 1px,
        transparent 2px
    );
}
```

---

### Phase 3: Diagnostics Page Enhancements ✅

#### 1. Liquid-Fill Canvas Animations (Planned)
- Canvas-based gauge animations with liquid fill effect
- Real-time sparkline integration inside rings
- 60-second historical data tracking

**Status:** Framework in place, awaiting canvas implementation

#### 2. CPU Cores Gauge
- Added alongside VRAM and RAM gauges
- Displays active threads and frequency
- Color-coded by utilization level

**Files:**
- `index.html` - CPU gauge bento card
- `app.js` - `updateGauges()` integration

#### 3. Tor Pipeline 3-Node Visualization
**Components:**
- Entry Node (DE-Frankfurt)
- Relay Node (NL-Amsterdam)
- Exit Node (IS-Reykjavik)
- Glowing CSS data packets sliding along connections
- Amber pulse if latency > 500ms

**Features:**
- Real-time connection status indicators
- AES-256, RELAY, and ONION encryption labels
- LCD-style metrics (throughput, latency, circuit health)

**Files:**
- `index.html` - Tor pipeline card markup
- `styles.css` - Tor node and wire styling
- `app.js` - Tor status updates

#### 4. Terminal Utility Bar
**Components:**
- Live regex search with multi-pattern support
- Filter chips: `[ALL]`, `[M1 Refiner]`, `[Scraper]`, `[Errors]`
- Auto-scroll toggle
- Pause/Resume playback

**Files:**
- `index.html` - Log utility bar markup
- `app.js` - `initLogStream()` function

---

### Phase 4: Orchestration Page Enhancements ✅

#### 1. M3 Skeptical Judge Table
**Layout:**
- Left column (60vw): Scrolling table with sticky header
- Status badges: `[PASSED]`, `[FAILED]`, `[PENDING]`
- Glowing pill-badge indicators

**Features:**
- Hover state reveals SHA-256 hash or Tor circuit ID
- Click to trigger command network line animation
- JSON verification score display

**Files:**
- `index.html` - M3 Judge table markup
- `styles-enhanced.css` - Table styling
- `app-enhanced.js` - `initOrchestrationEnhancements()`

#### 2. Command Network Tree
**Layout:**
- Right column top (50%): 4-node visual flow
- Source → Bot → Judge → Dossier
- Cyan connector lines with glowing effect

**Animation:**
- Sequential line illumination on row click
- Pulsing glow effect (`pulse-glow-line` animation)

**Files:**
- `styles-enhanced.css` - Network tree styling
- `app-enhanced.js` - Command tree interactivity

#### 3. Active Bot Fleet
**Layout:**
- Right column bottom (50%): 4 horizontal progress tracks
- Dot-matrix fill animation
- Status: `Scraping LeakDB...` → `Parsing JSON...` etc.

**Files:**
- `app.js` - `initBotFleet()` function
- `styles.css` - Fleet unit styling

---

### Phase 5: Intel Hub Enhancements ✅

#### 1. n8n Progressive Loading Checklist
**Components:**
- 3-stage workflow visualization: Refining → Scraping → Judging
- Emoji indicators: 🟡 (active), ⚪ (idle), ✓ (complete)
- Sweeping neon fill effect as workflow progresses

**Files:**
- `index.html` - Checklist markup
- `app-enhanced.js` - `initN8nChecklist()` function
- `styles-enhanced.css` - Checklist styling

#### 2. Interactive Intel Graph
**Components:**
- D3.js force-directed graph showing entities and relationships
- Node types: IP Addresses (cyan), Targets (amber), Entities (green)
- Draggable nodes with physics simulation
- Link strength based on relationship weight

**Features:**
- Click node to highlight relationships
- Hover tooltip shows detailed information
- Legend distinguishes node types
- Automatic layout with collision detection

**Files:**
- `index.html` - Intel graph SVG container
- `app-enhanced.js` - `initIntelGraph()` and `drawIntelGraph()` functions
- `styles-enhanced.css` - Graph styling

**D3 Implementation:**
```javascript
d3.forceSimulation(data.nodes)
    .force('link', d3.forceLink(data.links).distance(80))
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(width/2, height/2))
```

---

### Phase 6: Ollama Model Enhancements ✅

#### 1. Enhanced Model Cards
**Components:**
- Contextual buttons: `INSTALL`, `LOAD TO VRAM`, `UNLOAD`
- VRAM overhead gauge showing exact consumption
- Interactive capability tags (clickable filters)
- Hover elevation effect with targeted glow

**Features:**
- Per-model VRAM overhead visualization
- Tag-based filtering capability
- Real-time loading ring animation on button click
- Responsive bento grid (3 cols desktop, 2 tablet)

**Files:**
- `index.html` - Enhanced model card markup
- `styles-enhanced.css` - Card styling and animations
- `app-enhanced.js` - `initEnhancedModelCards()` function

#### 2. VRAM Overhead Gauge
**Components:**
- Mini-donut chart inside each card
- Shows allocation before load
- Color gradient: cyan → green based on utilization

**Visual:**
```
╔═══════════════════╗
║  llama3:70b       ║
║  ▓▓▓▓▓▓░░░░  48GB  ║  ← Mini donut
║  [LOAD TO VRAM]   ║
╚═══════════════════╝
```

---

### Phase 7: Settings 50-Config Matrix ✅

**Structure:**
Eight categories organized in bento grid (responsive):

```
I. Visual Theme Lab (7 settings)
   • Master Theme (Cyan/Amber/Neon)
   • Font Scaling
   • Reduced Motion Toggle
   • CRT Scanline Toggle
   • Terminal Color Scheme
   • Sidebar Default State
   • OLED True Black Enforcer

II. Engine Model Matrix (8 settings)
   • M1/M2/M3 Model Selection
   • Global Temperature Profile
   • VRAM Offload Limit
   • Max Context Window
   • Fallback Model Selection
   • Auto-Unload Idle Models

III. Node Endpoint Matrix (7 settings)
   • Ollama API URL
   • n8n Webhook URL
   • Redis Session Store URL
   • OSINT Custom API URL
   • Webhook Timeout Threshold
   • Local API Key Vault (AES-256)
   • Disable WebSockets Toggle

IV. Tor & Proxy Config (8 settings)
   • SOCKS5 Proxy Host:Port
   • Tor Auto-Renew Toggle
   • Renew Interval Slider
   • Hop Count Selection
   • Exit Node Country Restriction
   • Fallback Proxy List
   • Force HTTPS over Tor
   • Master Clear Tor DNS Cache

V. Security & Session Handling (7 settings)
   • Session Time-to-Live
   • Hallucination Guard
   • Max Retry Loops
   • Safety Preflight Guard
   • Require 2FA for Dossier Deletion
   • Auto-Wipe on Tab Close
   • Audit Log Retention

VI. Telegram Gateway (7 settings)
   • Bot Token
   • Target Chat ID
   • Parse Mode
   • Delivery Enabled
   • Silent Notifications
   • VRAM Threshold Alert
   • PDF Dossier via Telegram

VII. Data Extraction & Storage (5 settings)
   • Vector DB Endpoint
   • Scraper Chunk Size
   • Dossier Output Format
   • Local Export Directory
   • Max Dossier Size

VIII. System Overrides (1 setting)
   • Flush All Caches Killswitch
```

**Files:**
- `index.html` - Settings matrix markup
- `styles-enhanced.css` - Category card styling
- `app-enhanced.js` - `initSettingsMatrix()` function

**Features:**
- Live regex validation for URL inputs
- Prevents trailing slash errors
- Neon flash feedback on change
- Organized bento grid layout

---

### Phase 8: Global Animations & Easing ✅

**Cubic-Bezier Curves:**
```css
--ease-tactile: cubic-bezier(0.25, 1, 0.5, 1);   /* Button press */
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);    /* Smooth transitions */
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1); /* Bounce effect */
```

**Button Interactions:**
- 150ms tactile depression: `transform: scale(0.98)`
- 200ms neon background flash on data injection
- State change animations with consistent easing

**Files:**
- `styles-enhanced.css` - All animation definitions
- `app-enhanced.js` - `triggerButtonDepression()` utility

---

## 📁 File Structure

### New Files Created:
```
/home/nana/Desktop/OSINT/static/
├── styles-enhanced.css      (New - 700+ lines of enhanced styling)
└── app-enhanced.js          (New - 400+ lines of enhanced functionality)
```

### Modified Files:
```
/home/nana/Desktop/OSINT/static/
├── index.html               (Added libraries, new components)
├── app.js                   (Added initialization calls)
├── styles.css               (No changes)
└── styles-models-enhanced.css (No changes)
```

---

## 🎯 Integration Points

### API Endpoints Referenced:
- `/api/v1/system/telemetry` - System metrics (VRAM, CPU, Temp)
- `/api/v1/system/emergency-stop` - Emergency stop button
- `/api/v1/ollama/tags` - Ollama models
- `/api/v1/ollama/ps` - Running models
- `/api/v1/n8n/webhook` - n8n workflow execution

### WebSocket/Polling Integration:
- Real-time telemetry updates (2s polling)
- n8n workflow status (via webhook)
- Tor circuit health monitoring
- GPU temperature tracking

---

## 🚀 Features Not Yet Implemented

### Canvas-Based Liquid-Fill Animations
The specification calls for liquid-fill canvas animations in the gauge rings. Currently, the framework is in place with:
- Canvas elements prepared in HTML
- Styling set up in CSS
- Placeholder functions in JavaScript

**To Implement:**
1. Create liquid physics simulation using canvas
2. Populate sparkline data from telemetry
3. Animate fill level with wave effect
4. Sync with gauge ring updates

### API Integration for Real Data
Currently using simulated data. To connect real APIs:

1. **Ollama Integration:**
   - Replace simulated models with actual `/api/tags` response
   - Add real VRAM calculation based on model size
   - Implement actual load/unload operations

2. **n8n Webhook:**
   - Connect to real n8n instance
   - Track actual workflow stages
   - Display real-time execution logs

3. **Tor Circuit Monitoring:**
   - Integrate with Tor control port
   - Display actual circuit composition
   - Monitor real latency metrics

4. **GPU/System Metrics:**
   - Parse actual NVIDIA GPU stats
   - Read real CPU core count and frequency
   - Track actual temperature from GPU sensors

---

## 🎨 Design System

### Color Palette (Pre-existing)
```css
--accent-primary: #00D4E8     /* Cyan */
--accent-amber: #F7C948       /* Warning */
--accent-crimson: #FF416C     /* Critical */
--accent-green: #00FF87       /* Nominal */
--bg-oled: #050505            /* True black */
--bg-surface: #0F1115         /* Card surface */
```

### Typography
```css
--font-sans: 'Inter'           /* UI text */
--font-mono: 'JetBrains Mono'  /* Code/telemetry */
```

### Spacing Scale
```css
4px, 8px, 12px, 16px, 20px, 24px
```

### Border Radius
```css
--radius-sm: 4px
--radius-md: 8px
--radius-lg: 12px
```

---

## 📊 Component Status Matrix

| Component | Status | Files | Notes |
|-----------|--------|-------|-------|
| Health Sparkline | ✅ Complete | app-enhanced.js, styles-enhanced.css | Drawing, polling, canvas rendering |
| Zen Mode | ✅ Complete | styles-enhanced.css | CSS-based toggle |
| CRT Terminal | ✅ Complete | styles-enhanced.css | Scanlines, cursor blink |
| Intel Graph | ✅ Complete | app-enhanced.js, index.html | D3.js force-directed |
| n8n Checklist | ✅ Complete | app-enhanced.js, index.html | Stage progression |
| Model Cards | ✅ Complete | styles-enhanced.css, index.html | VRAM gauge, animations |
| Settings Matrix | ✅ Complete | index.html, styles-enhanced.css | 50-config bento grid |
| Orchestration Table | ⚠️ Partial | index.html | Markup ready, animations needed |
| Command Network | ✅ Complete | styles-enhanced.css | Styling complete |
| Bot Fleet | ✅ Complete | app.js | Progress tracks, animations |
| Liquid Animations | 🔴 Pending | app-enhanced.js | Framework ready, logic needed |
| Real API Data | 🔴 Pending | All | Mock data in place |

---

## 🔧 Developer Notes

### Adding New Telemetry Updates
```javascript
// Flash update notification
flashTelemetryUpdate('element-id');

// Trigger button effect
triggerButtonDepression(button);
```

### Extending Intel Graph
```javascript
// Add new node
intelGraphInstance.data.nodes.push({
    id: 'new-ip',
    type: 'ip-node',
    label: '192.168.x.x'
});

// Redraw
drawIntelGraph(intelGraphInstance.data);
```

### Adding Settings
Add to appropriate category in HTML, then validate in JavaScript:
```javascript
input.addEventListener('blur', validateInput);
```

---

## 📝 Version History

- **v4.1.0** (Current) - Enhanced UI with glassmorphic design, health sparklines, Intel Graph
- **v4.0.0** - Liquid glass sidebar, ticker tape, bento grid diagnostics
- **v3.2.0** - Initial state engine logic

---

## 🎓 Learning Resources

### D3.js Force Simulation
- https://d3js.org/d3-force
- Used for Intel Graph node positioning

### CSS Grid & Flexbox
- Bento grid: `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))`
- Responsive without media queries

### Canvas API
- 2D context drawing for sparklines
- Gradient rendering
- Line/curve smoothing

---

## 📞 Support

For implementation questions or bugs:
1. Check this guide's "Features Not Yet Implemented" section
2. Review component status matrix
3. Examine existing implementations in the code
4. Refer to inline code comments for context

---

**Last Updated:** June 1, 2026
**Version:** 4.1.0
**Status:** Core features complete, API integration pending
