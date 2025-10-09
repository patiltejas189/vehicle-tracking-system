import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaPlay, FaStop, FaMapMarkerAlt, FaTachometerAlt, FaRoute, FaClock } from 'react-icons/fa';
import API_BASE from '../api';

const GPSTracker = ({ assignedVehicle }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [tripDistance, setTripDistance] = useState(0);
  const [tripDuration, setTripDuration] = useState(0);
  const [lastPosition, setLastPosition] = useState(null);
  const [error, setError] = useState('');
  const [tripStartTime, setTripStartTime] = useState(null);
  
  const watchIdRef = useRef(null);
  const intervalRef = useRef(null);
  const tripTimerRef = useRef(null);

  useEffect(() => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
    }

    // Restore active trip from localStorage
    const savedTrip = localStorage.getItem('activeTrip');
    if (savedTrip && assignedVehicle) {
      try {
        const tripData = JSON.parse(savedTrip);
        if (tripData.vehicleId === assignedVehicle.id) {
          // Resume the active trip
          setIsTracking(true);
          setTripStartTime(new Date(tripData.startTime));
          setTripDistance(tripData.distance || 0);
          setLastPosition(tripData.lastPosition || null);

          // Resume GPS tracking
          resumeTracking();
        }
      } catch (error) {
        console.error('Error restoring trip data:', error);
        localStorage.removeItem('activeTrip');
      }
    }

    return () => {
      // Only stop tracking if component is being destroyed and no active trip
      const hasActiveTrip = localStorage.getItem('activeTrip');
      if (!hasActiveTrip) {
        stopTracking();
      }
    };
  }, [assignedVehicle]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  };

  const sendGPSData = async (position) => {
    if (!assignedVehicle) {
      console.error('No assigned vehicle');
      return;
    }

    // Check if position.coords exists
    if (!position || !position.coords) {
      console.error('Invalid position data received');
      setError('Invalid GPS data received');
      return;
    }

    const gpsData = {
      vehicle_id: assignedVehicle.id,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      speed: position.coords.speed ? position.coords.speed * 3.6 : 0, // Convert m/s to km/h
      heading: position.coords.heading || 0,
      accuracy: position.coords.accuracy || 0, // GPS accuracy in meters
      altitude: position.coords.altitude || null,
      altitudeAccuracy: position.coords.altitudeAccuracy || null,
      timestamp: new Date().toISOString()
    };

    try {
      await axios.post(`${API_BASE}/api/tracking/gps`, gpsData);
      console.log('GPS data sent successfully (accuracy: ' + (position.coords.accuracy || 'unknown') + 'm)');
    } catch (error) {
      console.error('Error sending GPS data:', error);
      setError('Failed to send GPS data - check connection');

      // Retry logic for failed sends
      setTimeout(async () => {
        try {
          await axios.post(`${API_BASE}/api/tracking/gps`, gpsData);
          console.log('GPS data retry successful');
          setError(''); // Clear error on successful retry
        } catch (retryError) {
          console.error('GPS data retry failed:', retryError);
        }
      }, 5000); // Retry after 5 seconds
    }
  };

  const resumeTracking = () => {
    if (!assignedVehicle) return;

    // Start watching position (same as startTracking but without resetting state)
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        // Check if position.coords exists
        if (!position || !position.coords) {
          console.error('Invalid position data received in resumeTracking');
          setError('Invalid GPS data received');
          return;
        }

        // Validate GPS accuracy
        const accuracy = position.coords.accuracy || 0;
        const isAccurate = accuracy <= 100; // Within 100 meters

        if (!isAccurate && accuracy > 0) {
          console.warn(`GPS accuracy low: ${accuracy}m`);
          setError(`GPS accuracy: ${accuracy.toFixed(0)}m (may be inaccurate)`);
        } else {
          setError(''); // Clear accuracy warning
        }

        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          speed: position.coords.speed ? position.coords.speed * 3.6 : 0,
          heading: position.coords.heading || 0,
          accuracy: accuracy,
          timestamp: new Date()
        };

        setCurrentLocation(newLocation);
        setCurrentSpeed(newLocation.speed);

        // Calculate distance if we have a previous position and accuracy is good
        if (lastPosition && isAccurate) {
          const distance = calculateDistance(
            lastPosition.latitude,
            lastPosition.longitude,
            newLocation.latitude,
            newLocation.longitude
          );

          // Filter out unrealistic jumps (more than 500m in 5 seconds)
          const timeDiff = (newLocation.timestamp - lastPosition.timestamp) / 1000;
          const speedCheck = distance / (timeDiff / 3600); // km/h

          if (speedCheck <= 500) { // Reasonable speed limit for distance calculation
            setTripDistance(prev => {
              const newDistance = prev + distance;
              // Update localStorage with new distance
              const updatedTrip = JSON.parse(localStorage.getItem('activeTrip') || '{}');
              updatedTrip.distance = newDistance;
              updatedTrip.lastPosition = newLocation;
              localStorage.setItem('activeTrip', JSON.stringify(updatedTrip));
              return newDistance;
            });
          } else {
            console.warn(`Unrealistic speed detected: ${speedCheck.toFixed(1)} km/h, skipping distance calculation`);
          }
        }

        setLastPosition(newLocation);
        sendGPSData(position);
      },
      (error) => {
        console.error('GPS Error:', error);
        let errorMessage = 'GPS tracking failed';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable GPS permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'GPS signal unavailable. Check your location settings.';
            break;
          case error.TIMEOUT:
            errorMessage = 'GPS timeout. Retrying...';
            // Auto-retry after timeout
            setTimeout(() => {
              if (isTracking) {
                navigator.geolocation.getCurrentPosition(
                  (position) => sendGPSData(position),
                  () => console.error('Retry GPS failed'),
                  { enableHighAccuracy: true, timeout: 15000 }
                );
              }
            }, 2000);
            break;
          default:
            errorMessage = `GPS Error: ${error.message}`;
        }

        setError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout for better accuracy
        maximumAge: 3000 // Reduced max age for fresher data
      }
    );

    // Send GPS data every 30 seconds
    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        sendGPSData,
        (error) => console.error('GPS interval error:', error),
        { enableHighAccuracy: true }
      );
    }, 30000);

    // Update trip duration every second
    tripTimerRef.current = setInterval(() => {
      if (tripStartTime) {
        const duration = Math.floor((new Date() - tripStartTime) / 1000);
        setTripDuration(duration);
      }
    }, 1000);
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    if (!assignedVehicle) {
      setError('No vehicle assigned to you');
      return;
    }

    setError('');
    setIsTracking(true);
    const startTime = new Date();
    setTripStartTime(startTime);
    setTripDistance(0);
    setTripDuration(0);

    // Save trip data to localStorage
    const tripData = {
      vehicleId: assignedVehicle.id,
      startTime: startTime.toISOString(),
      distance: 0,
      lastPosition: null
    };
    localStorage.setItem('activeTrip', JSON.stringify(tripData));

    // Start watching position with optimized accuracy settings
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        // Check if position.coords exists
        if (!position || !position.coords) {
          console.error('Invalid position data received in startTracking');
          setError('Invalid GPS data received');
          return;
        }

        // Validate GPS accuracy
        const accuracy = position.coords.accuracy || 0;
        const isAccurate = accuracy <= 100; // Within 100 meters

        if (!isAccurate && accuracy > 0) {
          console.warn(`GPS accuracy low: ${accuracy}m`);
          setError(`GPS accuracy: ${accuracy.toFixed(0)}m (may be inaccurate)`);
        } else {
          setError(''); // Clear accuracy warning
        }

        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          speed: position.coords.speed ? position.coords.speed * 3.6 : 0,
          heading: position.coords.heading || 0,
          accuracy: accuracy,
          timestamp: new Date()
        };

        setCurrentLocation(newLocation);
        setCurrentSpeed(newLocation.speed);

        // Calculate distance if we have a previous position and accuracy is good
        if (lastPosition && isAccurate) {
          const distance = calculateDistance(
            lastPosition.latitude,
            lastPosition.longitude,
            newLocation.latitude,
            newLocation.longitude
          );

          // Filter out unrealistic jumps (more than 500m in 5 seconds)
          const timeDiff = (newLocation.timestamp - lastPosition.timestamp) / 1000;
          const speedCheck = distance / (timeDiff / 3600); // km/h

          if (speedCheck <= 500) { // Reasonable speed limit for distance calculation
            setTripDistance(prev => {
              const newDistance = prev + distance;
              // Update localStorage with new distance
              const updatedTrip = JSON.parse(localStorage.getItem('activeTrip') || '{}');
              updatedTrip.distance = newDistance;
              updatedTrip.lastPosition = newLocation;
              localStorage.setItem('activeTrip', JSON.stringify(updatedTrip));
              return newDistance;
            });
          } else {
            console.warn(`Unrealistic speed detected: ${speedCheck.toFixed(1)} km/h, skipping distance calculation`);
          }
        }

        setLastPosition(newLocation);
        sendGPSData(position);
      },
      (error) => {
        console.error('GPS Error:', error);
        let errorMessage = 'GPS tracking failed';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable GPS permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'GPS signal unavailable. Check your location settings.';
            break;
          case error.TIMEOUT:
            errorMessage = 'GPS timeout. Retrying...';
            // Auto-retry after timeout
            setTimeout(() => {
              if (isTracking) {
                navigator.geolocation.getCurrentPosition(
                  (position) => sendGPSData(position),
                  () => console.error('Retry GPS failed'),
                  { enableHighAccuracy: true, timeout: 15000 }
                );
              }
            }, 2000);
            break;
          default:
            errorMessage = `GPS Error: ${error.message}`;
        }

        setError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout for better accuracy
        maximumAge: 3000 // Reduced max age for fresher data
      }
    );

    // Send GPS data every 30 seconds
    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        sendGPSData,
        (error) => console.error('GPS interval error:', error),
        { enableHighAccuracy: true }
      );
    }, 30000);

    // Update trip duration every second
    tripTimerRef.current = setInterval(() => {
      if (tripStartTime) {
        const duration = Math.floor((new Date() - tripStartTime) / 1000);
        setTripDuration(duration);
      }
    }, 1000);
  };

  const stopTracking = () => {
    setIsTracking(false);
    setTripStartTime(null);

    // Clear trip data from localStorage
    localStorage.removeItem('activeTrip');

    // Clear all intervals and watchers
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (tripTimerRef.current) {
      clearInterval(tripTimerRef.current);
      tripTimerRef.current = null;
    }

    // Send final GPS data
    if (currentLocation) {
      navigator.geolocation.getCurrentPosition(sendGPSData);
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!assignedVehicle) {
    return (
      <div className="bg-warning-50 border border-warning-200 rounded-xl p-4">
        <p className="text-warning-800 text-sm">No vehicle assigned to you. Contact your fleet manager.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-secondary-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-secondary-900">GPS Tracking</h2>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          isTracking ? 'bg-success-100 text-success-800' : 'bg-secondary-100 text-secondary-800'
        }`}>
          {isTracking ? 'Tracking Active' : 'Tracking Stopped'}
        </div>
      </div>

      {/* Vehicle Info */}
      <div className="bg-secondary-50 rounded-xl p-4 mb-6">
        <h3 className="font-semibold text-secondary-800 mb-2">Assigned Vehicle</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-secondary-600">Vehicle ID:</span>
            <span className="ml-2 font-medium">{assignedVehicle.vehicle_id}</span>
          </div>
          <div>
            <span className="text-secondary-600">License:</span>
            <span className="ml-2 font-medium">{assignedVehicle.license_plate}</span>
          </div>
          <div>
            <span className="text-secondary-600">Make/Model:</span>
            <span className="ml-2 font-medium">{assignedVehicle.make} {assignedVehicle.model}</span>
          </div>
          <div>
            <span className="text-secondary-600">Year:</span>
            <span className="ml-2 font-medium">{assignedVehicle.year}</span>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-4 mb-6">
        {!isTracking ? (
          <button
            onClick={startTracking}
            className="flex-1 bg-gradient-to-r from-success-500 to-success-600 hover:from-success-600 hover:to-success-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-medium hover:shadow-large hover:scale-105 flex items-center justify-center"
          >
            <FaPlay className="mr-2" />
            Start Trip
          </button>
        ) : (
          <button
            onClick={stopTracking}
            className="flex-1 bg-gradient-to-r from-danger-500 to-danger-600 hover:from-danger-600 hover:to-danger-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-medium hover:shadow-large hover:scale-105 flex items-center justify-center"
          >
            <FaStop className="mr-2" />
            End Trip
          </button>
        )}
      </div>

      {/* Trip Information */}
      {isTracking && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-primary-50 rounded-xl p-4 text-center">
            <FaMapMarkerAlt className="text-primary-600 text-xl mx-auto mb-2" />
            <div className="text-xs text-secondary-600 mb-1">Current Location</div>
            <div className="text-sm font-semibold text-secondary-900">
              {currentLocation ? 
                `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}` : 
                'Getting location...'
              }
            </div>
          </div>

          <div className="bg-success-50 rounded-xl p-4 text-center">
            <FaTachometerAlt className="text-success-600 text-xl mx-auto mb-2" />
            <div className="text-xs text-secondary-600 mb-1">Current Speed</div>
            <div className="text-sm font-semibold text-secondary-900">
              {currentSpeed.toFixed(1)} km/h
            </div>
          </div>

          <div className="bg-info-50 rounded-xl p-4 text-center">
            <FaMapMarkerAlt className="text-info-600 text-xl mx-auto mb-2" />
            <div className="text-xs text-secondary-600 mb-1">GPS Accuracy</div>
            <div className={`text-sm font-semibold ${
              currentLocation && currentLocation.accuracy <= 50 ? 'text-success-600' :
              currentLocation && currentLocation.accuracy <= 100 ? 'text-warning-600' :
              currentLocation ? 'text-danger-600' : 'text-secondary-600'
            }`}>
              {currentLocation && currentLocation.accuracy ? `${currentLocation.accuracy.toFixed(0)}m` : 'Getting accuracy...'}
            </div>
          </div>

          <div className="bg-warning-50 rounded-xl p-4 text-center">
            <FaRoute className="text-warning-600 text-xl mx-auto mb-2" />
            <div className="text-xs text-secondary-600 mb-1">Trip Distance</div>
            <div className="text-sm font-semibold text-secondary-900">
              {tripDistance.toFixed(2)} km
            </div>
          </div>

          <div className="bg-secondary-50 rounded-xl p-4 text-center">
            <FaClock className="text-secondary-600 text-xl mx-auto mb-2" />
            <div className="text-xs text-secondary-600 mb-1">Trip Duration</div>
            <div className="text-sm font-semibold text-secondary-900">
              {formatDuration(tripDuration)}
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-xl text-sm mb-4">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-primary-50 rounded-xl p-4 border border-primary-200">
        <h4 className="font-semibold text-primary-800 mb-2">How GPS Tracking Works:</h4>
        <ul className="text-sm text-primary-700 space-y-1">
          <li>• Click "Start Trip" to begin GPS tracking</li>
          <li>• Your location will be sent every 30 seconds</li>
          <li>• Speed monitoring alerts if you exceed 80 km/h</li>
          <li>• Trip continues even when navigating between app pages</li>
          <li>• Click "End Trip" when you finish driving</li>
          <li>• Make sure location permissions are enabled</li>
        </ul>
      </div>
    </div>
  );
};

export default GPSTracker;