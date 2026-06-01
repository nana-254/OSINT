import re

with open("static/app.js", "r") as f:
    js = f.read()

network_sim_code = """
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
"""

if "initNetworkSimulation()" not in js:
    # insert inside DOMContentLoaded
    dom_load_regex = re.compile(r"(document\.addEventListener\('DOMContentLoaded',\s*\(\)\s*=>\s*\{.*?)(initModels\(\);)(.*?\})", re.DOTALL)
    
    def repl_dom(m):
        return m.group(1) + m.group(2) + "\n    initNetworkSimulation();" + m.group(3)
        
    js = dom_load_regex.sub(repl_dom, js, count=1)
    
    js += "\n" + network_sim_code
    
    with open("static/app.js", "w") as f:
        f.write(js)
    print("JS patched.")
else:
    print("JS already patched.")
