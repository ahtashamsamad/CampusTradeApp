import {
    View, Text, ScrollView, TouchableOpacity, SafeAreaView,
    Switch, Platform, StatusBar, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTheme, ThemeMode } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

export default function ProfileScreen() {
    const router = useRouter();
    const { colors, themeMode, setThemeMode, resolvedTheme } = useTheme();
    const { user, isLoggedIn, logout, updateUser } = useAuth();
    
    const notificationsEnabled = user?.preferences?.pushNotifications ?? true;

    const toggleNotifications = async (val: boolean) => {
        try {
            await updateUser({
                preferences: {
                    ...user?.preferences,
                    pushNotifications: val
                }
            });
        } catch (error) {
            console.error("Error updating notification preference:", error);
            Alert.alert("Error", "Could not save notification preference.");
        }
    };

    // — Auth guard: show login prompt if not logged in
    if (!isLoggedIn || !user) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 28, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
                <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />
                <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <MaterialIcons name="person" size={40} color={colors.primary} />
                </View>
                <Text style={{ fontSize: 24, fontWeight: '800', color: colors.textPrimary, marginBottom: 10 }}>
                    Sign In to Campus Trade
                </Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 32, lineHeight: 22 }}>
                    Sign in to manage your profile, listings, messages, and more.
                </Text>
                <TouchableOpacity
                    onPress={() => router.push('/login' as any)}
                    style={{ width: '100%', backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 12, shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 }}
                >
                    <Text style={{ color: 'white', fontSize: 15, fontWeight: '800' }}>Sign In</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => router.push('/signup' as any)}
                    style={{ width: '100%', borderWidth: 1.5, borderColor: colors.border, borderRadius: 14, paddingVertical: 15, alignItems: 'center' }}
                >
                    <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700' }}>Create Account</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const handleLogout = () => {
        Alert.alert('Log Out', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Log Out', style: 'destructive',
                onPress: async () => {
                    try {
                        console.log("Triggering logout flow...");
                        await logout();
                    } catch (error) {
                        console.error("HandleLogout Error:", error);
                        Alert.alert("Error", "Could not complete logout. Please try again.");
                    }
                }
            },
        ]);
    };

    return (
        <SafeAreaView style={{
            flex: 1, backgroundColor: colors.background,
            paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        }}>
            <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />

            {/* Header */}
            <View style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                paddingHorizontal: 16, paddingVertical: 13,
                borderBottomWidth: 1, borderBottomColor: colors.border,
                backgroundColor: colors.surface,
            }}>
                <View style={{ width: 40 }} />
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>Settings</Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: colors.primary }}>Done</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>

                    {/* Large Title */}
                    <Text style={{ fontSize: 30, fontWeight: '800', color: colors.textPrimary, marginBottom: 20, letterSpacing: -0.5 }}>
                        Settings
                    </Text>

                    {/* ── Profile Card ── */}
                    <TouchableOpacity
                        onPress={() => router.push('/edit_profile' as any)}
                        style={{
                            backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 24,
                            borderWidth: 1, borderColor: colors.border,
                            flexDirection: 'row', alignItems: 'center', gap: 14,
                        }}
                    >
                        {/* Avatar */}
                        <View style={{ position: 'relative', flexShrink: 0 }}>
                            <View style={{ width: 80, height: 80, borderRadius: 40, overflow: 'hidden', backgroundColor: colors.surfaceHighlight, borderWidth: 2.5, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                                <Image
                                    source={{ uri: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random` }}
                                    style={{ width: '100%', height: '100%' }}
                                    contentFit="cover"
                                />
                            </View>
                            {user.isVerified && (
                                <View style={{
                                    position: 'absolute', bottom: 0, right: 0,
                                    backgroundColor: colors.primary, borderRadius: 12, padding: 4,
                                    borderWidth: 2, borderColor: colors.surface,
                                }}>
                                    <MaterialIcons name="verified" size={12} color="white" />
                                </View>
                            )}
                        </View>

                        {/* User Info */}
                        <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={{ fontSize: 20, fontWeight: '800', color: colors.textPrimary }} numberOfLines={1}>
                                {user.name}
                            </Text>
                            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
                                {user.email}
                            </Text>
                            <Text style={{ fontSize: 12, color: colors.textSecondary }} numberOfLines={1}>
                                {user.university}
                            </Text>
                            <View style={{
                                backgroundColor: colors.primary + '25', paddingHorizontal: 8, paddingVertical: 3,
                                borderRadius: 20, alignSelf: 'flex-start', marginTop: 6,
                                flexDirection: 'row', gap: 6,
                            }}>
                                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                                    {user.classYear}
                                </Text>
                                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary, alignSelf: 'center' }} />
                                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                                    ID: {user.studentId}
                                </Text>
                            </View>
                            <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600', marginTop: 4 }}>
                                @{user.username}
                            </Text>
                        </View>

                        {/* Edit chevron */}
                        <View style={{ alignItems: 'center', gap: 4 }}>
                            <MaterialIcons name="edit" size={20} color={colors.primary} />
                            <Text style={{ fontSize: 10, color: colors.primary, fontWeight: '600' }}>Edit</Text>
                        </View>
                    </TouchableOpacity>

                    {/* ── Stats Row ── */}
                    <View style={{
                        backgroundColor: colors.surface, borderRadius: 14, padding: 16,
                        borderWidth: 1, borderColor: colors.border, marginBottom: 24,
                        flexDirection: 'row',
                    }}>
                        {[
                            { label: 'Saved', value: String((user.savedItems || []).length) },
                            { label: 'Sales', value: String(user.totalSales) },
                            { label: 'Member Since', value: user.memberSince },
                        ].map(({ label, value }, i, arr) => (
                            <View key={label} style={{ flex: 1, alignItems: 'center', borderRightWidth: i < arr.length - 1 ? 1 : 0, borderRightColor: colors.border }}>
                                <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary }}>{value}</Text>
                                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 3 }}>{label}</Text>
                            </View>
                        ))}
                    </View>

                    {/* ── Bio ── */}
                    {user.bio ? (
                        <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 24 }}>
                            <Text style={{ fontSize: 13, color: colors.textSecondary, fontStyle: 'italic', lineHeight: 20 }}>
                                "{user.bio}"
                            </Text>
                        </View>
                    ) : null}

                    {/* ── Account Section ── */}
                    <SectionLabel label="Account" colors={colors} />
                    <SettingsGroup colors={colors}>
                        <SettingsItem
                            icon="person" iconColor="#60a5fa" iconBg="rgba(59,130,246,0.15)"
                            title="Edit Profile" subtitle="Name, bio, photo, contact" colors={colors}
                            onPress={() => router.push('/edit_profile' as any)}
                        />
                        <SettingsItem
                            icon="storefront" iconColor="#34d399" iconBg="rgba(52,211,153,0.15)"
                            title="My Listings" subtitle="Manage active and past listings" colors={colors}
                            hasBorder={false}
                            onPress={() => router.push('/manage_listings' as any)}
                        />
                    </SettingsGroup>

                    {/* ── Preferences Section ── */}
                    <SectionLabel label="Preferences" colors={colors} />
                    <View style={{
                        backgroundColor: colors.surface, borderRadius: 16, overflow: 'hidden',
                        borderWidth: 1, borderColor: colors.border, marginBottom: 20,
                    }}>
                        {/* Push Notifications */}
                        <View style={{
                            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                            padding: 14, borderBottomWidth: 1, borderBottomColor: colors.border + '80',
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(248,113,113,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                                    <MaterialIcons name="notifications" size={20} color="#f87171" />
                                </View>
                                <View>
                                    <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>Push Notifications</Text>
                                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>Messages, offers, price drops</Text>
                                </View>
                            </View>
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={toggleNotifications}
                                trackColor={{ false: colors.surfaceHighlight, true: colors.primary }}
                                thumbColor={Platform.OS === 'ios' ? undefined : '#f8fafc'}
                            />
                        </View>

                        {/* Appearance / Theme */}
                        <View style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: colors.border + '80' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(192,132,252,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                                    <MaterialIcons name="palette" size={20} color="#c084fc" />
                                </View>
                                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>Appearance</Text>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 8, backgroundColor: colors.surfaceHighlight + '55', borderRadius: 12, padding: 4 }}>
                                {([
                                    { mode: 'light' as ThemeMode, icon: 'light-mode', label: 'Light' },
                                    { mode: 'dark' as ThemeMode, icon: 'dark-mode', label: 'Dark' },
                                    { mode: 'system' as ThemeMode, icon: 'settings-suggest', label: 'System' },
                                ]).map(({ mode, icon, label }) => {
                                    const isActive = themeMode === mode;
                                    return (
                                        <TouchableOpacity
                                            key={mode}
                                            onPress={() => setThemeMode(mode)}
                                            style={{
                                                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                                                gap: 5, paddingVertical: 9, borderRadius: 9,
                                                backgroundColor: isActive ? colors.primary : 'transparent',
                                            }}
                                        >
                                            <MaterialIcons name={icon as any} size={16} color={isActive ? '#fff' : colors.textSecondary} />
                                            <Text style={{ fontSize: 13, fontWeight: isActive ? '700' : '500', color: isActive ? '#fff' : colors.textSecondary }}>
                                                {label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                            <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 8, marginLeft: 2 }}>
                                {themeMode === 'system' ? `Following system (currently ${resolvedTheme})` : `Locked to ${themeMode} mode`}
                            </Text>
                        </View>

                        </View>
                    
                    {/* ── Support Section ── */}
                    <SectionLabel label="Support" colors={colors} />
                    <SettingsGroup colors={colors}>
                        <SettingsItem
                            icon="help" iconColor="#fb923c" iconBg="rgba(251,146,60,0.15)"
                            title="Help Center" subtitle="FAQs and how-to guides" colors={colors}
                            onPress={() => Alert.alert('Help Center', 'Visit campustrade.app/help\n\nOr email us at help@campustrade.app')}
                        />
                        <SettingsItem
                            icon="diversity-3" iconColor="#2dd4bf" iconBg="rgba(45,212,191,0.15)"
                            title="Community Guidelines" subtitle="How to trade safely" colors={colors}
                            hasBorder={false}
                            onPress={() => Alert.alert('Community Guidelines', '• Be honest about item condition\n• Meet in public campus spaces\n• No counterfeit goods\n• Respect other students')}
                        />

                    </SettingsGroup>

                    {/* ── Footer ── */}
                    <View style={{ alignItems: 'center', gap: 14, marginTop: 8 }}>
                        <TouchableOpacity
                            onPress={handleLogout}
                            style={{
                                width: '100%', backgroundColor: colors.surface,
                                borderWidth: 1.5, borderColor: '#ef4444' + '60',
                                paddingVertical: 14, borderRadius: 14, alignItems: 'center',
                                flexDirection: 'row', justifyContent: 'center', gap: 8,
                            }}
                        >
                            <MaterialIcons name="logout" size={18} color="#ef4444" />
                            <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 15 }}>Log Out</Text>
                        </TouchableOpacity>
                        <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: '500' }}>
                            Campus Trade v2.4.1 · {user.email}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// ── Sub-components ──────────────────────────────

function SectionLabel({ label, colors }: { label: string; colors: any }) {
    return (
        <Text style={{
            fontSize: 11, fontWeight: '700', color: colors.textMuted,
            textTransform: 'uppercase', letterSpacing: 1.2,
            marginBottom: 8, marginLeft: 4, marginTop: 4,
        }}>
            {label}
        </Text>
    );
}

function SettingsGroup({ children, colors }: { children: React.ReactNode; colors: any }) {
    return (
        <View style={{
            backgroundColor: colors.surface, borderRadius: 16,
            overflow: 'hidden', borderWidth: 1, borderColor: colors.border, marginBottom: 20,
        }}>
            {children}
        </View>
    );
}

function SettingsItem({ icon, iconColor, iconBg, title, subtitle, hasBorder = true, onPress, colors }: any) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                padding: 14,
                ...(hasBorder ? { borderBottomWidth: 1, borderBottomColor: colors.border + '80' } : {}),
            }}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialIcons name={icon} size={20} color={iconColor} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>{title}</Text>
                    {subtitle && <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 1 }}>{subtitle}</Text>}
                </View>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
    );
}
