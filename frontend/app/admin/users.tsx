import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { db } from '@/src/config/firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export default function AdminUsers() {
    const router = useRouter();
    const { colors } = useTheme();
    const [users, setUsers] = useState<any[]>([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'users'), snap => {
            const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setUsers(arr);
        });
        return () => unsub();
    }, []);

    const filtered = users.filter(u => {
        if (!search) return true;
        const s = search.toLowerCase();
        return u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s) || u.username?.toLowerCase().includes(s);
    });

    const handleBan = (user: any) => {
        const isBanned = user.banned || user.status === 'banned';
        Alert.alert(
            isBanned ? 'Unban User' : 'Ban User',
            `Are you sure you want to ${isBanned ? 'unban' : 'ban'} ${user.name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: isBanned ? 'Unban' : 'Ban',
                    style: isBanned ? 'default' : 'destructive',
                    onPress: async () => {
                        try {
                            await updateDoc(doc(db, 'users', user.id), {
                                status: isBanned ? 'active' : 'banned',
                                banned: !isBanned,
                                bannedAt: !isBanned ? serverTimestamp() : null
                            });
                        } catch (e) {
                            Alert.alert('Error', 'Failed to update user');
                        }
                    }
                }
            ]
        );
    };

    const handleDelete = (user: any) => {
        Alert.alert(
            'Delete User',
            `Are you sure you want to permanently delete ${user.name}? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'users', user.id));
                        } catch (e) {
                            Alert.alert('Error', 'Failed to delete user');
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
            <StatusBar barStyle={colors.statusBarStyle} />
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface }}>
                <TouchableOpacity onPress={() => router.back()} style={{ width: 40, alignItems: 'flex-start' }}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>Manage Users</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={{ padding: 16, paddingBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, height: 44 }}>
                    <MaterialIcons name="search" size={20} color={colors.textSecondary} />
                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Search by name or email..."
                        placeholderTextColor={colors.textSecondary}
                        style={{ flex: 1, color: colors.textPrimary, marginLeft: 8, fontSize: 15 }}
                    />
                    {search ? <TouchableOpacity onPress={() => setSearch('')}><MaterialIcons name="close" size={20} color={colors.textSecondary} /></TouchableOpacity> : null}
                </View>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 12 }}>Showing {filtered.length} users</Text>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 40 }}>
                {filtered.map(user => {
                    const isBanned = user.banned || user.status === 'banned';
                    return (
                        <View key={user.id} style={{ backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: isBanned ? '#ef4444' : colors.border, padding: 16, marginBottom: 12 }}>
                            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                                <Image source={{ uri: user.avatar || `https://ui-avatars.com/api/?name=${user.name}` }} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surfaceHighlight }} />
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>{user.name}</Text>
                                        {isBanned && <Text style={{ fontSize: 11, fontWeight: '800', color: '#ef4444', backgroundColor: '#ef444420', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>BANNED</Text>}
                                    </View>
                                    <Text style={{ fontSize: 13, color: colors.textSecondary }}>{user.email}</Text>
                                    {(user.rollNumber || user.department) && (
                                        <Text style={{ fontSize: 12, color: colors.primary, marginTop: 4 }}>{user.department} {user.rollNumber ? `• ${user.rollNumber}` : ''}</Text>
                                    )}
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 8, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
                                <TouchableOpacity onPress={() => handleBan(user)} style={{ flex: 1, backgroundColor: isBanned ? '#10b98120' : '#f59e0b20', paddingVertical: 8, borderRadius: 8, alignItems: 'center' }}>
                                    <Text style={{ color: isBanned ? '#10b981' : '#f59e0b', fontWeight: '700', fontSize: 13 }}>{isBanned ? 'UNBAN' : 'BAN'}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDelete(user)} style={{ flex: 1, backgroundColor: '#ef444420', paddingVertical: 8, borderRadius: 8, alignItems: 'center' }}>
                                    <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 13 }}>DELETE</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
    );
}
