import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { adminFetch } from '@/src/utils/adminApi';
import { MaterialIcons } from '@expo/vector-icons';

type AdminReport = {
  id: string;
  reportedUserId?: string;
  reportedItemId?: string;
  category?: string;
  reason?: string;
  status?: string;
  reportedAt?: string;
};

export default function ReportsScreen() {
  const { colors } = useTheme();
  const { getIdToken } = useAuth();
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setError(null);
      const token = await getIdToken();
      if (!token) throw new Error('Authentication required');

      const response = await adminFetch<{ reports: AdminReport[] }>('/admin/reports', token);
      setReports(response.reports || []);
    } catch (err: any) {
      console.error('Failed to load admin reports:', err);
      setError(err.message || 'Unable to load reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchReports();
  }, []);

  const resolveReport = async (reportId: string) => {
    try {
      const token = await getIdToken();
      if (!token) throw new Error('Authentication required');

      await adminFetch(`/admin/reports/${reportId}/action`, token, {
        method: 'POST',
        body: JSON.stringify({ action: 'resolve' }),
      });
      void fetchReports();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Unable to resolve report');
    }
  };

  const confirmResolve = (report: AdminReport) => {
    Alert.alert(
      'Resolve report',
      `Mark report #${report.id.slice(0, 6)} as resolved?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resolve',
          onPress: () => void resolveReport(report.id),
        },
      ]
    );
  };

  const statusColor = (status?: string) => {
    switch (status) {
      case 'new':
        return '#ef4444';
      case 'in_progress':
        return '#f59e0b';
      case 'resolved':
        return '#22c55e';
      default:
        return '#6b7280';
    }
  };

  const renderReportCard = ({ item }: { item: AdminReport }) => (
    <View style={[styles.reportCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
      <View style={styles.reportHeader}>
        <View>
          <Text style={[styles.reportId, { color: colors.textPrimary }]}>Report #{item.id.slice(0, 6)}</Text>
          <Text style={[styles.reportCategory, { color: colors.primary }]}>{item.category || 'General'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) }]}> 
          <Text style={styles.statusText}>{item.status || 'unknown'}</Text>
        </View>
      </View>
      <Text style={[styles.reportReason, { color: colors.textSecondary }]}>{item.reason || 'No reason provided.'}</Text>
      <View style={styles.reportFooter}>
        <Text style={[styles.reportMeta, { color: colors.textSecondary }]}>Reported at {item.date ? new Date(item.date).toLocaleString() : 'Unknown'}</Text>
        {item.status !== 'resolved' ? (
          <TouchableOpacity style={[styles.resolveButton, { backgroundColor: '#22c55e' }]} onPress={() => confirmResolve(item)}>
            <MaterialIcons name="check-circle" size={16} color="#fff" />
            <Text style={styles.resolveButtonText}>Resolve</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}> 
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading reports...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <FlatList
        data={reports}
        renderItem={renderReportCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void fetchReports();
            }}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="done-all" size={48} color={colors.primary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No reports to review</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  reportCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reportId: {
    fontSize: 14,
    fontWeight: '700',
  },
  reportCategory: {
    fontSize: 12,
    marginTop: 4,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  reportReason: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  reportMeta: {
    fontSize: 12,
  },
  resolveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  resolveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 14,
  },
});
