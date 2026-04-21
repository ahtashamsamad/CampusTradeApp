import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { db } from '@/src/config/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { formatCurrency } from '@/src/utils/format';
import { useAuth } from '@/context/AuthContext';

export default function UserProfileScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { user: currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('listings');
    const [user, setUser] = useState<any>(null);
    const [listings, setListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchUserData();
            fetchUserListings();
        }
    }, [id]);

    const fetchUserData = async () => {
        try {
            const snap = await getDoc(doc(db, 'users', id as string));
            if (snap.exists()) {
                setUser(snap.data());
            }
        } catch (e) {
            console.error("Error fetching user data:", e);
        }
    };

    const fetchUserListings = async () => {
        try {
            setLoading(true);
            const q = query(
                collection(db, 'listings'),
                where('userId', '==', id),
                orderBy('createdAt', 'desc')
            );
            const snap = await getDocs(q);
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setListings(data);
        } catch (e) {
            console.error("Error fetching user listings:", e);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !user) {
        return (
            <SafeAreaView className="flex-1 bg-background-dark items-center justify-center">
                <ActivityIndicator size="large" color="#6366f1" />
            </SafeAreaView>
        );
    }

    const initialsAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=6366f1&color=fff`;

    return (
        <SafeAreaView className="flex-1 bg-background-dark">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3 bg-background-dark/95 z-10 pt-6">
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full hover:bg-slate-800">
                    <MaterialIcons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity className="w-10 h-10 items-center justify-center rounded-full hover:bg-slate-800">
                    <MaterialIcons name="more-vert" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>

                {/* Profile Info */}
                <View className="items-center px-4 pt-4 pb-6 border-b border-surface-highlight">
                    <View className="relative w-24 h-24 mb-4">
                        <Image 
                            source={{ uri: user?.avatar || user?.photoURL || initialsAvatar }} 
                            className="w-24 h-24 rounded-full border-2 border-surface-highlight bg-slate-800" 
                        />
                        {user?.isVerified && (
                            <View className="absolute bottom-0 right-0 bg-primary rounded-full p-1 border-2 border-background-dark">
                                <MaterialIcons name="verified" size={16} color="white" />
                            </View>
                        )}
                    </View>

                    <Text className="text-2xl font-bold text-white mb-1">{user?.name || user?.displayName || 'Campus User'}</Text>
                    <Text className="text-sm text-text-secondary mb-3">
                        {user?.major || 'Student'} • {user?.classYear || 'Campus Resident'}
                    </Text>

                    <View className="flex-row items-center gap-6 mb-6">
                        <TouchableOpacity 
                            className="items-center" 
                            onPress={() => router.push({ pathname: '/seller_reviews', params: { sellerId: id } } as any)}
                        >
                            <View className="flex-row items-center">
                                <Text className="text-lg font-bold text-white">{(user?.rating || 0).toFixed(1)}</Text>
                                <MaterialIcons name="star" size={16} color="#facc15" className="ml-0.5" />
                            </View>
                            <Text className="text-xs text-text-secondary">{user?.reviewCount || 0} Reviews</Text>
                        </TouchableOpacity>

                        <View className="w-px h-8 bg-surface-highlight" />

                        <View className="items-center">
                            <Text className="text-lg font-bold text-white">{user?.totalSales || 0}</Text>
                            <Text className="text-xs text-text-secondary">Items Sold</Text>
                        </View>
                    </View>

                    {currentUser?.id !== id && (
                        <TouchableOpacity
                            className="w-full bg-primary py-3.5 rounded-xl flex-row justify-center items-center gap-2 shadow-sm shadow-primary/30"
                            onPress={() => router.push(`/chat/new?sellerId=${id}` as any)}
                        >
                            <MaterialIcons name="chat-bubble-outline" size={20} color="white" />
                            <Text className="text-white font-bold text-base">Message</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Tabs */}
                <View className="flex-row border-b border-surface-highlight px-4">
                    <TouchableOpacity
                        className={`flex-1 py-4 border-b-2 items-center ${activeTab === 'listings' ? 'border-primary' : 'border-transparent'}`}
                        onPress={() => setActiveTab('listings')}
                    >
                        <Text className={`font-semibold ${activeTab === 'listings' ? 'text-primary' : 'text-text-secondary'}`}>
                            Listings ({listings.length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className={`flex-1 py-4 border-b-2 items-center ${activeTab === 'reviews' ? 'border-primary' : 'border-transparent'}`}
                        onPress={() => router.push({ pathname: '/seller_reviews', params: { sellerId: id } } as any)}
                    >
                        <Text className={`font-semibold ${activeTab === 'reviews' ? 'text-primary' : 'text-text-secondary'}`}>
                            Reviews ({user?.reviewCount || 0})
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Listings Grid */}
                {activeTab === 'listings' && (
                    <View className="p-4 flex-row flex-wrap justify-between gap-y-4">
                        {loading ? (
                            <View className="w-full py-10 items-center">
                                <ActivityIndicator color="#6366f1" />
                            </View>
                        ) : listings.length === 0 ? (
                            <View className="w-full py-20 items-center">
                                <MaterialIcons name="inventory" size={48} color="#475569" />
                                <Text className="text-text-secondary mt-4">No active listings.</Text>
                            </View>
                        ) : (
                            listings.map(item => (
                                <TouchableOpacity 
                                    key={item.id} 
                                    className="w-[48%] bg-surface-dark rounded-xl border border-surface-highlight overflow-hidden" 
                                    onPress={() => router.push(`/listing/${item.id}` as any)}
                                >
                                    <Image 
                                        source={{ uri: item.images?.[0] || item.imageUrl || item.image }} 
                                        className="w-full aspect-square bg-slate-800" 
                                    />
                                    <View className="p-3">
                                        <Text className="text-white font-semibold text-sm mb-1" numberOfLines={2}>{item.title}</Text>
                                        <Text className="text-primary font-bold">{formatCurrency(item.price)}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))
                        )}
                    </View>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}
