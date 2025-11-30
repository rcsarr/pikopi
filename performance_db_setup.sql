-- Create table for tracking machine accuracy performance
CREATE TABLE IF NOT EXISTS performance_logs (
    id VARCHAR(50) PRIMARY KEY,
    timestamp DATETIME NOT NULL,
    accuracy FLOAT NOT NULL,
    machine_id VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster querying by timestamp
CREATE INDEX idx_performance_timestamp ON performance_logs(timestamp);
