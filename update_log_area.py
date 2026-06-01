import re

with open("static/styles.css", "r") as f:
    css = f.read()

# Add grid-area: log; to .log-stream-card
css = css.replace(".log-stream-card {\n    display: flex;", ".log-stream-card {\n    grid-area: log;\n    display: flex;")

with open("static/styles.css", "w") as f:
    f.write(css)
print("Updated grid area")
