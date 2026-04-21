import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  SafeAreaView, Platform, StatusBar, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

import { API_BASE_URL } from '@/constants/Config';
import { db } from '@/src/config/firebase';
import { collection, query, orderBy, limit, getDocs, onSnapshot, where } from 'firebase/firestore';
import { formatCurrency } from '@/src/utils/format';

const CATEGORIES = [
  { icon: 'menu-book', title: 'Books', id: 'books', color: '#93c5fd', bg: '#1e3a5f' },
  { icon: 'devices', title: 'Tech', id: 'tech', color: '#d8b4fe', bg: '#4c1d95' },
  { icon: 'science', title: 'Lab Gear', id: 'lab', color: '#5eead4', bg: '#0f3d38' },
  { icon: 'chair', title: 'Furniture', id: 'furniture', color: '#fdba74', bg: '#431407' },
  { icon: 'grid-view', title: 'More', id: 'all', color: '#94a3b8', bg: '#1e293b' },
];

export default function MarketplaceHome() {
  const router = useRouter();
  const { colors, resolvedTheme } = useTheme();
  const { user, unreadNotifsCount } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // 1. Real-time listener for "New Arrivals" (5 most recent items)
    const q = query(
      collection(db, 'listings'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const firestoreListings = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setListings(firestoreListings);
        setLoading(false);
      } catch (err) {
        console.error("Error processing listings snapshot:", err);
      }
    }, (error) => {
      console.error("Home onSnapshot error:", error);
      setLoading(false);
      fetchLatestListings();
    });

    return () => unsubscribe();
  }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLatestListings();
    setRefreshing(false);
  };

  const fetchLatestListings = async () => {
    try {
      setLoading(true);

      // Fetch once from Firestore (optimized for Spark/Free tier)
      const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'), limit(10));
      const querySnapshot = await getDocs(q);

      const firestoreListings = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // If Firestore is empty, fallback to backend API for demo purposes
      if (firestoreListings.length === 0) {
        const response = await fetch(`${API_BASE_URL}/listings`);
        const data = await response.json();
        setListings(data);
      } else {
        setListings(firestoreListings);
      }
    } catch (error) {
      console.error('Error fetching homepage listings:', error);
      // Final fallback to backend API
      try {
        const response = await fetch(`${API_BASE_URL}/listings`);
        const data = await response.json();
        setListings(data);
      } catch (e) { }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/categories?search=${encodeURIComponent(searchQuery.trim())}` as any);
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
      }}
    >
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />

      {/* Header */}
      <View style={{
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: colors.border,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: colors.surface,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MaterialIcons name="school" size={28} color={colors.primary} />
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.textPrimary }}>
            Campus Trade
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {/* Notification Bell */}
          <TouchableOpacity
            onPress={() => { router.push('/notifications' as any); }}
            style={{ position: 'relative', padding: 8 }}
          >
            <MaterialIcons name="notifications" size={24} color={colors.textSecondary} />
            {unreadNotifsCount > 0 && (
              <View style={{
                position: 'absolute', top: 6, right: 6,
                minWidth: 16, height: 16, borderRadius: 8,
                backgroundColor: '#ef4444',
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 1.5, borderColor: colors.surface,
                paddingHorizontal: 3,
              }}>
                <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>
                  {unreadNotifsCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Avatar */}
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile')}
            style={{
              width: 36, height: 36, borderRadius: 18, overflow: 'hidden',
              borderWidth: 2, borderColor: colors.primary,
              backgroundColor: colors.surfaceHighlight,
              alignItems: 'center', justifyContent: 'center'
            }}
          >
            <Image
              source={{ uri: user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random` }}
              style={{ width: '100%', height: '100%' }}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>

          {/* Search */}
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: colors.inputBg,
            borderWidth: 1, borderColor: colors.inputBorder,
            borderRadius: 14, paddingHorizontal: 12,
            paddingVertical: Platform.OS === 'ios' ? 11 : 0,
            marginBottom: 24,
          }}>
            <MaterialIcons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={{ flex: 1, marginLeft: 8, fontSize: 14, color: colors.textPrimary }}
              placeholder="Search textbooks, electronics..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity onPress={handleSearch}>
              <MaterialIcons name="tune" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Categories */}
          <View style={{ marginBottom: 28 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary }}>
                Categories
              </Text>
              <TouchableOpacity onPress={() => router.push('/categories' as any)}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>
                  See All →
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingRight: 8 }}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => router.push(`/categories?category=${cat.id}` as any)}
                  style={{ alignItems: 'center', gap: 6 }}
                >
                  <View style={{
                    width: 64, height: 64, borderRadius: 18,
                    backgroundColor: cat.bg,
                    alignItems: 'center', justifyContent: 'center',
                    borderWidth: 1, borderColor: colors.border,
                  }}>
                    <MaterialIcons name={cat.icon as any} size={28} color={cat.color} />
                  </View>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary }}>
                    {cat.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>



          {/* New Arrivals */}
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary }}>
                New Arrivals
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/categories' as any)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 4,
                  backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 5,
                  borderRadius: 8, borderWidth: 1, borderColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>Sort by</Text>
                <MaterialIcons name="expand-more" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (() => {
              const filtered = listings.filter(item => 
                item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.category?.toLowerCase().includes(searchQuery.toLowerCase())
              );

              if (filtered.length === 0) {
                return (
                  <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                    <MaterialIcons name="search-off" size={48} color={colors.textMuted} />
                    <Text style={{ color: colors.textSecondary, marginTop: 12, textAlign: 'center' }}>
                      No arrivals match "{searchQuery}"
                    </Text>
                    <TouchableOpacity onPress={() => setSearchQuery('')} style={{ marginTop: 8 }}>
                      <Text style={{ color: colors.primary, fontWeight: '700' }}>Clear Search</Text>
                    </TouchableOpacity>
                  </View>
                );
              }

              return (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                  {filtered.slice(0, 5).map(item => (
                    <ProductCard
                      key={item.id}
                      title={item.title}
                      department={`${item.category} • ${item.createdAt?.toMillis ? new Date(item.createdAt.toMillis()).toLocaleDateString() : 'Just now'}`}
                      price={formatCurrency(item.price)}
                      condition={item.condition ? `Condition: ${item.condition}` : null}
                      image={
                        item.imageUrl || item.image || (item.images && item.images.length > 0 ? item.images[0] : null)
                      }
                      onPress={() => router.push(`/listing/${item.id}` as any)}
                      colors={colors}
                      itemId={item.id}
                    />
                  ))}
                </View>
              );
            })()}
          </View>

          {/* Safe Trading Tip */}
          <View style={{
            flexDirection: 'row', alignItems: 'flex-start', gap: 12,
            padding: 16, marginTop: 24, borderRadius: 14,
            backgroundColor: resolvedTheme === 'dark' ? 'rgba(30,58,138,0.25)' : 'rgba(219,234,254,0.8)',
            borderWidth: 1, borderColor: resolvedTheme === 'dark' ? 'rgba(30,58,138,0.5)' : '#bfdbfe',
          }}>
            <MaterialIcons name="security" size={24} color="#60a5fa" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#60a5fa', marginBottom: 4 }}>
                Safe Trading Tip
              </Text>
              <Text style={{ fontSize: 12, color: resolvedTheme === 'dark' ? '#93c5fd' : '#1d4ed8', lineHeight: 18 }}>
                Always meet in safe, public campus locations like the library or student center when trading items.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProductCard({ title, department, price, condition, image, onPress, colors, itemId }: any) {
  const [loading, setLoading] = useState(true);
  const { user, toggleSavedItem } = useAuth();
  const isSaved = (user?.savedItems || []).includes(itemId);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: '48%', backgroundColor: colors.surface,
        borderRadius: 14, borderWidth: 1, borderColor: colors.border,
        overflow: 'hidden', marginBottom: 14,
      }}
    >
      <View style={{ aspectRatio: 1, backgroundColor: colors.surfaceHighlight, alignItems: 'center', justifyContent: 'center' }}>
        {loading && image && (
          <ActivityIndicator size="small" color={colors.primary} style={{ position: 'absolute', zIndex: 1 }} />
        )}
        {image ? (
          <Image 
            source={{ uri: image }} 
            style={{ width: '100%', height: '100%', opacity: loading ? 0 : 0.9 }} 
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
          />
        ) : (
          <View style={{ alignItems: 'center', gap: 4 }}>
            <MaterialIcons name="image-not-supported" size={32} color={colors.textMuted} />
            <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '600' }}>No Image</Text>
          </View>
        )}
        <TouchableOpacity 
          onPress={() => toggleSavedItem(itemId)}
          style={{
            position: 'absolute', top: 8, right: 8,
            backgroundColor: isSaved ? colors.primary : 'rgba(0,0,0,0.4)', 
            borderRadius: 20, padding: 6,
          }}
        >
          <MaterialIcons name={isSaved ? "favorite" : "favorite-border"} size={16} color="white" />
        </TouchableOpacity>
        {condition && (
          <View style={{
            position: 'absolute', bottom: 8, left: 8,
            paddingHorizontal: 8, paddingVertical: 4,
            backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 6,
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
          }}>
            <Text style={{ fontSize: 9, color: 'white', fontWeight: '600' }} numberOfLines={1}>
              {condition}
            </Text>
          </View>
        )}
      </View>
      <View style={{ padding: 10 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 }} numberOfLines={1}>
          {title}
        </Text>
        <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 6 }} numberOfLines={1}>
          {department}
        </Text>
        <Text style={{ fontSize: 16, fontWeight: '800', color: colors.primary }}>{price}</Text>
      </View>
    </TouchableOpacity>
  );
}
