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

type PendingStudent = {
  id: string;
  name: string;
  email: string;
  rollNumber?: string;
  department?: string;
  program?: string;
  semester?: string;
  session?: string;
  campus?: string;
  verificationStatus?: string;
};

export default function StudentVerificationsScreen() {
  const { colors } = useTheme();
  const { getIdToken } = useAuth();
  const [students, setStudents] = useState<PendingStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingVerifications = async () => {
    try {
      setError(null);
      const token = await getIdToken();
      if (!token) throw new Error('Authentication required');
      const response = await adminFetch<{ pendingVerifications: PendingStudent[] }>('/admin/verifications', token);
      setStudents(response.pendingVerifications || []);
    } catch (err: any) {
      console.error('Failed to load pending verifications', err);
      setError(err.message || 'Unable to load verification requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchPendingVerifications();
  }, []);

  const resolveVerification = async (id: string, action: 'approve' | 'reject') => {
    try {
      const token = await getIdToken();
      if (!token) throw new Error('Authentication required');
      await adminFetch(`/admin/verifications/${id}/action`, token, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      void fetchPendingVerifications();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Unable to update verification');
    }
  };

  const confirmAction = (student: PendingStudent, action: 'approve' | 'reject') => {
    const title = action === 'approve' ? 'Approve verification' : 'Reject verification';
    const message = action === 'approve'
      ? `Approve verification for ${student.name}?`
      : `Reject verification for ${student.name}?`;

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: action === 'approve' ? 'Approve' : 'Reject',
        style: action === 'reject' ? 'destructive' : 'default',
        onPress: () => void resolveVerification(student.id, action),
      },
    ]);
  };

  const renderStudentCard = ({ item }: { item: PendingStudent }) => (
    <View style={[styles.studentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
      <View style={styles.studentInfo}>
        <View style={[styles.iconCircle, { backgroundColor: '#3498db20' }]}> 
          <MaterialIcons name="school" size={24} color="#3498db" />
        </View>
        <View style={styles.studentDetails}>
          <Text style={[styles.studentName, { color: colors.textPrimary }]}>{item.name}</Text>
          <Text style={[styles.studentDetail, { color: colors.textSecondary }]}>📧 {item.email}</Text>
          <Text style={[styles.studentDetail, { color: colors.textSecondary }]}>🆔 {item.rollNumber || 'N/A'}</Text>
        </View>
      </View>

      <View style={[styles.academicBox, { backgroundColor: colors.surfaceHighlight }]}> 
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Academic Details</Text>
        <View style={styles.academicRow}>
          <Text style={[styles.academicLabel, { color: colors.textSecondary }]}>Department</Text>
          <Text style={[styles.academicValue, { color: colors.textPrimary }]}>{item.department || 'Unknown'}</Text>
        </View>
        <View style={styles.academicRow}>
          <Text style={[styles.academicLabel, { color: colors.textSecondary }]}>Program</Text>
          <Text style={[styles.academicValue, { color: colors.textPrimary }]}>{item.program || 'Unknown'}</Text>
        </View>
        <View style={styles.academicRow}>
          <Text style={[styles.academicLabel, { color: colors.textSecondary }]}>Semester</Text>
          <Text style={[styles.academicValue, { color: colors.textPrimary }]}>{item.semester || 'Unknown'}</Text>
        </View>
        <View style={styles.academicRow}>
          <Text style={[styles.academicLabel, { color: colors.textSecondary }]}>Session</Text>
          <Text style={[styles.academicValue, { color: colors.textPrimary }]}>{item.session || 'Unknown'}</Text>
        </View>
        <View style={styles.academicRow}>
          <Text style={[styles.academicLabel, { color: colors.textSecondary }]}>Campus</Text>
          <Text style={[styles.academicValue, { color: colors.textPrimary }]}>{item.campus || 'Unknown'}</Text>
        </View>
      </View>

      <View style={[styles.checklistBox, { borderColor: colors.border }]}> 
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Verification checklist</Text>
        {['Roll number format', 'Department exists in registry', 'Session validity'].map((text) => (
          <View key={text} style={styles.checklistRow}>
            <MaterialIcons name="check-box" size={14} color="#e67e22" />
            <Text style={[styles.checklistText, { color: colors.textSecondary }]}>{text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={[styles.approveButton, { backgroundColor: '#22c55e' }]} onPress={() => confirmAction(item, 'approve')}>
          <MaterialIcons name="verified" size={18} color="#fff" />
          <Text style={styles.buttonText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.rejectButton, { backgroundColor: '#ef4444' }]} onPress={() => confirmAction(item, 'reject')}>
          <MaterialIcons name="cancel" size={18} color="#fff" />
          <Text style={styles.buttonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}> 
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading verifications...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      {error ? (
        <View style={[styles.errorBox, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={[styles.errorText, { color: colors.textPrimary }]}>{error}</Text>
        </View>
      ) : null}
      <FlatList
        data={students}
        renderItem={renderStudentCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void fetchPendingVerifications();
            }}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="verified-user" size={48} color={colors.primary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>All student verifications completed!</Text>
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
  },
  studentCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
  },
  studentInfo: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  studentDetail: {
    fontSize: 12,
    marginBottom: 2,
  },
  academicBox: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  academicRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  academicLabel: {
    fontSize: 12,
  },
  academicValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  checklistBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  checklistText: {
    fontSize: 11,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  errorBox: {
    margin: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 10,
  },
});
