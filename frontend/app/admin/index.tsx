import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import { db } from '@/src/config/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

export default function AdminDashboard() {
    const router = useRouter();
    const { colors } = useTheme();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalListings: 0,
        activeListings: 0,
        pendingReports: 0,
    });

    useEffect(() => {
        const unsubUsers = onSnapshot(collection(db, 'users'), snap => {
            setStats(p => ({ ...p, totalUsers: snap.size }));
        });
        const unsubListings = onSnapshot(collection(db, 'listings'), snap => {
            setStats(p => ({ ...p, totalListings: snap.size }));
        });
        const unsubActive = onSnapshot(query(collection(db, 'listings'), where('isAvailable', '==', true)), snap => {
            setStats(p => ({ ...p, activeListings: snap.size }));
        });
        const unsubReports = onSnapshot(query(collection(db, 'reports'), where('status', '==', 'pending')), snap => {
            setStats(p => ({ ...p, pendingReports: snap.size }));
        });

        return () => {
            unsubUsers();
            unsubListings();
            unsubActive();
            unsubReports();
        };
    }, []);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
            <StatusBar barStyle={colors.statusBarStyle} />
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface }}>
                <TouchableOpacity onPress={() => router.back()} style={{ width: 40, alignItems: 'flex-start' }}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>Admin Panel</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
                <Text style={{ fontSize: 24, fontWeight: '800', color: colors.textPrimary, marginBottom: 20 }}>Overview</Text>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
                    {[
                        { label: 'Total Users', value: stats.totalUsers, icon: 'people', color: '#3b82f6' },
                        { label: 'Total Listings', value: stats.totalListings, icon: 'storefront', color: '#8b5cf6' },
                        { label: 'Active Listings', value: stats.activeListings, icon: 'check-circle', color: '#10b981' },
                        { label: 'Pending Reports', value: stats.pendingReports, icon: 'warning', color: '#f59e0b' },
                    ].map((s, i) => (
                        <View key={i} style={{ width: '48%', backgroundColor: colors.surface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}>
                            <MaterialIcons name={s.icon as any} size={24} color={s.color} style={{ marginBottom: 8 }} />
                            <Text style={{ fontSize: 24, fontWeight: '800', color: colors.textPrimary }}>{s.value}</Text>
                            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>{s.label}</Text>
                        </View>
                    ))}
                </View>

                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 4 }}>Management</Text>
                <View style={{ backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
                    {[
                        { title: 'Manage Users', icon: 'manage-accounts', color: '#3b82f6', route: '/admin/users' },
                        { title: 'Manage Listings', icon: 'inventory', color: '#8b5cf6', route: '/admin/listings' },
                        { title: 'View Reports', icon: 'gavel', color: '#ef4444', route: '/admin/reports' },
                        { title: 'Send Announcement', icon: 'campaign', color: '#10b981', route: '/admin/announcements' },
                    ].map((item, i, arr) => (
                        <TouchableOpacity
                            key={i}
                            onPress={() => router.push(item.route as any)}
                            style={{
                                flexDirection: 'row', alignItems: 'center', padding: 16,
                                borderBottomWidth: i === arr.length - 1 ? 0 : 1, borderBottomColor: colors.border,
                            }}
                        >
                            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: item.color + '20', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                <MaterialIcons name={item.icon as any} size={20} color={item.color} />
                            </View>
                            <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: colors.textPrimary }}>{item.title}</Text>
                            <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
