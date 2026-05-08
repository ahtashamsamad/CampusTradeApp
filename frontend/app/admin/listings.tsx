import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { db } from '@/src/config/firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';

export default function AdminListings() {
    const router = useRouter();
    const { colors } = useTheme();
    const [listings, setListings] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'sold'>('all');

    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'listings'), (snap) => {
            const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            // Sort by newest
            arr.sort((a: any, b: any) => {
                const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
                const db2 = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
                return db2.getTime() - da.getTime();
            });
            setListings(arr);
        });
        return () => unsub();
    }, []);

    const filtered = listings.filter(l => {
        // Tab filtering
        if (filter === 'active' && l.isSold) return false;
        if (filter === 'sold' && !l.isSold) return false;

        // Search filtering
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            l.title?.toLowerCase().includes(s) || 
            l.category?.toLowerCase().includes(s) || 
            l.sellerId?.toLowerCase().includes(s) // Fallback since we removed async name fetch
        );
    });

    const handleMarkSold = (listing: any) => {
        Alert.alert(
            'Mark as Sold',
            `Mark "${listing.title}" as sold?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Mark Sold',
                    onPress: async () => {
                        try {
                            await updateDoc(doc(db, 'listings', listing.id), { isAvailable: false, isSold: true });
                        } catch (e) {
                            Alert.alert('Error', 'Failed to update listing');
                        }
                    }
                }
            ]
        );
    };

    const handleDelete = (listing: any) => {
        Alert.alert(
            'Delete Listing',
            `Delete "${listing.title}"? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'listings', listing.id));
                        } catch (e) {
                            Alert.alert('Error', 'Failed to delete listing');
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
            <StatusBar barStyle={colors.statusBarStyle} />
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface }}>
                <TouchableOpacity onPress={() => router.back()} style={{ width: 40, alignItems: 'flex-start' }}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>Manage Listings</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={{ padding: 16, paddingBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, height: 44, marginBottom: 12 }}>
                    <MaterialIcons name="search" size={20} color={colors.textSecondary} />
                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Search title, category, or seller..."
                        placeholderTextColor={colors.textSecondary}
                        style={{ flex: 1, color: colors.textPrimary, marginLeft: 8, fontSize: 15 }}
                    />
                    {search ? <TouchableOpacity onPress={() => setSearch('')}><MaterialIcons name="close" size={20} color={colors.textSecondary} /></TouchableOpacity> : null}
                </View>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                    {(['all', 'active', 'sold'] as const).map(f => (
                        <TouchableOpacity
                            key={f}
                            onPress={() => setFilter(f)}
                            style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: filter === f ? colors.primary : colors.surfaceHighlight, borderWidth: filter === f ? 0 : 1, borderColor: colors.border }}
                        >
                            <Text style={{ color: filter === f ? '#fff' : colors.textPrimary, fontSize: 13, fontWeight: '600', textTransform: 'capitalize' }}>{f}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 12 }}>Showing {filtered.length} listings</Text>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 40 }}>
                {filtered.map(listing => {
                    const img = listing.images?.[0] || listing.imageUrl;
                    return (
                        <View key={listing.id} style={{ backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 12, flexDirection: 'row', gap: 12 }}>
                            <Image source={{ uri: img }} style={{ width: 80, height: 80, borderRadius: 12, backgroundColor: colors.surfaceHighlight }} />
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary, flex: 1 }} numberOfLines={1}>{listing.title}</Text>
                                    <Text style={{ fontSize: 15, fontWeight: '800', color: colors.primary, marginLeft: 8 }}>Rs {listing.price}</Text>
                                </View>
                                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{listing.category} • {listing.condition}</Text>
                                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>Seller ID: {listing.sellerId?.slice(0, 8)}...</Text>
                                
                                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                                    {!listing.isSold && (
                                        <TouchableOpacity onPress={() => handleMarkSold(listing)} style={{ backgroundColor: '#10b98120', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}>
                                            <Text style={{ color: '#10b981', fontSize: 12, fontWeight: '700' }}>Mark Sold</Text>
                                        </TouchableOpacity>
                                    )}
                                    {listing.isSold && (
                                        <View style={{ backgroundColor: colors.surfaceHighlight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}>
                                            <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700' }}>Sold</Text>
                                        </View>
                                    )}
                                    <TouchableOpacity onPress={() => handleDelete(listing)} style={{ backgroundColor: '#ef444420', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}>
                                        <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '700' }}>Delete</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
    );
}
