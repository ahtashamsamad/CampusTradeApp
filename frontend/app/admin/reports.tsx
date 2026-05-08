import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar, Alert, TextInput, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import { db } from '@/src/config/firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// Shimmer Component
const ShimmerItem = () => {
    const { colors } = useTheme();
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.7, { duration: 800 }),
                withTiming(0.3, { duration: 800 })
            ),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <Animated.View 
            style={[
                { 
                    backgroundColor: colors.surfaceHighlight, 
                    borderRadius: 16, 
                    padding: 16, 
                    marginBottom: 12, 
                    height: 160,
                    borderWidth: 1,
                    borderColor: colors.border
                }, 
                animatedStyle
            ]} 
        />
    );
};

export default function AdminReports() {
    const router = useRouter();
    const { colors } = useTheme();
    const [reports, setReports] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'pending' | 'resolved' | 'dismissed'>('pending');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        
        try {
            const reportsRef = collection(db, 'reports');
            const q = query(reportsRef, orderBy('createdAt', 'desc'));
            
            const unsub = onSnapshot(q, (snap) => {
                const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setReports(arr);
                setLoading(false);
            }, (err) => {
                console.error("Reports Fetch Error:", err);
                setError(err.message);
                setLoading(false);
            });
            
            return () => unsub();
        } catch (e: any) {
            setError(e.message);
            setLoading(false);
        }
    }, []);

    const filtered = reports.filter(r => {
        // Status filtering
        const reportStatus = r.status || 'pending';
        if (reportStatus !== filter) return false;
        
        // Search filtering
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            r.reason?.toLowerCase().includes(s) || 
            r.description?.toLowerCase().includes(s) || 
            r.id?.toLowerCase().includes(s) ||
            r.reportedBy?.toLowerCase().includes(s)
        );
    });

    const handleUpdateStatus = async (reportId: string, newStatus: 'resolved' | 'dismissed') => {
        try {
            await updateDoc(doc(db, 'reports', reportId), { 
                status: newStatus,
                updatedAt: new Date()
            });
        } catch (e) {
            Alert.alert('Error', 'Failed to update report status');
        }
    };

    const handleAction = (report: any) => {
        const targetId = report.reportedItem || report.reportedItemId;
        const type = report.type || 'listing';
        
        if (type === 'user') {
            Alert.alert('Ban User', `Ban this user and resolve report?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Ban & Resolve', style: 'destructive', onPress: async () => {
                    try {
                        await updateDoc(doc(db, 'users', targetId), { status: 'banned', banned: true });
                        await handleUpdateStatus(report.id, 'resolved');
                    } catch (e) {
                        Alert.alert('Error', 'Action failed');
                    }
                }}
            ]);
        } else {
            Alert.alert('Delete Listing', `Delete this listing and resolve report?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete & Resolve', style: 'destructive', onPress: async () => {
                    try {
                        await deleteDoc(doc(db, 'listings', targetId));
                        await handleUpdateStatus(report.id, 'resolved');
                    } catch (e) {
                        Alert.alert('Error', 'Action failed');
                    }
                }}
            ]);
        }
    };

    const getBadgeColor = (reason: string) => {
        const r = reason?.toLowerCase() || '';
        if (r.includes('scam') || r.includes('fraud') || r.includes('fake')) return '#ef4444'; // Red
        if (r.includes('inappropriate') || r.includes('content') || r.includes('harassment')) return '#f97316'; // Orange
        if (r.includes('spam')) return '#3b82f6'; // Blue
        return '#8b5cf6'; // Purple (default)
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
            <StatusBar barStyle={colors.statusBarStyle} />
            
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface }}>
                <TouchableOpacity onPress={() => router.back()} style={{ width: 40, alignItems: 'flex-start' }}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: colors.textPrimary }}>Admin Reports</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Search & Filter Section */}
            <View style={{ padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, height: 46, marginBottom: 16 }}>
                    <MaterialIcons name="search" size={22} color={colors.textSecondary} />
                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Search ID, reporter, or reason..."
                        placeholderTextColor={colors.textMuted}
                        style={{ flex: 1, color: colors.textPrimary, marginLeft: 8, fontSize: 15 }}
                    />
                    {search ? <TouchableOpacity onPress={() => setSearch('')}><MaterialIcons name="close" size={20} color={colors.textSecondary} /></TouchableOpacity> : null}
                </View>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                    {['pending', 'resolved', 'dismissed'].map((f) => (
                        <TouchableOpacity
                            key={f}
                            onPress={() => setFilter(f as any)}
                            style={{
                                paddingHorizontal: 16,
                                paddingVertical: 8,
                                borderRadius: 20,
                                backgroundColor: filter === f ? colors.primary : colors.surfaceHighlight,
                                borderWidth: 1,
                                borderColor: filter === f ? colors.primary : colors.border
                            }}
                        >
                            <Text style={{ 
                                color: filter === f ? '#fff' : colors.textSecondary, 
                                fontSize: 13, 
                                fontWeight: '700',
                                textTransform: 'capitalize'
                            }}>
                                {f}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <ScrollView 
                style={{ flex: 1 }} 
                contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
                {loading ? (
                    <View>
                        {[1, 2, 3, 4].map(i => <ShimmerItem key={i} />)}
                    </View>
                ) : error ? (
                    <View style={{ alignItems: 'center', marginTop: 60, padding: 20 }}>
                        <MaterialIcons name="error-outline" size={60} color="#ef4444" />
                        <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginTop: 16 }}>Connection Error</Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 8 }}>{error}</Text>
                    </View>
                ) : filtered.length === 0 ? (
                    <View style={{ alignItems: 'center', marginTop: 60 }}>
                        <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: colors.surfaceHighlight, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                            <MaterialIcons name="assignment-turned-in" size={50} color={colors.textMuted} />
                        </View>
                        <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '800' }}>No Reports Found</Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 15, marginTop: 8, textAlign: 'center' }}>
                            {search ? 'No reports match your search.' : `There are no ${filter} reports at the moment.`}
                        </Text>
                    </View>
                ) : (
                    filtered.map(report => (
                        <View key={report.id} style={{ 
                            backgroundColor: colors.surface, 
                            borderRadius: 16, 
                            borderWidth: 1, 
                            borderColor: colors.border, 
                            padding: 16, 
                            marginBottom: 12,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            elevation: 2
                        }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <View style={{ 
                                    backgroundColor: getBadgeColor(report.reason) + '15', 
                                    paddingHorizontal: 10, 
                                    paddingVertical: 4, 
                                    borderRadius: 8,
                                    borderWidth: 1,
                                    borderColor: getBadgeColor(report.reason) + '40'
                                }}>
                                    <Text style={{ 
                                        color: getBadgeColor(report.reason), 
                                        fontSize: 11, 
                                        fontWeight: '800', 
                                        textTransform: 'uppercase',
                                        letterSpacing: 0.5
                                    }}>
                                        {report.reason || 'Report'}
                                    </Text>
                                </View>
                                <Text style={{ fontSize: 12, color: colors.textMuted }}>
                                    {report.createdAt?.toDate ? report.createdAt.toDate().toLocaleDateString() : 'New'}
                                </Text>
                            </View>

                            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 }}>
                                {report.type === 'user' ? 'User Misconduct' : 'Inappropriate Listing'}
                            </Text>
                            
                            {report.description ? (
                                <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 16, lineHeight: 20 }}>
                                    {report.description}
                                </Text>
                            ) : null}

                            <View style={{ backgroundColor: colors.surfaceHighlight, padding: 12, borderRadius: 12, marginBottom: 16 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                                    <MaterialIcons name="fingerprint" size={14} color={colors.textMuted} style={{ marginRight: 8 }} />
                                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>Report ID: <Text style={{ fontWeight: '600' }}>{report.id.slice(0, 12)}</Text></Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                                    <MaterialIcons name="person-outline" size={14} color={colors.textMuted} style={{ marginRight: 8 }} />
                                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>Reporter: <Text style={{ fontWeight: '600' }}>{report.reportedBy || 'Anonymous'}</Text></Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <MaterialIcons name="link" size={14} color={colors.textMuted} style={{ marginRight: 8 }} />
                                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>Target ID: <Text style={{ fontWeight: '600' }}>{report.reportedItem || report.reportedItemId}</Text></Text>
                                </View>
                            </View>

                            {filter === 'pending' && (
                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    <TouchableOpacity 
                                        onPress={() => handleAction(report)} 
                                        style={{ flex: 1.5, backgroundColor: '#ef4444', paddingVertical: 12, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
                                    >
                                        <MaterialIcons name="gavel" size={18} color="white" />
                                        <Text style={{ color: 'white', fontWeight: '800', fontSize: 13 }}>TAKE ACTION</Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity 
                                        onPress={() => handleUpdateStatus(report.id, 'resolved')} 
                                        style={{ flex: 1, backgroundColor: '#10b98120', paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#10b981' }}
                                    >
                                        <Text style={{ color: '#10b981', fontWeight: '700', fontSize: 13 }}>RESOLVE</Text>
                                    </TouchableOpacity>
                                </View>
                            ) || (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <MaterialIcons 
                                        name={filter === 'resolved' ? 'check-circle' : 'block'} 
                                        size={18} 
                                        color={filter === 'resolved' ? '#10b981' : colors.textMuted} 
                                    />
                                    <Text style={{ 
                                        color: filter === 'resolved' ? '#10b981' : colors.textMuted, 
                                        fontWeight: '700', 
                                        fontSize: 13,
                                        textTransform: 'uppercase'
                                    }}>
                                        {filter}
                                    </Text>
                                </View>
                            )}
                            
                            {filter === 'pending' && (
                                <TouchableOpacity 
                                    onPress={() => handleUpdateStatus(report.id, 'dismissed')} 
                                    style={{ marginTop: 12, paddingVertical: 4, alignItems: 'center' }}
                                >
                                    <Text style={{ color: colors.textMuted, fontWeight: '600', fontSize: 13 }}>Dismiss as Invalid</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
