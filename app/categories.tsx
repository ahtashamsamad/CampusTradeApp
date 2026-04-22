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

import { CATEGORIES_DATA } from '@/constants/categories';

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
    ...CATEGORIES_DATA
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
    
    // Filter states
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
    
    // Temporary states for modal
    const [tempMinPrice, setTempMinPrice] = useState('');
    const [tempMaxPrice, setTempMaxPrice] = useState('');
    const [tempConditions, setTempConditions] = useState<string[]>([]);

    const [listings, setListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchListings();
    }, []); // Fetch once on mount

    const fetchListings = async () => {
        try {
            setLoading(true);
            console.log("[CATEGORIES] Fetching all listings from Firestore...");
            const listingsRef = collection(db, 'listings');
            
            // Simple query to avoid any index issues
            const q = query(listingsRef, limit(100));

            const querySnapshot = await getDocs(q);
            console.log(`[CATEGORIES] Firestore returned ${querySnapshot.docs.length} documents`);
            
            const data = querySnapshot.docs.map(doc => {
                const docData = doc.data();
                return {
                    id: doc.id,
                    ...docData
                };
            });

            if (data.length > 0) {
                console.log("[CATEGORIES] First item category:", data[0].category);
                console.log("[CATEGORIES] First item title:", data[0].title);
            } else {
                console.warn("[CATEGORIES] NO DATA FOUND IN 'listings' COLLECTION!");
            }
            
            setListings(data);
        } catch (error) {
            console.error("[CATEGORIES] Error fetching listings:", error);
            setListings([]);
        } finally {
            setLoading(false);
        }
    };

    // Client-side refinement for category, search, price range, and condition
    const filteredListings = listings.filter(item => {
        // 1. Category Filter (Case-insensitive + Trim)
        const itemCategory = (item.category || '').toString().toLowerCase().trim();
        const selectedCatId = (selectedCategory || 'all').toString().toLowerCase().trim();
        
        // Handle "all" case
        const isAll = selectedCatId === 'all';
        
        // Find the category name corresponding to the selected ID
        const categoryObj = CATEGORIES.find(c => c.id.toLowerCase() === selectedCatId);
        const targetCategoryName = categoryObj?.name.toLowerCase().trim() || selectedCatId;

        // Strict matching: item.category should match the name of the selected category
        const matchesCategory = isAll || itemCategory === targetCategoryName;

        // 2. Search Filter
        const search = (searchQuery || '').toLowerCase().trim();
        const matchesSearch = !search || 
            (item.title || '').toLowerCase().includes(search) ||
            (item.description || '').toLowerCase().includes(search);
        
        // 3. Price Filter
        const itemPrice = typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0);
        const min = minPrice ? parseFloat(minPrice) : -Infinity;
        const max = maxPrice ? parseFloat(maxPrice) : Infinity;
        const matchesPrice = (isNaN(itemPrice) || (itemPrice >= min && itemPrice <= max));

        // 4. Condition Filter
        const matchesCondition = selectedConditions.length === 0 || 
            (item.condition && selectedConditions.some(c => c.toLowerCase().trim() === item.condition.toString().toLowerCase().trim()));

        return matchesCategory && matchesSearch && matchesPrice && matchesCondition;
    });

    console.log(`[FILTER] Total: ${listings.length}, Filtered: ${filteredListings.length}, Cat: ${selectedCategory}, Search: "${searchQuery}"`);

    const resetFilters = () => {
        console.log("[CATEGORIES] Resetting all filters");
        setSearchQuery('');
        setMinPrice('');
        setMaxPrice('');
        setSelectedConditions([]);
        setTempMinPrice('');
        setTempMaxPrice('');
        setTempConditions([]);
        setSelectedCategory('all');
        setSortBy('Newest');
    };

    const applyFilters = () => {
        setMinPrice(tempMinPrice);
        setMaxPrice(tempMaxPrice);
        setSelectedConditions(tempConditions);
        setIsFilterModalVisible(false);
    };

    const toggleCondition = (cond: string) => {
        if (tempConditions.includes(cond)) {
            setTempConditions(tempConditions.filter(c => c !== cond));
        } else {
            setTempConditions([...tempConditions, cond]);
        }
    };

    const sortedListings = [...filteredListings].sort((a, b) => {
        const priceA = typeof a.price === 'string' ? parseFloat(a.price) : (a.price || 0);
        const priceB = typeof b.price === 'string' ? parseFloat(b.price) : (b.price || 0);

        if (sortBy === 'Price: Low–High') return priceA - priceB;
        if (sortBy === 'Price: High–Low') return priceB - priceA;
        
        // Default: Newest
        const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
        const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
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
                    {filteredListings.length} ITEMS FOUND
                </Text>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity
                        onPress={() => {
                            setTempMinPrice(minPrice);
                            setTempMaxPrice(maxPrice);
                            setTempConditions(selectedConditions);
                            setIsFilterModalVisible(true);
                        }}
                        activeOpacity={0.7}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                            backgroundColor: (minPrice || maxPrice || selectedConditions.length > 0) ? colors.primary + '20' : colors.surface,
                            borderWidth: 1,
                            borderColor: (minPrice || maxPrice || selectedConditions.length > 0) ? colors.primary : colors.border,
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                        }}
                    >
                        <MaterialIcons name="tune" size={16} color={(minPrice || maxPrice || selectedConditions.length > 0) ? colors.primary : colors.textSecondary} />
                        <Text style={{ fontSize: 13, fontWeight: '600', color: (minPrice || maxPrice || selectedConditions.length > 0) ? colors.primary : colors.textSecondary }}>Filter</Text>
                    </TouchableOpacity>

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
        </View>

            {/* Filter Modal */}
            {isFilterModalVisible && (
                <View style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000,
                    justifyContent: 'flex-end'
                }}>
                    <TouchableOpacity 
                        style={{ flex: 1 }} 
                        onPress={() => setIsFilterModalVisible(false)} 
                    />
                    <View style={{
                        backgroundColor: colors.surface,
                        borderTopLeftRadius: 24, borderTopRightRadius: 24,
                        padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24,
                        maxHeight: '80%'
                    }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <Text style={{ fontSize: 20, fontWeight: '800', color: colors.textPrimary }}>Filters</Text>
                            <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
                                <MaterialIcons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Price Range */}
                            <View style={{ marginBottom: 24 }}>
                                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 }}>Price Range (Rs)</Text>
                                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                                    <TextInput
                                        style={{ flex: 1, backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, color: colors.textPrimary }}
                                        placeholder="Min"
                                        placeholderTextColor={colors.textMuted}
                                        keyboardType="numeric"
                                        value={tempMinPrice}
                                        onChangeText={setTempMinPrice}
                                    />
                                    <View style={{ width: 10, height: 1, backgroundColor: colors.border }} />
                                    <TextInput
                                        style={{ flex: 1, backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, color: colors.textPrimary }}
                                        placeholder="Max"
                                        placeholderTextColor={colors.textMuted}
                                        keyboardType="numeric"
                                        value={tempMaxPrice}
                                        onChangeText={setTempMaxPrice}
                                    />
                                </View>
                            </View>

                            {/* Condition */}
                            <View style={{ marginBottom: 24 }}>
                                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 }}>Condition</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                                    {['New', 'Like New', 'Good', 'Fair', 'Poor'].map(cond => {
                                        const isSelected = tempConditions.includes(cond);
                                        return (
                                            <TouchableOpacity
                                                key={cond}
                                                onPress={() => toggleCondition(cond)}
                                                style={{
                                                    paddingHorizontal: 14, paddingVertical: 8,
                                                    borderRadius: 10, borderWidth: 1,
                                                    borderColor: isSelected ? colors.primary : colors.border,
                                                    backgroundColor: isSelected ? colors.primary + '20' : colors.surface,
                                                }}
                                            >
                                                <Text style={{ fontSize: 13, fontWeight: '600', color: isSelected ? colors.primary : colors.textSecondary }}>{cond}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        </ScrollView>

                        {/* Footer Buttons */}
                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                            <TouchableOpacity
                                onPress={() => {
                                    setTempMinPrice('');
                                    setTempMaxPrice('');
                                    setTempConditions([]);
                                }}
                                style={{ flex: 1, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textSecondary }}>Clear All</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={applyFilters}
                                style={{ flex: 2, backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Text style={{ fontSize: 15, fontWeight: '700', color: 'white' }}>Apply Filters</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

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
                        No listings found
                    </Text>
                    <Text style={{ fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 }}>
                        No listings found for the selected filters.
                    </Text>
                    <TouchableOpacity 
                        onPress={resetFilters}
                        style={{ marginTop: 8, backgroundColor: colors.primary + '20', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }}
                    >
                        <Text style={{ color: colors.primary, fontWeight: '700' }}>Clear All Filters</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    key={selectedCategory}
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
                                        {CATEGORIES.find(c => c.id === item.category || c.name === item.category)?.name || item.category || 'Misc'}
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
