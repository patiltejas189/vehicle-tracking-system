import { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';

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
} from 'chart.js';
import { FaSpinner } from 'react-icons/fa';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState({
    vehicles: [],
    alerts: [],
    maintenance: []
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0]
  });
  const [reportType, setReportType] = useState('overview');

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const [vehiclesRes, alertsRes, maintenanceRes] = await Promise.all([
        axios.get(`${API_BASE}/api/vehicles`),
        axios.get(`${API_BASE}/api/alerts`),
        axios.get(`${API_BASE}/api/maintenance`)
      ]);

      setAnalyticsData({
        vehicles: vehiclesRes.data,
        alerts: alertsRes.data,
        maintenance: maintenanceRes.data
      });
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
          <p className="text-secondary-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Vehicle status distribution
  const vehicleStatusData = {
    labels: ['Active', 'Inactive', 'Maintenance'],
    datasets: [{
      label: 'Vehicles by Status',
      data: [
        analyticsData.vehicles.filter(v => v.status === 'active').length,
        analyticsData.vehicles.filter(v => v.status === 'inactive').length,
        analyticsData.vehicles.filter(v => v.status === 'maintenance').length
      ],
      backgroundColor: ['#10B981', '#6B7280', '#F59E0B'],
    }]
  };

  // Alerts by type
  const alertTypes = analyticsData.alerts.reduce((acc, alert) => {
    acc[alert.alert_type] = (acc[alert.alert_type] || 0) + 1;
    return acc;
  }, {});

  const alertsByTypeData = {
    labels: Object.keys(alertTypes),
    datasets: [{
      label: 'Alerts by Type',
      data: Object.values(alertTypes),
      backgroundColor: ['#EF4444', '#F59E0B', '#10B981', '#3B82F6'],
    }]
  };

  // Maintenance costs over time (simplified)
  const maintenanceByMonth = analyticsData.maintenance.reduce((acc, item) => {
    const month = new Date(item.scheduled_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    acc[month] = (acc[month] || 0) + (item.cost || 0);
    return acc;
  }, {});

  const maintenanceChartData = {
    labels: Object.keys(maintenanceByMonth),
    datasets: [{
      label: 'Maintenance Costs ($)',
      data: Object.values(maintenanceByMonth),
      borderColor: '#8B5CF6',
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      tension: 0.4
    }]
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
        <div className="flex space-x-4">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="border border-gray-300 rounded-md shadow-sm p-2"
          >
            <option value="overview">Overview</option>
            <option value="performance">Performance</option>
            <option value="maintenance">Maintenance</option>
            <option value="alerts">Alerts</option>
          </select>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Date Range:</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="border border-gray-300 rounded-md shadow-sm p-2"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="border border-gray-300 rounded-md shadow-sm p-2"
          />
          <button
            onClick={() => fetchAnalyticsData()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Apply Filter
          </button>
        </div>
      </div>

      {reportType === 'overview' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Vehicle Status Distribution */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Vehicle Status Distribution</h2>
              <div className="h-64">
                <Doughnut
                  data={vehicleStatusData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Alerts by Type */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Alerts by Type</h2>
              <div className="h-64">
                <Bar
                  data={alertsByTypeData}
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
                        beginAtZero: true
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Maintenance Costs */}
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-semibold mb-4">Maintenance Costs Over Time</h2>
            <div className="h-64">
              <Line
                data={maintenanceChartData}
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
                      beginAtZero: true
                    }
                  }
                }}
              />
            </div>
          </div>
        </>
      )}

      {reportType === 'performance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Vehicle Utilization */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Vehicle Utilization</h2>
            <div className="h-64">
              <Bar
                data={{
                  labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                  datasets: [{
                    label: 'Hours Used',
                    data: [120, 135, 110, 145],
                    backgroundColor: '#3B82F6',
                    borderColor: '#2563EB',
                    borderWidth: 1
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
                      beginAtZero: true
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Fuel Efficiency Trends */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Fuel Efficiency Trends</h2>
            <div className="h-64">
              <Line
                data={{
                  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                  datasets: [{
                    label: 'km/L',
                    data: [12.5, 13.2, 11.8, 14.1, 13.7, 14.3],
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4
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
                      beginAtZero: true
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {reportType === 'maintenance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Maintenance by Type */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Maintenance by Type</h2>
            <div className="h-64">
              <Pie
                data={{
                  labels: ['Oil Change', 'Tire Replacement', 'Brake Service', 'Engine Repair', 'Other'],
                  datasets: [{
                    data: [25, 15, 20, 10, 30],
                    backgroundColor: ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6']
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false
                }}
              />
            </div>
          </div>

          {/* Maintenance Schedule Compliance */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Schedule Compliance</h2>
            <div className="h-64">
              <Doughnut
                data={{
                  labels: ['On Time', 'Delayed', 'Overdue'],
                  datasets: [{
                    data: [65, 25, 10],
                    backgroundColor: ['#10B981', '#F59E0B', '#EF4444']
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {reportType === 'alerts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Alert Severity Distribution */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Alert Severity</h2>
            <div className="h-64">
              <Bar
                data={{
                  labels: ['Low', 'Medium', 'High', 'Critical'],
                  datasets: [{
                    label: 'Count',
                    data: [45, 30, 15, 5],
                    backgroundColor: ['#10B981', '#F59E0B', '#EF4444', '#7F1D1D']
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
                      beginAtZero: true
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Alert Response Time */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Response Time (hours)</h2>
            <div className="h-64">
              <Line
                data={{
                  labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                  datasets: [{
                    label: 'Average Response Time',
                    data: [2.5, 1.8, 3.2, 1.5],
                    borderColor: '#8B5CF6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    tension: 0.4
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
                      beginAtZero: true
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Total Vehicles</h3>
          <p className="text-3xl font-bold text-blue-600">{analyticsData.vehicles.length}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Active Vehicles</h3>
          <p className="text-3xl font-bold text-green-600">
            {analyticsData.vehicles.filter(v => v.status === 'active').length}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Total Alerts</h3>
          <p className="text-3xl font-bold text-red-600">{analyticsData.alerts.length}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Maintenance Items</h3>
          <p className="text-3xl font-bold text-orange-600">{analyticsData.maintenance.length}</p>
        </div>
      </div>

      {/* Export Reports */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Export Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
            >
              <option value="overview">Overview Report</option>
              <option value="performance">Performance Report</option>
              <option value="maintenance">Maintenance Report</option>
              <option value="alerts">Alerts Report</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
            <select className="w-full border border-gray-300 rounded-md shadow-sm p-2">
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                // Mock export functionality
                alert(`Exporting ${reportType} report...`);
              }}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Generate Report
            </button>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-2">Quick Exports</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                const csvContent = [
                  ['Metric', 'Value'],
                  ['Total Vehicles', analyticsData.vehicles.length],
                  ['Active Vehicles', analyticsData.vehicles.filter(v => v.status === 'active').length],
                  ['Total Alerts', analyticsData.alerts.length],
                  ['Maintenance Items', analyticsData.maintenance.length]
                ].map(row => row.join(',')).join('\n');

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `analytics_summary_${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
            >
              Export Summary CSV
            </button>
            <button
              onClick={() => {
                const csvContent = [
                  ['Vehicle ID', 'License Plate', 'Status', 'Last Updated'],
                  ...analyticsData.vehicles.map(vehicle => [
                    vehicle.vehicle_id,
                    vehicle.license_plate,
                    vehicle.status,
                    vehicle.updated_at ? new Date(vehicle.updated_at).toLocaleString() : 'Never'
                  ])
                ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `vehicle_report_${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
            >
              Export Vehicle Data
            </button>
            <button
              onClick={() => {
                const csvContent = [
                  ['Alert Type', 'Message', 'Severity', 'Timestamp', 'Vehicle'],
                  ...analyticsData.alerts.map(alert => [
                    alert.alert_type,
                    alert.message,
                    alert.severity,
                    alert.timestamp,
                    alert.license_plate
                  ])
                ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `alerts_report_${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 text-sm"
            >
              Export Alerts Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;