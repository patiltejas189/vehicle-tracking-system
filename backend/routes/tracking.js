const express = require('express');
const axios = require('axios');
const pool = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get GPS data for a vehicle
router.get('/vehicle/:vehicleId', authenticateToken, async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { start, end, limit = 100 } = req.query;

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
      // Customers might have different permissions, for now deny
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    // admin and fleet_manager can access all

    let query = 'SELECT * FROM gps_data WHERE vehicle_id = $1';
    let params = [vehicleId];
    let paramIndex = 2;

    if (start) {
      query += ` AND timestamp >= $${paramIndex}`;
      params.push(start);
      paramIndex++;
    }

    if (end) {
      query += ` AND timestamp <= $${paramIndex}`;
      params.push(end);
      paramIndex++;
    }

    query += ` ORDER BY timestamp DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get GPS data error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add GPS data (for vehicle devices/drivers)
router.post('/gps', authenticateToken, authorizeRoles('driver'), async (req, res) => {
  try {
    const { vehicle_id, latitude, longitude, speed, heading, timestamp } = req.body;

    // Validate required fields
    if (!vehicle_id || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: 'Vehicle ID, latitude, and longitude are required' });
    }

    // Anti-spoofing validation
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ message: 'Invalid GPS coordinates' });
    }

    if (speed !== undefined && (speed < 0 || speed > 200)) { // Max speed 200 km/h
      return res.status(400).json({ message: 'Invalid speed value' });
    }

    if (heading !== undefined && (heading < 0 || heading > 360)) {
      return res.status(400).json({ message: 'Invalid heading value' });
    }

    // Check if vehicle exists and user is assigned to it
    const vehicleCheck = await pool.query(
      'SELECT id FROM vehicles WHERE id = $1 AND assigned_driver_id = $2',
      [vehicle_id, req.user.id]
    );

    if (vehicleCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Not authorized for this vehicle' });
    }

    const gpsTimestamp = timestamp ? new Date(timestamp) : new Date();

    const result = await pool.query(
      `INSERT INTO gps_data (vehicle_id, latitude, longitude, speed, heading, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [vehicle_id, latitude, longitude, speed, heading, gpsTimestamp]
    );

    // Emit real-time update via Socket.IO
    const io = req.app.get('io');
    io.emit('gps_update', {
      vehicle_id,
      latitude,
      longitude,
      speed,
      heading,
      timestamp: gpsTimestamp
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add GPS data error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get latest position for all vehicles
router.get('/latest', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT ON (g.vehicle_id)
        g.vehicle_id,
        g.latitude,
        g.longitude,
        g.speed,
        g.heading,
        g.timestamp,
        v.vehicle_id as vehicle_code,
        v.license_plate,
        v.status
      FROM gps_data g
      JOIN vehicles v ON g.vehicle_id = v.id
      ORDER BY g.vehicle_id, g.timestamp DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Get latest positions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get route history
router.get('/route/:vehicleId', authenticateToken, async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { date } = req.query;

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

    let query = `
      SELECT latitude, longitude, speed, heading, timestamp
      FROM gps_data
      WHERE vehicle_id = $1
    `;
    let params = [vehicleId];

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      query += ' AND timestamp >= $2 AND timestamp < $3';
      params.push(startDate, endDate);
    }

    query += ' ORDER BY timestamp ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get route error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Store offline GPS data (batch)
router.post('/offline', authenticateToken, authorizeRoles('driver'), async (req, res) => {
  try {
    const { vehicle_id, data } = req.body; // data is array of GPS points

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ message: 'GPS data array is required' });
    }

    // Check vehicle authorization
    const vehicleCheck = await pool.query(
      'SELECT id FROM vehicles WHERE id = $1 AND assigned_driver_id = $2',
      [vehicle_id, req.user.id]
    );

    if (vehicleCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Not authorized for this vehicle' });
    }

    // Insert batch data
    const values = data.map(point =>
      `(${vehicle_id}, ${point.latitude}, ${point.longitude}, ${point.speed || 'NULL'}, ${point.heading || 'NULL'}, '${new Date(point.timestamp).toISOString()}', true)`
    ).join(', ');

    await pool.query(`
      INSERT INTO gps_data (vehicle_id, latitude, longitude, speed, heading, timestamp, is_offline)
      VALUES ${values}
    `);

    res.json({ message: 'Offline GPS data stored successfully', count: data.length });
  } catch (error) {
    console.error('Store offline GPS error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Detect anomalies for a vehicle
router.get('/anomalies/:vehicleId', authenticateToken, async (req, res) => {
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

    // Get recent GPS data
    const result = await pool.query(
      'SELECT vehicle_id, latitude, longitude, speed, heading, timestamp FROM gps_data WHERE vehicle_id = $1 ORDER BY timestamp DESC LIMIT 100',
      [vehicleId]
    );

    if (result.rows.length === 0) {
      return res.json({ anomalies: [], message: 'No GPS data available' });
    }

    // Call ML service
    const mlResponse = await axios.post('http://localhost:8000/anomaly-detection', result.rows);

    res.json(mlResponse.data);
  } catch (error) {
    console.error('Anomaly detection error:', error);
    res.status(500).json({ message: 'Anomaly detection failed' });
  }
});

module.exports = router;