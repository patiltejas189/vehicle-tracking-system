const express = require('express');
const pool = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get all vehicles
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT v.*, u.username as driver_name
      FROM vehicles v
      LEFT JOIN users u ON v.assigned_driver_id = u.id
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

    query += ' ORDER BY v.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get vehicle by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT v.*, u.username as driver_name
      FROM vehicles v
      LEFT JOIN users u ON v.assigned_driver_id = u.id
      WHERE v.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create vehicle
router.post('/', authenticateToken, authorizeRoles('admin', 'fleet_manager'), async (req, res) => {
  try {
    const { vehicle_id, license_plate, make, model, year, assigned_driver_id } = req.body;

    // Check if vehicle_id or license_plate already exists
    const existing = await pool.query(
      'SELECT id FROM vehicles WHERE vehicle_id = $1 OR license_plate = $2',
      [vehicle_id, license_plate]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Vehicle ID or license plate already exists' });
    }

    // Handle empty string for assigned_driver_id
    const driverId = assigned_driver_id === '' || assigned_driver_id === null ? null : parseInt(assigned_driver_id);

    const result = await pool.query(
      `INSERT INTO vehicles (vehicle_id, license_plate, make, model, year, assigned_driver_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [vehicle_id, license_plate, make, model, year, driverId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create vehicle error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update vehicle
router.put('/:id', authenticateToken, authorizeRoles('admin', 'fleet_manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const { vehicle_id, license_plate, make, model, year, status, assigned_driver_id } = req.body;

    // Handle empty string for assigned_driver_id
    const driverId = assigned_driver_id === '' || assigned_driver_id === null ? null : parseInt(assigned_driver_id);

    const result = await pool.query(
      `UPDATE vehicles
       SET vehicle_id = $1, license_plate = $2, make = $3, model = $4, year = $5,
           status = $6, assigned_driver_id = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 RETURNING *`,
      [vehicle_id, license_plate, make, model, year, status, driverId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete vehicle
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM vehicles WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;