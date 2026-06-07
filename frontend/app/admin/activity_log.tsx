import { View, Text, FlatList, TouchableOpacity, SafeAreaView, Platform, StatusBar, StyleSheet, Alert, TextInput, ScrollView, Share } from 'react-native';
import { useRouter } from 'expo-router';
import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { db } from '@/src/config/firebase';
import { collection, query, orderBy, limit, onSnapshot, where, Timestamp } from 'firebase/firestore';
import Animated, { FadeInRight, Layout } from 'react-native-reanimated';

type LogAction = 'approval' | 'suspension' | 'review' | 'settings' | 'delete';

export default function AdminActivityLog() {
    const router = useRouter();
    const { colors } = useTheme();
    const [logs, setLogs] = useState<any[]>([]);
    const [filter, setFilter] = useState<LogAction | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('all');

    useEffect(() => {
        // Assume 'admin_logs' collection tracks all sensitive actions
        let q = query(collection(db, 'admin_logs'), orderBy('createdAt', 'desc'), limit(100));

        const unsub = onSnapshot(q, (snap) => {
            const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setLogs(arr);
        });
        return () => unsub();
    }, []);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchesFilter = filter === 'all' || log.action === filter;
            const matchesSearch = log.targetName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 log.adminName?.toLowerCase().includes(searchQuery.toLowerCase());
            
            // Basic date filtering
            if (dateRange === 'all') return matchesFilter && matchesSearch;
            
            const now = new Date();
            const logDate = log.createdAt?.toDate ? log.createdAt.toDate() : new Date();
            let matchesDate = true;
            
            if (dateRange === 'today') {
                matchesDate = logDate.toDateString() === now.toDateString();
            } else if (dateRange === 'week') {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                matchesDate = logDate >= weekAgo;
            } else if (dateRange === 'month') {
                const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                matchesDate = logDate >= monthAgo;
            }
            
            return matchesFilter && matchesSearch && matchesDate;
        });
    }, [logs, filter, searchQuery, dateRange]);

    const handleExport = async () => {
        const csvContent = "Action,Target,Admin,Time,Details\n" + 
            filteredLogs.map(l => `${l.action},${l.targetName},${l.adminName},${l.createdAt?.toDate().toISOString()},${l.details}`).join("\n");
        
        try {
            await Share.share({
                message: csvContent,
                title: 'Admin Activity Log Export'
            });
        } catch (e) {
            Alert.alert('Error', 'Failed to export logs');
        }
    };

    const getActionUI = (action: LogAction) => {
        switch (action) {
            case 'approval': return { icon: 'check-circle', color: '#10b981', label: 'Approved' };
            case 'suspension': return { icon: 'block', color: '#ef4444', label: 'Suspended' };
            case 'review': return { icon: 'rate-review', color: '#3b82f6', label: 'Reviewed' };
            case 'settings': return { icon: 'settings', color: '#8b5cf6', label: 'Configured' };
            case 'delete': return { icon: 'delete-forever', color: '#64748b', label: 'Deleted' };
            default: return { icon: 'info', color: colors.textSecondary, label: 'Action' };
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle={colors.statusBarStyle} />

            {/* Header & Search */}
            <View style={{ padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text style={{ fontSize: 22, fontWeight: '900', color: colors.textPrimary }}>Activity Log</Text>
                    <TouchableOpacity onPress={handleExport} style={styles.exportBtn}>
                        <MaterialIcons name="ios-share" size={20} color="#fff" />
                        <Text style={{ color: '#fff', fontWeight: '700', marginLeft: 4 }}>Export</Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                    <MaterialIcons name="search" size={20} color={colors.textSecondary} />
                    <TextInput
                        placeholder="Search target or admin..."
                        placeholderTextColor={colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={{ flex: 1, marginLeft: 8, color: colors.textPrimary }}
                    />
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ marginTop: 12, gap: 8 }}>
                    {['today', 'week', 'month', 'all'].map(r => (
                        <TouchableOpacity 
                            key={r} 
                            onPress={() => setDateRange(r as any)}
                            style={[styles.dateTab, { borderColor: dateRange === r ? colors.primary : colors.border, backgroundColor: dateRange === r ? colors.primary + '10' : 'transparent' }]}
                        >
                            <Text style={{ fontSize: 12, fontWeight: '700', color: dateRange === r ? colors.primary : colors.textSecondary }}>
                                {r.charAt(0).toUpperCase() + r.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Filter Tabs */}
            <View style={{ backgroundColor: colors.surface, paddingBottom: 12 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
                    {['all', 'approval', 'suspension', 'review', 'settings'].map(f => (
                        <TouchableOpacity 
                            key={f} 
                            onPress={() => setFilter(f as any)}
                            style={[styles.filterTab, { backgroundColor: filter === f ? colors.primary : colors.surfaceHighlight }]}
                        >
                            <Text style={{ color: filter === f ? '#fff' : colors.textSecondary, fontWeight: '700', fontSize: 13 }}>
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <FlatList
                data={filteredLogs}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                ListEmptyComponent={
                    <View style={{ alignItems: 'center', marginTop: 100 }}>
                        <MaterialCommunityIcons name="history" size={64} color={colors.textMuted} />
                        <Text style={{ color: colors.textSecondary, marginTop: 16 }}>No activity matching filters</Text>
                    </View>
                }
                renderItem={({ item, index }) => {
                    const ui = getActionUI(item.action);
                    const time = item.createdAt?.toDate ? item.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now';
                    const date = item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : '';

                    return (
                        <Animated.View entering={FadeInRight.delay(index * 30)} layout={Layout.springify()}>
                            <TouchableOpacity 
                                onPress={() => Alert.alert('Action Details', `Admin: ${item.adminName}\nTarget: ${item.targetName}\nDetails: ${item.details || 'No additional info'}`)}
                                style={styles.logCard}
                            >
                                {/* Timeline Line */}
                                <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
                                <View style={[styles.timelineDot, { backgroundColor: ui.color }]} />

                                <View style={[styles.cardContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                        <View style={[styles.actionBadge, { backgroundColor: ui.color + '15' }]}>
                                            <MaterialIcons name={ui.icon as any} size={14} color={ui.color} />
                                            <Text style={{ color: ui.color, fontSize: 11, fontWeight: '800', marginLeft: 4, textTransform: 'uppercase' }}>{ui.label}</Text>
                                        </View>
                                        <Text style={{ fontSize: 11, color: colors.textMuted, marginLeft: 'auto' }}>{date} • {time}</Text>
                                    </View>
                                    
                                    <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700' }}>
                                        {item.targetName}
                                    </Text>
                                    <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
                                        By <Text style={{ fontWeight: '600', color: colors.primary }}>{item.adminName}</Text>
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </Animated.View>
                    );
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    exportBtn: { backgroundColor: '#3b82f6', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
    dateTab: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
    filterTab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 },
    logCard: { flexDirection: 'row', paddingLeft: 20, marginBottom: 16, position: 'relative' },
    timelineLine: { position: 'absolute', left: 8, top: 0, bottom: -16, width: 2 },
    timelineDot: { position: 'absolute', left: 4, top: 20, width: 10, height: 10, borderRadius: 5, zIndex: 1, borderWidth: 2, borderColor: '#fff' },
    cardContent: { flex: 1, padding: 12, borderRadius: 16, borderWidth: 1, marginLeft: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
    actionBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }
});
