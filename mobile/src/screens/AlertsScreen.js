import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

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

const AlertsScreen = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, read

  useEffect(() => {
    fetchAlerts();
  }, []);

  useEffect(() => {
    filterAlerts();
  }, [alerts, filter]);

  const fetchAlerts = async () => {
    try {
      const response = await axios.get('/api/alerts');
      // Filter alerts for current user/driver
      const userAlerts = response.data.filter(alert =>
        alert.driver_id === user.id || alert.vehicle_id === user.vehicle_id
      );
      setAlerts(userAlerts);
    } catch (error) {
      console.error('Alerts fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAlerts = () => {
    let filtered = [...alerts];

    switch (filter) {
      case 'unread':
        filtered = filtered.filter(alert => !alert.read);
        break;
      case 'read':
        filtered = filtered.filter(alert => alert.read);
        break;
      default:
        // all alerts
        break;
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    setFilteredAlerts(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAlerts();
    setRefreshing(false);
  };

  const markAsRead = async (alertId) => {
    try {
      await axios.put(`/api/alerts/${alertId}/read`);
      setAlerts(prevAlerts =>
        prevAlerts.map(alert =>
          alert.id === alertId ? { ...alert, read: true } : alert
        )
      );
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'speed':
        return 'speed';
      case 'maintenance':
        return 'build';
      case 'geofence':
        return 'location-on';
      case 'fuel':
        return 'local-gas-station';
      default:
        return 'warning';
    }
  };

  const getAlertColor = (severity) => {
    switch (severity) {
      case 'high':
        return colors.danger;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.secondary;
      default:
        return colors.primary;
    }
  };

  const getAlertTypeLabel = (type) => {
    switch (type) {
      case 'speed':
        return 'Speed Alert';
      case 'maintenance':
        return 'Maintenance';
      case 'geofence':
        return 'Geofence';
      case 'fuel':
        return 'Fuel Alert';
      default:
        return 'Alert';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffHours < 1) {
      return `${Math.floor(diffMs / (1000 * 60))}m ago`;
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h ago`;
    } else {
      return `${Math.floor(diffDays)}d ago`;
    }
  };

  const filterButtons = [
    { key: 'all', label: 'All', count: alerts.length },
    { key: 'unread', label: 'Unread', count: alerts.filter(a => !a.read).length },
    { key: 'read', label: 'Read', count: alerts.filter(a => a.read).length },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Icon name="notifications" size={50} color={colors.primary} />
          <Text style={styles.loadingText}>Loading alerts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {filterButtons.map((button) => (
          <TouchableOpacity
            key={button.key}
            style={[
              styles.filterButton,
              filter === button.key && styles.filterButtonActive,
            ]}
            onPress={() => setFilter(button.key)}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === button.key && styles.filterButtonTextActive,
              ]}
            >
              {button.label} ({button.count})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Alerts List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredAlerts.length > 0 ? (
          <View style={styles.alertsList}>
            {filteredAlerts.map((alert) => (
              <TouchableOpacity
                key={alert.id}
                style={[
                  styles.alertCard,
                  !alert.read && styles.alertCardUnread,
                ]}
                onPress={() => !alert.read && markAsRead(alert.id)}
              >
                <View style={styles.alertHeader}>
                  <View style={styles.alertIcon}>
                    <Icon
                      name={getAlertIcon(alert.alert_type)}
                      size={24}
                      color={getAlertColor(alert.severity)}
                    />
                  </View>
                  <View style={styles.alertTitleContainer}>
                    <Text style={styles.alertTitle}>
                      {getAlertTypeLabel(alert.alert_type)}
                    </Text>
                    <Text style={styles.alertTime}>
                      {formatTime(alert.timestamp)}
                    </Text>
                  </View>
                  {!alert.read && <View style={styles.unreadDot} />}
                </View>

                <Text style={styles.alertMessage}>{alert.message}</Text>

                {alert.vehicle_id && (
                  <View style={styles.alertFooter}>
                    <Icon name="directions-car" size={16} color={colors.textSecondary} />
                    <Text style={styles.alertVehicle}>
                      Vehicle ID: {alert.vehicle_id}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Icon name="notifications-none" size={60} color={colors.textSecondary} />
            <Text style={styles.emptyStateTitle}>
              {filter === 'unread' ? 'No unread alerts' :
               filter === 'read' ? 'No read alerts' : 'No alerts'}
            </Text>
            <Text style={styles.emptyStateText}>
              {filter === 'all' ? 'You will see alerts here when they occur' :
               'Try changing the filter to see other alerts'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textSecondary,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 2,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  alertsList: {
    padding: 15,
  },
  alertCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  alertCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertTitleContainer: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  alertTime: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  alertMessage: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 10,
  },
  alertFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertVehicle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 15,
    marginBottom: 5,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AlertsScreen;