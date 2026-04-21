import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { db } from '@/src/config/firebase';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { useTheme } from '@/context/ThemeContext';

export default function SellerReviewsScreen() {
    const router = useRouter();
    const { sellerId } = useLocalSearchParams();
    const { colors } = useTheme();
    const [reviews, setReviews] = useState<any[]>([]);
    const [seller, setSeller] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        avg: 0,
        total: 0,
        distribution: [0, 0, 0, 0, 0] // 5, 4, 3, 2, 1
    });

    useEffect(() => {
        if (sellerId) {
            fetchSeller();
            fetchReviews();
        }
    }, [sellerId]);

    const fetchSeller = async () => {
        try {
            const sellerSnap = await getDoc(doc(db, 'users', sellerId as string));
            if (sellerSnap.exists()) setSeller(sellerSnap.data());
        } catch (e) { console.error(e); }
    };

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const q = query(
                collection(db, 'reviews'),
                where('sellerId', '==', sellerId),
                orderBy('createdAt', 'desc')
            );
            const snap = await getDocs(q);
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setReviews(data);

            // Calculate stats
            if (data.length > 0) {
                const total = data.length;
                const sum = data.reduce((acc, r: any) => acc + (r.rating || 0), 0);
                const distribution = [0, 0, 0, 0, 0];
                data.forEach((r: any) => {
                    const idx = 5 - Math.round(r.rating || 1);
                    if (idx >= 0 && idx < 5) distribution[idx]++;
                });
                setStats({
                    avg: sum / total,
                    total,
                    distribution: distribution.map(count => Math.round((count / total) * 100))
                });
            }
        } catch (error) {
            console.error("Error fetching reviews:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-background-dark items-center justify-center">
                <ActivityIndicator size="large" color="#6366f1" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background-dark">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Top App Bar */}
            <View className="flex-row items-center justify-between px-4 py-3 bg-background-dark/95 z-10 pt-6 border-b border-surface-highlight">
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full">
                    <MaterialIcons name="arrow-back" size={24} color="#f8fafc" />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-white flex-1 text-center pr-10">
                    {seller?.name || 'Seller'} Reviews
                </Text>
            </View>

            <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 100 }}>

                {/* Summary Stats Cards */}
                <View className="flex-row justify-between gap-3 mb-6">
                    <StatCard icon="star" value={stats.avg.toFixed(1)} label="Rating" />
                    <StatCard icon="shopping-bag" value={seller?.totalSales || 0} label="Sold" />
                    <StatCard icon="rate-review" value={stats.total} label="Reviews" />
                </View>

                {/* Rating Distribution */}
                <View className="bg-surface-dark rounded-2xl p-5 border border-surface-highlight mb-6">
                    <View className="flex-row items-center">
                        <View className="items-center justify-center mr-6">
                            <Text className="text-5xl font-black text-white">{stats.avg.toFixed(1)}</Text>
                            <View className="flex-row mt-2">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <MaterialIcons 
                                        key={s} 
                                        name={s <= Math.floor(stats.avg) ? "star" : (s <= stats.avg ? "star-half" : "star-outline")} 
                                        size={18} 
                                        color="#6366f1" 
                                    />
                                ))}
                            </View>
                            <Text className="text-text-secondary text-sm mt-1">out of 5</Text>
                        </View>

                        <View className="flex-1 space-y-2">
                            <RatingBar star="5" percentage={stats.distribution[0]} />
                            <RatingBar star="4" percentage={stats.distribution[1]} />
                            <RatingBar star="3" percentage={stats.distribution[2]} />
                            <RatingBar star="2" percentage={stats.distribution[3]} />
                            <RatingBar star="1" percentage={stats.distribution[4]} />
                        </View>
                    </View>
                </View>

                {/* Filters */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2 mb-6" contentContainerStyle={{ paddingRight: 20 }}>
                    <FilterButton icon="sort" title="Most Recent" isActive={true} />
                    <FilterButton icon="thumb-up" title="Highest Rated" isActive={false} />
                </ScrollView>

                {/* Reviews List */}
                <View className="gap-4">
                    {reviews.length === 0 ? (
                        <View className="py-20 items-center">
                            <MaterialIcons name="rate-review" size={48} color="#475569" />
                            <Text className="text-text-secondary mt-4">No reviews yet for this seller.</Text>
                        </View>
                    ) : (
                        reviews.map(review => (
                            <ReviewItem
                                key={review.id}
                                name={review.reviewerName || "Campus Student"}
                                time={review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString() : 'Recently'}
                                item={review.listingTitle || "Item"}
                                rating={review.rating}
                                text={review.comment}
                                helpful={review.helpful || 0}
                                avatar={review.reviewerAvatar}
                            />
                        ))
                    )}
                </View>

            </ScrollView>

            {/* Floating Action Button */}
            <View className="absolute bottom-8 right-6 z-40">
                <TouchableOpacity
                    className="flex-row items-center gap-2 bg-primary py-4 px-6 rounded-full shadow-lg shadow-primary/40"
                    onPress={() => router.push('/rate_review')}
                >
                    <MaterialIcons name="edit" size={20} color="white" />
                    <Text className="text-white font-semibold">Write a Review</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

function StatCard({ icon, value, label }: any) {
    return (
        <View className="flex-1 flex-col gap-1 bg-surface-dark p-3 items-center rounded-xl border border-surface-highlight">
            <MaterialIcons name={icon} size={24} color="#6366f1" />
            <Text className="text-white text-2xl font-bold">{value}</Text>
            <Text className="text-text-secondary text-xs font-medium">{label}</Text>
        </View>
    );
}

function RatingBar({ star, percentage }: any) {
    return (
        <View className="flex-row items-center gap-2 mb-1">
            <Text className="text-text-secondary w-2 text-right text-xs font-medium">{star}</Text>
            <View className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                <View className="h-full bg-primary" style={{ width: `${percentage}%` }} />
            </View>
            <Text className="text-text-secondary w-6 text-right text-xs">{percentage}%</Text>
        </View>
    );
}

function FilterButton({ icon, title, isActive }: any) {
    return (
        <TouchableOpacity className={`flex-row items-center gap-2 px-4 py-2 rounded-full mr-2 ${isActive ? 'bg-primary' : 'bg-surface-dark border border-surface-highlight'}`}>
            <MaterialIcons name={icon} size={18} color={isActive ? "white" : "#94a3b8"} />
            <Text className={`text-sm font-medium ${isActive ? 'text-white' : 'text-text-secondary'}`}>{title}</Text>
        </TouchableOpacity>
    );
}

function ReviewItem({ name, time, item, rating, text, helpful, downvotes = 0, avatar }: any) {
    const [imageLoading, setImageLoading] = useState(true);
    const { colors } = useTheme();

    return (
        <View className="flex-col gap-3 rounded-2xl bg-surface-dark p-5 border border-surface-highlight mb-4">
            <View className="flex-row items-start justify-between">
                <View className="flex-row items-center gap-3">
                    <View className="relative w-10 h-10 rounded-full border-2 border-surface-highlight overflow-hidden bg-surface-highlight items-center justify-center">
                        {imageLoading && (
                            <ActivityIndicator 
                                size="small" 
                                color="#6366f1" 
                                style={{ position: 'absolute', zIndex: 1 }} 
                            />
                        )}
                        <Image 
                            source={{ uri: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random` }} 
                            className="w-full h-full"
                            onLoadStart={() => setImageLoading(true)}
                            onLoadEnd={() => setImageLoading(false)}
                        />
                        <View className="absolute bottom-0 right-0 bg-primary rounded-full p-0.5 border border-surface-dark z-10">
                            <MaterialIcons name="verified" size={10} color="white" />
                        </View>
                    </View>
                    <View>
                        <Text className="text-white text-base font-semibold">{name}</Text>
                        <View className="flex-row items-center gap-2 mt-0.5">
                            <Text className="text-xs text-text-secondary">{time}</Text>
                            <View className="w-1 h-1 rounded-full bg-slate-600" />
                            <View className="bg-slate-700 px-1.5 py-0.5 rounded">
                                <Text className="text-[10px] text-text-secondary uppercase">{item}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            <View className="flex-row mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <MaterialIcons
                        key={star}
                        name="star"
                        size={18}
                        color={star <= rating ? "#6366f1" : "#475569"}
                    />
                ))}
            </View>

            <Text className="text-white text-sm leading-relaxed mt-1">
                {text}
            </Text>

            <View className="flex-row items-center justify-between pt-3 border-t border-surface-highlight/50 mt-2">
                <Text className="text-xs text-text-secondary">Was this helpful?</Text>
                <View className="flex-row gap-4">
                    <TouchableOpacity className="flex-row items-center gap-1.5">
                        <MaterialIcons name="thumb-up" size={16} color="#94a3b8" />
                        <Text className="text-xs font-medium text-text-secondary">{helpful}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-row items-center gap-1.5">
                        <MaterialIcons name="thumb-down" size={16} color="#94a3b8" />
                        {downvotes > 0 && <Text className="text-xs font-medium text-text-secondary">{downvotes}</Text>}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}
