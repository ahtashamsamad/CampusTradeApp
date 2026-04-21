import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, SafeAreaView,
    Platform, StatusBar, TextInput, ActivityIndicator, FlatList,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';

import { db } from '@/src/config/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/src/utils/format';

type Category = {
    id: string;
    name: string;
    icon: string;
    color: string;
    bgColor: string;
    count?: number;
};

const CATEGORIES: Category[] = [
    { id: 'all', name: 'All', icon: 'grid-view', color: '#818cf8', bgColor: '#3730a3' },
    { id: 'books', name: 'Books', icon: 'menu-book', color: '#93c5fd', bgColor: '#1e3a5f' },
    { id: 'tech', name: 'Tech', icon: 'devices', color: '#d8b4fe', bgColor: '#4c1d95' },
    { id: 'lab', name: 'Lab Gear', icon: 'science', color: '#5eead4', bgColor: '#0f3d38' },
    { id: 'furniture', name: 'Furniture', icon: 'chair', color: '#fdba74', bgColor: '#431407' },
    { id: 'clothing', name: 'Clothing', icon: 'checkroom', color: '#f9a8d4', bgColor: '#500724' },
    { id: 'sports', name: 'Sports', icon: 'sports-soccer', color: '#86efac', bgColor: '#052e16' },
    { id: 'notes', name: 'Notes', icon: 'description', color: '#fde68a', bgColor: '#451a03' },
    { id: 'transport', name: 'Transport', icon: 'directions-bike', color: '#67e8f9', bgColor: '#083344' },
    { id: 'services', name: 'Services', icon: 'handyman', color: '#fca5a5', bgColor: '#450a0a' },
];

const SORT_OPTIONS = ['Newest', 'Price: Low–High', 'Price: High–Low', 'Most Relevant'];

