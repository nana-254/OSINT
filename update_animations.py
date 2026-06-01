import re

with open("static/styles.css", "r") as f:
    css = f.read()

# Add hover tooltip CSS
tooltip_css = """
/* Tooltip styles */
.gauge-interactive {
    position: relative;
}
.gauge-tooltip {
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%) translateY(-10px);
    background: rgba(15, 17, 21, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    padding: 12px;
    border-radius: 8px;
    backdrop-filter: blur(8px);
    z-index: 100;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s;
    pointer-events: none;
    min-width: 140px;
}
.gauge-interactive:hover .gauge-tooltip {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) translateY(0);
}
.gauge-tooltip-title {
    font-size: 10px;
    font-weight: 700;
    color: var(--accent-primary);
    margin-bottom: 6px;
    text-transform: uppercase;
}
.gauge-tooltip-row {
    display: flex;
    justify-content: space-between;
    font-size: 9px;
    margin-bottom: 4px;
    color: var(--text-bright);
}
.gauge-tooltip-row span:first-child {
    color: var(--text-dim);
}

/* Button micro-interactions */
button, .theme-btn, .tactical-btn, .capsule-btn, .icon-btn {
    transition: transform 0.2s cubic-bezier(0.25, 1, 0.5, 1), background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease !important;
}
button:active, .theme-btn:active, .tactical-btn:active, .capsule-btn:active, .icon-btn:active {
    transform: scale(0.98) !important;
}

/* Liquid fill animation for rings */
[class^="ring-"] {
    transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.4s ease;
}

/* Tor Data Flow */
.tor-packet {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent-primary);
    box-shadow: 0 0 8px var(--accent-primary);
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0;
    animation: tor-packet-flow 2s infinite cubic-bezier(0.4, 0, 0.2, 1);
}
.tor-wire-track {
    position: absolute;
    inset: -4px 0;
}
@keyframes tor-packet-flow {
    0% { left: 0; opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { left: 100%; opacity: 0; }
}

/* Value flash animation */
@keyframes value-flash {
    0% { background-color: rgba(255, 255, 255, 0.2); }
    100% { background-color: transparent; }
}
.flash-update {
    animation: value-flash 0.2s ease-out;
    border-radius: 2px;
}
"""

if "gauge-tooltip" not in css:
    css += tooltip_css

with open("static/styles.css", "w") as f:
    f.write(css)
print("CSS updated.")
