DELETE FROM users;
INSERT INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@example.com', '$2b$10$f9BUFZuCS7aWTZfXiJnCnusNFGsnvLtFKXqQ39W1HL6Fr95VCksaa', 'admin'),
('manager1', 'manager@example.com', '$2b$10$dScY.rU6.pNACehCJsoeEOaEMcWUZFW8XH5/jFaZo1fmFm0ymGLO2', 'fleet_manager'),
('driver1', 'driver@example.com', '$2b$10$4gR3MJtxjLNr1ohqi5p6oe6DeaTDu.Bz7s22g277R128UZZ937Qcm', 'driver');