export default function CategoriesScreen() {
    const { colors } = useTheme();
    const { user, toggleSavedItem } = useAuth();
    const router = useRouter();
    const params = useLocalSearchParams<{ category?: string, search?: string }>();

    const [selectedCategory, setSelectedCategory] = useState<string>(params.category || 'all');
    const [sortBy, setSortBy] = useState('Newest');
    const [showSort, setShowSort] = useState(false);
    const [searchQuery, setSearchQuery] = useState(params.search || '');
    const [listings, setListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchListings();
    }, [selectedCategory]);

    const fetchListings = async () => {
        try {
            setLoading(true);
            const listingsRef = collection(db, 'listings');
            let q;

            if (selectedCategory === 'all') {
                q = query(listingsRef, orderBy('createdAt', 'desc'), limit(50));
            } else {
                // Find matching category ID or normalization
                const currentCat = CATEGORIES.find(c => c.id === selectedCategory);
                q = query(
                    listingsRef, 
                    where('category', '==', currentCat?.name || selectedCategory), 
                    orderBy('createdAt', 'desc'),
                    limit(50)
                );
            }

            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setListings(data);
        } catch (error) {
            console.error("Error fetching category listings:", error);
            setListings([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredListings = listings.filter(item =>
        item.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sortedListings = [...filteredListings].sort((a, b) => {
        if (sortBy === 'Price: Low–High') return a.price - b.price;
        if (sortBy === 'Price: High–Low') return b.price - a.price;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return (
        <SafeAreaView style={{
            flex: 1, backgroundColor: colors.background,
            paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        }}>
            <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />

            {/* Header */}
            <View style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                paddingHorizontal: 16, paddingVertical: 14,
                borderBottomWidth: 1, borderBottomColor: colors.border,
                backgroundColor: colors.surface,
            }}>
                <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPrimary }}>
                    Browse Categories
                </Text>
                <View style={{ width: 32 }} />
            </View>

            {/* Search */}
            <View style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder,
                borderRadius: 14, marginHorizontal: 16, marginTop: 14, marginBottom: 4,
                paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 11 : 0,
            }}>
                <MaterialIcons name="search" size={20} color={colors.textSecondary} />
                <TextInput
                    placeholder="Search listings..."
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

            {/* Category Pill Scroller */}
            <View>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        gap: 10
                    }}
                >
                    {CATEGORIES.map(cat => {
                        const isSelected = selectedCategory === cat.id;
                        return (
                            <TouchableOpacity
                                key={cat.id}
                                onPress={() => setSelectedCategory(cat.id)}
                                activeOpacity={0.7}
                                style={{
                                    flexDirection: 'column', // Set to vertical
                                    alignItems: 'center',
                                    gap: 12,
                                    paddingVertical: 18,
                                    paddingHorizontal: 12,
                                    width: 100, // Fixed width for vertical card
                                    height: 110, // Increased height for vertical layout
                                    borderRadius: 18,
                                    backgroundColor: isSelected ? '#818cf8' : colors.surface,
                                    borderWidth: 1.5,
                                    borderColor: isSelected ? '#818cf8' : '#334155',
                                    justifyContent: 'center',
                                    // Subtle shadow for unselected, glow for selected
                                    shadowColor: isSelected ? '#818cf8' : '#000',
                                    shadowOffset: { width: 0, height: 6 },
                                    shadowOpacity: isSelected ? 0.35 : 0.15,
                                    shadowRadius: 10,
                                    elevation: 5,
                                }}
                            >
                                <View style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 14,
                                    backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : cat.bgColor + '30',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 4,
                                }}>
                                    <MaterialIcons
                                        name={cat.icon as any}
                                        size={24}
                                        color={isSelected ? '#ffffff' : cat.color}
                                    />
                                </View>
                                <Text style={{
                                    fontSize: 13,
                                    fontWeight: '800',
                                    color: isSelected ? '#ffffff' : colors.textSecondary,
                                    letterSpacing: 0.3,
                                    textAlign: 'center',
                                }}>
                                    {cat.name}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Sort bar */}
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 20,
                paddingBottom: 12,
                marginTop: 2,
            }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textMuted }}>
                    {sortedListings.length} ITEMS FOUND
                </Text>

                <View style={{ position: 'relative' }}>
                    <TouchableOpacity
                        onPress={() => setShowSort(!showSort)}
                        activeOpacity={0.7}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                            backgroundColor: colors.surface,
                            borderWidth: 1,
                            borderColor: colors.border,
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                        }}
                    >
                        <MaterialIcons name="sort" size={16} color={colors.textSecondary} />
                        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>{sortBy}</Text>
                        <MaterialIcons
                            name={showSort ? 'expand-less' : 'expand-more'}
                            size={18}
                            color={colors.textSecondary}
                        />
                    </TouchableOpacity>

                    {showSort && (
                        <View style={{
                            position: 'absolute', top: 40, right: 0, zIndex: 100,
                            backgroundColor: colors.surface,
                            borderWidth: 1, borderColor: colors.border,
                            borderRadius: 12, overflow: 'hidden', minWidth: 180,
                            shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
                            shadowOpacity: 0.3, shadowRadius: 12, elevation: 12,
                        }}>
                            {SORT_OPTIONS.map(opt => (
                                <TouchableOpacity
                                    key={opt}
                                    onPress={() => { setSortBy(opt); setShowSort(false); }}
                                    style={{
                                        paddingHorizontal: 16, paddingVertical: 14,
                                        borderBottomWidth: opt !== SORT_OPTIONS[SORT_OPTIONS.length - 1] ? 1 : 0,
                                        borderBottomColor: colors.border,
                                        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                                        backgroundColor: sortBy === opt ? colors.surfaceHighlight : 'transparent',
                                    }}
                                >
                                    <Text style={{
                                        fontSize: 14, color: sortBy === opt ? colors.primary : colors.textPrimary,
                                        fontWeight: sortBy === opt ? '700' : '500',
                                    }}>{opt}</Text>
                                    {sortBy === opt && (
                                        <MaterialIcons name="check" size={18} color={colors.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            </View>

            {/* Listings Grid */}
            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color="#8b5cf6" />
                </View>
            ) : sortedListings.length === 0 ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 }}>
                    <View style={{
                        width: 80, height: 80, borderRadius: 40,
                        backgroundColor: colors.surfaceHighlight,
                        alignItems: 'center', justifyContent: 'center'
                    }}>
                        <MaterialIcons name="search-off" size={40} color={colors.textMuted} />
                    </View>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' }}>
                        No matches found
                    </Text>
                    <Text style={{ fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 }}>
                        We couldn't find anything matching your current filters or search term.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={sortedListings}
                    keyExtractor={item => item.id?.toString()}
                    numColumns={2}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                    columnWrapperStyle={{ gap: 16 }}
                    ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => router.push(`/listing/${item.id}` as any)}
                            activeOpacity={0.9}
                            style={{
                                flex: 1,
                                backgroundColor: colors.surface,
                                borderRadius: 16,
                                overflow: 'hidden',
                                borderWidth: 1,
                                borderColor: colors.border,
                                // Premium shadow
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.1,
                                shadowRadius: 6,
                            }}
                        >
                            <View style={{ aspectRatio: 1, backgroundColor: colors.surfaceHighlight }}>
                                <Image
                                    source={{ uri: item.images?.[0] || item.imageUrl || item.image }}
                                    style={{ width: '100%', height: '100%', backgroundColor: colors.surfaceHighlight }}
                                    contentFit="cover"
                                />
                                {/* Price Badge Over Image for High-Ref Design */}
                                <View style={{
                                    position: 'absolute', bottom: 8, left: 8,
                                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                                    paddingHorizontal: 10, paddingVertical: 4,
                                    borderRadius: 8,
                                    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
                                }}>
                                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>
                                        {formatCurrency(item.price)}
                                    </Text>
                                </View>
                                <TouchableOpacity 
                                    onPress={() => toggleSavedItem(item.id)}
                                    style={{
                                        position: 'absolute', top: 8, right: 8,
                                        backgroundColor: (user?.savedItems || []).includes(item.id) ? colors.primary : 'rgba(0,0,0,0.5)', 
                                        borderRadius: 20, padding: 8,
                                    }}
                                >
                                    <MaterialIcons 
                                        name={(user?.savedItems || []).includes(item.id) ? "favorite" : "favorite-border"} 
                                        size={18} 
                                        color="white" 
                                    />
                                </TouchableOpacity>
                            </View>
                            <View style={{ padding: 12 }}>
                                <Text
                                    style={{
                                        fontSize: 15,
                                        fontWeight: '700',
                                        color: colors.textPrimary,
                                        marginBottom: 4,
                                        lineHeight: 20
                                    }}
                                    numberOfLines={1}
                                >
                                    {item.title}
                                </Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <MaterialIcons name="local-offer" size={12} color={colors.textMuted} />
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }} numberOfLines={1}>
                                        {CATEGORIES.find(c => c.id === item.category)?.name || 'Misc'}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}
        </SafeAreaView>
    );
}
