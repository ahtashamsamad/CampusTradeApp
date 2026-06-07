import { View, Text, FlatList, TouchableOpacity, SafeAreaView, Platform, ScrollView, StatusBar, StyleSheet, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { db } from '@/src/config/firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy, limit, writeBatch, getDocs } from 'firebase/firestore';
import Animated, { FadeInUp, FadeOutRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

type NotifType = 'info' | 'warning' | 'critical';

export default function AdminNotifications() {
    const router = useRouter();
    const { colors } = useTheme();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [filter, setFilter] = useState<NotifType | 'all'>('all');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        // Assume an 'admin_notifications' collection exists for this system
        const q = query(collection(db, 'admin_notifications'), orderBy('createdAt', 'desc'), limit(50));
        const unsub = onSnapshot(q, (snap) => {
            const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setNotifications(arr);
            setRefreshing(false);
        }, (err) => {
            console.error("Notif Error:", err);
            setRefreshing(false);
        });
        return () => unsub();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
    };

    const filteredNotifications = useMemo(() => {
        if (filter === 'all') return notifications;
        return notifications.filter(n => n.type === filter);
    }, [notifications, filter]);

    const triggerHaptic = (type: NotifType) => {
        if (Platform.OS === 'web') return;
        if (type === 'critical') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        else if (type === 'warning') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleNotificationPress = async (notif: any) => {
        try {
            // Mark as read
            await updateDoc(doc(db, 'admin_notifications', notif.id), { isRead: true });
            
            // Navigate based on data
            if (notif.route) {
                router.push(notif.route as any);
            } else {
                Alert.alert(notif.title, notif.message);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const markAllRead = async () => {
        try {
            const batch = writeBatch(db);
            notifications.filter(n => !n.isRead).forEach(n => {
                batch.update(doc(db, 'admin_notifications', n.id), { isRead: true });
            });
            await batch.commit();
            Alert.alert('Success', 'All notifications marked as read');
        } catch (e) {
            Alert.alert('Error', 'Failed to mark all as read');
        }
    };

    const clearAll = async () => {
        Alert.alert('Clear All', 'Are you sure you want to delete all notification history?', [
            { text: 'Cancel' },
            { text: 'Clear All', style: 'destructive', onPress: async () => {
                try {
                    const snap = await getDocs(collection(db, 'admin_notifications'));
                    const batch = writeBatch(db);
                    snap.docs.forEach(d => batch.delete(d.ref));
                    await batch.commit();
                } catch (e) {
                    Alert.alert('Error', 'Failed to clear notifications');
                }
            }}
        ]);
    };

    const getNotifUI = (type: NotifType) => {
        switch (type) {
            case 'critical': return { icon: 'alert-decagram', color: '#ef4444', bg: '#ef444415' };
            case 'warning': return { icon: 'alert', color: '#f59e0b', bg: '#f59e0b15' };
            default: return { icon: 'information', color: '#3b82f6', bg: '#3b82f615' };
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle={colors.statusBarStyle} />

            {/* Header Controls */}
            <View style={{ padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text style={{ fontSize: 22, fontWeight: '900', color: colors.textPrimary }}>Notifications</Text>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity onPress={markAllRead} style={styles.iconBtn}>
                            <MaterialIcons name="done-all" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={clearAll} style={styles.iconBtn}>
                            <MaterialIcons name="delete-sweep" size={20} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Filter Tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {['all', 'critical', 'warning', 'info'].map((f) => (
                        <TouchableOpacity 
                            key={f} 
                            onPress={() => setFilter(f as any)}
                            style={[
                                styles.tab, 
                                { backgroundColor: filter === f ? colors.primary : colors.surfaceHighlight },
                                filter === f && { elevation: 4 }
                            ]}
                        >
                            <Text style={[styles.tabText, { color: filter === f ? '#fff' : colors.textSecondary }]}>
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <FlatList
                data={filteredNotifications}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="bell-off-outline" size={64} color={colors.textMuted} />
                        <Text style={{ color: colors.textSecondary, marginTop: 16, fontSize: 16 }}>No notifications yet</Text>
                    </View>
                }
                renderItem={({ item, index }) => {
                    const ui = getNotifUI(item.type);
                    const time = item.createdAt?.toDate ? item.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now';
                    
                    return (
                        <Animated.View entering={FadeInUp.delay(index * 50)} exiting={FadeOutRight}>
                            <TouchableOpacity 
                                onPress={() => handleNotificationPress(item)}
                                style={[
                                    styles.notifCard, 
                                    { backgroundColor: colors.surface, borderColor: item.isRead ? colors.border : colors.primary + '40' }
                                ]}
                            >
                                <View style={[styles.iconBox, { backgroundColor: ui.bg }]}>
                                    <MaterialCommunityIcons name={ui.icon as any} size={24} color={ui.color} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text style={[styles.notifTitle, { color: colors.textPrimary }]} numberOfLines={1}>{item.title}</Text>
                                        <Text style={{ fontSize: 11, color: colors.textMuted }}>{time}</Text>
                                    </View>
                                    <Text style={[styles.notifMsg, { color: colors.textSecondary }]} numberOfLines={2}>{item.message}</Text>
                                    {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
                                </View>
                                <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
                            </TouchableOpacity>
                        </Animated.View>
                    );
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    iconBtn: { padding: 8, borderRadius: 10, backgroundColor: '#f1f5f9' },
    tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    tabText: { fontSize: 13, fontWeight: '700' },
    notifCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 12, position: 'relative' },
    iconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    notifTitle: { fontSize: 15, fontWeight: '800' },
    notifMsg: { fontSize: 13, marginTop: 4, lineHeight: 18 },
    unreadDot: { position: 'absolute', top: 16, right: -4, width: 8, height: 8, borderRadius: 4 },
    emptyContainer: { alignItems: 'center', marginTop: 100 }
});
