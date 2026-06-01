import re

with open("static/styles.css", "r") as f:
    css = f.read()

# Add CRT Scanline CSS if missing or modify it
crt_css = """
/* CRT Scanline */
.crt-scanline {
    background-image: repeating-linear-gradient(
        transparent 0px,
        rgba(0, 255, 255, 0.03) 1px,
        transparent 2px
    );
    background-size: 100% 2px;
}

/* Cursor Blink */
.log-caret {
    display: inline-block;
    animation: blink-caret 1s step-start infinite;
    color: var(--accent-primary);
}
@keyframes blink-caret {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
}

/* Selection Highlight */
.log-body *::selection, .log-prompt-row *::selection {
    background: var(--accent-primary);
    color: #000;
}

/* Syntax Highlighting overrides if any */
.ll-token.ok { color: #39ff14; } /* Neon Green for Success */
.ll-token.err { color: #dc143c; } /* Crimson for Errors */
.ll-token.ctx { color: var(--accent-primary); } /* Cyan for Contexts */
.ll-ts { color: #888; } /* Grey for Dates/Timestamps */
"""

if "repeating-linear-gradient" not in css:
    css += "\n" + crt_css

with open("static/styles.css", "w") as f:
    f.write(css)
print("Terminal CSS updated.")
