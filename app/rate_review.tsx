import { View, Text, TextInput, TouchableOpacity, SafeAreaView, Platform, ScrollView, StatusBar, KeyboardAvoidingView, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { db } from '@/src/config/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';

export default function RateReviewScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { user } = useAuth();
    const [rating, setRating] = useState(5);
    const [reviewText, setReviewText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [targetUser, setTargetUser] = useState<any>(null);

    useEffect(() => {
        if (params.sellerId) {
            fetchTargetUser();
        }
    }, [params.sellerId]);

    const fetchTargetUser = async () => {
        try {
            const snap = await getDoc(doc(db, 'users', params.sellerId as string));
            if (snap.exists()) setTargetUser(snap.data());
        } catch (e) { console.error(e); }
    };

    const handleSubmit = async () => {
        if (!user) return;
        try {
            setIsSubmitting(true);
            
            // 1. Create Review Doc
            await addDoc(collection(db, 'reviews'), {
                sellerId: params.sellerId,
                reviewerId: user.id,
                reviewerName: user.name || 'Campus Student',
                reviewerAvatar: user.avatar || '',
                rating,
                comment: reviewText,
                listingId: params.listingId,
                listingTitle: params.listingTitle,
                createdAt: serverTimestamp()
            });

            // 2. Update Target User Stats
            const targetRef = doc(db, 'users', params.sellerId as string);
            const targetSnap = await getDoc(targetRef);
            if (targetSnap.exists()) {
                const data = targetSnap.data();
                const oldCount = data.reviewCount || 0;
                const oldRating = data.rating || 0;
                const newCount = oldCount + 1;
                const newRating = ((oldRating * oldCount) + rating) / newCount;

                await updateDoc(targetRef, {
                    rating: newRating,
                    reviewCount: newCount
                });
            }

            Alert.alert("Success", "Review submitted! Thanks for helping the community.");
            router.push('/(tabs)/profile');
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Could not submit review.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStars = () => {
        let stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <TouchableOpacity key={i} onPress={() => setRating(i)} className="p-1">
                    <MaterialIcons
                        name={i <= rating ? "star" : "star-border"}
                        size={40}
                        color={i <= rating ? "#facc15" : "#475569"}
                    />
                </TouchableOpacity>
            );
        }
        return stars;
    };

    return (
        <SafeAreaView className="flex-1 bg-background-dark">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Top App Bar */}
            <View className="flex-row items-center justify-between px-4 py-3 bg-background-dark/95 z-10 pt-6">
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full hover:bg-slate-800">
                    <MaterialIcons name="close" size={24} color="#f8fafc" />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-white">Rate & Review</Text>
                <TouchableOpacity>
                    <Text className="text-sm font-semibold text-primary">Skip</Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 100 }}>

                    {/* Transaction Context Card */}
                    <View className="bg-surface-dark rounded-xl p-4 border border-surface-highlight mb-6">
                        <View className="flex-row gap-4">
                            <View className="flex-1 justify-center">
                                <Text className="text-base font-bold text-white mb-1" numberOfLines={1}>{params.listingTitle || 'Item'}</Text>
                                <View className="flex-row items-center gap-2 mt-1">
                                    <Image
                                        source={{ uri: targetUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(targetUser?.name || 'S')}&background=random` }}
                                        className="w-5 h-5 rounded-full"
                                    />
                                    <Text className="text-xs text-text-secondary">Trade with <Text className="text-white font-medium">{targetUser?.name || 'Student'}</Text></Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Star Rating Section */}
                    <View className="items-center py-2 mb-6">
                        <Text className="text-2xl font-bold text-center text-white mb-6">How was your trade?</Text>
                        <View className="flex-row gap-3">
                            {renderStars()}
                        </View>
                        <Text className="text-sm font-medium text-text-secondary mt-3">Good</Text>
                    </View>

                    {/* Tags */}
                    <View className="mb-6">
                        <Text className="text-sm font-semibold text-white mb-3 ml-1">What went well?</Text>
                        <View className="flex-row flex-wrap gap-2">
                            <TagButton title="Punctual" isActive={true} />
                            <TagButton title="Item as described" isActive={false} />
                            <TagButton title="Friendly" isActive={true} />
                            <TagButton title="Quick Response" isActive={false} />
                            <TagButton title="Fair Negotiation" isActive={false} />
                        </View>
                    </View>

                    {/* Comment Area */}
                    <View className="mb-6">
                        <Text className="text-sm font-semibold text-white mb-2 ml-1">
                            Additional Comments <Text className="font-normal text-text-secondary">(Optional)</Text>
                        </Text>
                        <TextInput
                            className="w-full rounded-xl bg-surface-dark border border-surface-highlight text-white p-4 text-sm min-h-[100px]"
                            placeholder="Share details about your experience..."
                            placeholderTextColor="#94a3b8"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            value={reviewText}
                            onChangeText={setReviewText}
                        />
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Fixed Bottom Action */}
            <View className="absolute bottom-0 w-full p-4 bg-background-dark/95 border-t border-surface-highlight pb-8">
                <TouchableOpacity 
                    className="w-full bg-primary py-3.5 rounded-xl flex-row justify-center items-center gap-2 shadow-sm"
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Text className="text-white font-semibold flex-1 text-center pl-8">Submit Review</Text>
                            <View className="pr-4">
                                <MaterialIcons name="arrow-forward" size={20} color="white" />
                            </View>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

function TagButton({ title, isActive }: { title: string, isActive: boolean }) {
    return (
        <TouchableOpacity className={`px-4 py-2 rounded-full border ${isActive ? 'border-primary bg-primary/20' : 'border-surface-highlight bg-surface-dark'}`}>
            <Text className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-text-secondary'}`}>{title}</Text>
        </TouchableOpacity>
    );
}
