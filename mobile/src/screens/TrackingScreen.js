import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import BackgroundService from 'react-native-background-actions';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

const colors = {
  primary: '#3b82f6',
  secondary: '#64748b',
  success: '#22c55e',
  danger: '#ef4444',
  warning: '#f59e0b',
  background: '#f8fafc',
  surface: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
};

const TrackingScreen = () => {
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [speed, setSpeed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRouteView, setShowRouteView] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [historicalRoute, setHistoricalRoute] = useState([]);
  const [allVehicles, setAllVehicles] = useState([]);

  const mapRef = useRef(null);
  const watchId = useRef(null);
  const intervalRef = useRef(null);
  const lastPosition = useRef(null);

  useEffect(() => {
    requestLocationPermission();
    return () => {
      stopTracking();
    };
  }, []);

  useEffect(() => {
    if (startTime && isTracking) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [startTime, isTracking]);

  const requestLocationPermission = async () => {
    try {
      const result = await request(
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
          : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
      );

      if (result === RESULTS.GRANTED) {
        setPermissionsGranted(true);
        getCurrentLocation();
      } else {
        Alert.alert(
          'Location Permission Required',
          'This app needs location permission to track your vehicle. Please enable it in settings.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Permission error:', error);
    }
  };

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        // Check if position.coords exists
        if (!position || !position.coords) {
          console.error('Invalid position data received in getCurrentLocation');
          Alert.alert('Location Error', 'Received invalid location data. Please try again.');
          return;
        }

        const { latitude, longitude, speed: currentSpeed } = position.coords;
        const newLocation = {
          latitude,
          longitude,
          latitudeDelta: 0.005, // Smaller delta for better zoom
          longitudeDelta: 0.005,
        };

        setCurrentLocation(newLocation);
        setSpeed(currentSpeed || 0);
        lastPosition.current = newLocation;

        // Animate to current location
        if (mapRef.current) {
          mapRef.current.animateToRegion(newLocation, 1000);
        }
      },
      (error) => {
        console.error('Location error:', error);
        Alert.alert('Location Error', 'Unable to get your current location. Please check your GPS settings.');
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 10000,
      }
    );
  };

  const startTracking = async () => {
    if (!permissionsGranted) {
      Alert.alert('Permission Required', 'Location permission is required for tracking.');
      return;
    }

    setLoading(true);
    try {
      const now = Date.now();
      setStartTime(now);
      setIsTracking(true);
      setRouteCoordinates([]);
      setDistance(0);
      setElapsedTime(0);

      // Start background service for continuous tracking
      await BackgroundService.start(veryIntensiveTask, {
        taskName: 'GPS Tracking',
        taskTitle: 'Vehicle Tracking Active',
        taskDesc: 'Tracking your location in the background',
        taskIcon: {
          name: 'ic_launcher',
          type: 'mipmap',
        },
        color: colors.primary,
        linkingURI: 'vehicletracker://tracking',
      });

      // Start watching position
      watchId.current = Geolocation.watchPosition(
        (position) => {
          handleLocationUpdate(position);
        },
        (error) => {
          console.error('Watch position error:', error);
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 10, // Update every 10 meters
          interval: 5000, // Update every 5 seconds
          fastestInterval: 2000,
        }
      );

      Alert.alert('Tracking Started', 'GPS tracking is now active. You can minimize the app.');
    } catch (error) {
      console.error('Start tracking error:', error);
      Alert.alert('Error', 'Failed to start tracking.');
    } finally {
      setLoading(false);
    }
  };

  const stopTracking = async () => {
    setIsTracking(false);
    setStartTime(null);

    if (watchId.current) {
      Geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }

    try {
      await BackgroundService.stop();
    } catch (error) {
      console.error('Stop background service error:', error);
    }
  };

  const handleLocationUpdate = async (position) => {
    // Check if position.coords exists
    if (!position || !position.coords) {
      console.error('Invalid position data received in handleLocationUpdate');
      return;
    }

    const { latitude, longitude, speed: currentSpeed, accuracy } = position.coords;

    const newLocation = {
      latitude,
      longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };

    setCurrentLocation(newLocation);
    setSpeed(currentSpeed || 0);

    // Add to route
    setRouteCoordinates(prev => [...prev, newLocation]);

    // Calculate distance
    if (lastPosition.current) {
      const newDistance = calculateDistance(
        lastPosition.current.latitude,
        lastPosition.current.longitude,
        latitude,
        longitude
      );
      setDistance(prev => prev + newDistance);
    }

    lastPosition.current = newLocation;

    // Send to backend
    try {
      await axios.post('/api/tracking/gps', {
        vehicle_id: user.vehicle_id || 1, // Default to vehicle 1 for demo
        latitude,
        longitude,
        speed: currentSpeed || 0,
        heading: 0, // Could calculate from previous position
        accuracy,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Send GPS data error:', error);
    }

    // Check speed limit (80 km/h = ~22 m/s)
    if (currentSpeed && currentSpeed > 22) {
      Alert.alert('Speed Alert', 'You are exceeding the speed limit!');
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  const formatTime = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    return `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const formatDistance = (km) => {
    return km < 1 ? `${(km * 1000).toFixed(0)}m` : `${km.toFixed(2)}km`;
  };

  const fetchVehicles = async () => {
    try {
      const response = await axios.get('/api/vehicles');
      setAllVehicles(response.data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const fetchHistoricalRoute = async () => {
    if (!selectedVehicle || !selectedDate) {
      Alert.alert('Missing Information', 'Please select both vehicle and date.');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`/api/tracking/route/${selectedVehicle}?date=${selectedDate}`);

      if (response.data && response.data.length > 0) {
        // Convert backend data to map coordinates
        const routePoints = response.data.map(point => ({
          latitude: point.latitude,
          longitude: point.longitude,
        }));

        setHistoricalRoute(routePoints);
        setShowRouteView(true);

        // Fit map to show the entire route
        if (mapRef.current && routePoints.length > 1) {
          mapRef.current.fitToCoordinates(routePoints, {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true,
          });
        }
      } else {
        Alert.alert('No Route Data', 'No route data found for the selected vehicle and date.');
      }
    } catch (error) {
      console.error('Error fetching historical route:', error);
      Alert.alert('Error', 'Failed to fetch route data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearHistoricalRoute = () => {
    setHistoricalRoute([]);
    setShowRouteView(false);
    setSelectedVehicle('');
    setSelectedDate('');
  };

  // Background task for continuous GPS tracking
  const veryIntensiveTask = async (taskDataArguments) => {
    const { delay } = taskDataArguments;
    await new Promise(async (resolve) => {
      // Keep the service alive
      for (let i = 0; BackgroundService.isRunning(); i++) {
        // Send heartbeat to keep service alive
        await new Promise(resolve => setTimeout(resolve, delay || 5000));
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Icon name="gps-fixed" size={24} color={colors.primary} />
          <Text style={styles.headerTitle}>
            {showRouteView ? 'Route History' : 'GPS Tracking'}
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              if (showRouteView) {
                clearHistoricalRoute();
              } else {
                setShowRouteView(true);
                fetchVehicles();
              }
            }}
          >
            <Icon name={showRouteView ? "gps-fixed" : "timeline"} size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={getCurrentLocation}
          >
            <Icon name="my-location" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        {currentLocation ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={currentLocation}
            region={currentLocation}
            showsUserLocation={true}
            followsUserLocation={isTracking}
            showsMyLocationButton={true}
            showsCompass={true}
            showsScale={true}
            zoomEnabled={true}
            scrollEnabled={true}
            rotateEnabled={true}
            pitchEnabled={false}
            loadingEnabled={true}
            loadingIndicatorColor={colors.primary}
            loadingBackgroundColor={colors.background}
          >
            {/* Live tracking route */}
            {routeCoordinates.length > 1 && !showRouteView && (
              <Polyline
                coordinates={routeCoordinates}
                strokeColor={colors.primary}
                strokeWidth={4}
                lineDashPattern={[1]}
              />
            )}

            {/* Historical route */}
            {historicalRoute.length > 1 && showRouteView && (
              <Polyline
                coordinates={historicalRoute}
                strokeColor={colors.danger}
                strokeWidth={5}
              />
            )}

            {/* Current location marker (only in live tracking mode) */}
            {currentLocation && !showRouteView && (
              <Marker
                coordinate={currentLocation}
                title="Current Location"
                description={`Speed: ${(speed * 3.6).toFixed(1)} km/h`}
              >
                <View style={styles.markerContainer}>
                  <Icon name="directions-car" size={24} color={colors.primary} />
                </View>
              </Marker>
            )}

            {/* Route start marker */}
            {historicalRoute.length > 0 && showRouteView && (
              <Marker
                coordinate={historicalRoute[0]}
                title="Route Start"
                description="Starting point"
              >
                <View style={[styles.markerContainer, { backgroundColor: colors.success }]}>
                  <Icon name="flag" size={20} color="#ffffff" />
                </View>
              </Marker>
            )}

            {/* Route end marker */}
            {historicalRoute.length > 1 && showRouteView && (
              <Marker
                coordinate={historicalRoute[historicalRoute.length - 1]}
                title="Route End"
                description="Ending point"
              >
                <View style={[styles.markerContainer, { backgroundColor: colors.danger }]}>
                  <Icon name="flag" size={20} color="#ffffff" />
                </View>
              </Marker>
            )}
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Icon name="location-off" size={64} color={colors.textSecondary} />
            <Text style={styles.placeholderTitle}>Location Unavailable</Text>
            <Text style={styles.placeholderText}>Please enable location services to start tracking</Text>
            <TouchableOpacity style={styles.retryButton} onPress={getCurrentLocation}>
              <Icon name="refresh" size={20} color="#ffffff" />
              <Text style={styles.retryButtonText}>Get Location</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Stats Overlay */}
      {isTracking && (
        <View style={styles.statsOverlay}>
          <View style={styles.statsRow}>
            <View style={styles.miniStat}>
              <Icon name="speed" size={16} color={colors.primary} />
              <Text style={styles.miniStatValue}>{(speed * 3.6).toFixed(1)}</Text>
              <Text style={styles.miniStatLabel}>km/h</Text>
            </View>
            <View style={styles.miniStat}>
              <Icon name="straighten" size={16} color={colors.success} />
              <Text style={styles.miniStatValue}>{formatDistance(distance)}</Text>
              <Text style={styles.miniStatLabel}>Distance</Text>
            </View>
            <View style={styles.miniStat}>
              <Icon name="schedule" size={16} color={colors.warning} />
              <Text style={styles.miniStatValue}>{formatTime(elapsedTime)}</Text>
              <Text style={styles.miniStatLabel}>Time</Text>
            </View>
          </View>
        </View>
      )}

      {/* Route Selection UI */}
      {showRouteView && (
        <View style={styles.routeSelectionContainer}>
          <Text style={styles.routeSelectionTitle}>Select Route to View</Text>

          <View style={styles.selectionRow}>
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Vehicle</Text>
              <View style={styles.pickerWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vehicleScroll}>
                  {allVehicles.map((vehicle) => (
                    <TouchableOpacity
                      key={vehicle.id}
                      style={[
                        styles.vehicleChip,
                        selectedVehicle === vehicle.id.toString() && styles.vehicleChipSelected
                      ]}
                      onPress={() => setSelectedVehicle(vehicle.id.toString())}
                    >
                      <Text style={[
                        styles.vehicleChipText,
                        selectedVehicle === vehicle.id.toString() && styles.vehicleChipTextSelected
                      ]}>
                        {vehicle.license_plate}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>

          <View style={styles.selectionRow}>
            <View style={styles.dateContainer}>
              <Text style={styles.pickerLabel}>Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  // For React Native, we'd use a proper date picker
                  // For now, let's set yesterday as default
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  setSelectedDate(yesterday.toISOString().split('T')[0]);
                }}
              >
                <Text style={styles.dateButtonText}>
                  {selectedDate || 'Select Date'}
                </Text>
                <Icon name="calendar-today" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.routeActionButtons}>
            <TouchableOpacity
              style={[styles.routeButton, styles.showRouteButton]}
              onPress={fetchHistoricalRoute}
              disabled={loading || !selectedVehicle || !selectedDate}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Icon name="timeline" size={20} color="#ffffff" />
                  <Text style={styles.routeButtonText}>Show Route</Text>
                </>
              )}
            </TouchableOpacity>

            {historicalRoute.length > 0 && (
              <TouchableOpacity
                style={[styles.routeButton, styles.clearRouteButton]}
                onPress={clearHistoricalRoute}
              >
                <Icon name="clear" size={20} color="#ffffff" />
                <Text style={styles.routeButtonText}>Clear Route</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Bottom Controls */}
      <View style={styles.bottomContainer}>
        {/* Detailed Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Icon name="speed" size={24} color={colors.primary} />
            <Text style={styles.statValue}>{(speed * 3.6).toFixed(1)}</Text>
            <Text style={styles.statLabel}>Speed</Text>
            <Text style={styles.statUnit}>km/h</Text>
          </View>

          <View style={styles.statCard}>
            <Icon name="straighten" size={24} color={colors.success} />
            <Text style={styles.statValue}>{formatDistance(distance)}</Text>
            <Text style={styles.statLabel}>Distance</Text>
            <Text style={styles.statUnit}>Travelled</Text>
          </View>

          <View style={styles.statCard}>
            <Icon name="schedule" size={24} color={colors.warning} />
            <Text style={styles.statValue}>{formatTime(elapsedTime)}</Text>
            <Text style={styles.statLabel}>Duration</Text>
            <Text style={styles.statUnit}>Time</Text>
          </View>

          <View style={styles.statCard}>
            <Icon name="gps-fixed" size={24} color={isTracking ? colors.success : colors.secondary} />
            <Text style={[styles.statValue, { color: isTracking ? colors.success : colors.secondary }]}>
              {isTracking ? 'Active' : 'Stopped'}
            </Text>
            <Text style={styles.statLabel}>Status</Text>
            <Text style={styles.statUnit}>Tracking</Text>
          </View>
        </View>

        {/* Control Button */}
        <View style={styles.buttonContainer}>
          {!isTracking ? (
            <TouchableOpacity
              style={[styles.trackButton, styles.startButton]}
              onPress={startTracking}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Icon name="play-arrow" size={28} color="#ffffff" />
                  <Text style={styles.trackButtonText}>Start Tracking</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.trackButton, styles.stopButton]}
              onPress={stopTracking}
            >
              <Icon name="stop" size={28} color="#ffffff" />
              <Text style={styles.trackButtonText}>Stop Tracking</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 10,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: colors.background,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    minHeight: height * 0.6, // Ensure minimum height for proper display
  },
  mapPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 40,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statsOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  miniStat: {
    alignItems: 'center',
    flex: 1,
  },
  miniStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 2,
  },
  miniStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  bottomContainer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
  },
  statCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    margin: 6,
    alignItems: 'center',
    width: (width - 60) / 2, // 2 cards per row with margins
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  statUnit: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  buttonContainer: {
    padding: 20,
    paddingTop: 0,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startButton: {
    backgroundColor: colors.success,
  },
  stopButton: {
    backgroundColor: colors.danger,
  },
  trackButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  markerContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  routeSelectionContainer: {
    backgroundColor: colors.surface,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  routeSelectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
    textAlign: 'center',
  },
  selectionRow: {
    marginBottom: 15,
  },
  pickerContainer: {
    marginBottom: 10,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  pickerWrapper: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  vehicleScroll: {
    flexDirection: 'row',
  },
  vehicleChip: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  vehicleChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  vehicleChipText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  vehicleChipTextSelected: {
    color: '#ffffff',
  },
  dateContainer: {
    marginBottom: 10,
  },
  dateButton: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButtonText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  routeActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  routeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  showRouteButton: {
    backgroundColor: colors.primary,
  },
  clearRouteButton: {
    backgroundColor: colors.secondary,
  },
  routeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default TrackingScreen;