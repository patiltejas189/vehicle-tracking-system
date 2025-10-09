import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaPlay, FaStop, FaMapMarkerAlt, FaTachometerAlt, FaCog } from 'react-icons/fa';
import API_BASE from '../api';

const GPSSimulator = ({ vehicleId, onLocationUpdate }) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 28.6139, // Delhi coordinates
    longitude: 77.2090,
    speed: 0,
    heading: 0
  });
  const [simulationSettings, setSimulationSettings] = useState({
    speed: 50, // km/h
    updateInterval: 5, // seconds
    routeType: 'city' // city, highway, random
  });
  
  const intervalRef = useRef(null);
  const routeIndex = useRef(0);

  // Predefined routes for simulation
  const routes = {
    city: [
      { lat: 28.6139, lng: 77.2090 }, // Delhi
      { lat: 28.6169, lng: 77.2120 },
      { lat: 28.6199, lng: 77.2150 },
      { lat: 28.6229, lng: 77.2180 },
      { lat: 28.6259, lng: 77.2210 }
    ],
    highway: [
      { lat: 28.6139, lng: 77.2090 }, // Delhi to Gurgaon
      { lat: 28.5945, lng: 77.2006 },
      { lat: 28.5751, lng: 77.1922 },
      { lat: 28.5557, lng: 77.1838 },
      { lat: 28.4595, lng: 77.0266 } // Gurgaon
    ]
  };

  const generateRandomMovement = (currentLat, currentLng) => {
    // Small random movement (within 1km radius)
    const deltaLat = (Math.random() - 0.5) * 0.01; // ~1km
    const deltaLng = (Math.random() - 0.5) * 0.01;
    
    return {
      latitude: currentLat + deltaLat,
      longitude: currentLng + deltaLng,
      speed: Math.random() * simulationSettings.speed + 20, // 20-70 km/h
      heading: Math.random() * 360
    };
  };

  const generateRouteMovement = () => {
    const route = routes[simulationSettings.routeType] || routes.city;
    const currentPoint = route[routeIndex.current % route.length];
    const nextPoint = route[(routeIndex.current + 1) % route.length];
    
    // Move towards next point
    const progress = 0.1; // 10% towards next point each update
    const newLat = currentPoint.lat + (nextPoint.lat - currentPoint.lat) * progress;
    const newLng = currentPoint.lng + (nextPoint.lng - currentPoint.lng) * progress;
    
    // Calculate heading towards next point
    const heading = Math.atan2(
      nextPoint.lng - currentPoint.lng,
      nextPoint.lat - currentPoint.lat
    ) * 180 / Math.PI;
    
    routeIndex.current++;
    
    return {
      latitude: newLat,
      longitude: newLng,
      speed: simulationSettings.speed + (Math.random() - 0.5) * 10,
      heading: heading
    };
  };

  const sendSimulatedGPS = async (location) => {
    try {
      const token = localStorage.getItem('token');
      // Simulate realistic GPS accuracy (10-100 meters)
      const simulatedAccuracy = Math.random() * 90 + 10;

      await axios.post(`${API_BASE}/api/tracking/gps`, {
        vehicle_id: vehicleId,
        latitude: location.latitude,
        longitude: location.longitude,
        speed: location.speed,
        heading: location.heading,
        accuracy: simulatedAccuracy,
        altitude: Math.random() * 500 + 100, // 100-600m altitude
        altitude_accuracy: simulatedAccuracy * 2,
        timestamp: new Date().toISOString()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Simulated GPS data sent:', { ...location, accuracy: simulatedAccuracy });
      if (onLocationUpdate) {
        onLocationUpdate({ ...location, accuracy: simulatedAccuracy });
      }
    } catch (error) {
      console.error('Error sending simulated GPS:', error);
    }
  };

  const startSimulation = () => {
    setIsSimulating(true);
    routeIndex.current = 0;
    
    intervalRef.current = setInterval(() => {
      let newLocation;
      
      if (simulationSettings.routeType === 'random') {
        newLocation = generateRandomMovement(currentLocation.latitude, currentLocation.longitude);
      } else {
        newLocation = generateRouteMovement();
      }
      
      setCurrentLocation(newLocation);
      sendSimulatedGPS(newLocation);
    }, simulationSettings.updateInterval * 1000);
  };

  const stopSimulation = () => {
    setIsSimulating(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-secondary-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-secondary-900">GPS Simulator</h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          isSimulating ? 'bg-success-100 text-success-800' : 'bg-secondary-100 text-secondary-800'
        }`}>
          {isSimulating ? 'Simulating' : 'Stopped'}
        </div>
      </div>

      {/* Simulation Settings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-semibold text-secondary-700 mb-2">
            <FaTachometerAlt className="inline mr-1" />
            Speed (km/h)
          </label>
          <input
            type="number"
            value={simulationSettings.speed}
            onChange={(e) => setSimulationSettings({...simulationSettings, speed: parseInt(e.target.value)})}
            className="w-full border border-secondary-300 rounded-xl p-3 focus:ring-2 focus:ring-primary-500"
            min="10"
            max="120"
            disabled={isSimulating}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-secondary-700 mb-2">
            <FaCog className="inline mr-1" />
            Update Interval (sec)
          </label>
          <input
            type="number"
            value={simulationSettings.updateInterval}
            onChange={(e) => setSimulationSettings({...simulationSettings, updateInterval: parseInt(e.target.value)})}
            className="w-full border border-secondary-300 rounded-xl p-3 focus:ring-2 focus:ring-primary-500"
            min="1"
            max="60"
            disabled={isSimulating}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-secondary-700 mb-2">Route Type</label>
          <select
            value={simulationSettings.routeType}
            onChange={(e) => setSimulationSettings({...simulationSettings, routeType: e.target.value})}
            className="w-full border border-secondary-300 rounded-xl p-3 focus:ring-2 focus:ring-primary-500"
            disabled={isSimulating}
          >
            <option value="city">City Route</option>
            <option value="highway">Highway Route</option>
            <option value="random">Random Movement</option>
          </select>
        </div>
      </div>

      {/* Current Location Display */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-primary-50 rounded-xl p-4 text-center">
          <FaMapMarkerAlt className="text-primary-600 text-xl mx-auto mb-2" />
          <div className="text-xs text-secondary-600 mb-1">Latitude</div>
          <div className="text-sm font-semibold text-secondary-900">
            {currentLocation.latitude.toFixed(6)}
          </div>
        </div>
        <div className="bg-primary-50 rounded-xl p-4 text-center">
          <FaMapMarkerAlt className="text-primary-600 text-xl mx-auto mb-2" />
          <div className="text-xs text-secondary-600 mb-1">Longitude</div>
          <div className="text-sm font-semibold text-secondary-900">
            {currentLocation.longitude.toFixed(6)}
          </div>
        </div>
        <div className="bg-success-50 rounded-xl p-4 text-center">
          <FaTachometerAlt className="text-success-600 text-xl mx-auto mb-2" />
          <div className="text-xs text-secondary-600 mb-1">Speed</div>
          <div className="text-sm font-semibold text-secondary-900">
            {currentLocation.speed.toFixed(1)} km/h
          </div>
        </div>
        <div className="bg-warning-50 rounded-xl p-4 text-center">
          <FaCog className="text-warning-600 text-xl mx-auto mb-2" />
          <div className="text-xs text-secondary-600 mb-1">Heading</div>
          <div className="text-sm font-semibold text-secondary-900">
            {currentLocation.heading.toFixed(0)}°
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-4">
        {!isSimulating ? (
          <button
            onClick={startSimulation}
            className="flex-1 bg-gradient-to-r from-success-500 to-success-600 hover:from-success-600 hover:to-success-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-medium hover:shadow-large hover:scale-105 flex items-center justify-center"
          >
            <FaPlay className="mr-2" />
            Start GPS Simulation
          </button>
        ) : (
          <button
            onClick={stopSimulation}
            className="flex-1 bg-gradient-to-r from-danger-500 to-danger-600 hover:from-danger-600 hover:to-danger-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-medium hover:shadow-large hover:scale-105 flex items-center justify-center"
          >
            <FaStop className="mr-2" />
            Stop Simulation
          </button>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 bg-primary-50 rounded-xl p-4 border border-primary-200">
        <h4 className="font-semibold text-primary-800 mb-2">GPS Simulation:</h4>
        <ul className="text-sm text-primary-700 space-y-1">
          <li>• This simulates GPS data for testing purposes</li>
          <li>• Data is sent to the backend every {simulationSettings.updateInterval} seconds</li>
          <li>• Speed alerts trigger if speed exceeds 80 km/h</li>
          <li>• Check the Map page to see real-time updates</li>
        </ul>
      </div>
    </div>
  );
};

export default GPSSimulator;