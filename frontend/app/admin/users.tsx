import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { adminFetch } from '@/src/utils/adminApi';
import { MaterialIcons } from '@expo/vector-icons';

type AdminUser = {
  id: string;
  name: string;
  email: string;
  rollNumber?: string;
  university?: string;
  status: 'active' | 'banned';
  isVerified: boolean;
  verificationStatus: string;
  role: string;
  memberSince?: string;
};

export default function UsersScreen() {
  const { colors } = useTheme();
  const { getIdToken } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setError(null);
      const token = await getIdToken();
      if (!token) throw new Error('Authentication is required');

      const response = await adminFetch<{ users: AdminUser[] }>('/admin/users', token);
      setUsers(response.users || []);
      setFilteredUsers(response.users || []);
    } catch (err: any) {
      console.error('Failed to fetch admin users:', err);
      setError(err.message || 'Unable to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchUsers();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const queryText = searchQuery.toLowerCase();
    setFilteredUsers(
      users.filter((user) =>
        user.name.toLowerCase().includes(queryText) ||
        user.email.toLowerCase().includes(queryText) ||
        user.rollNumber?.toLowerCase().includes(queryText)
      )
    );
  }, [searchQuery, users]);

  const performUserAction = async (id: string, action: 'verify' | 'ban' | 'unban' | 'delete') => {
    try {
      const token = await getIdToken();
      if (!token) throw new Error('Authentication is required');

      await adminFetch(`/admin/users/${id}/action`, token, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      void fetchUsers();
      setSelectedUser(null);
    } catch (err: any) {
      Alert.alert('Action failed', err.message || 'Unable to update user');
    }
  };

  const confirmAction = (user: AdminUser, action: 'verify' | 'ban' | 'unban' | 'delete') => {
    const actionDisplay = {
      verify: 'Verify',
      ban: 'Ban',
      unban: 'Unban',
      delete: 'Delete',
    } as const;

    Alert.alert(
      `${actionDisplay[action]} user`,
      `Are you sure you want to ${actionDisplay[action].toLowerCase()} ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionDisplay[action],
          style: action === 'delete' ? 'destructive' : 'default',
          onPress: () => void performUserAction(user.id, action),
        },
      ]
    );
  };

  const renderUser = ({ item }: { item: AdminUser }) => (
    <TouchableOpacity
      style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => setSelectedUser(item)}
    >
      <View style={styles.userHeader}>
        <Text style={[styles.userName, { color: colors.textPrimary }]}>{item.name}</Text>
        <Text style={[styles.userStatus, { color: item.status === 'banned' ? '#f87171' : '#34d399' }]}>
          {item.status === 'banned' ? 'Banned' : 'Active'}
        </Text>
      </View>
      <Text style={[styles.userDetail, { color: colors.textSecondary }]}>{item.email}</Text>
      <Text style={[styles.userDetail, { color: colors.textSecondary }]}>{item.university || 'No university set'}</Text>
      <View style={styles.badgeRow}>
        <View style={[styles.smallBadge, { backgroundColor: item.isVerified ? '#22c55e20' : '#f9731670' }]}> 
          <MaterialIcons name={item.isVerified ? 'check-circle' : 'hourglass-top'} size={14} color={item.isVerified ? '#22c55e' : '#f97316'} />
          <Text style={[styles.badgeText, { color: colors.textSecondary }]}>{item.isVerified ? 'Verified' : 'Unverified'}</Text>
        </View>
        <View style={[styles.smallBadge, { backgroundColor: '#3b82f620' }]}> 
          <Text style={[styles.badgeText, { color: colors.textSecondary }]}>{item.verificationStatus}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}> 
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
        <MaterialIcons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Search by name, email, or roll number"
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {error ? (
        <View style={[styles.errorBox, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={[styles.errorText, { color: colors.textPrimary }]}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void fetchUsers();
            }}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="person-off" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No users found</Text>
          </View>
        }
      />

      {selectedUser ? (
        <View style={styles.modalOverlay}> 
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>User details</Text>
              <TouchableOpacity onPress={() => setSelectedUser(null)}>
                <MaterialIcons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Name</Text>
            <Text style={[styles.modalValue, { color: colors.textPrimary }]}>{selectedUser.name}</Text>
            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Email</Text>
            <Text style={[styles.modalValue, { color: colors.textPrimary }]}>{selectedUser.email}</Text>
            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>University</Text>
            <Text style={[styles.modalValue, { color: colors.textPrimary }]}>{selectedUser.university || 'Unknown'}</Text>
            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Role</Text>
            <Text style={[styles.modalValue, { color: colors.textPrimary }]}>{selectedUser.role}</Text>
            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Joined</Text>
            <Text style={[styles.modalValue, { color: colors.textPrimary }]}>{selectedUser.memberSince || 'Unknown'}</Text>
            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Status</Text>
            <Text style={[styles.modalValue, { color: colors.textPrimary }]}>{selectedUser.status}</Text>

            <View style={styles.modalButtonRow}>
              {selectedUser.status === 'banned' ? (
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#2563eb' }]} onPress={() => confirmAction(selectedUser, 'unban')}>
                  <Text style={styles.modalButtonText}>Unban</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#ef4444' }]} onPress={() => confirmAction(selectedUser, 'ban')}>
                  <Text style={styles.modalButtonText}>Ban</Text>
                </TouchableOpacity>
              )}
              {!selectedUser.isVerified && (
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#22c55e' }]} onPress={() => confirmAction(selectedUser, 'verify')}>
                  <Text style={styles.modalButtonText}>Verify</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#6b7280' }]} onPress={() => confirmAction(selectedUser, 'delete')}>
                <Text style={styles.modalButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}
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
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    margin: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
  },
  errorBox: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  userCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
  },
  userStatus: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  userDetail: {
    fontSize: 13,
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  smallBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    marginLeft: 6,
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 14,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalContent: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
  },
  modalValue: {
    fontSize: 14,
    marginTop: 4,
  },
  modalButtonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    minWidth: 100,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '800',
  },
});
