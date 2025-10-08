import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import API_BASE from '../api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { FaCar, FaCheckCircle, FaExclamationTriangle, FaWrench, FaEye, FaMap, FaFileAlt, FaUsers, FaSpinner } from 'react-icons/fa';
import GPSTracker from '../components/GPSTracker';
import GPSSimulator from '../components/GPSSimulator';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalVehicles: 0,
    activeVehicles: 0,
    totalAlerts: 0,
    upcomingMaintenance: 0
  });
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [recentMaintenance, setRecentMaintenance] = useState([]);
  const [recentVehicles, setRecentVehicles] = useState([]);
  const [assignedVehicle, setAssignedVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({
    vehicleStatus: { active: 0, inactive: 0, maintenance: 0 },
    alertsByType: {},
    maintenanceTrends: [],
    fuelConsumption: []
  });
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    fetchDashboardData();

    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [vehiclesRes, alertsRes, maintenanceRes] = await Promise.all([
        axios.get(`${API_BASE}/api/vehicles`),
        axios.get(`${API_BASE}/api/alerts`),
        axios.get(`${API_BASE}/api/maintenance`)
      ]);

      const vehicles = vehiclesRes.data;
      const alerts = alertsRes.data;
      const maintenance = maintenanceRes.data;

      // For drivers, find their assigned vehicle
      if (user?.role === 'driver') {
        const driverVehicle = vehicles.find(v => v.assigned_driver_id === user.id);
        setAssignedVehicle(driverVehicle);
      }

      const activeVehicles = vehicles.filter(v => v.status === 'active').length;
      const unresolvedAlerts = alerts.filter(a => !a.resolved).length;
      const upcomingMaintenance = maintenance.filter(m => !m.completed_date && new Date(m.scheduled_date) > new Date()).length;

      setStats({
        totalVehicles: vehicles.length,
        activeVehicles,
        totalAlerts: unresolvedAlerts,
        upcomingMaintenance
      });

      // Get recent data
      setRecentAlerts(alerts.filter(a => !a.resolved).slice(0, 5));
      setRecentMaintenance(maintenance.slice(0, 5));
      setRecentVehicles(vehicles.slice(0, 10)); // Show more vehicles in fleet overview

      // Prepare chart data
      const vehicleStatus = {
        active: vehicles.filter(v => v.status === 'active').length,
        inactive: vehicles.filter(v => v.status === 'inactive').length,
        maintenance: vehicles.filter(v => v.status === 'maintenance').length
      };

      const alertsByType = {};
      alerts.forEach(alert => {
        alertsByType[alert.alert_type] = (alertsByType[alert.alert_type] || 0) + 1;
      });

      // Mock data for trends (in real app, this would come from API)
      const maintenanceTrends = [
        { month: 'Jan', count: 12 },
        { month: 'Feb', count: 8 },
        { month: 'Mar', count: 15 },
        { month: 'Apr', count: 10 },
        { month: 'May', count: 18 },
        { month: 'Jun', count: 14 }
      ];

      const fuelConsumption = [
        { week: 'Week 1', consumption: 450 },
        { week: 'Week 2', consumption: 520 },
        { week: 'Week 3', consumption: 480 },
        { week: 'Week 4', consumption: 510 }
      ];

      setChartData({
        vehicleStatus,
        alertsByType,
        maintenanceTrends,
        fuelConsumption
      });

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-primary-600 mx-auto mb-4" />
          <p className="text-secondary-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Vehicles',
      value: stats.totalVehicles,
      icon: FaCar,
      color: 'primary',
      bgGradient: 'from-primary-500 to-primary-600'
    },
    {
      title: 'Active Vehicles',
      value: stats.activeVehicles,
      icon: FaCheckCircle,
      color: 'success',
      bgGradient: 'from-success-500 to-success-600'
    },
    {
      title: 'Active Alerts',
      value: stats.totalAlerts,
      icon: FaExclamationTriangle,
      color: 'danger',
      bgGradient: 'from-danger-500 to-danger-600'
    },
    {
      title: 'Upcoming Maintenance',
      value: stats.upcomingMaintenance,
      icon: FaWrench,
      color: 'warning',
      bgGradient: 'from-warning-500 to-warning-600'
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Dashboard</h1>
          <p className="text-secondary-600 mt-1">Welcome back, {user?.username}</p>
        </div>
        <div className="flex flex-col sm:items-end">
          <div className="text-sm font-medium text-secondary-700 capitalize">
            {user?.role?.replace('_', ' ')} Account
          </div>
          <div className="text-xs text-secondary-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white rounded-2xl shadow-soft hover:shadow-medium transition-all duration-300 p-6 border border-secondary-100 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600 mb-1">{card.title}</p>
                  <p className="text-3xl font-bold text-secondary-900">{card.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${card.bgGradient} shadow-medium`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Vehicle Status Chart */}
        <div className="bg-white rounded-2xl shadow-soft p-6 border border-secondary-100">
          <h2 className="text-xl font-semibold text-secondary-800 mb-4">Vehicle Status Distribution</h2>
          <div className="h-64">
            <Doughnut
              data={{
                labels: ['Active', 'Inactive', 'Maintenance'],
                datasets: [{
                  data: [
                    chartData.vehicleStatus.active,
                    chartData.vehicleStatus.inactive,
                    chartData.vehicleStatus.maintenance
                  ],
                  backgroundColor: ['#22c55e', '#6b7280', '#f59e0b'],
                  borderWidth: 0,
                  hoverOffset: 4
                }]
              }}
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

        {/* Maintenance Trends */}
        <div className="bg-white rounded-2xl shadow-soft p-6 border border-secondary-100">
          <h2 className="text-xl font-semibold text-secondary-800 mb-4">Maintenance Trends</h2>
          <div className="h-64">
            <Line
              data={{
                labels: chartData.maintenanceTrends.map(item => item.month),
                datasets: [{
                  label: 'Maintenance Count',
                  data: chartData.maintenanceTrends.map(item => item.count),
                  borderColor: '#3b82f6',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  tension: 0.4,
                  fill: true,
                  pointBackgroundColor: '#3b82f6',
                  pointBorderColor: '#ffffff',
                  pointBorderWidth: 2,
                  pointRadius: 6
                }]
              }}
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
                    grid: {
                      color: '#f1f5f9'
                    }
                  },
                  x: {
                    grid: {
                      display: false
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Fuel Consumption */}
        <div className="bg-white rounded-2xl shadow-soft p-6 border border-secondary-100">
          <h2 className="text-xl font-semibold text-secondary-800 mb-4">Fuel Consumption (Last 4 Weeks)</h2>
          <div className="h-64">
            <Bar
              data={{
                labels: chartData.fuelConsumption.map(item => item.week),
                datasets: [{
                  label: 'Fuel (Liters)',
                  data: chartData.fuelConsumption.map(item => item.consumption),
                  backgroundColor: 'rgba(239, 68, 68, 0.8)',
                  borderColor: '#dc2626',
                  borderWidth: 1,
                  borderRadius: 8,
                  borderSkipped: false,
                }]
              }}
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
                    grid: {
                      color: '#f1f5f9'
                    }
                  },
                  x: {
                    grid: {
                      display: false
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Alerts by Type */}
        <div className="bg-white rounded-2xl shadow-soft p-6 border border-secondary-100">
          <h2 className="text-xl font-semibold text-secondary-800 mb-4">Alerts by Type</h2>
          <div className="h-64">
            <Bar
              data={{
                labels: Object.keys(chartData.alertsByType),
                datasets: [{
                  label: 'Count',
                  data: Object.values(chartData.alertsByType),
                  backgroundColor: 'rgba(245, 158, 11, 0.8)',
                  borderColor: '#d97706',
                  borderWidth: 1,
                  borderRadius: 8,
                  borderSkipped: false,
                }]
              }}
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
                    grid: {
                      color: '#f1f5f9'
                    }
                  },
                  x: {
                    grid: {
                      display: false
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Alerts */}
        <div className="bg-white rounded-2xl shadow-soft border border-secondary-100 overflow-hidden">
          <div className="p-6 border-b border-secondary-100 bg-gradient-to-r from-danger-50 to-danger-100">
            <h2 className="text-xl font-semibold text-secondary-800 flex items-center">
              <FaExclamationTriangle className="mr-2 text-danger-600" />
              Recent Alerts
            </h2>
          </div>
          <div className="p-6">
            {recentAlerts.length > 0 ? (
              <div className="space-y-4">
                {recentAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-start space-x-3 p-3 rounded-xl bg-secondary-50 hover:bg-secondary-100 transition-colors duration-200">
                    <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                      alert.severity === 'high' ? 'bg-danger-500' :
                      alert.severity === 'medium' ? 'bg-warning-500' : 'bg-success-500'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-secondary-900 truncate">{alert.alert_type}</p>
                      <p className="text-sm text-secondary-600 truncate">{alert.message}</p>
                      <p className="text-xs text-secondary-500">{alert.license_plate} • {formatDate(alert.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-secondary-500 text-sm text-center py-8">No recent alerts</p>
            )}
          </div>
        </div>

        {/* Recent Maintenance */}
        <div className="bg-white rounded-2xl shadow-soft border border-secondary-100 overflow-hidden">
          <div className="p-6 border-b border-secondary-100 bg-gradient-to-r from-warning-50 to-warning-100">
            <h2 className="text-xl font-semibold text-secondary-800 flex items-center">
              <FaWrench className="mr-2 text-warning-600" />
              Maintenance Schedule
            </h2>
          </div>
          <div className="p-6">
            {recentMaintenance.length > 0 ? (
              <div className="space-y-4">
                {recentMaintenance.map((item) => (
                  <div key={item.id} className="flex items-start space-x-3 p-3 rounded-xl bg-secondary-50 hover:bg-secondary-100 transition-colors duration-200">
                    <div className="w-3 h-3 rounded-full mt-2 bg-primary-500 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-secondary-900 truncate">{item.maintenance_type}</p>
                      <p className="text-sm text-secondary-600 truncate">{item.description}</p>
                      <p className="text-xs text-secondary-500">
                        Due: {item.scheduled_date ? formatDate(item.scheduled_date) : 'Not scheduled'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-secondary-500 text-sm text-center py-8">No maintenance scheduled</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-soft border border-secondary-100 overflow-hidden">
          <div className="p-6 border-b border-secondary-100 bg-gradient-to-r from-primary-50 to-primary-100">
            <h2 className="text-xl font-semibold text-secondary-800">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <button className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center font-medium shadow-medium hover:shadow-large hover:scale-105">
                <FaEye className="mr-2" />
                View All Vehicles
              </button>
              <button className="w-full bg-gradient-to-r from-success-500 to-success-600 hover:from-success-600 hover:to-success-700 text-white px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center font-medium shadow-medium hover:shadow-large hover:scale-105">
                <FaMap className="mr-2" />
                Open Map View
              </button>
              <button className="w-full bg-gradient-to-r from-warning-500 to-warning-600 hover:from-warning-600 hover:to-warning-700 text-white px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center font-medium shadow-medium hover:shadow-large hover:scale-105">
                <FaFileAlt className="mr-2" />
                Generate Report
              </button>
              {user?.role === 'admin' && (
                <button className="w-full bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 text-white px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center font-medium shadow-medium hover:shadow-large hover:scale-105">
                  <FaUsers className="mr-2" />
                  Manage Users
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fleet Overview */}
      <div className="bg-white rounded-2xl shadow-soft border border-secondary-100 overflow-hidden">
        <div className="p-6 border-b border-secondary-100">
          <h2 className="text-xl font-semibold text-secondary-800">Fleet Overview</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Vehicle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Driver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {recentVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-secondary-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-secondary-900">{vehicle.vehicle_id}</div>
                    <div className="text-sm text-secondary-500">{vehicle.license_plate}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      vehicle.status === 'active' ? 'bg-success-100 text-success-800' :
                      vehicle.status === 'inactive' ? 'bg-secondary-100 text-secondary-800' :
                      'bg-warning-100 text-warning-800'
                    }`}>
                      {vehicle.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                    {vehicle.driver_name || 'Unassigned'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                    {vehicle.updated_at ? formatDate(vehicle.updated_at) : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* GPS Tracker for Drivers */}
      {user?.role === 'driver' && assignedVehicle && (
        <div className="mt-6">
          <GPSTracker assignedVehicle={assignedVehicle} />
        </div>
      )}

      {/* No Vehicle Assigned Message for Drivers */}
      {user?.role === 'driver' && !assignedVehicle && (
        <div className="mt-6 bg-warning-50 border border-warning-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-warning-800 mb-2">No Vehicle Assigned</h3>
          <p className="text-warning-700">You don't have a vehicle assigned to you yet. Please contact your fleet manager to get a vehicle assignment.</p>
        </div>
      )}

      {/* GPS Simulator for Admin/Fleet Manager */}
      {['admin', 'fleet_manager'].includes(user?.role) && recentVehicles.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold text-secondary-900 mb-4">GPS Testing Simulator</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {recentVehicles.slice(0, 2).map((vehicle) => (
              <GPSSimulator
                key={vehicle.id}
                vehicleId={vehicle.id}
                onLocationUpdate={(location) => console.log(`Vehicle ${vehicle.vehicle_id} location:`, location)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;