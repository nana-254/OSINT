"""
Tor Control Port Integration
Connects to Tor's control port to fetch real circuit data, relay information, and statistics.
Requires: `apt install tor` and tor service running with control port configured
"""

import socket
import hashlib
import logging
from typing import Optional, Dict, List, Any
from datetime import datetime
import time

logger = logging.getLogger(__name__)

class TorControlClient:
    """
    Low-level Tor control protocol client
    Communicates with Tor's control port (default: 127.0.0.1:9051)
    """
    
    def __init__(self, host: str = '127.0.0.1', port: int = 9051, password: Optional[str] = None):
        self.host = host
        self.port = port
        self.password = password
        self.socket = None
        self.connected = False
    
    def connect(self) -> bool:
        """Establish connection to Tor control port"""
        try:
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket.connect((self.host, self.port))
            self.connected = True
            
            # Read welcome message
            response = self.socket.recv(1024).decode('utf-8', errors='ignore')
            logger.info(f"Tor control: {response.strip()}")
            
            # Authenticate if password provided
            if self.password:
                self.authenticate(self.password)
            
            return True
        except Exception as e:
            logger.error(f"Failed to connect to Tor control port: {e}")
            self.connected = False
            return False
    
    def authenticate(self, password: str) -> bool:
        """Authenticate with Tor control port"""
        try:
            # AUTHENTICATE command with password
            auth_cmd = f'AUTHENTICATE "{password}"\r\n'
            self.socket.sendall(auth_cmd.encode())
            response = self.socket.recv(1024).decode('utf-8', errors='ignore')
            
            if '250' in response:  # 250 OK
                logger.info("Authenticated with Tor control port")
                return True
            else:
                logger.error(f"Authentication failed: {response}")
                return False
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            return False
    
    def send_command(self, command: str) -> str:
        """Send a command to Tor control port and receive response"""
        if not self.connected or not self.socket:
            return ""
        
        try:
            # Ensure command ends with \r\n
            if not command.endswith('\r\n'):
                command += '\r\n'
            
            self.socket.sendall(command.encode())
            
            # Read response (may be multi-line)
            response = b''
            while True:
                data = self.socket.recv(4096)
                if not data:
                    break
                response += data
                
                # Check if we have a complete response (ends with \r\n)
                if response.endswith(b'\r\n'):
                    break
                
                # For simplicity, break after first chunk if it has a complete line
                if b'250' in response or b'551' in response or b'552' in response:
                    break
            
            return response.decode('utf-8', errors='ignore')
        except Exception as e:
            logger.error(f"Error sending command: {e}")
            return ""
    
    def disconnect(self):
        """Close connection to Tor control port"""
        try:
            if self.socket:
                self.socket.close()
            self.connected = False
        except Exception as e:
            logger.error(f"Error disconnecting: {e}")


