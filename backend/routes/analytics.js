const express = require('express');
const analyticsService = require('../analytics-service');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get fleet KPIs
router.get('/kpis', authenticateToken, async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;

    // Role-based access control
    if (req.user.role === 'driver') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const kpis = await analyticsService.getFleetKPIs(timeRange);
    res.json(kpis);
  } catch (error) {
    console.error('Get KPIs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get driver performance
router.get('/drivers', authenticateToken, async (req, res) => {
  try {
    const { driverId, timeRange = '7d' } = req.query;

    // Role-based access control
    if (req.user.role === 'driver' && (!driverId || parseInt(driverId) !== req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const performance = await analyticsService.getDriverPerformance(
      driverId ? parseInt(driverId) : null,
      timeRange
    );
    res.json(performance);
  } catch (error) {
    console.error('Get driver performance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get vehicle utilization
router.get('/vehicles', authenticateToken, async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;

    // Role-based access control
    if (req.user.role === 'driver') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const utilization = await analyticsService.getVehicleUtilization(timeRange);
    res.json(utilization);
  } catch (error) {
    console.error('Get vehicle utilization error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get dashboard summary (combined KPIs)
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;

    // Role-based access control
    if (req.user.role === 'driver') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const [kpis, driverPerformance, vehicleUtilization] = await Promise.all([
      analyticsService.getFleetKPIs(timeRange),
      analyticsService.getDriverPerformance(null, timeRange),
      analyticsService.getVehicleUtilization(timeRange)
    ]);

    res.json({
      kpis,
      topDrivers: driverPerformance.slice(0, 5),
      vehicleUtilization: vehicleUtilization.slice(0, 10),
      alerts: {
        speedingDrivers: driverPerformance.filter(d => d.speedingEvents > 0).length,
        lowUtilizationVehicles: vehicleUtilization.filter(v => v.utilizationRate < 50).length,
        inactiveVehicles: vehicleUtilization.filter(v => v.activeDays === 0).length
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get driver leaderboard
router.get('/leaderboard/drivers', authenticateToken, async (req, res) => {
  try {
    const { timeRange = '7d', limit = 10 } = req.query;

    // Role-based access control
    if (req.user.role === 'driver') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const performance = await analyticsService.getDriverPerformance(null, timeRange);
    const leaderboard = performance
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, parseInt(limit));

    res.json(leaderboard);
  } catch (error) {
    console.error('Get driver leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get vehicle efficiency rankings
router.get('/leaderboard/vehicles', authenticateToken, async (req, res) => {
  try {
    const { timeRange = '30d', limit = 10 } = req.query;

    // Role-based access control
    if (req.user.role === 'driver') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const utilization = await analyticsService.getVehicleUtilization(timeRange);
    const leaderboard = utilization
      .sort((a, b) => b.utilizationRate - a.utilizationRate)
      .slice(0, parseInt(limit));

    res.json(leaderboard);
  } catch (error) {
    console.error('Get vehicle leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;