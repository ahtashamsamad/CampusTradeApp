import {
    View, Text, ScrollView, TouchableOpacity, SafeAreaView,
    Platform, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/src/config/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, getDocs, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { API_BASE_URL } from '@/constants/Config';
import { formatCurrency } from '@/src/utils/format';

export default function ListingDetailsScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { colors, resolvedTheme } = useTheme();
    const { user, toggleSavedItem } = useAuth();
    
    const [listing, setListing] = useState<any>(null);
    const [seller, setSeller] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [sellerImageLoading, setSellerImageLoading] = useState(true);

    const isSaved = user?.savedItems?.includes(id as string) || false;

    useEffect(() => {
        if (id) fetchListingDetails();
    }, [id]);

    const fetchListingDetails = async () => {
        try {
            setLoading(true);
            const docRef = doc(db, 'listings', id as string);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data: any = { id: docSnap.id, ...docSnap.data() };
                setListing(data);
                if (data.sellerId) fetchSellerInfo(data.sellerId);
            } else {
                // Fallback to API if not in Firestore (legacy)
                const response = await fetch(`${API_BASE_URL}/listings/${id}`);
                if (response.ok) {
                    const data: any = await response.json();
                    setListing(data);
                    if (data.sellerId) fetchSellerInfo(data.sellerId);
                } else {
                    console.error('Failed to fetch listing');
                    setListing(null);
                }
            }
        } catch (error) {
            console.error('Error fetching listing details:', error);
            setListing(null);
        } finally {
            setLoading(false);
        }
    };

    const fetchSellerInfo = async (sellerId: string) => {
        try {
            const sellerSnap = await getDoc(doc(db, 'users', sellerId));
            if (sellerSnap.exists()) {
                setSeller({ id: sellerSnap.id, ...sellerSnap.data() });
            }
        } catch (error) {
            console.error("Error fetching seller info:", error);
        }
    };

    const toggleSave = async () => {
        if (!user || !id) {
            Alert.alert("Authentication", "Please log in to save items.");
            return;
        }

        try {
            setIsSaving(true);
            await toggleSavedItem(id as string);
        } catch (error) {
            console.error("Error toggling save:", error);
            Alert.alert("Error", "Could not update your wishlist.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleMessageSeller = async () => {
        if (!user || !listing) {
            Alert.alert("Authentication", "Please log in to message the seller.");
            return;
        }

        if (user.id === listing.sellerId) {
            Alert.alert("Wait", "You cannot message yourself about your own listing.");
            return;
        }

        try {
            setLoading(true);

            // 1. Check if a chat already exists between these two users
            const chatsRef = collection(db, 'chats');
            const q = query(
                chatsRef,
                where('participantIds', 'array-contains', user.id)
            );

            const querySnapshot = await getDocs(q);
            let existingChatId = null;

            // Find if any of the user's chats have the seller as the other participant
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.participantIds.includes(listing.sellerId)) {
                    existingChatId = doc.id;
                }
            });

            if (existingChatId) {
                // If exists, navigate to it
                router.push(`/chat/${existingChatId}` as any);
                return;
            }

            // 2. If it doesn't exist, create a new one
            const sellerSnap = await getDoc(doc(db, 'users', listing.sellerId));
            const sellerData = sellerSnap.exists() ? sellerSnap.data() : { name: 'Seller' };

            const chatData = {
                listingId: listing.id,
                listingTitle: listing.title,
                listingImage: listing.images?.[0] || listing.imageUrl || listing.image || null,
                participantIds: [user.id, listing.sellerId],
                participants: [
                    { 
                        id: user.id, 
                        name: user.name || 'User', 
                        avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=random` 
                    },
                    { 
                        id: listing.sellerId, 
                        name: sellerData.name || sellerData.displayName || 'Seller', 
                        avatar: sellerData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(sellerData.name || 'S')}&background=random` 
                    }
                ],
                lastMessage: `Interested in ${listing.title}`,
                lastActivity: serverTimestamp(),
                lastMessageTimestamp: serverTimestamp(),
                unreadCounts: { [listing.sellerId]: 1, [user.id]: 0 },
                createdAt: serverTimestamp()
            };

            const newChatRef = await addDoc(collection(db, 'chats'), chatData);
            router.push(`/chat/${newChatRef.id}` as any);

        } catch (error) {
            console.error("Error creating/finding chat:", error);
            Alert.alert("Message Error", "Could not start conversation. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
                <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Loading listing details...</Text>
            </SafeAreaView>
        );
    }

    if (!listing) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />
                <MaterialIcons name="error-outline" size={56} color="#ef4444" />
                <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '800', marginTop: 16, marginBottom: 8 }}>
                    Listing Not Found
                </Text>
                <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 24 }}>
                    The listing you are looking for {"doesn't"} exist or has been removed.
                </Text>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{ backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 }}
                >
                    <Text style={{ color: 'white', fontWeight: '700' }}>Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    // Handle all possible image fields
    const images = listing.images || (listing.imageUrl ? [listing.imageUrl] : listing.image ? [listing.image] : []);
    const displayImage = images.length > 0 ? images[0] : null;

    const conditionColor: Record<string, string> = {
        'New': '#10b981',
        'Like New': '#34d399',
        'Good': '#60a5fa',
        'Fair': '#fbbf24',
        'Poor': '#f87171',
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle={colors.statusBarStyle} backgroundColor="transparent" translucent />

            {/* Floating Back / Save Header */}
            <View style={{
                position: 'absolute', top: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 8 : 52,
                width: '100%', flexDirection: 'row', justifyContent: 'space-between',
                paddingHorizontal: 16, zIndex: 50,
            }}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{
                        width: 40, height: 40, borderRadius: 20,
                        backgroundColor: 'rgba(0,0,0,0.55)',
                        alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    <MaterialIcons name="arrow-back" size={22} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={toggleSave}
                    disabled={isSaving}
                    style={{
                        width: 40, height: 40, borderRadius: 20,
                        backgroundColor: 'rgba(0,0,0,0.55)',
                        alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    {isSaving ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <MaterialIcons
                            name={isSaved ? 'favorite' : 'favorite-border'}
                            size={22}
                            color={isSaved ? '#ef4444' : 'white'}
                        />
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }} bounces={false}>

                {/* Hero Image */}
                <View style={{ width: '100%', height: 320, backgroundColor: colors.surfaceHighlight }}>
                    <Image
                        source={{ uri: displayImage }}
                        style={{ width: '100%', height: '100%', backgroundColor: colors.surfaceHighlight }}
                        contentFit="cover"
                    />
                    {/* Image count badge */}
                    {listing.images && listing.images.length > 1 && (
                        <View style={{
                            position: 'absolute', bottom: 12, right: 12,
                            backgroundColor: 'rgba(0,0,0,0.65)',
                            paddingHorizontal: 10, paddingVertical: 4,
                            borderRadius: 20,
                        }}>
                            <Text style={{ color: 'white', fontSize: 11, fontWeight: '600' }}>
                                1 / {listing.images.length}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Content */}
                <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>

                    {/* Title & Price */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                        <Text style={{ fontSize: 22, fontWeight: '800', color: colors.textPrimary, flex: 1, marginRight: 12, lineHeight: 28 }}>
                            {listing.title}
                        </Text>
                        <Text style={{ fontSize: 22, fontWeight: '800', color: colors.primary }}>
                            {formatCurrency(listing.price)}
                        </Text>
                    </View>

                    {/* Badges */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                        <View style={{
                            backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
                            paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
                        }}>
                            <Text style={{ fontSize: 12, color: colors.textSecondary, textTransform: 'capitalize' }}>
                                {listing.category}
                            </Text>
                        </View>
                        {listing.condition && (
                            <View style={{
                                backgroundColor: (conditionColor[listing.condition] || colors.primary) + '20',
                                borderWidth: 1, borderColor: conditionColor[listing.condition] || colors.primary,
                                paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
                            }}>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: conditionColor[listing.condition] || colors.primary }}>
                                    {listing.condition}
                                </Text>
                            </View>
                        )}
                        {listing.isNegotiable && (
                            <View style={{
                                backgroundColor: '#065f46', borderWidth: 1, borderColor: '#10b981',
                                paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
                            }}>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: '#6ee7b7' }}>Negotiable</Text>
                            </View>
                        )}
                        <Text style={{ fontSize: 12, color: colors.textMuted, alignSelf: 'center', marginLeft: 4 }}>
                            {listing.createdAt ? (
                                (() => {
                                    try {
                                        let date;
                                        if (listing.createdAt && typeof listing.createdAt.toDate === 'function') {
                                            date = listing.createdAt.toDate();
                                        } else if (listing.createdAt?.seconds) {
                                            date = new Date(listing.createdAt.seconds * 1000);
                                        } else {
                                            date = new Date(listing.createdAt);
                                        }
                                        
                                        if (isNaN(date.getTime())) return 'Recently';
                                        
                                        return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
                                    } catch (e) {
                                        return 'Recently';
                                    }
                                })()
                            ) : 'Just now'}
                        </Text>
                    </View>

                    {/* Description */}
                    <View style={{ marginBottom: 24 }}>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: 8 }}>
                            Description
                        </Text>
                        <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 22 }}>
                            {listing.description}
                        </Text>
                    </View>

                    {/* Seller Info */}
                    <View style={{ marginBottom: 20 }}>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: 10 }}>
                            Seller
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.push(`/seller_reviews?sellerId=${listing.sellerId}` as any)}
                            style={{
                                flexDirection: 'row', alignItems: 'center', padding: 14,
                                backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border,
                            }}
                        >
                            <View style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12, overflow: 'hidden', backgroundColor: colors.surfaceHighlight, alignItems: 'center', justifyContent: 'center' }}>
                                {sellerImageLoading && (
                                    <ActivityIndicator size="small" color={colors.primary} style={{ position: 'absolute', zIndex: 1 }} />
                                )}
                                    <Image
                                    source={{ uri: seller?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller?.name || 'S')}&background=random` }}
                                    style={{ width: '100%', height: '100%' }}
                                    onLoadStart={() => setSellerImageLoading(true)}
                                    onLoadEnd={() => setSellerImageLoading(false)}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>
                                    {seller?.name || seller?.displayName || 'Campus Student'}
                                </Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 4 }}>
                                    <MaterialIcons name="star" size={14} color="#facc15" />
                                    <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                                        {seller?.rating?.toFixed(1) || '0.0'} ({seller?.reviewCount || 0} reviews)
                                    </Text>
                                    {(seller?.isVerified || seller?.verified) && (
                                        <View style={{
                                            marginLeft: 4, backgroundColor: '#065f46',
                                            paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
                                        }}>
                                            <Text style={{ fontSize: 10, fontWeight: '700', color: '#6ee7b7' }}>✓ Verified</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                            <MaterialIcons name="chevron-right" size={22} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Location */}
                    <View style={{
                        flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
                        backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border,
                    }}>
                        <View style={{
                            width: 40, height: 40, borderRadius: 20,
                            backgroundColor: colors.primary + '20',
                            alignItems: 'center', justifyContent: 'center',
                        }}>
                            <MaterialIcons name="location-on" size={20} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>
                                Meetup Location
                            </Text>
                            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                                {listing.location || listing.meetupLocation || 'Campus Center Steps'}
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Action Bar */}
            <View style={{
                position: 'absolute', bottom: 0, width: '100%',
                paddingHorizontal: 16, paddingVertical: 12,
                paddingBottom: Platform.OS === 'ios' ? 28 : 14,
                backgroundColor: colors.surface,
                borderTopWidth: 1, borderTopColor: colors.border,
                flexDirection: 'row', gap: 12,
            }}>
                <TouchableOpacity
                    onPress={handleMessageSeller}
                    style={{
                        flex: 1, backgroundColor: colors.background,
                        borderWidth: 1, borderColor: colors.border,
                        paddingVertical: 14, borderRadius: 14,
                        alignItems: 'center', justifyContent: 'center',
                        flexDirection: 'row', gap: 8,
                    }}
                >
                    <MaterialIcons name="chat-bubble-outline" size={18} color={colors.textPrimary} />
                    <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 15 }}>Message</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => Alert.alert('Make Offer', 'Offer feature coming soon!')}
                    style={{
                        flex: 1.4, backgroundColor: colors.primary,
                        paddingVertical: 14, borderRadius: 14,
                        alignItems: 'center', justifyContent: 'center',
                        flexDirection: 'row', gap: 8,
                        shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
                    }}
                >
                    <MaterialIcons name="local-offer" size={18} color="white" />
                    <Text style={{ color: 'white', fontWeight: '800', fontSize: 15 }}>Make Offer</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
