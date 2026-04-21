import {
    View, Text, TextInput, TouchableOpacity, SafeAreaView, Platform,
    KeyboardAvoidingView, ScrollView, ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/src/config/firebase';
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, deleteDoc, getDocs, writeBatch, where, arrayRemove } from 'firebase/firestore';

import { API_BASE_URL } from '@/constants/Config';
import { formatCurrency } from '@/src/utils/format';
import { sendPushNotification, getUserPushToken } from '@/src/utils/notifications';

// Initial loading hint or empty state logic
const EMPTY_CHAT_MESSAGE = "Start your conversation below!";

export default function ChatRoomScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { colors } = useTheme();
    const { user } = useAuth();
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [chatMeta, setChatMeta] = useState<any>(null);
    const [typingOther, setTypingOther] = useState(false);
    const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
    const scrollViewRef = useRef<ScrollView>(null);
    const typingTimeoutRef = useRef<any>(null);

    useEffect(() => {
        if (!id || !user) return;

        // 1. Fetch Chat Metadata (other participant, listing info)
        const fetchMeta = async () => {
            try {
                const chatRef = doc(db, 'chats', id as string);
                const chatSnap = await getDoc(chatRef);
                if (chatSnap.exists()) {
                    const data = chatSnap.data();
                    const otherId = data.participantIds.find((pid: string) => pid !== user.id);
                    
                    // Fetch real-time user data for the other participant
                    let otherUser = data.participants?.find((p: any) => p.id !== user.id) || { name: 'Campus User' };
                    if (otherId) {
                        const otherSnap = await getDoc(doc(db, 'users', otherId));
                        if (otherSnap.exists()) {
                            const u = otherSnap.data();
                            otherUser = {
                                id: otherId,
                                name: u.name || u.displayName || 'Campus User',
                                avatar: u.avatar || u.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || u.displayName || 'U')}&background=random`
                            };
                        }
                    }

                    // Also fetch listing details for the banner
                    const listingRef = doc(db, 'listings', data.listingId);
                    const listingSnap = await getDoc(listingRef);
                    
                    setChatMeta({
                        ...data,
                        otherParticipant: otherUser,
                        listing: listingSnap.exists() ? { id: listingSnap.id, ...listingSnap.data() } : null
                    });
                }
            } catch (err) {
                console.error("Error fetching chat meta:", err);
            }
        };
        fetchMeta();

        // 2. Real-time messages & Typing Status & Unread Clear
        const chatRef = doc(db, 'chats', id as string);
        
        // Clear unread count & mark other user's messages as 'read'
        const clearUnreadAndMarkRead = async () => {
            try {
                await updateDoc(chatRef, {
                    [`unreadCounts.${user.id}`]: 0
                });

                // Batch-mark all messages from the other user as 'read'
                const msgsCol = collection(db, 'chats', id as string, 'messages');
                const otherMsgs = await getDocs(query(msgsCol, where('senderId', '!=', user.id)));
                const batch = writeBatch(db);
                let needsCommit = false;
                otherMsgs.docs.forEach(msgDoc => {
                    if (msgDoc.data().status !== 'read') {
                        batch.update(msgDoc.ref, { status: 'read' });
                        needsCommit = true;
                    }
                });
                if (needsCommit) await batch.commit();
            } catch (e) {
                console.warn('Error clearing unread / marking read:', e);
            }
        };
        clearUnreadAndMarkRead();

        const msgsRef = collection(db, 'chats', id as string, 'messages');
        const q = query(msgsRef, orderBy('createdAt', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(msgs);
            setLoading(false);
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        }, (err) => {
            console.error("Messages onSnapshot error:", err);
            setLoading(false);
        });

        // Listen for typing status
        const unsubscribeTyping = onSnapshot(chatRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                const otherId = data.participantIds?.find((pid: string) => pid !== user.id);
                if (otherId && data.typingStatus?.[otherId]) {
                    setTypingOther(true);
                } else {
                    setTypingOther(false);
                }
            }
        });

        return () => {
            unsubscribe();
            unsubscribeTyping();
            // Reset typing status on exit
            updateDoc(chatRef, { [`typingStatus.${user.id}`]: false }).catch(() => {});
        };
    }, [id, user]);

    const handleTyping = (text: string) => {
        setMessage(text);
        if (!id || !user) return;

        const chatRef = doc(db, 'chats', id as string);
        updateDoc(chatRef, { [`typingStatus.${user.id}`]: true }).catch(() => {});

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            updateDoc(chatRef, { [`typingStatus.${user.id}`]: false }).catch(() => {});
        }, 2000);
    };

    const deleteSelectedMessages = async () => {
        if (selectedMessages.length === 0) return;
        Alert.alert("Delete Messages", `Delete ${selectedMessages.length} message(s)?`, [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Delete", 
                style: "destructive", 
                onPress: async () => {
                    try {
                        for (const msgId of selectedMessages) {
                            await deleteDoc(doc(db, 'chats', id as string, 'messages', msgId));
                        }
                        setSelectedMessages([]);
                    } catch (e) { console.error(e); }
                }
            }
        ]);
    };

    const toggleMessageSelection = (msgId: string) => {
        setSelectedMessages(prev => 
            prev.includes(msgId) ? prev.filter(i => i !== msgId) : [...prev, msgId]
        );
    };

    const handleSendMessage = async () => {
        if (!message.trim() || !user || !id) return;

        const text = message.trim();
        setMessage('');

        try {
            setIsSending(true);
            const msgsRef = collection(db, 'chats', id as string, 'messages');
            
            await addDoc(msgsRef, {
                text,
                senderId: user.id,
                status: 'sent',
                createdAt: serverTimestamp(),
            });

            // Update last activity & unread counts in parent chat doc
            const otherId = chatMeta?.participantIds?.find((pid: string) => pid !== user.id);
            const chatRef = doc(db, 'chats', id as string);
            
            const currentUnread = chatMeta?.unreadCounts?.[otherId] || 0;

            await updateDoc(chatRef, {
                lastMessage: text,
                lastActivity: serverTimestamp(),
                lastMessageTimestamp: serverTimestamp(),
                [`unreadCounts.${otherId}`]: currentUnread + 1,
                [`typingStatus.${user.id}`]: false,
                // Re-surface chat for recipient if they previously soft-deleted it
                deletedBy: arrayRemove(otherId),
            });

            // 3. Create a notification for the other user (shows up in Notifications screen)
            try {
                await addDoc(collection(db, 'notifications'), {
                    userId: otherId,
                    senderId: user.id,
                    title: `New Message from ${user.name || 'Campus Student'}`,
                    message: text,
                    type: 'message',
                    chatId: id,
                    listingId: chatMeta?.listingId || '',
                    read: false,
                    createdAt: serverTimestamp(),
                });
            } catch (notifErr) {
                console.error("Error creating notification document:", notifErr);
            }

            // 4. Fire-and-forget: Send remote push notification to recipient's device
            if (otherId) {
                getUserPushToken(otherId).then(token => {
                    sendPushNotification(
                        token,
                        `New Message from ${user.name || 'Campus Student'}`,
                        text,
                        { chatId: id, screen: `/chat/${id}` },
                    );
                });
            }

            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        } catch (error) {
            console.error('Error sending message:', error);
            Alert.alert("Error", "Message failed to send.");
        } finally {
            setIsSending(false);
        }
    };

    const formatTime = (ts: any) => {
        try {
            const date = ts?.toDate ? ts.toDate() : new Date(ts);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch { return ''; }
    };

    return (
        <SafeAreaView style={{
            flex: 1, backgroundColor: colors.background,
            paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        }}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />

            {/* Header */}
            <View style={{
                flexDirection: 'row', alignItems: 'center',
                paddingHorizontal: 12, paddingVertical: 10,
                borderBottomWidth: 1, borderBottomColor: colors.border,
                backgroundColor: colors.surface,
            }}>
                <TouchableOpacity
                    onPress={() => selectedMessages.length > 0 ? setSelectedMessages([]) : router.back()}
                    style={{ padding: 8, borderRadius: 20, marginRight: 4 }}
                >
                    <MaterialIcons name={selectedMessages.length > 0 ? "close" : "arrow-back"} size={22} color={colors.textPrimary} />
                </TouchableOpacity>

                {selectedMessages.length > 0 ? (
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPrimary }}>
                            {selectedMessages.length} Selected
                        </Text>
                        <TouchableOpacity onPress={deleteSelectedMessages} style={{ padding: 8 }}>
                            <MaterialIcons name="delete-outline" size={24} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <Image
                            source={{ uri: chatMeta?.otherParticipant?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(chatMeta?.otherParticipant?.name || 'User')}&background=random` }}
                            style={{ width: 38, height: 38, borderRadius: 19, marginRight: 10, backgroundColor: colors.surfaceHighlight }}
                        />
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }} numberOfLines={1}>
                                {chatMeta?.otherParticipant?.name || 'Loading...'}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: typingOther ? colors.primary : '#22c55e' }} />
                                <Text style={{ fontSize: 11, color: typingOther ? colors.primary : colors.textSecondary, fontWeight: typingOther ? '700' : '400' }}>
                                    {typingOther ? 'Typing...' : 'Online'}
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={() => Alert.alert('Options', 'Select all, Clear Chat?', [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Clear Chat', style: 'destructive' },
                            ])}
                            style={{ padding: 8 }}
                        >
                            <MaterialIcons name="more-vert" size={22} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </>
                )}
            </View>

            {chatMeta?.listing && (
                <View>
                    <TouchableOpacity
                        onPress={() => router.push(`/listing/${chatMeta.listing.id}` as any)}
                        style={{
                            flexDirection: 'row', alignItems: 'center',
                            paddingHorizontal: 14, paddingVertical: 10,
                            backgroundColor: colors.surface,
                            borderBottomWidth: 1, borderBottomColor: colors.border,
                            gap: 12,
                        }}
                    >
                        <Image
                            source={{ uri: chatMeta.listing.images?.[0] || chatMeta.listing.imageUrl || chatMeta.listing.image || null }}
                            style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: colors.surfaceHighlight }}
                        />
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }} numberOfLines={1}>
                                {chatMeta.listing.title}
                            </Text>
                            <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600', marginTop: 2 }}>
                                {formatCurrency(chatMeta.listing.price)}
                            </Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>

                    {chatMeta.listing.status === 'sold' && (
                        <View style={{
                            backgroundColor: colors.primary + '15',
                            padding: 12,
                            borderBottomWidth: 1,
                            borderBottomColor: colors.primary + '30',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <Text style={{ fontSize: 13, color: colors.textPrimary, fontWeight: '600' }}>Trade Complete!</Text>
                                <Text style={{ fontSize: 11, color: colors.textSecondary }}>Rate your experience with {chatMeta.otherParticipant?.name}</Text>
                            </View>
                            <TouchableOpacity 
                                onPress={() => router.push({
                                    pathname: '/rate_review',
                                    params: { 
                                        sellerId: chatMeta.otherParticipant?.id,
                                        listingId: chatMeta.listing.id,
                                        listingTitle: chatMeta.listing.title
                                    }
                                } as any)}
                                style={{ backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                            >
                                <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>Rate Now</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={0}
            >
                {/* Messages */}
                <ScrollView
                    style={{ flex: 1, paddingHorizontal: 14 }}
                    ref={scrollViewRef}
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                    contentContainerStyle={{ paddingTop: 14, paddingBottom: 10 }}
                >
                    <Text style={{ textAlign: 'center', fontSize: 11, color: colors.textMuted, marginBottom: 16 }}>
                        Today
                    </Text>

                    {loading ? (
                        <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.senderId === user?.id;
                            const isSelected = selectedMessages.includes(msg.id);
                            return (
                                <TouchableOpacity
                                    key={msg.id}
                                    activeOpacity={0.9}
                                    onPress={() => selectedMessages.length > 0 && toggleMessageSelection(msg.id)}
                                    onLongPress={() => toggleMessageSelection(msg.id)}
                                    style={{
                                        flexDirection: 'row',
                                        justifyContent: isMe ? 'flex-end' : 'flex-start',
                                        marginBottom: 16,
                                        alignItems: 'flex-end',
                                        gap: 8,
                                        backgroundColor: isSelected ? colors.primary + '15' : 'transparent',
                                        borderRadius: 8,
                                        padding: 4
                                    }}
                                >
                                    {!isMe && (
                                        <Image
                                            source={{ uri: chatMeta?.otherParticipant?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(chatMeta?.otherParticipant?.name || 'User')}&background=random` }}
                                            style={{ width: 28, height: 28, borderRadius: 14, flexShrink: 0, backgroundColor: colors.surfaceHighlight }}
                                        />
                                    )}
                                    <View style={{ maxWidth: '75%' }}>
                                        <View style={{
                                            paddingHorizontal: 14, paddingVertical: 10,
                                            borderRadius: 18,
                                            borderBottomRightRadius: isMe ? 4 : 18,
                                            borderBottomLeftRadius: isMe ? 18 : 4,
                                            backgroundColor: isMe ? colors.primary : colors.surface,
                                            borderWidth: isMe ? 0 : 1,
                                            borderColor: colors.border,
                                        }}>
                                            <Text style={{
                                                fontSize: 14, lineHeight: 20,
                                                color: isMe ? 'white' : colors.textPrimary,
                                            }}>
                                                {msg.text}
                                            </Text>
                                        </View>
                                        <View style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: isMe ? 'flex-end' : 'flex-start',
                                            marginTop: 4,
                                            paddingHorizontal: 4,
                                            gap: 4,
                                        }}>
                                            <Text style={{ fontSize: 10, color: colors.textMuted }}>
                                                {formatTime(msg.createdAt)}
                                            </Text>
                                            {isMe && (
                                                msg.status === 'read' ? (
                                                    <MaterialIcons name="done-all" size={14} color={colors.primary} />
                                                ) : msg.createdAt ? (
                                                    <MaterialIcons name="done-all" size={14} color={colors.textMuted} />
                                                ) : (
                                                    <MaterialIcons name="done" size={14} color={colors.textMuted} />
                                                )
                                            )}
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}
                    <View style={{ height: 8 }} />
                </ScrollView>

                {/* Input Area */}
                <View style={{
                    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
                    paddingHorizontal: 12, paddingVertical: 10,
                    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
                    backgroundColor: colors.surface,
                    borderTopWidth: 1, borderTopColor: colors.border,
                }}>
                    <TouchableOpacity style={{ padding: 8, marginBottom: 2 }}>
                        <MaterialIcons name="add-circle-outline" size={24} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TextInput
                        style={{
                            flex: 1, minHeight: 44, maxHeight: 120,
                            backgroundColor: colors.inputBg,
                            borderWidth: 1.5, borderColor: isSending ? colors.border : colors.primary + '40',
                            borderRadius: 22, paddingHorizontal: 16,
                            paddingVertical: 10, fontSize: 14, color: colors.textPrimary,
                        }}
                        placeholder="Type a message..."
                        placeholderTextColor={colors.textMuted}
                        multiline
                        value={message}
                        onChangeText={handleTyping}
                    />

                    {message.trim() ? (
                        <TouchableOpacity
                            onPress={handleSendMessage}
                            disabled={isSending}
                            style={{
                                width: 44, height: 44,
                                borderRadius: 22,
                                backgroundColor: isSending ? colors.primary + '80' : colors.primary,
                                alignItems: 'center', justifyContent: 'center',
                                marginBottom: 2,
                            }}
                        >
                            {isSending
                                ? <ActivityIndicator size="small" color="white" />
                                : <MaterialIcons name="send" size={20} color="white" />
                            }
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={{ padding: 8, marginBottom: 2 }}>
                            <MaterialIcons name="mic" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
