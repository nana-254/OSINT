CREATE TABLE IF NOT EXISTS topics (
    id SERIAL PRIMARY KEY,
    topic_name VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sanitized_data (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
    raw_content TEXT,
    sanitized_content TEXT,
    sanitization_log TEXT,
    is_safe BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_reports (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
    extracted_entities JSONB,
    synthesis_report JSONB,
    verification_log TEXT,
    final_status VARCHAR(50) DEFAULT 'COMPLETED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial topics
INSERT INTO topics (topic_name) VALUES 
('Dark Web Forums Operations'), ('State-Sponsored APT Groups'), ('Zero-Day Exploits Market'),
('Ransomware as a Service (RaaS)'), ('Cryptocurrency Tumblers'), ('Phishing Kits Distribution'),
('Botnet Command and Control'), ('Stolen Credential Markets'), ('Insider Threat Recruitment'),
('Initial Access Brokers'), ('DDoS for Hire Services'), ('Malware Crypters'),
('SIM Swapping Networks'), ('Bulletproof Hosting'), ('Exploit Kit Development'),
('Carding Forums'), ('Corporate Espionage Tactics'), ('Cyber Warfare Doctrines')
ON CONFLICT (topic_name) DO NOTHING;
