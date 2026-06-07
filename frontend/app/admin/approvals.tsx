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
import { Image } from 'expo-image';

type PendingListing = {
  id: string;
  title: string;
  price?: number;
  category?: string;
  condition?: string;
  status?: string;
  sellerName?: string;
  sellerId?: string;
  images?: string[];
  description?: string;
  postedAt?: string;
};

export default function ApprovalsScreen() {
  const { colors } = useTheme();
  const { getIdToken } = useAuth();
  const [listings, setListings] = useState<PendingListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingListings = async () => {
    try {
      setError(null);
      const token = await getIdToken();
      if (!token) throw new Error('Authentication required');
      const response = await adminFetch<{ listings: PendingListing[] }>('/admin/listings', token);
      setListings(response.listings.filter((listing) => listing.status === 'pending') || []);
    } catch (err: any) {
      console.error('Failed to load pending listings', err);
      setError(err.message || 'Unable to load pending listings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchPendingListings();
  }, []);

  const performAction = async (listingId: string, action: 'approve' | 'reject') => {
    try {
      const token = await getIdToken();
      if (!token) throw new Error('Authentication required');

      await adminFetch(`/admin/listings/${listingId}/action`, token, {
        method: 'POST',
        body: JSON.stringify({ action: action === 'approve' ? 'approve' : 'reject' }),
      });
      void fetchPendingListings();
    } catch (err: any) {
      Alert.alert('Action failed', err.message || 'Unable to update listing');
    }
  };

  const confirmAction = (listing: PendingListing, action: 'approve' | 'reject') => {
    const title = action === 'approve' ? 'Approve listing' : 'Reject listing';
    const description = action === 'approve'
      ? `Approve "${listing.title}" for publishing?`
      : `Reject "${listing.title}"? This will remove it from the pending queue.`;

    Alert.alert(title, description, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: action === 'approve' ? 'Approve' : 'Reject',
        style: action === 'reject' ? 'destructive' : 'default',
        onPress: () => void performAction(listing.id, action),
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}> 
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading pending listings...</Text>
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
        data={listings}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void fetchPendingListings();
            }}
            colors={[colors.primary]}
          />
        }
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.listingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            {item.images?.[0] ? (
              <Image source={{ uri: item.images[0] }} style={styles.listingImage} contentFit="cover" />
            ) : (
              <View style={[styles.imagePlaceholder, { backgroundColor: colors.surfaceHighlight }]}>
                <MaterialIcons name="image-not-supported" size={32} color={colors.textSecondary} />
              </View>
            )}
            <View style={styles.listingContent}>
              <View style={styles.listingHeader}>
                <Text style={[styles.listingTitle, { color: colors.textPrimary }]} numberOfLines={1}>{item.title}</Text>
                <Text style={[styles.listingPrice, { color: colors.primary }]}>Rs {item.price ?? 'N/A'}</Text>
              </View>
              <Text style={[styles.listingCategory, { color: colors.textSecondary }]}>{item.category || 'Uncategorized'}</Text>
              <Text style={[styles.sellerName, { color: colors.textSecondary }]}>Seller: {item.sellerName || item.sellerId || 'Unknown'}</Text>
              <Text style={[styles.listingDescription, { color: colors.textSecondary }]} numberOfLines={2}>{item.description || 'No description available.'}</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity style={[styles.approveButton, { backgroundColor: '#22c55e' }]} onPress={() => confirmAction(item, 'approve')}>
                  <MaterialIcons name="check" size={18} color="#fff" />
                  <Text style={styles.buttonText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.rejectButton, { backgroundColor: '#ef4444' }]} onPress={() => confirmAction(item, 'reject')}>
                  <MaterialIcons name="close" size={18} color="#fff" />
                  <Text style={styles.buttonText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="done-all" size={48} color={colors.primary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>All pending items have been reviewed!</Text>
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
  listingCard: {
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  listingImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#1f2937',
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listingContent: {
    padding: 14,
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  listingPrice: {
    fontSize: 15,
    fontWeight: '800',
  },
  listingCategory: {
    fontSize: 12,
    marginBottom: 6,
  },
  sellerName: {
    fontSize: 12,
    marginBottom: 8,
  },
  listingDescription: {
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  approveButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  rejectButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  errorBox: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
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
    marginTop: 10,
    fontSize: 14,
  },
});
