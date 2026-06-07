import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { adminFetch } from '@/src/utils/adminApi';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';

type AdminListing = {
  id: string;
  title: string;
  category?: string;
  condition?: string;
  price?: number;
  isSold?: boolean;
  sellerName?: string;
  sellerId?: string;
  images?: string[];
  createdAt?: string;
};

export default function AdminListings() {
  const { colors } = useTheme();
  const { getIdToken } = useAuth();
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'sold'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = async () => {
    try {
      setError(null);
      const token = await getIdToken();
      if (!token) throw new Error('Authentication required');
      const response = await adminFetch<{ listings: AdminListing[] }>('/admin/listings', token);
      setListings(response.listings || []);
    } catch (err: any) {
      console.error('Failed to load listings', err);
      setError(err.message || 'Unable to load listings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchListings();
  }, []);

  const filteredListings = listings.filter((listing) => {
    if (filter === 'active' && listing.isSold) return false;
    if (filter === 'sold' && !listing.isSold) return false;
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return (
      listing.title?.toLowerCase().includes(query) ||
      listing.category?.toLowerCase().includes(query) ||
      listing.sellerName?.toLowerCase().includes(query) ||
      listing.sellerId?.toLowerCase().includes(query)
    );
  });

  const updateListingStatus = async (id: string, action: 'sold' | 'delete') => {
    try {
      const token = await getIdToken();
      if (!token) throw new Error('Authentication required');
      await adminFetch(`/admin/listings/${id}/action`, token, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      void fetchListings();
    } catch (err: any) {
      Alert.alert('Action failed', err.message || 'Unable to update listing');
    }
  };

  const confirmListingAction = (listing: AdminListing, action: 'sold' | 'delete') => {
    const actionLabel = action === 'sold' ? 'Mark as sold' : 'Delete listing';
    const description =
      action === 'sold'
        ? `Mark "${listing.title}" as sold?`
        : `Delete "${listing.title}"? This cannot be undone.`;

    Alert.alert(actionLabel, description, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: action === 'sold' ? 'Mark Sold' : 'Delete',
        style: action === 'delete' ? 'destructive' : 'default',
        onPress: () => void updateListingStatus(listing.id, action),
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <StatusBar barStyle={colors.statusBarStyle} />

      <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <MaterialIcons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search title, category, or seller..."
            placeholderTextColor={colors.textSecondary}
            style={[styles.searchInput, { color: colors.textPrimary }]}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialIcons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.filterBar}>
          {(['all', 'active', 'sold'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[
                styles.filterButton,
                { backgroundColor: filter === f ? colors.primary : colors.surfaceHighlight, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.filterText, { color: filter === f ? '#fff' : colors.textPrimary }]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.countText, { color: colors.textSecondary }]}>Showing {filteredListings.length} listings</Text>
      </View>

      {error ? (
        <View style={[styles.errorBox, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={[styles.errorText, { color: colors.textPrimary }]}>{error}</Text>
        </View>
      ) : null}

      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void fetchListings(); }} colors={[colors.primary]} />
        }
      >
        {filteredListings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="inventory" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No listings match your filter.</Text>
          </View>
        ) : (
          filteredListings.map((listing) => {
            const imageUri = listing.images?.[0] || undefined;
            return (
              <View key={listing.id} style={[styles.listingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
                  {imageUri ? (
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.listingImage}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.imagePlaceholder, { backgroundColor: colors.surfaceHighlight }]}> 
                      <MaterialIcons name="image-not-supported" size={32} color={colors.textSecondary} />
                    </View>
                  )}
                <View style={styles.listingInfo}>
                  <View style={styles.listingHeader}>
                    <Text style={[styles.listingTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                      {listing.title}
                    </Text>
                    <Text style={[styles.listingPrice, { color: colors.primary }]}>Rs {listing.price ?? 'N/A'}</Text>
                  </View>
                  <Text style={[styles.listingMeta, { color: colors.textSecondary }]}>{listing.category || 'No category'} • {listing.condition || 'Unknown'}</Text>
                  <Text style={[styles.listingMeta, { color: colors.textSecondary }]}>Seller: {listing.sellerName || listing.sellerId || 'Unknown'}</Text>
                  <View style={styles.buttonRow}>
                    {!listing.isSold ? (
                      <TouchableOpacity style={styles.actionButtonSold} onPress={() => confirmListingAction(listing, 'sold')}>
                        <Text style={styles.actionButtonText}>Mark Sold</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={[styles.statusTag, { backgroundColor: colors.surfaceHighlight }]}> 
                        <Text style={[styles.statusTagText, { color: colors.textSecondary }]}>Sold</Text>
                      </View>
                    )}
                    <TouchableOpacity style={styles.actionButtonDelete} onPress={() => confirmListingAction(listing, 'delete')}>
                      <Text style={styles.actionButtonTextDelete}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
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
  header: {
    padding: 16,
    paddingBottom: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
  },
  filterBar: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  countText: {
    marginTop: 12,
    fontSize: 13,
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
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  listingCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  listingImage: {
    width: 96,
    height: 96,
    borderRadius: 16,
    backgroundColor: '#1f2937',
  },
  imagePlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listingInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  listingTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  listingPrice: {
    fontSize: 15,
    fontWeight: '800',
  },
  listingMeta: {
    fontSize: 12,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  actionButtonSold: {
    backgroundColor: '#10b98120',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actionButtonDelete: {
    backgroundColor: '#ef444420',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actionButtonText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '700',
  },
  actionButtonTextDelete: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
  statusTag: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusTagText: {
    fontSize: 12,
    fontWeight: '700',
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