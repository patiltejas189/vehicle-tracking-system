const express = require('express');
const axios = require('axios');
const pool = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get maintenance records
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = 'SELECT * FROM maintenance';
    let params = [];

    if (req.user.role === 'driver') {
      // Only show maintenance for assigned vehicles
      query += ' WHERE vehicle_id IN (SELECT id FROM vehicles WHERE assigned_driver_id = $1)';
      params.push(req.user.id);
    } else if (req.user.role === 'customer') {
      return res.json([]);
    }
    // admin and fleet_manager see all

    query += ' ORDER BY scheduled_date DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get maintenance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Predict maintenance for a vehicle
router.get('/predict/:vehicleId', authenticateToken, async (req, res) => {
  try {
    const { vehicleId } = req.params;

    // Check permissions
    if (req.user.role === 'driver') {
      const vehicleCheck = await pool.query(
        'SELECT id FROM vehicles WHERE id = $1 AND assigned_driver_id = $2',
        [vehicleId, req.user.id]
      );
      if (vehicleCheck.rows.length === 0) {
        return res.status(403).json({ message: 'Not authorized for this vehicle' });
      }
    } else if (req.user.role === 'customer') {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // Get vehicle data for prediction
    const vehicleResult = await pool.query(
      'SELECT id, vehicle_id, make, model, year FROM vehicles WHERE id = $1',
      [vehicleId]
    );

    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // Get latest GPS data for mileage estimation
    const gpsResult = await pool.query(
      'SELECT COUNT(*) as data_points, AVG(speed) as avg_speed FROM gps_data WHERE vehicle_id = $1 AND timestamp > NOW() - INTERVAL \'30 days\'',
      [vehicleId]
    );

    // Mock data for prediction
    const maintenanceData = {
      vehicle_id: vehicleId,
      mileage: gpsResult.rows[0].data_points * 10, // Rough estimate
      engine_hours: gpsResult.rows[0].data_points * 0.5, // Rough estimate
      fuel_consumption: gpsResult.rows[0].avg_speed || 0,
      last_service_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days ago
    };

    // Call ML service
    const mlResponse = await axios.post('http://localhost:8000/predictive-maintenance', maintenanceData);

    res.json(mlResponse.data);
  } catch (error) {
    console.error('Maintenance prediction error:', error);
    res.status(500).json({ message: 'Maintenance prediction failed' });
  }
});

// Create maintenance record
router.post('/', authenticateToken, authorizeRoles('admin', 'fleet_manager'), async (req, res) => {
  try {
    const { vehicle_id, maintenance_type, description, scheduled_date, completed_date, cost } = req.body;

    const result = await pool.query(
      `INSERT INTO maintenance (vehicle_id, maintenance_type, description, scheduled_date, completed_date, cost)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [vehicle_id, maintenance_type, description, scheduled_date, completed_date, cost]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create maintenance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;