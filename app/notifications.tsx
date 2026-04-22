import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, SafeAreaView,
    Platform, StatusBar, Animated, ActivityIndicator, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/src/config/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, deleteDoc, writeBatch, serverTimestamp, getDocs, addDoc } from 'firebase/firestore';

type NotificationItem = {
    id: string;
    toUserId?: string;
    fromUserId?: string;
    fromUserName?: string;
    fromUserAvatar?: string;
    type: 'message' | 'sale' | 'price' | 'system' | 'listing' | 'offer';
    title: string;
    body: string;
    relatedId?: string;
    isRead: boolean;
    time: string;
    createdAt?: any;
};

const typeConfig: Record<NotificationItem['type'], { icon: string; bg: string; color: string }> = {
    message: { icon: 'chat', bg: '#1d4ed8', color: '#93c5fd' },
    sale: { icon: 'sell', bg: '#065f46', color: '#6ee7b7' },
    price: { icon: 'trending-down', bg: '#7c3aed', color: '#c4b5fd' },
    system: { icon: 'info', bg: '#374151', color: '#9ca3af' },
};

export default function NotificationsScreen() {
    const { colors } = useTheme();
    const { user } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');

    useEffect(() => {
        if (!user?.id) return;

        const markAllAsRead = async () => {
            try {
                const qRead = query(
                    collection(db, 'notifications'),
                    where('toUserId', '==', user.id),
                    where('isRead', '==', false)
                );
                const snapshot = await getDocs(qRead);
                snapshot.docs.forEach(async (docSnap) => {
                    await updateDoc(doc(db, 'notifications', docSnap.id), { isRead: true });
                });
            } catch (e) {
                console.error("Error marking all as read on open", e);
            }
        };
        markAllAsRead();

        const q = query(
            collection(db, 'notifications'),
            where('toUserId', '==', user.id),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => {
                const item = doc.data();
                return {
                    id: doc.id,
                    ...item,
                    time: formatTime(item.createdAt),
                } as NotificationItem;
            });
            
            setNotifications(data);
            setLoading(false);


        }, (error: any) => {
            if (error.code === 'failed-precondition') {
                console.warn("Notifications index building - items will appear soon.");
            } else {
                console.error('Error fetching notifications:', error);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.id]);

    const formatTime = (timestamp: any) => {
        if (!timestamp) return 'Just now';
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            const now = new Date();
            const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
            
            if (diff < 60) return 'Just now';
            if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
            if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
            if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        } catch (e) {
            return '';
        }
    };



    const unreadCount = notifications.filter(n => !n.isRead).length;
    const displayed = activeFilter === 'unread' ? notifications.filter(n => !n.isRead) : notifications;

    const markAllRead = async () => {
        try {
            const batch = writeBatch(db);
            notifications.filter(n => !n.isRead).forEach(n => {
                const ref = doc(db, 'notifications', n.id);
                batch.update(ref, { isRead: true });
            });
            await batch.commit();
        } catch (e) {
            console.error('Error marking all as read:', e);
        }
    };

    const markRead = async (id: string) => {
        try {
            const ref = doc(db, 'notifications', id);
            await updateDoc(ref, { isRead: true });
        } catch (e) {
            console.error('Error marking as read:', e);
        }
    };

    const handleNotificationClick = async (notif: NotificationItem) => {
        try {
            // 1. Mark as read in Firestore
            if (!notif.isRead) {
                const ref = doc(db, 'notifications', notif.id);
                await updateDoc(ref, { isRead: true });
            }

            // 2. Navigate based on type
            if (notif.type === 'message') {
                router.push({
                    pathname: '/chat/[id]',
                    params: { id: notif.relatedId }
                } as any);
            } else if (notif.type === 'listing') {
                router.push({
                    pathname: '/listing/[id]',
                    params: { id: notif.relatedId }
                } as any);
            } else if (notif.type === 'offer') {
                router.push({
                    pathname: '/manage_listings'
                } as any);
            } else if (notif.type === 'sale') {
                router.push('/manage_listings' as any);
            }
        } catch (e) {
            console.error('Error handling notification click:', e);
        }
    };

    const dismiss = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'notifications', id));
        } catch (e) {
            console.error('Error dismissing notification:', e);
        }
    };

    const clearAll = async () => {
        Alert.alert(
            "Clear All",
            "Are you sure you want to clear all notifications?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Clear", 
                    style: "destructive", 
                    onPress: async () => {
                        try {
                            const batch = writeBatch(db);
                            notifications.forEach(n => {
                                batch.delete(doc(db, 'notifications', n.id));
                            });
                            await batch.commit();
                        } catch (e) {
                            console.error('Error clearing notifications:', e);
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView
            style={{
                flex: 1,
                backgroundColor: colors.background,
                paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
            }}
        >
            <StatusBar
                barStyle={colors.statusBarStyle}
                backgroundColor={colors.background}
            />

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
                    Notifications {unreadCount > 0 && `(${unreadCount})`}
                </Text>
                <TouchableOpacity onPress={markAllRead} style={{ padding: 4 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary }}>
                        Mark all read
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Filter Tabs */}
            <View style={{
                flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10,
                backgroundColor: colors.surface, gap: 8,
            }}>
                {(['all', 'unread'] as const).map(filter => (
                    <TouchableOpacity
                        key={filter}
                        onPress={() => setActiveFilter(filter)}
                        style={{
                            paddingHorizontal: 16, paddingVertical: 7,
                            borderRadius: 20,
                            backgroundColor: activeFilter === filter ? colors.primary : colors.chipBg,
                        }}
                    >
                        <Text style={{
                            fontSize: 13, fontWeight: '600', textTransform: 'capitalize',
                            color: activeFilter === filter ? '#ffffff' : colors.textSecondary,
                        }}>
                            {filter} {filter === 'unread' && unreadCount > 0 ? `(${unreadCount})` : ''}
                        </Text>
                    </TouchableOpacity>
                ))}
                <TouchableOpacity
                    onPress={clearAll}
                    style={{
                        marginLeft: 'auto', paddingHorizontal: 12, paddingVertical: 7,
                        borderRadius: 20, backgroundColor: 'transparent',
                        borderWidth: 1, borderColor: colors.border,
                    }}
                >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#ef4444' }}>Clear All</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 100, paddingTop: 4 }}
            >
                {loading ? (
                    <View style={{ paddingVertical: 100, alignItems: 'center', justifyContent: 'center' }}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Loading notifications...</Text>
                    </View>
                ) : displayed.length === 0 ? (
                    <View style={{ alignItems: 'center', paddingTop: 80, gap: 12 }}>
                        <View style={{
                            width: 80, height: 80, borderRadius: 40,
                            backgroundColor: colors.surface,
                            alignItems: 'center', justifyContent: 'center',
                        }}>
                            <MaterialIcons name="notifications-none" size={40} color={colors.textMuted} />
                        </View>
                        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPrimary }}>
                            All caught up!
                        </Text>
                        <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 40 }}>
                            You have no {activeFilter === 'unread' ? 'unread ' : ''}notifications right now.
                        </Text>
                    </View>
                ) : (
                    displayed.map((item) => {
                        const cfg = typeConfig[item.type] || typeConfig.system;
                        return (
                            <TouchableOpacity
                                key={item.id}
                                onPress={() => handleNotificationClick(item)}
                                activeOpacity={0.85}
                                style={{
                                    flexDirection: 'row', alignItems: 'flex-start',
                                    paddingHorizontal: 16, paddingVertical: 14,
                                    backgroundColor: item.isRead ? colors.background : colors.surface,
                                    borderBottomWidth: 1, borderBottomColor: colors.border,
                                    gap: 12,
                                }}
                            >
                                {/* Unread dot */}
                                {!item.isRead && (
                                    <View style={{
                                        position: 'absolute', left: 4, top: '50%',
                                        width: 6, height: 6, borderRadius: 3,
                                        backgroundColor: colors.primary,
                                    }} />
                                )}

                                {/* Icon or Avatar */}
                                {item.fromUserAvatar ? (
                                    <View style={{
                                        width: 44, height: 44, borderRadius: 22,
                                        overflow: 'hidden', flexShrink: 0,
                                        backgroundColor: colors.chipBg,
                                    }}>
                                        <Image source={{ uri: item.fromUserAvatar }} style={{ width: '100%', height: '100%' }} />
                                    </View>
                                ) : (
                                    <View style={{
                                        width: 44, height: 44, borderRadius: 22,
                                        backgroundColor: cfg.bg + '33',
                                        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                    }}>
                                        <MaterialIcons name={cfg.icon as any} size={22} color={cfg.color} />
                                    </View>
                                )}

                                {/* Content */}
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Text style={{
                                            fontSize: 14, fontWeight: item.isRead ? '600' : '700',
                                            color: colors.textPrimary, flex: 1, marginRight: 8,
                                        }} numberOfLines={1}>
                                            {item.title}
                                        </Text>
                                        <Text style={{ fontSize: 11, color: colors.textMuted, flexShrink: 0 }}>
                                            {item.time}
                                        </Text>
                                    </View>
                                    <Text style={{
                                        fontSize: 13, color: colors.textSecondary, marginTop: 3, lineHeight: 18,
                                    }} numberOfLines={2}>
                                        {item.body}
                                    </Text>
                                </View>

                                {/* Dismiss */}
                                <TouchableOpacity onPress={() => dismiss(item.id)} style={{ padding: 4, flexShrink: 0 }}>
                                    <MaterialIcons name="close" size={16} color={colors.textMuted} />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
