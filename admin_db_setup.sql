-- Add machine_id and machine_name to orders table for machine assignment feature
ALTER TABLE orders ADD COLUMN machine_id VARCHAR(50);
ALTER TABLE orders ADD COLUMN machine_name VARCHAR(100);
