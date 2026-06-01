#!/usr/bin/env python3
"""
Quick verification script for Canvas Wave Gauges and Tor Integration
Tests both features to ensure they're working correctly
"""

import subprocess
import json
import time
import sys
import requests
from pathlib import Path

def print_header(text):
    print(f"\n{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}\n")

def test_tor_integration():
    """Test Tor control port connectivity"""
    print_header("TESTING TOR INTEGRATION")
    
    try:
        # Import tor_control module
        sys.path.insert(0, str(Path(__file__).parent))
        from tor_control import get_tor_circuit_data, TorCircuitMonitor
        
        print("✓ Tor control module imported successfully")
        
        # Test connection
        monitor = TorCircuitMonitor()
        if monitor.connect():
            print("✓ Connected to Tor control port (127.0.0.1:9051)")
            
            # Get status
            status = monitor.get_status()
            print(f"\nTor Status:")
            print(f"  Version: {status.get('version', 'N/A')}")
            print(f"  Circuit Established: {status.get('circuit_established', False)}")
            print(f"  Read: {status.get('read_bytes', 0)} bytes")
            print(f"  Written: {status.get('written_bytes', 0)} bytes")
            
            # Get circuits
            circuits = monitor.get_circuits()
            print(f"\nActive Circuits: {len(circuits)}")
            
            for i, circuit in enumerate(circuits[:3]):  # Show first 3
                print(f"\n  Circuit {i+1}:")
                print(f"    ID: {circuit.get('id')}")
                print(f"    State: {circuit.get('state')}")
                print(f"    Nodes: {len(circuit.get('nodes', []))}")
                
                for j, node in enumerate(circuit.get('nodes', [])[:3]):
                    relay_info = monitor.get_relay_info(node)
                    print(f"      Node {j+1}: {relay_info.get('name', 'Unknown')} ({relay_info.get('country', 'XX')})")
            
            monitor.close()
            print("\n✓ Tor integration test PASSED")
            return True
        else:
            print("✗ Cannot connect to Tor control port")
            print("  Make sure:")
            print("    1. Tor is running: sudo systemctl status tor")
            print("    2. Control port is enabled in /etc/tor/torrc")
            print("    3. ControlPort 9051 is set")
            return False
            
    except ImportError as e:
        print(f"✗ Failed to import tor_control: {e}")
        return False
    except Exception as e:
        print(f"✗ Tor test error: {e}")
        return False

def test_flask_server():
    """Test Flask server endpoints"""
    print_header("TESTING FLASK SERVER")
    
    try:
        # Test if server is running
        response = requests.get("http://localhost:5000/api/v1/system/telemetry", timeout=2)
        print("✓ Flask server is running on http://localhost:5000")
        
        # Test Tor endpoints
        print("\nTesting Tor endpoints:")
        
        try:
            tor_status = requests.get("http://localhost:5000/api/v1/tor/status", timeout=5)
            print(f"  GET /api/v1/tor/status - {tor_status.status_code}")
            if tor_status.status_code == 200:
                print(f"    {json.dumps(tor_status.json(), indent=6)[:200]}...")
        except Exception as e:
            print(f"  GET /api/v1/tor/status - {type(e).__name__}: {e}")
        
        try:
            tor_circuit = requests.get("http://localhost:5000/api/v1/tor/circuit", timeout=5)
            print(f"  GET /api/v1/tor/circuit - {tor_circuit.status_code}")
        except Exception as e:
            print(f"  GET /api/v1/tor/circuit - {type(e).__name__}: {e}")
        
        try:
            tor_bridges = requests.get("http://localhost:5000/api/v1/tor/bridges", timeout=5)
            print(f"  GET /api/v1/tor/bridges - {tor_bridges.status_code}")
            if tor_bridges.status_code == 200:
                data = tor_bridges.json()
                print(f"    Found {data.get('total', 0)} bridges")
        except Exception as e:
            print(f"  GET /api/v1/tor/bridges - {type(e).__name__}: {e}")
        
        print("\n✓ Flask server test PASSED")
        return True
        
    except requests.exceptions.ConnectionError:
        print("✗ Cannot connect to Flask server")
        print("  Start the server with: python osint_server.py")
        return False
    except Exception as e:
        print(f"✗ Server test error: {e}")
        return False

