import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { adminFetch } from '@/src/utils/adminApi';
import { MaterialIcons } from '@expo/vector-icons';

type DashboardStats = {
  totalUsers: number;
  totalListings: number;
  pendingApprovals: number;
  activeReports: number;
};

type ActivityItem = {
  id: string;
  title: string;
  subtitle: string;
  date: string | null;
  type: string;
};

export default function AdminDashboard() {
  const { colors } = useTheme();
  const { getIdToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalListings: 0,
    pendingApprovals: 0,
    activeReports: 0,
  });
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setErrorMessage(null);
      const token = await getIdToken();
      if (!token) throw new Error('Admin authentication token missing');

      const [statsResponse, activityResponse] = await Promise.all([
        adminFetch<DashboardStats>('/admin/stats', token),
        adminFetch<{ activity: ActivityItem[] }>('/admin/activity', token),
      ]);

      setStats(statsResponse);
      setActivity(activityResponse.activity || []);
    } catch (error: any) {
      console.error('Admin dashboard load error:', error);
      setErrorMessage(error?.message || 'Unable to load admin dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchDashboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    void fetchDashboard();
  };

  const navigateToScreen = (route: string) => {
    router.push(`/admin/${route}` as any);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.content}>
          <Text style={[styles.header, { color: colors.textPrimary }]}>Admin Dashboard</Text>
          <Text style={[styles.subHeader, { color: colors.textSecondary }]}>Manage users, listings, reports, and verifications from one place.</Text>

          <View style={styles.metricsContainer}>
            <TouchableOpacity style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => navigateToScreen('users')}>
              <View style={[styles.iconCircle, { backgroundColor: '#3b82f6' }]}>
                <MaterialIcons name="people" size={26} color="#fff" />
              </View>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{stats.totalUsers}</Text>
              <Text style={[styles.metricTitle, { color: colors.textSecondary }]}>Total Users</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => navigateToScreen('listings')}>
              <View style={[styles.iconCircle, { backgroundColor: '#10b981' }]}>
                <MaterialIcons name="shopping-bag" size={26} color="#fff" />
              </View>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{stats.totalListings}</Text>
              <Text style={[styles.metricTitle, { color: colors.textSecondary }]}>Total Listings</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => navigateToScreen('approvals')}>
              <View style={[styles.iconCircle, { backgroundColor: '#f59e0b' }]}>
                <MaterialIcons name="pending-actions" size={26} color="#fff" />
              </View>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{stats.pendingApprovals}</Text>
              <Text style={[styles.metricTitle, { color: colors.textSecondary }]}>Pending Approvals</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => navigateToScreen('reports')}>
              <View style={[styles.iconCircle, { backgroundColor: '#ef4444' }]}>
                <MaterialIcons name="flag" size={26} color="#fff" />
              </View>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{stats.activeReports}</Text>
              <Text style={[styles.metricTitle, { color: colors.textSecondary }]}>Active Reports</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
          </View>

          <View style={styles.quickActionsContainer}>
            <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => navigateToScreen('approvals')}>
              <MaterialIcons name="pending-actions" size={20} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.textPrimary }]}>Review Pending Items</Text>
              <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => navigateToScreen('reports')}>
              <MaterialIcons name="flag" size={20} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.textPrimary }]}>View Reports</Text>
              <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => navigateToScreen('verifications')}>
              <MaterialIcons name="verified-user" size={20} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.textPrimary }]}>Verify Students</Text>
              <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Activity</Text>
          </View>

          {errorMessage ? (
            <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{errorMessage}</Text>
            </View>
          ) : activity.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No recent admin activity available.</Text>
            </View>
          ) : (
            activity.map((item) => (
              <View key={item.id} style={[styles.activityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
                <View style={styles.activityRow}>
                  <MaterialIcons name={item.type === 'report' ? 'flag' : 'history'} size={18} color={colors.primary} />
                  <Text style={[styles.activityTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                </View>
                <Text style={[styles.activitySubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
                <Text style={[styles.activityDate, { color: colors.textMuted }]}>{item.date ? new Date(item.date).toLocaleString() : 'Unknown date'}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
  },
  subHeader: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  metricCard: {
    width: '48%',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  metricValue: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
  },
  metricTitle: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  quickActionsContainer: {
    marginBottom: 24,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  actionText: {
    flex: 1,
    marginHorizontal: 10,
    fontSize: 15,
    fontWeight: '700',
  },
  activityCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  activitySubtitle: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 8,
  },
  activityDate: {
    fontSize: 12,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 15,
  },
  emptyState: {
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
  },
  emptyText: {
    fontSize: 14,
  },
});
