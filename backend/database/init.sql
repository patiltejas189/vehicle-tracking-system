-- Vehicle Tracking Management System Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'fleet_manager', 'driver', 'customer')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id SERIAL PRIMARY KEY,
  vehicle_id VARCHAR(50) UNIQUE NOT NULL,
  license_plate VARCHAR(20) UNIQUE NOT NULL,
  make VARCHAR(50),
  model VARCHAR(50),
  year INTEGER,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  assigned_driver_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GPS Data table
CREATE TABLE IF NOT EXISTS gps_data (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  speed DECIMAL(5, 2),
  heading DECIMAL(5, 2),
  accuracy DECIMAL(6, 2), -- GPS accuracy in meters
  altitude DECIMAL(7, 2), -- Altitude in meters
  altitude_accuracy DECIMAL(6, 2), -- Altitude accuracy in meters
  timestamp TIMESTAMP NOT NULL,
  is_offline BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add accuracy columns if they don't exist (for existing databases)
ALTER TABLE gps_data ADD COLUMN IF NOT EXISTS accuracy DECIMAL(6, 2);
ALTER TABLE gps_data ADD COLUMN IF NOT EXISTS altitude DECIMAL(7, 2);
ALTER TABLE gps_data ADD COLUMN IF NOT EXISTS altitude_accuracy DECIMAL(6, 2);

-- Routes table
CREATE TABLE IF NOT EXISTS routes (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  distance DECIMAL(10, 2),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL,
  message TEXT,
  severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved BOOLEAN DEFAULT FALSE
);

-- Maintenance records
CREATE TABLE IF NOT EXISTS maintenance (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
  maintenance_type VARCHAR(100),
  description TEXT,
  scheduled_date DATE,
  completed_date DATE,
  cost DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_gps_data_vehicle_timestamp ON gps_data(vehicle_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_gps_data_timestamp ON gps_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_alerts_vehicle_timestamp ON alerts(vehicle_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_routes_vehicle_start ON routes(vehicle_id, start_time);

-- Insert sample data
INSERT INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@example.com', '$2b$10$f9BUFZuCS7aWTZfXiJnCnusNFGsnvLtFKXqQ39W1HL6Fr95VCksaa', 'admin'),
('manager1', 'manager@example.com', '$2b$10$dScY.rU6.pNACehCJsoeEOaEMcWUZFW8XH5/jFaZo1fmFm0ymGLO2', 'fleet_manager'),
('driver1', 'driver@example.com', '$2b$10$4gR3MJtxjLNr1ohqi5p6oe6DeaTDu.Bz7s22g277R128UZZ937Qcm', 'driver')
ON CONFLICT (username) DO NOTHING;

INSERT INTO vehicles (vehicle_id, license_plate, make, model, year) VALUES
('V001', 'ABC-123', 'Toyota', 'Camry', 2020),
('V002', 'DEF-456', 'Honda', 'Civic', 2019)
ON CONFLICT (vehicle_id) DO NOTHING;