import { View, Text, TouchableOpacity, SafeAreaView, Platform, StatusBar, Alert } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { db } from '@/src/config/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { formatCurrency } from '@/src/utils/format';

export default function ItemSoldScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [buyer, setBuyer] = useState<any>(null);

    useEffect(() => {
        findPotentialBuyer();
    }, []);

    const findPotentialBuyer = async () => {
        try {
            // Find the most recent person who chatted about this item
            const q = query(
                collection(db, 'chats'),
                where('listingId', '==', params.id),
                limit(1)
            );
            const snap = await getDocs(q);
            if (!snap.empty) {
                const chat = snap.docs[0].data();
                // Assumes current user is seller, find other participant
                const other = chat.participants.find((p: any) => p.name !== 'Seller'); // Simplified logic
                setBuyer(other);
            }
        } catch (e) { console.error(e); }
    };

    return (
        <SafeAreaView className="flex-1 bg-background-dark">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="flex-row items-center justify-end px-4 py-3 pt-6 z-10">
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full hover:bg-slate-800">
                    <MaterialIcons name="close" size={24} color="#94a3b8" />
                </TouchableOpacity>
            </View>

            <View className="flex-1 items-center px-6 pt-2 pb-8">

                {/* Hero Illustration */}
                <View className="items-center justify-center mb-8 relative w-40 h-40">
                    <View className="absolute top-0 left-[-20] w-2 h-2 rounded-full bg-primary" />
                    <View className="absolute bottom-[-20] right-[-20] w-3 h-3 rounded-full bg-primary/60" />
                    <View className="w-full h-full items-center justify-center rounded-full bg-primary/20 border border-primary/20">
                        <MaterialIcons name="check-circle" size={80} color="#6366f1" />
                    </View>
                </View>

                {/* Headlines */}
                <Text className="text-center text-3xl font-bold tracking-tight text-white mb-2">
                    Cha-ching! Item Sold.
                </Text>
                <Text className="text-center text-lg text-text-secondary mb-8">
                    You just earned <Text className="text-primary font-semibold">{formatCurrency(params.price as string)}</Text>.
                </Text>

                {/* Item Summary Card */}
                <View className="w-full rounded-xl bg-surface-dark p-4 border border-surface-highlight mb-8">
                    <View className="flex-row items-center gap-4">
                        <Image
                            source={{ uri: (params.image as string) }}
                            className="w-16 h-16 rounded-lg bg-gray-800"
                        />
                        <View className="flex-1 justify-center">
                            <Text className="text-base font-semibold text-white truncate mb-1">{params.title || 'Item'}</Text>
                            <View className="flex-row items-center gap-1.5 text-text-secondary">
                                <MaterialIcons name="person" size={16} color="#94a3b8" />
                                <Text className="text-sm text-text-secondary">Sold to {buyer?.name || 'a Campus Student'}</Text>
                            </View>
                        </View>
                        <View className="rounded-full bg-green-900/30 px-2.5 py-1 border border-green-600/20">
                            <Text className="text-xs font-medium text-green-400">Sold</Text>
                        </View>
                    </View>

                    <View className="my-4 h-[1px] w-full bg-surface-highlight/50" />

                    <View className="flex-row w-full items-center justify-between group">
                        <Text className="text-sm font-medium text-text-secondary">Item status updated to Sold</Text>
                        <MaterialIcons name="check-circle" size={18} color="#10b981" />
                    </View>
                </View>

                {/* Actions */}
                <View className="w-full gap-3">
                    <TouchableOpacity 
                        className="flex-row w-full items-center justify-center gap-2 rounded-lg bg-primary py-3.5 px-4 shadow-sm shadow-primary/25"
                        onPress={() => router.push('/manage_listings')}
                    >
                        <MaterialIcons name="storefront" size={20} color="white" />
                        <Text className="text-base font-semibold text-white">View My Listings</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="flex-row w-full items-center justify-center gap-2 rounded-lg bg-surface-dark py-3.5 px-4 border border-surface-highlight"
                        onPress={() => router.push('/manage_listings')}
                    >
                        <MaterialIcons name="add-circle" size={20} color="white" />
                        <Text className="text-base font-semibold text-white">Sell something else</Text>
                    </TouchableOpacity>
                </View>

                {/* Spacer */}
                <View className="flex-1" />

                {/* Footer Navigation */}
                <TouchableOpacity
                    className="w-full py-2"
                    onPress={() => router.push('/')}
                >
                    <Text className="text-center text-sm font-medium text-text-secondary">Return to Home</Text>
                </TouchableOpacity>

            </View>
        </SafeAreaView>
    );
}
