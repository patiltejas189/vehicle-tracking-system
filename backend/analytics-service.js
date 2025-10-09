// Advanced Analytics Service
// Provides real-time KPIs, driver scoring, and fleet analytics

class AnalyticsService {
  constructor() {
    this.pool = require('./db');
  }

  // Calculate real-time KPIs for dashboard
  async getFleetKPIs(timeRange = '24h') {
    try {
      const timeFilter = this.getTimeFilter(timeRange);

      // Get vehicle statistics
      const vehicleStats = await this.pool.query(`
        SELECT
          COUNT(*) as total_vehicles,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_vehicles,
          COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance_vehicles,
          COUNT(CASE WHEN assigned_driver_id IS NOT NULL THEN 1 END) as assigned_vehicles
        FROM vehicles
      `);

      // Get GPS data statistics
      const gpsStats = await this.pool.query(`
        SELECT
          COUNT(DISTINCT vehicle_id) as vehicles_with_gps,
          COUNT(*) as total_gps_points,
          AVG(speed) as avg_fleet_speed,
          MAX(speed) as max_fleet_speed,
          AVG(accuracy) as avg_accuracy
        FROM gps_data
        WHERE timestamp >= $1
      `, [timeFilter]);

      // Get driver performance metrics
      const driverStats = await this.pool.query(`
        SELECT
          COUNT(DISTINCT u.id) as total_drivers,
          AVG(CASE WHEN g.speed > 80 THEN 1 ELSE 0 END) * 100 as speeding_percentage,
          COUNT(CASE WHEN g.speed > 80 THEN 1 END) as speeding_incidents
        FROM users u
        LEFT JOIN vehicles v ON u.id = v.assigned_driver_id
        LEFT JOIN gps_data g ON v.id = g.vehicle_id AND g.timestamp >= $1
        WHERE u.role = 'driver'
      `, [timeFilter]);

      // Calculate utilization rate
      const utilizationRate = vehicleStats.rows[0].total_vehicles > 0
        ? (vehicleStats.rows[0].active_vehicles / vehicleStats.rows[0].total_vehicles) * 100
        : 0;

      return {
        fleetOverview: {
          totalVehicles: parseInt(vehicleStats.rows[0].total_vehicles),
          activeVehicles: parseInt(vehicleStats.rows[0].active_vehicles),
          maintenanceVehicles: parseInt(vehicleStats.rows[0].maintenance_vehicles),
          assignedVehicles: parseInt(vehicleStats.rows[0].assigned_vehicles),
          utilizationRate: Math.round(utilizationRate * 100) / 100
        },
        gpsMetrics: {
          vehiclesWithGPS: parseInt(gpsStats.rows[0].vehicles_with_gps),
          totalGPSPoints: parseInt(gpsStats.rows[0].total_gps_points),
          avgFleetSpeed: Math.round((gpsStats.rows[0].avg_fleet_speed || 0) * 100) / 100,
          maxFleetSpeed: Math.round((gpsStats.rows[0].max_fleet_speed || 0) * 100) / 100,
          avgAccuracy: Math.round((gpsStats.rows[0].avg_accuracy || 0) * 100) / 100
        },
        driverMetrics: {
          totalDrivers: parseInt(driverStats.rows[0].total_drivers),
          speedingPercentage: Math.round((driverStats.rows[0].speeding_percentage || 0) * 100) / 100,
          speedingIncidents: parseInt(driverStats.rows[0].speeding_incidents || 0)
        },
        timeRange: timeRange,
        calculatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error calculating fleet KPIs:', error);
      throw error;
    }
  }

  // Calculate driver performance scores
  async getDriverPerformance(driverId = null, timeRange = '7d') {
    try {
      const timeFilter = this.getTimeFilter(timeRange);

      let query, params;
      if (driverId) {
        query = `
          SELECT
            u.id, u.username,
            COUNT(DISTINCT g.id) as gps_points,
            AVG(g.speed) as avg_speed,
            MAX(g.speed) as max_speed,
            COUNT(CASE WHEN g.speed > 80 THEN 1 END) as speeding_events,
            COUNT(CASE WHEN g.speed > 100 THEN 1 END) as severe_speeding,
            AVG(g.accuracy) as avg_accuracy,
            MIN(g.timestamp) as first_activity,
            MAX(g.timestamp) as last_activity
          FROM users u
          LEFT JOIN vehicles v ON u.id = v.assigned_driver_id
          LEFT JOIN gps_data g ON v.id = g.vehicle_id AND g.timestamp >= $1
          WHERE u.role = 'driver' AND u.id = $2
          GROUP BY u.id, u.username
        `;
        params = [timeFilter, driverId];
      } else {
        query = `
          SELECT
            u.id, u.username,
            COUNT(DISTINCT g.id) as gps_points,
            AVG(g.speed) as avg_speed,
            MAX(g.speed) as max_speed,
            COUNT(CASE WHEN g.speed > 80 THEN 1 END) as speeding_events,
            COUNT(CASE WHEN g.speed > 100 THEN 1 END) as severe_speeding,
            AVG(g.accuracy) as avg_accuracy,
            MIN(g.timestamp) as first_activity,
            MAX(g.timestamp) as last_activity
          FROM users u
          LEFT JOIN vehicles v ON u.id = v.assigned_driver_id
          LEFT JOIN gps_data g ON v.id = g.vehicle_id AND g.timestamp >= $1
          WHERE u.role = 'driver'
          GROUP BY u.id, u.username
          ORDER BY AVG(g.speed) DESC
        `;
        params = [timeFilter];
      }

      const result = await this.pool.query(query, params);

      return result.rows.map(driver => ({
        driverId: driver.id,
        driverName: driver.username,
        gpsPoints: parseInt(driver.gps_points || 0),
        avgSpeed: Math.round((driver.avg_speed || 0) * 100) / 100,
        maxSpeed: Math.round((driver.max_speed || 0) * 100) / 100,
        speedingEvents: parseInt(driver.speeding_events || 0),
        severeSpeeding: parseInt(driver.severe_speeding || 0),
        avgAccuracy: Math.round((driver.avg_accuracy || 0) * 100) / 100,
        firstActivity: driver.first_activity,
        lastActivity: driver.last_activity,
        // Calculate performance scores
        safetyScore: this.calculateSafetyScore(driver),
        efficiencyScore: this.calculateEfficiencyScore(driver),
        overallScore: this.calculateOverallScore(driver)
      }));
    } catch (error) {
      console.error('Error calculating driver performance:', error);
      throw error;
    }
  }

  // Calculate vehicle utilization and efficiency
  async getVehicleUtilization(timeRange = '30d') {
    try {
      const timeFilter = this.getTimeFilter(timeRange);

      const result = await this.pool.query(`
        SELECT
          v.id, v.vehicle_id, v.license_plate, v.make, v.model,
          u.username as driver_name,
          COUNT(g.id) as gps_points,
          AVG(g.speed) as avg_speed,
          MAX(g.speed) as max_speed,
          MIN(g.timestamp) as first_seen,
          MAX(g.timestamp) as last_seen,
          EXTRACT(EPOCH FROM (MAX(g.timestamp) - MIN(g.timestamp))) / 3600 as active_hours,
          COUNT(DISTINCT DATE(g.timestamp)) as active_days,
          AVG(g.accuracy) as avg_accuracy
        FROM vehicles v
        LEFT JOIN users u ON v.assigned_driver_id = u.id
        LEFT JOIN gps_data g ON v.id = g.vehicle_id AND g.timestamp >= $1
        GROUP BY v.id, v.vehicle_id, v.license_plate, v.make, v.model, u.username
        ORDER BY COUNT(g.id) DESC
      `, [timeFilter]);

      return result.rows.map(vehicle => ({
        vehicleId: vehicle.id,
        vehicleCode: vehicle.vehicle_id,
        licensePlate: vehicle.license_plate,
        make: vehicle.make,
        model: vehicle.model,
        driverName: vehicle.driver_name || 'Unassigned',
        gpsPoints: parseInt(vehicle.gps_points || 0),
        avgSpeed: Math.round((vehicle.avg_speed || 0) * 100) / 100,
        maxSpeed: Math.round((vehicle.max_speed || 0) * 100) / 100,
        firstSeen: vehicle.first_seen,
        lastSeen: vehicle.last_seen,
        activeHours: Math.round((vehicle.active_hours || 0) * 100) / 100,
        activeDays: parseInt(vehicle.active_days || 0),
        avgAccuracy: Math.round((vehicle.avg_accuracy || 0) * 100) / 100,
        utilizationRate: this.calculateUtilizationRate(vehicle, timeRange)
      }));
    } catch (error) {
      console.error('Error calculating vehicle utilization:', error);
      throw error;
    }
  }

  // Helper methods
  getTimeFilter(timeRange) {
    const now = new Date();
    switch (timeRange) {
      case '1h': return new Date(now.getTime() - 60 * 60 * 1000);
      case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  }

  calculateSafetyScore(driver) {
    const speedingPenalty = Math.min((driver.speeding_events || 0) * 2, 40);
    const severeSpeedingPenalty = Math.min((driver.severe_speeding || 0) * 5, 30);
    return Math.max(0, 100 - speedingPenalty - severeSpeedingPenalty);
  }

  calculateEfficiencyScore(driver) {
    // Efficiency based on consistent speed and GPS data quality
    const dataQuality = driver.avg_accuracy ? Math.min(driver.avg_accuracy / 10, 100) : 50;
    const consistency = driver.gps_points > 100 ? 100 : (driver.gps_points / 100) * 100;
    return Math.round((dataQuality + consistency) / 2);
  }

  calculateOverallScore(driver) {
    const safety = this.calculateSafetyScore(driver);
    const efficiency = this.calculateEfficiencyScore(driver);
    return Math.round((safety * 0.7) + (efficiency * 0.3));
  }

  calculateUtilizationRate(vehicle, timeRange) {
    const days = timeRange === '30d' ? 30 : timeRange === '7d' ? 7 : 1;
    const expectedHours = days * 8; // Assuming 8 hours per day
    const actualHours = vehicle.active_hours || 0;
    return Math.min(Math.round((actualHours / expectedHours) * 100), 100);
  }
}

module.exports = new AnalyticsService();