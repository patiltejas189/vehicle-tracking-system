import { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { FaSpinner, FaTachometerAlt, FaCar, FaExclamationTriangle, FaStar, FaRoute } from 'react-icons/fa';

const API_BASE = (import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5000`).replace(/\/$/, '');
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Analytics = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const dashboardRes = await axios.get(`${API_BASE}/api/analytics/dashboard?timeRange=${timeRange}`);
      setDashboardData(dashboardRes.data);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-primary-600 mx-auto mb-4" />
          <p className="text-secondary-600">Loading advanced analytics...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-center">
          <p className="text-secondary-600">No data available</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const fleetUtilizationData = {
    labels: ['Active', 'Inactive', 'Maintenance', 'Unassigned'],
    datasets: [{
      label: 'Fleet Status',
      data: [
        dashboardData.kpis.fleetOverview.activeVehicles,
        dashboardData.kpis.fleetOverview.totalVehicles - dashboardData.kpis.fleetOverview.activeVehicles - dashboardData.kpis.fleetOverview.maintenanceVehicles,
        dashboardData.kpis.fleetOverview.maintenanceVehicles,
        dashboardData.kpis.fleetOverview.totalVehicles - dashboardData.kpis.fleetOverview.assignedVehicles
      ],
      backgroundColor: ['#10B981', '#6B7280', '#F59E0B', '#EF4444'],
    }]
  };


  const vehicleUtilizationData = {
    labels: dashboardData.vehicleUtilization.slice(0, 10).map(v => v.licensePlate),
    datasets: [{
      label: 'Utilization Rate (%)',
      data: dashboardData.vehicleUtilization.slice(0, 10).map(v => v.utilizationRate),
      backgroundColor: dashboardData.vehicleUtilization.slice(0, 10).map(v =>
        v.utilizationRate > 70 ? '#10B981' : v.utilizationRate > 40 ? '#F59E0B' : '#EF4444'
      ),
      borderWidth: 1
    }]
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Advanced Analytics Dashboard</h1>
          <p className="text-secondary-600 mt-1">Real-time fleet insights and performance metrics</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-secondary-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <button
            onClick={fetchAnalyticsData}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-xl font-medium transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-soft border border-secondary-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-secondary-600 text-sm font-medium">Total Vehicles</p>
              <p className="text-3xl font-bold text-secondary-900">{dashboardData.kpis.fleetOverview.totalVehicles}</p>
            </div>
            <FaCar className="text-3xl text-primary-600" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-success-600 font-medium">{dashboardData.kpis.fleetOverview.activeVehicles} active</span>
            <span className="text-secondary-400 mx-2">•</span>
            <span className="text-secondary-600">{dashboardData.kpis.fleetOverview.utilizationRate}% utilized</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-soft border border-secondary-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-secondary-600 text-sm font-medium">Fleet Speed</p>
              <p className="text-3xl font-bold text-secondary-900">{dashboardData.kpis.gpsMetrics.avgFleetSpeed.toFixed(1)} km/h</p>
            </div>
            <FaTachometerAlt className="text-3xl text-success-600" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-secondary-600">Max: {dashboardData.kpis.gpsMetrics.maxFleetSpeed.toFixed(1)} km/h</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-soft border border-secondary-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-secondary-600 text-sm font-medium">GPS Accuracy</p>
              <p className="text-3xl font-bold text-secondary-900">{dashboardData.kpis.gpsMetrics.avgAccuracy.toFixed(0)}m</p>
            </div>
            <FaRoute className="text-3xl text-warning-600" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-secondary-600">{dashboardData.kpis.gpsMetrics.vehiclesWithGPS} vehicles tracked</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-soft border border-secondary-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-secondary-600 text-sm font-medium">Safety Alerts</p>
              <p className="text-3xl font-bold text-secondary-900">{dashboardData.kpis.driverMetrics.speedingIncidents}</p>
            </div>
            <FaExclamationTriangle className="text-3xl text-danger-600" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-danger-600 font-medium">{dashboardData.kpis.driverMetrics.speedingPercentage}% speeding rate</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fleet Utilization */}
        <div className="bg-white rounded-2xl shadow-soft border border-secondary-100 p-6">
          <h3 className="text-xl font-semibold text-secondary-900 mb-4">Fleet Status Overview</h3>
          <div className="h-64">
            <Doughnut
              data={fleetUtilizationData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      padding: 20,
                      usePointStyle: true
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Vehicle Utilization */}
        <div className="bg-white rounded-2xl shadow-soft border border-secondary-100 p-6">
          <h3 className="text-xl font-semibold text-secondary-900 mb-4">Top Vehicle Utilization</h3>
          <div className="h-64">
            <Bar
              data={vehicleUtilizationData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                      callback: (value) => value + '%'
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Driver Performance */}
      <div className="bg-white rounded-2xl shadow-soft border border-secondary-100 p-6">
        <h3 className="text-xl font-semibold text-secondary-900 mb-4">Driver Performance Leaderboard</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-secondary-200">
                <th className="text-left py-3 px-4 font-semibold text-secondary-700">Driver</th>
                <th className="text-center py-3 px-4 font-semibold text-secondary-700">Safety Score</th>
                <th className="text-center py-3 px-4 font-semibold text-secondary-700">Efficiency</th>
                <th className="text-center py-3 px-4 font-semibold text-secondary-700">Overall</th>
                <th className="text-center py-3 px-4 font-semibold text-secondary-700">Speeding Events</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.topDrivers.map((driver, index) => (
                <tr key={driver.driverId} className="border-b border-secondary-100 hover:bg-secondary-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-secondary-100 text-secondary-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-secondary-50 text-secondary-600'
                      }`}>
                        {index + 1}
                      </div>
                      {driver.driverName}
                    </div>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      driver.safetyScore >= 80 ? 'bg-success-100 text-success-800' :
                      driver.safetyScore >= 60 ? 'bg-warning-100 text-warning-800' :
                      'bg-danger-100 text-danger-800'
                    }`}>
                      {driver.safetyScore}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      driver.efficiencyScore >= 80 ? 'bg-success-100 text-success-800' :
                      driver.efficiencyScore >= 60 ? 'bg-warning-100 text-warning-800' :
                      'bg-danger-100 text-danger-800'
                    }`}>
                      {driver.efficiencyScore}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <div className="flex items-center justify-center">
                      <FaStar className="text-yellow-500 mr-1" />
                      <span className="font-semibold">{driver.overallScore}</span>
                    </div>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      driver.speedingEvents === 0 ? 'bg-success-100 text-success-800' :
                      driver.speedingEvents <= 5 ? 'bg-warning-100 text-warning-800' :
                      'bg-danger-100 text-danger-800'
                    }`}>
                      {driver.speedingEvents}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alerts Summary */}
      <div className="bg-white rounded-2xl shadow-soft border border-secondary-100 p-6">
        <h3 className="text-xl font-semibold text-secondary-900 mb-4">Fleet Alerts Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-danger-600 mb-2">{dashboardData.alerts.speedingDrivers}</div>
            <p className="text-secondary-600">Drivers with Speeding</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-warning-600 mb-2">{dashboardData.alerts.lowUtilizationVehicles}</div>
            <p className="text-secondary-600">Low Utilization Vehicles</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-secondary-600 mb-2">{dashboardData.alerts.inactiveVehicles}</div>
            <p className="text-secondary-600">Inactive Vehicles</p>
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-white rounded-2xl shadow-soft border border-secondary-100 p-6">
        <h3 className="text-xl font-semibold text-secondary-900 mb-4">Export Analytics</h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => {
              const csvData = [
                ['Metric', 'Value'],
                ['Total Vehicles', dashboardData.kpis.fleetOverview.totalVehicles],
                ['Active Vehicles', dashboardData.kpis.fleetOverview.activeVehicles],
                ['Fleet Utilization', dashboardData.kpis.fleetOverview.utilizationRate + '%'],
                ['Average Speed', dashboardData.kpis.gpsMetrics.avgFleetSpeed + ' km/h'],
                ['GPS Accuracy', dashboardData.kpis.gpsMetrics.avgAccuracy + 'm'],
                ['Speeding Incidents', dashboardData.kpis.driverMetrics.speedingIncidents]
              ];
              const csvContent = csvData.map(row => row.join(',')).join('\n');
              const blob = new Blob([csvContent], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `fleet-analytics-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
            }}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Export Dashboard CSV
          </button>
          <button
            onClick={() => {
              const csvData = [
                ['Driver', 'Safety Score', 'Efficiency Score', 'Overall Score', 'Speeding Events'],
                ...dashboardData.topDrivers.map(d => [d.driverName, d.safetyScore, d.efficiencyScore, d.overallScore, d.speedingEvents])
              ];
              const csvContent = csvData.map(row => row.join(',')).join('\n');
              const blob = new Blob([csvContent], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `driver-performance-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
            }}
            className="bg-success-600 hover:bg-success-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Export Driver Performance
          </button>
        </div>
      </div>
    </div>
  );
};

export default Analytics;