class TorCircuitMonitor:
    """
    High-level interface for monitoring Tor circuits and relays
    """
    
    def __init__(self, control_host: str = '127.0.0.1', control_port: int = 9051, password: Optional[str] = None):
        self.client = TorControlClient(control_host, control_port, password)
        self.connected = False
        self.circuit_cache = {}
        self.relay_cache = {}
        self.last_update = None
    
    def connect(self) -> bool:
        """Connect to Tor control port"""
        if self.client.connect():
            self.connected = True
            return True
        return False
    
    def get_circuits(self) -> List[Dict[str, Any]]:
        """
        Fetch all active circuits from Tor
        Returns list of circuit info with nodes
        """
        if not self.connected:
            return []
        
        try:
            response = self.client.send_command('GETINFO circuit-status')
            circuits = []
            
            for line in response.split('\n'):
                if line.startswith('circuit-status='):
                    # Parse circuit info
                    # Format: circuit-status=circid,state,path
                    # Example: 1 EXTENDED $FP1,$FP2,$FP3
                    circuit_data = line.replace('circuit-status=', '').strip()
                    if circuit_data:
                        parts = circuit_data.split()
                        if len(parts) >= 2:
                            circuit_id = parts[0]
                            state = parts[1]
                            node_fps = parts[2:] if len(parts) > 2 else []
                            
                            # Clean up fingerprints
                            nodes = [fp.strip('$,()') for fp in node_fps]
                            
                            circuits.append({
                                'id': circuit_id,
                                'state': state,
                                'nodes': nodes,
                                'purpose': 'general'
                            })
            
            return circuits
        except Exception as e:
            logger.error(f"Error fetching circuits: {e}")
            return []
    
    def get_relay_info(self, fingerprint: str) -> Dict[str, Any]:
        """
        Fetch information about a specific relay
        """
        if not self.connected:
            return {}
        
        # Check cache first
        if fingerprint in self.relay_cache:
            if time.time() - self.relay_cache[fingerprint].get('cached_at', 0) < 300:
                return self.relay_cache[fingerprint]
        
        try:
            response = self.client.send_command(f'GETINFO ns/id/{fingerprint}')
            relay_info = self._parse_relay_info(response)
            
            # Cache the result
            relay_info['cached_at'] = time.time()
            self.relay_cache[fingerprint] = relay_info
            
            return relay_info
        except Exception as e:
            logger.error(f"Error fetching relay info for {fingerprint}: {e}")
            return {}
    
    def _parse_relay_info(self, response: str) -> Dict[str, Any]:
        """Parse relay information from GETINFO response"""
        info = {
            'name': 'Unknown',
            'country': 'XX',
            'ip': '0.0.0.0',
            'port': 9001,
            'bandwidth': 0,
            'flags': []
        }
        
        for line in response.split('\n'):
            line = line.strip()
            if line.startswith('r '):
                # Router line: r name IP port dirport time
                parts = line.split()
                if len(parts) >= 3:
                    info['name'] = parts[1]
                    info['ip'] = parts[2]
                    if len(parts) > 3:
                        try:
                            info['port'] = int(parts[3])
                        except:
                            pass
            
            elif line.startswith('s '):
                # Flags line: s flags
                flags_str = line.replace('s ', '').strip()
                info['flags'] = flags_str.split()
            
            elif line.startswith('a '):
                # Address line for country inference (simplified)
                pass
            
            elif line.startswith('w '):
                # Bandwidth line: w Bandwidth=X
                parts = line.split('=')
                if len(parts) > 1:
                    try:
                        info['bandwidth'] = int(parts[1])
                    except:
                        pass
        
        return info
    
    def get_status(self) -> Dict[str, Any]:
        """Get overall Tor status and metrics"""
        if not self.connected:
            return {'status': 'disconnected'}
        
        try:
            # Get version
            version_resp = self.client.send_command('GETINFO version')
            version = 'Unknown'
            if 'Tor version' in version_resp:
                version = version_resp.split('Tor version')[-1].split('\n')[0].strip()
            
            # Get network status
            status_resp = self.client.send_command('GETINFO status/circuit-established')
            circuit_established = 'connected' in status_resp.lower()
            
            # Get traffic stats
            traffic_resp = self.client.send_command('GETINFO traffic/read traffic/written')
            read_bytes = 0
            written_bytes = 0
            
            for line in traffic_resp.split('\n'):
                if 'traffic/read=' in line:
                    try:
                        read_bytes = int(line.split('=')[1])
                    except:
                        pass
                elif 'traffic/written=' in line:
                    try:
                        written_bytes = int(line.split('=')[1])
                    except:
                        pass
            
            return {
                'version': version,
                'circuit_established': circuit_established,
                'read_bytes': read_bytes,
                'written_bytes': written_bytes,
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error getting status: {e}")
            return {'status': 'error', 'error': str(e)}
    
    def close(self):
        """Close connection"""
        if self.client:
            self.client.disconnect()
        self.connected = False


# Convenience function for quick circuit monitoring
def get_tor_circuit_data(control_host: str = '127.0.0.1', control_port: int = 9051) -> Dict[str, Any]:
    """
    Quick utility function to fetch current Tor circuit data
    Returns formatted circuit info with node details
    """
    monitor = TorCircuitMonitor(control_host, control_port)
    
    if not monitor.connect():
        return {
            'error': 'Cannot connect to Tor control port',
            'suggestion': 'Ensure Tor is running and control port is configured on 9051'
        }
    
    try:
        circuits = monitor.get_circuits()
        status = monitor.get_status()
        
        # Enrich circuits with relay information
        enriched_circuits = []
        for circuit in circuits:
            enriched = circuit.copy()
            enriched['nodes'] = []
            
            for fp in circuit.get('nodes', []):
                relay_info = monitor.get_relay_info(fp)
                enriched['nodes'].append({
                    'fingerprint': fp,
                    'name': relay_info.get('name', 'Unknown'),
                    'country': relay_info.get('country', 'XX'),
                    'ip': relay_info.get('ip', '0.0.0.0'),
                    'flags': relay_info.get('flags', []),
                    'bandwidth': relay_info.get('bandwidth', 0)
                })
            
            enriched_circuits.append(enriched)
        
        return {
            'status': status,
            'circuits': enriched_circuits,
            'circuit_count': len(circuits)
        }
    
    except Exception as e:
        logger.error(f"Error fetching circuit data: {e}")
        return {'error': str(e)}
    
    finally:
        monitor.close()


if __name__ == '__main__':
    # Test the Tor monitor
    logging.basicConfig(level=logging.INFO)
    data = get_tor_circuit_data()
    import json
    print(json.dumps(data, indent=2))
