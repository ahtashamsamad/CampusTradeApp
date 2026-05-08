import { View, Text, FlatList, TouchableOpacity, SafeAreaView, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/src/config/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Alert, TextInput } from 'react-native';

export default function ChatListScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const { user } = useAuth();
    const [chats, setChats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedChats, setSelectedChats] = useState<string[]>([]);

    useEffect(() => {
        if (!user?.id) return;

        // Optimized query with mandatory index for (participantIds array-contains && lastMessageTimestamp DESC)
        const q = query(
            collection(db, 'chats'),
            where('participantIds', 'array-contains', user.id),
            orderBy('lastMessageTimestamp', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const chatdata = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setChats(chatdata);
            setLoading(false);
        }, (error) => {
            console.error("Chats onSnapshot error:", error);
            // Fallback: If index is missing, try fetching without orderBy to show data at least
            if (error.message.includes('index')) {
                const fallbackQ = query(
                    collection(db, 'chats'),
                    where('participantIds', 'array-contains', user.id)
                );
                onSnapshot(fallbackQ, (snapshot) => {
                    const chatdata = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })).sort((a: any, b: any) => {
                        const timeA = a.lastMessageTimestamp?.toMillis?.() || 0;
                        const timeB = b.lastMessageTimestamp?.toMillis?.() || 0;
                        return timeB - timeA;
                    });
                    setChats(chatdata);
                    setLoading(false);
                });
            } else {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [user?.id]);

    const formatChatTime = (timestamp: any) => {
        if (!timestamp) return '';
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            const now = new Date();
            const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

            if (diffInSeconds < 60) return 'Just now';
            if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
            if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
            if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
            
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        } catch (e) {
            return '';
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedChats.length === 0 || !user?.id) return;
        
        Alert.alert(
            "Remove Conversations",
            `Remove ${selectedChats.length} conversation(s) from your inbox?\nThe other person can still see the chat.`,
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Remove", 
                    style: "destructive", 
                    onPress: async () => {
                        try {
                            for (const chatId of selectedChats) {
                                await updateDoc(doc(db, 'chats', chatId), {
                                    deletedBy: arrayUnion(user.id)
                                });
                            }
                            setSelectedChats([]);
                        } catch (error) {
                            console.error("Error removing chats:", error);
                        }
                    }
                }
            ]
        );
    };

    const toggleSelection = (id: string) => {
        setSelectedChats(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const filteredChats = chats.filter(chat => {
        // Hide soft-deleted chats for the current user
        if ((chat.deletedBy || []).includes(user?.id)) return false;

        const otherParticipant = chat.participants?.find((p: any) => p.id !== user?.id);
        const nameMatch = otherParticipant?.name?.toLowerCase().includes(searchQuery.toLowerCase());
        const titleMatch = chat.listingTitle?.toLowerCase().includes(searchQuery.toLowerCase());
        return nameMatch || titleMatch;
    });

    const renderChatItem = ({ item: chat }: { item: any }) => {
        const otherParticipant = chat.participants?.find((p: any) => p.id !== user?.id) || { name: 'Chat Participant' };
        const isSelected = selectedChats.includes(chat.id);
        const unreadCount = chat.unreadCounts?.[user?.id || ''] || 0;
        
        return (
            <TouchableOpacity
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 12,
                    backgroundColor: isSelected ? colors.primary + '15' : colors.surface,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: isSelected ? colors.primary : colors.border,
                    marginBottom: 12
                }}
                onPress={() => {
                    if (selectedChats.length > 0) {
                        toggleSelection(chat.id);
                    } else {
                        router.push(`/chat/${chat.id}`);
                    }
                }}
                onLongPress={() => toggleSelection(chat.id)}
                activeOpacity={0.7}
            >
                <View style={{ position: 'relative', marginRight: 12 }}>
                    <Image 
                        source={{ uri: chat.listingImage }} 
                        style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: colors.surfaceHighlight }} 
                        placeholder={null}
                    />
                    <View style={{ 
                        position: 'absolute', bottom: -4, right: -4, 
                        width: 24, height: 24, borderRadius: 12, 
                        borderWidth: 2, borderColor: colors.surface,
                        overflow: 'hidden',
                        backgroundColor: colors.surfaceHighlight,
                        alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Image 
                            source={{ uri: otherParticipant.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherParticipant.name)}&background=random` }} 
                            style={{ width: '100%', height: '100%' }} 
                        />
                    </View>
                </View>

                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary, flex: 1 }} numberOfLines={1}>
                            {otherParticipant.name}
                        </Text>
                        <Text style={{ fontSize: 11, color: unreadCount > 0 ? colors.primary : colors.textMuted, fontWeight: unreadCount > 0 ? '700' : '400' }}>
                            {formatChatTime(chat.lastMessageTimestamp)}
                        </Text>
                    </View>

                    <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600', marginBottom: 2 }} numberOfLines={1}>
                        {chat.listingTitle || 'Item Interest'}
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text
                            style={{ fontSize: 13, color: unreadCount > 0 ? colors.textPrimary : colors.textSecondary, flex: 1, marginRight: 8, fontWeight: unreadCount > 0 ? '600' : '400' }}
                            numberOfLines={1}
                        >
                            {chat.lastMessage || 'No messages yet'}
                        </Text>
                        {unreadCount > 0 && (
                            <View style={{ backgroundColor: colors.primary, minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
                                <Text style={{ color: 'white', fontSize: 10, fontWeight: '800' }}>{unreadCount}</Text>
                            </View>
                        )}
                        {isSelected && (
                            <View style={{ backgroundColor: colors.primary, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
                                <MaterialIcons name="check" size={14} color="white" />
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 8 : 10 }}>
            <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />
            
            {/* Header */}
            <View style={{ 
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
                paddingHorizontal: 16, paddingVertical: 12, 
                borderBottomWidth: 1, borderBottomColor: colors.border,
                backgroundColor: colors.surface
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    {selectedChats.length > 0 && (
                        <TouchableOpacity onPress={() => setSelectedChats([])} style={{ marginRight: 4 }}>
                            <MaterialIcons name="close" size={24} color={colors.textPrimary} />
                        </TouchableOpacity>
                    )}
                    <Text style={{ fontSize: 22, fontWeight: '800', color: colors.textPrimary }}>
                        {selectedChats.length > 0 ? `${selectedChats.length} Selected` : 'Messages'}
                    </Text>
                </View>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                    {selectedChats.length > 0 ? (
                        <TouchableOpacity onPress={handleDeleteSelected}>
                            <MaterialIcons name="delete-outline" size={26} color="#ef4444" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity>
                            <MaterialIcons name="filter-list" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <FlatList
                data={filteredChats}
                keyExtractor={(item) => item.id}
                renderItem={renderChatItem}
                contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 }}
                ListHeaderComponent={() => (
                    <View style={{ marginBottom: 20 }}>
                        <View style={{ 
                            flexDirection: 'row', alignItems: 'center', 
                            backgroundColor: colors.inputBg, 
                            borderWidth: 1.5, borderColor: colors.border, 
                            borderRadius: 14, height: 48, paddingHorizontal: 14 
                        }}>
                            <MaterialIcons name="search" size={22} color={colors.textMuted} />
                            <TextInput
                                style={{ flex: 1, marginLeft: 10, fontSize: 15, color: colors.textPrimary }}
                                placeholder="Search people or items..."
                                placeholderTextColor={colors.textMuted}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <MaterialIcons name="cancel" size={18} color={colors.textMuted} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}
                ListEmptyComponent={() => (
                    loading ? (
                        <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text style={{ color: colors.textSecondary, marginTop: 12, fontWeight: '600' }}>Syncing your messages...</Text>
                        </View>
                    ) : (
                        <View style={{ paddingVertical: 100, alignItems: 'center', paddingHorizontal: 40 }}>
                            <View style={{ 
                                width: 100, height: 100, borderRadius: 50, 
                                backgroundColor: colors.primary + '10', 
                                alignItems: 'center', justifyContent: 'center', 
                                marginBottom: 24,
                                borderWidth: 1, borderColor: colors.primary + '20'
                            }}>
                                <MaterialIcons name="chat-bubble-outline" size={48} color={colors.primary} />
                            </View>
                            <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '800', textAlign: 'center' }}>No messages yet</Text>
                            <Text style={{ color: colors.textSecondary, marginTop: 10, textAlign: 'center', lineHeight: 20, fontSize: 14 }}>
                                Find something interesting in the marketplace and reach out to the seller to start a trade!
                            </Text>
                            <TouchableOpacity 
                                onPress={() => router.push('/(tabs)')}
                                style={{ 
                                    marginTop: 32, backgroundColor: colors.primary, 
                                    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 
                                }}
                            >
                                <Text style={{ color: 'white', fontWeight: '700' }}>Explore Marketplace</Text>
                            </TouchableOpacity>
                        </View>
                    )
                )}
            />
        </SafeAreaView>
    );
}
