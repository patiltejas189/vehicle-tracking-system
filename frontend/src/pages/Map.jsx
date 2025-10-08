import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import io from 'socket.io-client';
import L from 'leaflet';
import { FaSpinner } from 'react-icons/fa';
import API_BASE from '../api';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const Map = () => {
  const [vehicles, setVehicles] = useState([]); // Vehicles with GPS data for markers
  const [allVehicles, setAllVehicles] = useState([]); // All vehicles for dropdown
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [route, setRoute] = useState([]);
  const [showRoute, setShowRoute] = useState(false);
  const [geofences, setGeofences] = useState([]);
  const [showGeofences, setShowGeofences] = useState(false);
  const [geofenceMode, setGeofenceMode] = useState(false);
  const [liveTracking, setLiveTracking] = useState(true);
  const [speedAlerts, setSpeedAlerts] = useState([]);

  useEffect(() => {
    fetchVehicleLocations();

    // Initialize sample geofences
    setGeofences([
      {
        id: 1,
        name: 'Delhi Restricted Zone',
        center: [28.6139, 77.2090],
        radius: 5000,
        type: 'restricted',
        color: 'red'
      },
      {
        id: 2,
        name: 'Mumbai Business District',
        center: [19.0760, 72.8777],
        radius: 3000,
        type: 'business',
        color: 'blue'
      },
      {
        id: 3,
        name: 'Bangalore Tech Park',
        center: [12.9716, 77.5946],
        radius: 2000,
        type: 'parking',
        color: 'green'
      }
    ]);

    // Connect to socket for real-time updates with auto-reconnect
    const socket = io(API_BASE, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`Reconnected after ${attemptNumber} attempts`);
    });

    socket.on('gps_update', (data) => {
      if (liveTracking) {
        setVehicles(prev => prev.map(vehicle =>
          vehicle.vehicle_id === data.vehicle_id
            ? { ...vehicle, latitude: data.latitude, longitude: data.longitude, speed: data.speed, timestamp: data.timestamp }
            : vehicle
        ));

        // Check for speed violations
        if (data.speed > 80) { // Assume 80 km/h speed limit
          setSpeedAlerts(prev => [{
            vehicle_id: data.vehicle_id,
            speed: data.speed,
            limit: 80,
            timestamp: data.timestamp,
            location: [data.latitude, data.longitude]
          }, ...prev.slice(0, 4)]); // Keep last 5 alerts
        }

        // Check geofence violations
        checkGeofenceViolations(data);
      }
    });

    return () => socket.disconnect();
  }, [liveTracking]);

  const fetchVehicleLocations = async () => {
    try {
      // Fetch all vehicles for dropdown
      const vehiclesResponse = await axios.get(`${API_BASE}/api/vehicles`);
      setAllVehicles(vehiclesResponse.data);

      // Fetch latest GPS data for map markers
      const gpsResponse = await axios.get(`${API_BASE}/api/tracking/latest`);

      // Merge vehicle info with GPS data
      const vehiclesWithGPS = gpsResponse.data.map(gps => {
        const vehicle = vehiclesResponse.data.find(v => v.id === gps.vehicle_id);
        return {
          ...gps,
          driver_name: vehicle?.driver_name || null
        };
      });

      setVehicles(vehiclesWithGPS);
    } catch (error) {
      console.error('Error fetching vehicle data:', error);
      // Fallback: try to get vehicles even if GPS fails
      try {
        const vehiclesResponse = await axios.get(`${API_BASE}/api/vehicles`);
        setAllVehicles(vehiclesResponse.data);
        setVehicles([]); // No GPS data available
      } catch (fallbackError) {
        console.error('Fallback vehicle fetch failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRoute = async () => {
    if (!selectedVehicle || !selectedDate) return;

    try {
      const response = await axios.get(`${API_BASE}/api/tracking/route/${selectedVehicle}?date=${selectedDate}`);
      const routePoints = response.data.map(point => [point.latitude, point.longitude]);
      setRoute(routePoints);
      setShowRoute(true);
    } catch (error) {
      console.error('Error fetching route:', error);
    }
  };

  const clearRoute = () => {
    setRoute([]);
    setShowRoute(false);
    setSelectedVehicle('');
    setSelectedDate('');
  };

  const checkGeofenceViolations = (vehicleData) => {
    geofences.forEach(geofence => {
      const distance = L.latLng(vehicleData.latitude, vehicleData.longitude).distanceTo(
        L.latLng(geofence.center[0], geofence.center[1])
      );

      if (distance <= geofence.radius) {
        // Vehicle is inside geofence
        if (geofence.type === 'restricted') {
          console.log(`Alert: Vehicle ${vehicleData.vehicle_id} entered restricted zone ${geofence.name}`);
          // In a real app, this would send an alert to the backend
        }
      }
    });
  };

  // Create custom marker based on vehicle status
  const createCustomIcon = (status) => {
    let color;
    switch (status) {
      case 'active':
        color = 'green';
        break;
      case 'inactive':
        color = 'gray';
        break;
      case 'maintenance':
        color = 'orange';
        break;
      default:
        color = 'blue';
    }

    return L.divIcon({
      html: `<div style="
        background-color: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>`,
      className: 'custom-vehicle-marker',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-primary-600 mx-auto mb-4" />
          <p className="text-secondary-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="hidden lg:block w-80 bg-white shadow-soft overflow-y-auto border border-secondary-100">
        <div className="p-6 border-b border-secondary-100">
          <h2 className="text-xl font-semibold text-secondary-800">Vehicle Status</h2>
          <div className="mt-2 text-sm text-secondary-600">
            {vehicles.length} vehicles tracking • {vehicles.filter(v => v.status === 'active').length} active
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-3">
            {vehicles.map((vehicle) => (
              <div key={vehicle.vehicle_id} className="border border-secondary-200 rounded-xl p-4 hover:bg-secondary-50 cursor-pointer transition-colors duration-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-sm text-secondary-900">{vehicle.license_plate}</span>
                  <div className={`w-3 h-3 rounded-full ${
                    vehicle.status === 'active' ? 'bg-success-500' :
                    vehicle.status === 'inactive' ? 'bg-secondary-500' :
                    'bg-warning-500'
                  }`}></div>
                </div>
                <div className="text-xs text-secondary-600 space-y-1">
                  <div>Speed: {vehicle.speed ? `${vehicle.speed} km/h` : 'N/A'}</div>
                  <div>Driver: {vehicle.driver_name || 'Unassigned'}</div>
                  <div>Last Update: {new Date(vehicle.timestamp).toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Speed Alerts */}
        {speedAlerts.length > 0 && (
          <div className="p-6 border-t border-secondary-100">
            <h3 className="text-sm font-semibold text-danger-600 mb-3">Speed Alerts</h3>
            <div className="space-y-2">
              {speedAlerts.map((alert, index) => (
                <div key={index} className="text-xs bg-danger-50 p-3 rounded-xl border border-danger-200">
                  <div className="font-medium text-danger-900">{alert.vehicle_id}</div>
                  <div className="text-danger-700">Speed: {alert.speed} km/h (Limit: {alert.limit} km/h)</div>
                  <div className="text-secondary-500">{new Date(alert.timestamp).toLocaleTimeString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="p-6">
          <h1 className="text-3xl font-bold text-secondary-900">Map View</h1>
          <p className="text-secondary-600 mt-1">Real-time vehicle tracking and route visualization</p>
        </div>

      <div className="bg-white p-6 rounded-2xl shadow-soft border border-secondary-100 mx-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <span className="text-sm text-secondary-600 font-medium">
              Showing {vehicles.length} vehicles on map ({allVehicles.length} total)
            </span>
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-success-500 rounded-full"></div>
                <span className="text-secondary-700">Active</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-secondary-500 rounded-full"></div>
                <span className="text-secondary-700">Inactive</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-warning-500 rounded-full"></div>
                <span className="text-secondary-700">Maintenance</span>
              </div>
            </div>
          </div>
          <button
            onClick={fetchVehicleLocations}
            className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-medium hover:shadow-large hover:scale-105"
          >
            Refresh Data
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
          <div>
            <label className="block text-sm font-semibold text-secondary-700 mb-2">Vehicle</label>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="w-full border border-secondary-300 rounded-xl shadow-sm p-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-secondary-50 focus:bg-white"
            >
              <option value="">Select Vehicle</option>
              {allVehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.license_plate} - {vehicle.vehicle_id} ({vehicle.driver_name || 'Unassigned'})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-secondary-700 mb-2">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border border-secondary-300 rounded-xl shadow-sm p-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-secondary-50 focus:bg-white"
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={fetchRoute}
              className="bg-gradient-to-r from-success-500 to-success-600 hover:from-success-600 hover:to-success-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 shadow-medium hover:shadow-large hover:scale-105 text-sm"
            >
              Show Route
            </button>
            {showRoute && (
              <button
                onClick={clearRoute}
                className="bg-gradient-to-r from-danger-500 to-danger-600 hover:from-danger-600 hover:to-danger-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 shadow-medium hover:shadow-large hover:scale-105 text-sm"
              >
                Clear Route
              </button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="geofence-toggle"
              checked={showGeofences}
              onChange={(e) => setShowGeofences(e.target.checked)}
              className="w-4 h-4 text-primary-600 bg-secondary-100 border-secondary-300 rounded focus:ring-primary-500 focus:ring-2"
            />
            <label htmlFor="geofence-toggle" className="text-sm font-medium text-secondary-700">
              Geofences
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="live-tracking"
              checked={liveTracking}
              onChange={(e) => setLiveTracking(e.target.checked)}
              className="w-4 h-4 text-primary-600 bg-secondary-100 border-secondary-300 rounded focus:ring-primary-500 focus:ring-2"
            />
            <label htmlFor="live-tracking" className="text-sm font-medium text-secondary-700">
              Live Tracking
            </label>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setGeofenceMode(!geofenceMode)}
              className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 shadow-medium hover:shadow-large hover:scale-105 text-sm ${
                geofenceMode
                  ? 'bg-gradient-to-r from-warning-500 to-warning-600 hover:from-warning-600 hover:to-warning-700 text-white'
                  : 'bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 text-white'
              }`}
            >
              {geofenceMode ? 'Exit Geofence Mode' : 'Create Geofence'}
            </button>
          </div>
        </div>

        {geofenceMode && (
          <div className="mt-6 p-4 bg-warning-50 border border-warning-200 rounded-xl">
            <p className="text-sm text-warning-800 font-medium">
              <strong>Geofence Mode:</strong> Click on the map to create geofence points. Right-click to complete the geofence.
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-soft border border-secondary-100 mx-6" style={{ height: '600px' }}>
        <MapContainer
          center={[20.5937, 78.9629]} // Center of India
          zoom={5}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {vehicles.map((vehicle) => (
            <Marker
              key={vehicle.vehicle_id}
              position={[vehicle.latitude, vehicle.longitude]}
              icon={createCustomIcon(vehicle.status)}
            >
              <Popup>
                <div className="p-4 min-w-64 bg-white rounded-xl shadow-large border border-secondary-100">
                  <h3 className="font-bold text-lg mb-3 text-secondary-900">{vehicle.license_plate}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center py-1">
                      <span className="font-medium text-secondary-600">Vehicle ID:</span>
                      <span className="text-secondary-900">{vehicle.vehicle_id}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="font-medium text-secondary-600">Speed:</span>
                      <span className="text-secondary-900">{vehicle.speed ? `${vehicle.speed} km/h` : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="font-medium text-secondary-600">Status:</span>
                      <span className={`font-semibold px-2 py-1 rounded-full text-xs ${
                        vehicle.status === 'active' ? 'bg-success-100 text-success-800' :
                        vehicle.status === 'inactive' ? 'bg-secondary-100 text-secondary-800' :
                        'bg-warning-100 text-warning-800'
                      }`}>
                        {vehicle.status?.charAt(0).toUpperCase() + vehicle.status?.slice(1)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="font-medium text-secondary-600">Driver:</span>
                      <span className="text-secondary-900">{vehicle.driver_name || 'Unassigned'}</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-secondary-200">
                      <p className="text-xs text-secondary-500">
                        Last Update: {new Date(vehicle.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Dynamic Geofence Circles */}
          {showGeofences && geofences.map(geofence => (
            <Circle
              key={geofence.id}
              center={geofence.center}
              radius={geofence.radius}
              pathOptions={{
                color: geofence.color,
                fillColor: geofence.color,
                fillOpacity: 0.1,
                weight: 2
              }}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold">{geofence.name}</h3>
                  <p className="text-sm text-gray-600">Type: {geofence.type}</p>
                  <p className="text-sm text-gray-600">Radius: {geofence.radius}m</p>
                </div>
              </Popup>
            </Circle>
          ))}

          {showRoute && route.length > 0 && (
            <Polyline
              positions={route}
              color="blue"
              weight={4}
              opacity={0.7}
            />
          )}
        </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default Map;