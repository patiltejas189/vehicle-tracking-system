import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
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

const DashboardScreen = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    todayDistance: 0,
    todayTrips: 0,
    totalDistance: 0,
    averageSpeed: 0,
  });
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch user's alerts
      const alertsResponse = await axios.get('/api/alerts');
      const userAlerts = alertsResponse.data.filter(alert =>
        alert.driver_id === user.id || alert.vehicle_id === user.vehicle_id
      );

      // Mock stats for demo (in real app, this would come from API)
      setStats({
        todayDistance: 45.2,
        todayTrips: 3,
        totalDistance: 1250.8,
        averageSpeed: 42.5,
      });

      setRecentAlerts(userAlerts.slice(0, 5));
    } catch (error) {
      console.error('Dashboard data error:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const formatDistance = (km) => {
    return km < 1 ? `${(km * 1000).toFixed(0)}m` : `${km.toFixed(1)}km`;
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'speed':
        return 'speed';
      case 'maintenance':
        return 'build';
      case 'geofence':
        return 'location-on';
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
      default:
        return colors.secondary;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Icon name="directions-car" size={50} color={colors.primary} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.userInfo}>
              <Icon name="person" size={24} color={colors.primary} />
              <View style={styles.userText}>
                <Text style={styles.greeting}>Hello, {user.username}</Text>
                <Text style={styles.role}>{user.role.replace('_', ' ')}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <Icon name="refresh" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Activity</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Icon name="straighten" size={24} color={colors.primary} />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{formatDistance(stats.todayDistance)}</Text>
                <Text style={styles.statLabel}>Distance</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Icon name="local-shipping" size={24} color={colors.success} />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{stats.todayTrips}</Text>
                <Text style={styles.statLabel}>Trips</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Icon name="speed" size={24} color={colors.warning} />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{stats.averageSpeed.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Avg Speed</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Total Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overall Statistics</Text>
          <View style={styles.totalStatsCard}>
            <View style={styles.totalStat}>
              <Text style={styles.totalStatValue}>{formatDistance(stats.totalDistance)}</Text>
              <Text style={styles.totalStatLabel}>Total Distance</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.totalStat}>
              <Text style={styles.totalStatValue}>{stats.todayTrips * 30}</Text>
              <Text style={styles.totalStatLabel}>Total Trips</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <Icon name="play-arrow" size={30} color={colors.success} />
              <Text style={styles.actionText}>Start Trip</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <Icon name="history" size={30} color={colors.primary} />
              <Text style={styles.actionText}>Trip History</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <Icon name="report-problem" size={30} color={colors.warning} />
              <Text style={styles.actionText}>Report Issue</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <Icon name="settings" size={30} color={colors.secondary} />
              <Text style={styles.actionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Alerts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Alerts</Text>
          {recentAlerts.length > 0 ? (
            <View style={styles.alertsList}>
              {recentAlerts.map((alert) => (
                <View key={alert.id} style={styles.alertCard}>
                  <View style={styles.alertIcon}>
                    <Icon
                      name={getAlertIcon(alert.alert_type)}
                      size={20}
                      color={getAlertColor(alert.severity)}
                    />
                  </View>
                  <View style={styles.alertContent}>
                    <Text style={styles.alertTitle}>{alert.alert_type}</Text>
                    <Text style={styles.alertMessage}>{alert.message}</Text>
                    <Text style={styles.alertTime}>
                      {new Date(alert.timestamp).toLocaleDateString()} {new Date(alert.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Icon name="notifications-none" size={40} color={colors.textSecondary} />
              <Text style={styles.emptyStateText}>No recent alerts</Text>
            </View>
          )}
        </View>
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
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.surface,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userText: {
    marginLeft: 12,
  },
  greeting: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  role: {
    fontSize: 14,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  refreshButton: {
    padding: 8,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statIcon: {
    marginBottom: 8,
  },
  statContent: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  totalStatsCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  totalStat: {
    flex: 1,
    alignItems: 'center',
  },
  totalStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  totalStatLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
    marginHorizontal: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    width: '48%',
    alignItems: 'center',
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
  actionText: {
    fontSize: 12,
    color: colors.text,
    marginTop: 8,
    textAlign: 'center',
  },
  alertsList: {
    space: 10,
  },
  alertCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  alertIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  alertTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 10,
  },
});

export default DashboardScreen;