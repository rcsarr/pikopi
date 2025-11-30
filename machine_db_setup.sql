-- Create machines table
CREATE TABLE IF NOT EXISTS machines (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200),
    status_power BOOLEAN DEFAULT FALSE,
    temperature FLOAT DEFAULT 0.0,
    last_maintenance TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create machine_logs table
CREATE TABLE IF NOT EXISTS machine_logs (
    id SERIAL PRIMARY KEY,
    machine_id VARCHAR(50) REFERENCES machines(id),
    message TEXT NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'success', 'info', 'warning', 'error'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert seed data for machines
INSERT INTO machines (id, name, location, status_power, temperature) VALUES
('MCH-001', 'Mesin Sortir A', 'Lantai 1 - Zona Produksi', TRUE, 28.5),
('MCH-002', 'Mesin Sortir B', 'Lantai 1 - Zona Quality Control', TRUE, 30.2),
('MCH-003', 'Mesin Sortir C', 'Lantai 2 - Zona Ekspor', FALSE, 26.0)
ON CONFLICT (id) DO NOTHING;

-- Insert seed data for logs
INSERT INTO machine_logs (machine_id, message, type, created_at) VALUES
('MCH-001', 'Sistem dimulai', 'info', NOW() - INTERVAL '3 hours'),
('MCH-001', 'Batch #423 selesai diproses', 'success', NOW() - INTERVAL '2 minutes'),
('MCH-002', 'Sistem dimulai', 'info', NOW() - INTERVAL '5 hours'),
('MCH-002', 'Efisiensi mencapai 97.8%', 'success', NOW() - INTERVAL '10 minutes'),
('MCH-003', 'Sistem dimatikan', 'warning', NOW() - INTERVAL '2 hours')
ON CONFLICT DO NOTHING;