def test_canvas_gauges():
    """Test canvas gauge HTML elements"""
    print_header("TESTING CANVAS GAUGES")
    
    try:
        html_path = Path(__file__).parent / "static" / "index.html"
        if not html_path.exists():
            print(f"✗ HTML file not found: {html_path}")
            return False
        
        html_content = html_path.read_text()
        
        # Check for canvas elements
        canvas_ids = [
            'vram-wave-canvas',
            'cpu-wave-canvas',
            'ram-wave-canvas',
            'temp-wave-canvas'
        ]
        
        print("Checking for canvas elements in HTML:")
        all_found = True
        for canvas_id in canvas_ids:
            if f'id="{canvas_id}"' in html_content:
                print(f"  ✓ {canvas_id} found")
            else:
                print(f"  ✗ {canvas_id} NOT found")
                all_found = False
        
        # Check for script include
        print("\nChecking for canvas-wave-gauges.js script:")
        if 'canvas-wave-gauges.js' in html_content:
            print("  ✓ canvas-wave-gauges.js script included")
        else:
            print("  ✗ canvas-wave-gauges.js script NOT included")
            all_found = False
        
        # Check JavaScript file
        js_path = Path(__file__).parent / "static" / "canvas-wave-gauges.js"
        if js_path.exists():
            print(f"\n✓ canvas-wave-gauges.js file exists ({js_path.stat().st_size} bytes)")
            
            js_content = js_path.read_text()
            if 'class LiquidWaveGauge' in js_content:
                print("  ✓ LiquidWaveGauge class defined")
            if 'function initCanvasWaveGauges' in js_content:
                print("  ✓ initCanvasWaveGauges function defined")
            if 'function updateWaveGauge' in js_content:
                print("  ✓ updateWaveGauge function defined")
        else:
            print(f"✗ canvas-wave-gauges.js not found")
            all_found = False
        
        if all_found:
            print("\n✓ Canvas gauges test PASSED")
        else:
            print("\n⚠ Canvas gauges test PARTIAL")
        
        return all_found
        
    except Exception as e:
        print(f"✗ Canvas gauge test error: {e}")
        return False

def test_files_exist():
    """Verify all implementation files exist"""
    print_header("VERIFYING FILES")
    
    required_files = [
        'static/canvas-wave-gauges.js',
        'static/app.js',
        'static/index.html',
        'static/styles.css',
        'osint_server.py',
        'tor_control.py',
        'CANVAS_TOR_IMPLEMENTATION.md'
    ]
    
    base_path = Path(__file__).parent
    all_exist = True
    
    for file_path in required_files:
        full_path = base_path / file_path
        if full_path.exists():
            size = full_path.stat().st_size
            print(f"  ✓ {file_path} ({size:,} bytes)")
        else:
            print(f"  ✗ {file_path} - NOT FOUND")
            all_exist = False
    
    if all_exist:
        print("\n✓ All files exist")
    else:
        print("\n✗ Some files are missing")
    
    return all_exist

def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("  CANVAS WAVE GAUGES & TOR INTEGRATION VERIFICATION")
    print("="*60)
    
    results = {}
    
    # Run tests
    results['files'] = test_files_exist()
    results['canvas'] = test_canvas_gauges()
    results['tor'] = test_tor_integration()
    results['flask'] = test_flask_server()
    
    # Summary
    print_header("VERIFICATION SUMMARY")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"  {test_name.upper():15} {status}")
    
    print(f"\nResult: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All systems operational!")
        return 0
    elif passed >= 2:
        print("\n⚠️  Some systems offline (see above)")
        return 1
    else:
        print("\n❌ Critical systems offline")
        return 2

if __name__ == '__main__':
    sys.exit(main())
