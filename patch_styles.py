import re

with open("static/styles.css", "r") as f:
    css = f.read()

# Update .bento-card to include box-shadow and backdrop-filter
bento_card_regex = re.compile(r"(\.bento-card\s*\{[^}]*?)(border:\s*1px\s*solid\s*var\(--glass-border\);)([^}]*\})")
def repl_card(m):
    return m.group(1) + "box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);\n    backdrop-filter: blur(12px);\n    -webkit-backdrop-filter: blur(12px);" + m.group(3)

css = bento_card_regex.sub(repl_card, css)

# Update bento-grid
bento_grid_regex = re.compile(r"(\.bento-grid\s*\{.*?)grid-template-areas:\s*\"vram[^\"]*\"\s*\"tor[^\"]*\"\s*\"log[^\"]*\";(.*?)\}", re.DOTALL)
new_grid_areas = """    grid-template-areas:
        "vram  cpu   tor   tor"
        "ram   temp  tor   tor"
        "log   log   log   log";
    gap: clamp(12px, 1.5vw, 24px);
    padding: clamp(16px, 2vw, 32px);"""
    
def repl_grid(m):
    return m.group(1) + new_grid_areas + m.group(2) + "}"

css = bento_grid_regex.sub(repl_grid, css)

# Fix potential duplicate gap/padding from original
css = re.sub(r"gap:\s*16px;?\n?", "", css)
css = re.sub(r"padding:\s*20px;?\n?", "", css)

with open("static/styles.css", "w") as f:
    f.write(css)

print("Styles patched.")
