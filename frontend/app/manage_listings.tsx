import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar, ActivityIndicator, Alert, TextInput } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/src/config/firebase';

import { API_BASE_URL } from '@/constants/Config';
import { formatCurrency } from '@/src/utils/format';

export default function ManageListingsScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const { user } = useAuth();
    const [listings, setListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('Active');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchListings();
    }, [user, activeFilter, searchQuery]);

    const fetchListings = async () => {
        if (!user) return;
        try {
            setLoading(true);
            
            const q = query(
                collection(db, 'listings'),
                where('userId', '==', user.id)
            );
            
            const querySnapshot = await getDocs(q);
            const allFetched = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data() as any
            }));

            // Filter client-side
            const currentStatus = activeFilter.toLowerCase();
            const filtered = allFetched.filter((item: any) => {
                const itemStatus = (item.status || 'active').toLowerCase();
                const matchesStatus = itemStatus === currentStatus;
                const matchesSearch = !searchQuery || 
                    item.title?.toLowerCase().includes(searchQuery.toLowerCase());
                return matchesStatus && matchesSearch;
            });

            // Sort them client-side by createdAt descending
            filtered.sort((a: any, b: any) => {
                const dateA = a.createdAt?.toMillis?.() || (a.createdAt instanceof Date ? a.createdAt.getTime() : 0);
                const dateB = b.createdAt?.toMillis?.() || (b.createdAt instanceof Date ? b.createdAt.getTime() : 0);
                return dateB - dateA;
            });
            
            setListings(filtered);
        } catch (error: any) {
            console.error("Error fetching listings:", error);
            setListings([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-4 pt-6 bg-background-dark z-20">
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 rounded-full border border-surface-highlight">
                        <MaterialIcons name="arrow-back" size={20} color="#f8fafc" />
                    </TouchableOpacity>
                    <Text className="text-2xl font-bold tracking-tight text-white flex-1">My Listings</Text>
                </View>
                <TouchableOpacity 
                    onPress={() => router.push('/(tabs)/create' as any)}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-primary shadow-lg shadow-primary/30"
                >
                    <MaterialIcons name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>

            {/* Search and Filter Tabs */}
            <View className="px-4 py-3 bg-background-dark/95 z-10 gap-3">
                <View style={{
                    flexDirection: 'row', alignItems: 'center',
                    backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border,
                    borderRadius: 12, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 10 : 0
                }}>
                    <MaterialIcons name="search" size={20} color={colors.textSecondary} />
                    <TextInput
                        placeholder="Search my listings..."
                        placeholderTextColor={colors.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={{ flex: 1, marginLeft: 8, fontSize: 14, color: colors.textPrimary }}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <MaterialIcons name="close" size={18} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>

                <View className="flex-row p-1 bg-surface-dark rounded-lg border border-surface-highlight">
                    <FilterTab title="Active" isActive={activeFilter === 'Active'} onPress={() => setActiveFilter('Active')} />
                    <FilterTab title="Pending" isActive={activeFilter === 'Pending'} onPress={() => setActiveFilter('Pending')} />
                    <FilterTab title="Sold" isActive={activeFilter === 'Sold'} onPress={() => setActiveFilter('Sold')} />
                </View>
            </View>

            {/* Content List */}
            <ScrollView className="flex-1 px-4 space-y-4 pt-2" contentContainerStyle={{ paddingBottom: 100 }}>

                {loading ? (
                    <View className="flex-1 items-center justify-center py-20">
                        <ActivityIndicator size="large" color="#6366f1" />
                        <Text className="text-text-secondary mt-4">Loading your listings...</Text>
                    </View>
                ) : !listings || listings.length === 0 ? (
                    <View className="flex-1 items-center justify-center py-20">
                        <MaterialIcons name="inventory-2" size={48} color="#334155" />
                        <Text className="text-text-secondary mt-4 text-center">You {"don't"} have any listings yet.</Text>
                        <TouchableOpacity
                            className="mt-6 bg-primary px-6 py-2 rounded-lg"
                            onPress={() => router.push('/(tabs)/create' as any)}
                        >
                            <Text className="text-white font-semibold">Create Listing</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View className="gap-4">
                        {listings?.map?.((item) => (
                            <ListingItem
                                key={item.id}
                                id={item.id}
                                title={item?.title}
                                price={formatCurrency(item?.price)}
                                time={(() => {
                                    try {
                                        const date = item?.createdAt?.toDate ? item.createdAt.toDate() : new Date(item?.createdAt || Date.now());
                                        return date.toLocaleDateString();
                                    } catch (e) { return 'Recently'; }
                                })()}
                                views="0"
                                image={item?.images?.[0] || item?.imageUrl || item?.image}
                                status={item?.status}
                                onDelete={fetchListings}
                            />
                        ))}
                    </View>
                )}

                {/* Stats Summary */}
                {!loading && listings.length > 0 && (
                    <View className="px-4 py-8 items-center mb-8">
                        <Text className="text-sm text-text-secondary">You have {listings.length} active listings visible to students.</Text>
                    </View>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

function FilterTab({ title, isActive, onPress }: { title: string, isActive: boolean, onPress: () => void }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            className={`flex-1 items-center justify-center py-2 px-3 rounded ${isActive ? 'bg-surface-highlight' : ''}`}
        >
            <Text className={`text-sm font-medium ${isActive ? 'text-white' : 'text-text-secondary'}`}>{title}</Text>
        </TouchableOpacity>
    );
}

function ListingItem({ id, title, price, time, views, image, onDelete, status }: any) {
    const router = useRouter();
    const handleDelete = async () => {
        Alert.alert('Delete Listing', 'Are you sure you want to delete this listing?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteDoc(doc(db, 'listings', id));
                        onDelete();
                    } catch (e) {
                        console.error('Error deleting listing:', e);
                    }
                }
            }
        ]);
    };

    const handleMarkSold = async () => {
        try {
            await updateDoc(doc(db, 'listings', id), { status: 'sold' });
            onDelete();
            // Navigate to success screen with listing info
            router.push({
                pathname: '/item_sold',
                params: { 
                    id, 
                    title, 
                    price,
                    image 
                }
            } as any);
        } catch (e) {
            console.error('Error updating listing status:', e);
            Alert.alert("Error", "Could not mark as sold.");
        }
    };

    return (
        <View className="bg-surface-dark rounded-xl overflow-hidden border border-surface-highlight shadow-sm mb-4">
            <View className="flex-row p-3 gap-3">
                <View className="relative w-24 h-24 bg-gray-800 rounded-lg overflow-hidden">
                    <Image source={{ uri: image }} style={{ width: '100%', height: '100%' }} />
                    <View className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 rounded flex-row items-center gap-1 border border-white/10">
                        <MaterialIcons name="visibility" size={10} color="white" />
                        <Text className="text-[10px] font-medium text-white">{views}</Text>
                    </View>
                </View>
                <View className="flex-1 justify-between">
                    <View>
                        <View className="flex-row justify-between items-start">
                            <Text className="text-base font-semibold text-white flex-1" numberOfLines={1}>{title}</Text>
                            <TouchableOpacity className="ml-2">
                                <MaterialIcons name="more-vert" size={20} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>
                        <Text className="text-primary font-bold mt-1 text-base">{price}</Text>
                    </View>
                    <Text className="text-xs text-text-secondary">{time}</Text>
                </View>
            </View>

            {/* Action Bar */}
            <View className="flex-row border-t border-surface-highlight">
                <TouchableOpacity 
                    onPress={() => router.push(`/edit_listing/${id}`)}
                    className="flex-1 py-3 border-r border-surface-highlight flex-row items-center justify-center gap-1.5 bg-background-dark/30"
                >
                    <MaterialIcons name="edit" size={16} color="#94a3b8" />
                    <Text className="text-xs font-medium text-text-secondary">Edit</Text>
                </TouchableOpacity>
                {status !== 'sold' && (
                    <TouchableOpacity onPress={handleMarkSold} className="flex-1 py-3 border-r border-surface-highlight flex-row items-center justify-center gap-1.5 bg-background-dark/30">
                        <MaterialIcons name="check-circle" size={16} color="#10b981" />
                        <Text className="text-xs font-medium text-emerald-500">Mark Sold</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    onPress={handleDelete}
                    className="flex-1 py-3 flex-row items-center justify-center gap-1.5 bg-background-dark/30"
                >
                    <MaterialIcons name="delete" size={16} color="#ef4444" />
                    <Text className="text-xs font-medium text-red-500">Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
