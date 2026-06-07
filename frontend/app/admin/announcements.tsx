import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { db } from '@/src/config/firebase';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { addDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, SafeAreaView, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AdminAnnouncements() {
    const router = useRouter();
    const { colors } = useTheme();
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    const sendAnnouncement = async () => {
        if (!title.trim() || !message.trim()) {
            Alert.alert('Error', 'Please fill in both title and message.');
            return;
        }

        Alert.alert(
            'Send Announcement',
            'This will send a push notification to ALL registered users. Continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Send',
                    style: 'destructive',
                    onPress: async () => {
                        setIsSending(true);
                        try {
                            // 1. Save announcement
                            await addDoc(collection(db, 'announcements'), {
                                title: title.trim(),
                                message: message.trim(),
                                sentBy: user?.id,
                                createdAt: serverTimestamp(),
                            });

                            // 2. Get all push tokens
                            const usersSnap = await getDocs(collection(db, 'users'));
                            const tokens = usersSnap.docs
                                .map(d => d.data()?.expoPushToken)
                                .filter(Boolean);

                            // 3. Send in batches of 100
                            const batches = [];
                            for (let i = 0; i < tokens.length; i += 100) {
                                batches.push(tokens.slice(i, i + 100));
                            }

                            for (const batch of batches) {
                                const messages = batch.map(token => ({
                                    to: token,
                                    sound: 'default',
                                    title: title.trim(),
                                    body: message.trim(),
                                    data: { type: 'announcement' },
                                }));

                                await fetch('https://exp.host/--/api/v2/push/send', {
                                    method: 'POST',
                                    headers: {
                                        'Accept': 'application/json',
                                        'Accept-encoding': 'gzip, deflate',
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify(messages),
                                });
                            }

                            Alert.alert('Success', `Announcement sent to ${tokens.length} users`);
                            setTitle('');
                            setMessage('');
                        } catch (e) {
                            Alert.alert('Error', 'Failed to send announcement');
                        } finally {
                            setIsSending(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle={colors.statusBarStyle} />

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
                <View style={{ backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 24 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 }}>Announcement Title</Text>
                    <TextInput
                        value={title}
                        onChangeText={setTitle}
                        placeholder="e.g. Server Maintenance, New Feature"
                        placeholderTextColor={colors.textSecondary}
                        style={{ backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 12, padding: 14, color: colors.textPrimary, fontSize: 15, marginBottom: 16 }}
                    />

                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 }}>Message Body</Text>
                    <TextInput
                        value={message}
                        onChangeText={setMessage}
                        placeholder="Write your announcement here..."
                        placeholderTextColor={colors.textSecondary}
                        multiline
                        numberOfLines={5}
                        textAlignVertical="top"
                        style={{ backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 12, padding: 14, color: colors.textPrimary, fontSize: 15, minHeight: 120, marginBottom: 20 }}
                    />

                    <TouchableOpacity
                        onPress={sendAnnouncement}
                        disabled={isSending}
                        style={{ backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, opacity: isSending ? 0.7 : 1 }}
                    >
                        {isSending ? <ActivityIndicator color="#fff" /> : <MaterialIcons name="campaign" size={20} color="#fff" />}
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{isSending ? 'Sending...' : 'Send to All Users'}</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ backgroundColor: '#10b98120', padding: 16, borderRadius: 12, flexDirection: 'row', gap: 12 }}>
                    <MaterialIcons name="info" size={24} color="#10b981" />
                    <Text style={{ flex: 1, color: colors.textPrimary, fontSize: 13, lineHeight: 20 }}>
                        <Text style={{ fontWeight: '700' }}>Note:</Text> Sending an announcement will trigger a push notification for all users who have enabled notifications. Please use this feature sparingly.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
