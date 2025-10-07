import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaSpinner } from 'react-icons/fa';

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    // General Settings
    companyName: 'Vehicle Tracking Co.',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    language: 'en',

    // System Settings
    autoRefreshInterval: 30,
    maxFileSize: 10,
    sessionTimeout: 60,
    maintenanceMode: false,

    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    alertThresholds: {
      speedLimit: 80,
      fuelLow: 20,
      maintenanceDays: 30
    },

    // Map Settings
    defaultZoom: 10,
    mapProvider: 'openstreetmap',
    showTraffic: false,
    geofenceAlerts: true,

    // Security Settings
    passwordMinLength: 8,
    twoFactorAuth: false,
    sessionLogging: true,
    ipWhitelist: []
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // In a real app, load from backend
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        setSettings({ ...settings, ...JSON.parse(savedSettings) });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      // In a real app, save to backend
      localStorage.setItem('appSettings', JSON.stringify(settings));
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      setSettings({
        companyName: 'Vehicle Tracking Co.',
        timezone: 'Asia/Kolkata',
        dateFormat: 'DD/MM/YYYY',
        language: 'en',
        autoRefreshInterval: 30,
        maxFileSize: 10,
        sessionTimeout: 60,
        maintenanceMode: false,
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        alertThresholds: {
          speedLimit: 80,
          fuelLow: 20,
          maintenanceDays: 30
        },
        defaultZoom: 10,
        mapProvider: 'openstreetmap',
        showTraffic: false,
        geofenceAlerts: true,
        passwordMinLength: 8,
        twoFactorAuth: false,
        sessionLogging: true,
        ipWhitelist: []
      });
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'system', label: 'System', icon: '🖥️' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'map', label: 'Map', icon: '🗺️' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'backup', label: 'Backup', icon: '💾' }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings & Configuration</h1>
        <div className="flex space-x-3">
          <button
            onClick={resetToDefaults}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Reset to Defaults
          </button>
          <button
            onClick={saveSettings}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800">General Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={settings.companyName}
                    onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Format
                  </label>
                  <select
                    value={settings.dateFormat}
                    onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <select
                    value={settings.language}
                    onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* System Settings */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800">System Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auto Refresh Interval (seconds)
                  </label>
                  <input
                    type="number"
                    value={settings.autoRefreshInterval}
                    onChange={(e) => setSettings({ ...settings, autoRefreshInterval: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                    min="10"
                    max="300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max File Size (MB)
                  </label>
                  <input
                    type="number"
                    value={settings.maxFileSize}
                    onChange={(e) => setSettings({ ...settings, maxFileSize: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                    min="1"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                    min="5"
                    max="480"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="maintenance-mode"
                    checked={settings.maintenanceMode}
                    onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="maintenance-mode" className="ml-2 text-sm font-medium text-gray-700">
                    Maintenance Mode
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800">Notification Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="email-notifications"
                    checked={settings.emailNotifications}
                    onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="email-notifications" className="ml-2 text-sm font-medium text-gray-700">
                    Email Notifications
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sms-notifications"
                    checked={settings.smsNotifications}
                    onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="sms-notifications" className="ml-2 text-sm font-medium text-gray-700">
                    SMS Notifications
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="push-notifications"
                    checked={settings.pushNotifications}
                    onChange={(e) => setSettings({ ...settings, pushNotifications: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="push-notifications" className="ml-2 text-sm font-medium text-gray-700">
                    Push Notifications
                  </label>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Alert Thresholds</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Speed Limit (km/h)
                    </label>
                    <input
                      type="number"
                      value={settings.alertThresholds.speedLimit}
                      onChange={(e) => setSettings({
                        ...settings,
                        alertThresholds: { ...settings.alertThresholds, speedLimit: parseInt(e.target.value) }
                      })}
                      className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                      min="30"
                      max="150"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fuel Low Threshold (%)
                    </label>
                    <input
                      type="number"
                      value={settings.alertThresholds.fuelLow}
                      onChange={(e) => setSettings({
                        ...settings,
                        alertThresholds: { ...settings.alertThresholds, fuelLow: parseInt(e.target.value) }
                      })}
                      className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                      min="5"
                      max="50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maintenance Reminder (days)
                    </label>
                    <input
                      type="number"
                      value={settings.alertThresholds.maintenanceDays}
                      onChange={(e) => setSettings({
                        ...settings,
                        alertThresholds: { ...settings.alertThresholds, maintenanceDays: parseInt(e.target.value) }
                      })}
                      className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                      min="1"
                      max="90"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Map Settings */}
          {activeTab === 'map' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800">Map Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Zoom Level
                  </label>
                  <input
                    type="number"
                    value={settings.defaultZoom}
                    onChange={(e) => setSettings({ ...settings, defaultZoom: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                    min="1"
                    max="20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Map Provider
                  </label>
                  <select
                    value={settings.mapProvider}
                    onChange={(e) => setSettings({ ...settings, mapProvider: e.target.value })}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                  >
                    <option value="openstreetmap">OpenStreetMap</option>
                    <option value="google">Google Maps</option>
                    <option value="mapbox">Mapbox</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="show-traffic"
                    checked={settings.showTraffic}
                    onChange={(e) => setSettings({ ...settings, showTraffic: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="show-traffic" className="ml-2 text-sm font-medium text-gray-700">
                    Show Traffic Layer
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="geofence-alerts"
                    checked={settings.geofenceAlerts}
                    onChange={(e) => setSettings({ ...settings, geofenceAlerts: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="geofence-alerts" className="ml-2 text-sm font-medium text-gray-700">
                    Geofence Alerts
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && user?.role === 'admin' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800">Security Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Password Length
                  </label>
                  <input
                    type="number"
                    value={settings.passwordMinLength}
                    onChange={(e) => setSettings({ ...settings, passwordMinLength: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                    min="6"
                    max="32"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="two-factor-auth"
                    checked={settings.twoFactorAuth}
                    onChange={(e) => setSettings({ ...settings, twoFactorAuth: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="two-factor-auth" className="ml-2 text-sm font-medium text-gray-700">
                    Require Two-Factor Authentication
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="session-logging"
                    checked={settings.sessionLogging}
                    onChange={(e) => setSettings({ ...settings, sessionLogging: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="session-logging" className="ml-2 text-sm font-medium text-gray-700">
                    Enable Session Logging
                  </label>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">IP Whitelist</h3>
                <div className="space-y-2">
                  {settings.ipWhitelist.map((ip, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={ip}
                        onChange={(e) => {
                          const newWhitelist = [...settings.ipWhitelist];
                          newWhitelist[index] = e.target.value;
                          setSettings({ ...settings, ipWhitelist: newWhitelist });
                        }}
                        className="flex-1 border border-gray-300 rounded-md shadow-sm p-2"
                        placeholder="192.168.1.0/24"
                      />
                      <button
                        onClick={() => {
                          const newWhitelist = settings.ipWhitelist.filter((_, i) => i !== index);
                          setSettings({ ...settings, ipWhitelist: newWhitelist });
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setSettings({ ...settings, ipWhitelist: [...settings.ipWhitelist, ''] })}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    + Add IP Range
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Backup Settings */}
          {activeTab === 'backup' && user?.role === 'admin' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800">Backup & Recovery</h2>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Database Backup</h3>
                  <div className="flex space-x-3">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                      Create Backup
                    </button>
                    <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                      Download Latest
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Automated Backups</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input type="checkbox" className="rounded" />
                      <label className="ml-2 text-sm font-medium text-gray-700">
                        Daily backups at 2:00 AM
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" className="rounded" />
                      <label className="ml-2 text-sm font-medium text-gray-700">
                        Weekly backups on Sunday
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" className="rounded" />
                      <label className="ml-2 text-sm font-medium text-gray-700">
                        Store backups for 30 days
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Data Export</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                      Export All Vehicles
                    </button>
                    <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                      Export All Tracking Data
                    </button>
                    <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                      Export User Data
                    </button>
                    <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                      Export System Logs
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && user?.role !== 'admin' && (
            <div className="text-center py-8">
              <p className="text-gray-500">Security settings are only available to administrators.</p>
            </div>
          )}

          {activeTab === 'backup' && user?.role !== 'admin' && (
            <div className="text-center py-8">
              <p className="text-gray-500">Backup settings are only available to administrators.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;