const express = require('express');
const axios = require('axios');
const pool = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const gpsQuality = require('../gps-quality');

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
    const { vehicle_id, latitude, longitude, speed, heading, accuracy, altitude, altitude_accuracy, timestamp } = req.body;

    // Validate required fields
    if (!vehicle_id || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: 'Vehicle ID, latitude, and longitude are required' });
    }

    // Enhanced coordinate validation
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ message: 'Invalid GPS coordinates' });
    }

    // Speed validation with more realistic limits
    if (speed !== undefined && (speed < 0 || speed > 300)) { // Max speed 300 km/h (highway speeds)
      return res.status(400).json({ message: 'Invalid speed value (must be 0-300 km/h)' });
    }

    // Heading validation
    if (heading !== undefined && (heading < 0 || heading > 360)) {
      return res.status(400).json({ message: 'Invalid heading value (must be 0-360 degrees)' });
    }

    // Accuracy validation
    if (accuracy !== undefined && (accuracy < 0 || accuracy > 10000)) { // Max 10km accuracy
      return res.status(400).json({ message: 'Invalid accuracy value' });
    }

    // Altitude validation
    if (altitude !== undefined && (altitude < -500 || altitude > 10000)) { // -500m to 10km
      return res.status(400).json({ message: 'Invalid altitude value' });
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

    // Get previous GPS data for quality validation
    const lastPosition = await pool.query(
      'SELECT latitude, longitude, speed, timestamp FROM gps_data WHERE vehicle_id = $1 ORDER BY timestamp DESC LIMIT 1',
      [vehicle_id]
    );

    // Prepare GPS data for quality validation
    const gpsDataForValidation = {
      latitude,
      longitude,
      speed,
      heading,
      accuracy,
      altitude,
      timestamp: gpsTimestamp
    };

    // Validate GPS data quality
    const qualityValidation = gpsQuality.validateGPSData(
      gpsDataForValidation,
      lastPosition.rows.length > 0 ? {
        latitude: lastPosition.rows[0].latitude,
        longitude: lastPosition.rows[0].longitude,
        speed: lastPosition.rows[0].speed,
        timestamp: lastPosition.rows[0].timestamp
      } : null
    );

    // Log quality issues
    if (qualityValidation.issues.length > 0) {
      console.warn(`GPS quality issues for vehicle ${vehicle_id}:`, qualityValidation.issues);
    }

    // Determine quality score
    let quality_score = 'good';
    if (qualityValidation.qualityScore < 60) quality_score = 'poor';
    else if (qualityValidation.qualityScore < 80) quality_score = 'fair';

    const result = await pool.query(
      `INSERT INTO gps_data (vehicle_id, latitude, longitude, speed, heading, accuracy, altitude, altitude_accuracy, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [vehicle_id, latitude, longitude, speed, heading, accuracy, altitude, altitude_accuracy, gpsTimestamp]
    );

    // Emit real-time update via Socket.IO with quality info
    const io = req.app.get('io');
    io.emit('gps_update', {
      vehicle_id,
      latitude,
      longitude,
      speed,
      heading,
      accuracy,
      quality_score,
      quality_details: qualityValidation,
      timestamp: gpsTimestamp
    });

    res.status(201).json({
      ...result.rows[0],
      quality_score,
      quality_validation: qualityValidation
    });
  } catch (error) {
    console.error('Add GPS data error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get latest position for all vehicles
router.get('/latest', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT DISTINCT ON (g.vehicle_id)
        g.vehicle_id,
        g.latitude,
        g.longitude,
        g.speed,
        g.heading,
        g.accuracy,
        g.altitude,
        g.timestamp,
        v.vehicle_id as vehicle_code,
        v.license_plate,
        v.status
      FROM gps_data g
      JOIN vehicles v ON g.vehicle_id = v.id
    `;
    let params = [];

    if (req.user.role === 'driver') {
      query += ' WHERE v.assigned_driver_id = $1';
      params.push(req.user.id);
    } else if (req.user.role === 'customer') {
      // For now, customers see no vehicles; could be extended
      return res.json([]);
    }
    // admin and fleet_manager see all

    query += ' ORDER BY g.vehicle_id, g.timestamp DESC';

    const result = await pool.query(query, params);
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