const express = require('express');
const nodemailer = require('nodemailer');
const pool = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send notification
const sendNotification = async (alert, vehicle) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'admin@example.com', // or get from users table
      subject: `Vehicle Alert: ${alert.alert_type}`,
      text: `Alert for vehicle ${vehicle.license_plate}: ${alert.message}`
    };

    await transporter.sendMail(mailOptions);
    console.log('Notification sent');
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

// Get alerts
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = 'SELECT a.*, v.vehicle_id, v.license_plate FROM alerts a JOIN vehicles v ON a.vehicle_id = v.id';
    let params = [];

    if (req.user.role === 'driver') {
      query += ' WHERE v.assigned_driver_id = $1';
      params.push(req.user.id);
    } else if (req.user.role === 'customer') {
      return res.json([]);
    }
    // admin and fleet_manager see all

    query += ' ORDER BY a.timestamp DESC LIMIT 50';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create alert
router.post('/', authenticateToken, authorizeRoles('admin', 'fleet_manager'), async (req, res) => {
  try {
    const { vehicle_id, alert_type, message, severity } = req.body;

    const result = await pool.query(
      `INSERT INTO alerts (vehicle_id, alert_type, message, severity)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [vehicle_id, alert_type, message, severity]
    );

    const alert = result.rows[0];

    // Get vehicle info for notification
    const vehicleResult = await pool.query(
      'SELECT license_plate FROM vehicles WHERE id = $1',
      [vehicle_id]
    );

    if (vehicleResult.rows.length > 0) {
      // Send notification
      await sendNotification(alert, vehicleResult.rows[0]);
    }

    res.status(201).json(alert);
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark alert as resolved
router.put('/:id/resolve', authenticateToken, authorizeRoles('admin', 'fleet_manager'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE alerts SET resolved = TRUE WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Resolve alert error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;