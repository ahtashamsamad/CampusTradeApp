import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/src/config/firebase';
import { collection, query, where, getDocs, doc, getDoc, documentId } from 'firebase/firestore';
import { API_BASE_URL } from '@/constants/Config';
import { formatCurrency } from '@/src/utils/format';

export default function SavedScreen() {
    const { colors } = useTheme();
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user, toggleSavedItem } = useAuth();
    const [savedItems, setSavedItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('Newest');
    const [showSort, setShowSort] = useState(false);

    useEffect(() => {
        fetchSavedItems();
    }, [user?.savedItems]);

    const fetchSavedItems = async () => {
        if (!user || !user.savedItems || user.savedItems.length === 0) {
            setSavedItems([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const savedIds = user.savedItems;
            
            // Fetch documents in parallel
            const fetches = savedIds.map(id => getDoc(doc(db, 'listings', id)));
            const snaps = await Promise.all(fetches);
            
            const fetchedListings = snaps
                .filter(snap => snap.exists())
                .map(snap => ({
                    id: snap.id,
                    ...snap.data()
                }));
            
            setSavedItems(fetchedListings);
        } catch (error) {
            console.error('Error fetching saved items:', error);
            setSavedItems([]);
        } finally {
            setLoading(false);
        }
    };

    const sortedItems = [...savedItems].sort((a, b) => {
        if (sortBy === 'Price: Low–High') return (a.price || 0) - (b.price || 0);
        if (sortBy === 'Price: High–Low') return (b.price || 0) - (a.price || 0);
        // Default: Newest (assuming createdAt exists)
        const dateA = a.createdAt?.seconds ? a.createdAt.seconds : new Date(a.createdAt || 0).getTime();
        const dateB = b.createdAt?.seconds ? b.createdAt.seconds : new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
    });

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
            {/* Header */}
            <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                    <Text style={{ fontSize: 20, fontWeight: '800', color: colors.textPrimary }}>My Wishlist</Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '500' }}>{savedItems.length} items saved</Text>
                </View>
                <View style={{ position: 'relative' }}>
                    <TouchableOpacity 
                        onPress={() => setShowSort(!showSort)}
                        style={{ padding: 8, borderRadius: 20, backgroundColor: colors.surfaceHighlight, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                    >
                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary }}>{sortBy}</Text>
                        <MaterialIcons name="tune" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>

                    {showSort && (
                        <View style={{
                            position: 'absolute', top: 44, right: 0, zIndex: 100,
                            backgroundColor: colors.surface, borderRadius: 12, overflow: 'hidden',
                            borderWidth: 1, borderColor: colors.border, minWidth: 160,
                            shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5
                        }}>
                            {['Newest', 'Price: Low–High', 'Price: High–Low'].map(opt => (
                                <TouchableOpacity
                                    key={opt}
                                    onPress={() => { setSortBy(opt); setShowSort(false); }}
                                    style={{ padding: 12, backgroundColor: sortBy === opt ? colors.primary + '10' : 'transparent', borderBottomWidth: 1, borderBottomColor: colors.border }}
                                >
                                    <Text style={{ color: sortBy === opt ? colors.primary : colors.textPrimary, fontWeight: '600' }}>{opt}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            </View>

            <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Filter Tabs (Mock) */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
                    <FilterTab title="All Items" isActive={true} colors={colors} />
                    <FilterTab title="Books" isActive={false} colors={colors} />
                    <FilterTab title="Electronics" isActive={false} colors={colors} />
                    <FilterTab title="Furniture" isActive={false} colors={colors} />
                </ScrollView>

                {loading ? (
                    <View style={{ paddingVertical: 100, alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : savedItems.length === 0 ? (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 }}>
                        <MaterialIcons name="favorite-border" size={56} color={colors.textMuted} />
                        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPrimary }}>Your wishlist is empty</Text>
                        <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 40 }}>
                            Save items you're interested in to keep track of them here.
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)')}
                            style={{ backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 12 }}
                        >
                            <Text style={{ color: 'white', fontWeight: '700' }}>Explore Marketplace</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                        {sortedItems.map((item) => (
                            <WishlistItem
                                key={item.id}
                                itemId={item.id}
                                title={item.title}
                                price={formatCurrency(item.price)}
                                status={item.status || 'Available'}
                                image={item.images?.[0] || item.imageUrl || item.image}
                                onPress={() => router.push(`/listing/${item.id}` as any)}
                                onRemove={() => toggleSavedItem(item.id)}
                                colors={colors}
                            />
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

function FilterTab({ title, isActive, colors }: any) {
    return (
        <TouchableOpacity style={{
            paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10,
            backgroundColor: isActive ? colors.primary : colors.surface,
            borderWidth: 1, borderColor: isActive ? colors.primary : colors.border,
        }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: isActive ? '#fff' : colors.textSecondary }}>{title}</Text>
        </TouchableOpacity>
    );
}

function WishlistItem({ title, price, status, image, onPress, onRemove, colors }: any) {
    const isSold = status === 'Sold' || status === 'sold';
    return (
        <TouchableOpacity
            onPress={onPress}
            style={{ width: '48%', backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: 16, opacity: isSold ? 0.6 : 1 }}
        >
            <View style={{ aspectRatio: 1, backgroundColor: colors.surfaceHighlight }}>
                <Image source={{ uri: image }} style={{ width: '100%', height: '100%', backgroundColor: colors.surfaceHighlight }} contentFit="cover" />
                <View style={{ position: 'absolute', top: 8, right: 8 }}>
                    <TouchableOpacity 
                        onPress={onRemove}
                        style={{ padding: 6, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 }}
                    >
                        <MaterialIcons name="close" size={16} color="white" />
                    </TouchableOpacity>
                </View>
                {isSold && (
                    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 4 }}>
                        <Text style={{ textAlign: 'center', color: 'white', fontSize: 10, fontWeight: '700' }}>SOLD</Text>
                    </View>
                )}
            </View>
            <View style={{ padding: 10 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 }} numberOfLines={1}>{title}</Text>
                <Text style={{ fontSize: 15, fontWeight: '800', color: colors.primary }}>{price}</Text>
            </View>
        </TouchableOpacity>
    );
}
