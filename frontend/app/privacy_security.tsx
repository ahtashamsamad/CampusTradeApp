import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, SafeAreaView, Platform, StatusBar,
    ScrollView, Switch, Alert, TextInput, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/src/config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

// ── Privacy field keys (map directly to Firestore document fields) ──
type PrivacyField = 'isPublicProfile' | 'showEmail' | 'showPhoneNumber' | 'showActivityStatus';

const PRIVACY_DEFAULTS: Record<PrivacyField, boolean> = {
    isPublicProfile: true,
    showEmail: false,
    showPhoneNumber: false,
    showActivityStatus: true,
};

export default function PrivacySecurityScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const { user, deleteAccount } = useAuth();

    // ── Privacy toggle state ──
    const [privacy, setPrivacy] = useState<Record<PrivacyField, boolean>>(PRIVACY_DEFAULTS);
    const [loadingPrivacy, setLoadingPrivacy] = useState(true);

    // ── Password form state ──
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
    const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });

    // ────────────────────────────────────────────────────────
    // 1. Fetch initial privacy values from Firestore
    // ────────────────────────────────────────────────────────
    useEffect(() => {
        if (!user?.id) {
            setLoadingPrivacy(false);
            return;
        }

        const fetchPrivacy = async () => {
            try {
                const userRef = doc(db, 'users', user.id);
                const snap = await getDoc(userRef);

                if (snap.exists()) {
                    const data = snap.data();
                    setPrivacy({
                        isPublicProfile: data.isPublicProfile ?? PRIVACY_DEFAULTS.isPublicProfile,
                        showEmail: data.showEmail ?? PRIVACY_DEFAULTS.showEmail,
                        showPhoneNumber: data.showPhoneNumber ?? PRIVACY_DEFAULTS.showPhoneNumber,
                        showActivityStatus: data.showActivityStatus ?? PRIVACY_DEFAULTS.showActivityStatus,
                    });
                }
            } catch (err) {
                console.error('[Privacy] Error fetching settings:', err);
            } finally {
                setLoadingPrivacy(false);
            }
        };

        fetchPrivacy();
    }, [user?.id]);

    // ────────────────────────────────────────────────────────
    // 2. Universal toggle handler — instant UI + Firestore sync
    // ────────────────────────────────────────────────────────
    const handleToggle = useCallback(async (field: PrivacyField, newValue: boolean) => {
        if (!user?.id) return;

        // Optimistic: switch immediately for instant visual feedback
        const previousValue = privacy[field];
        setPrivacy(prev => ({ ...prev, [field]: newValue }));

        try {
            const userRef = doc(db, 'users', user.id);
            await updateDoc(userRef, { [field]: newValue });
            console.log(`[Privacy] ✅ ${field} updated to ${newValue}`);
        } catch (err: any) {
            console.error(`[Privacy] ❌ Failed to update ${field}:`, err.message);
            // Revert to prevent UI/Database mismatch
            setPrivacy(prev => ({ ...prev, [field]: previousValue }));
            Alert.alert('Update Failed', 'Could not save your preference. Please try again.');
        }
    }, [user?.id, privacy]);

    // ────────────────────────────────────────────────────────
    // Password change handler (kept from original)
    // ────────────────────────────────────────────────────────
    const handleChangePassword = () => {
        if (!pwForm.current) { Alert.alert('Error', 'Enter your current password.'); return; }
        if (pwForm.newPw.length < 6) { Alert.alert('Error', 'New password must be at least 6 characters.'); return; }
        if (pwForm.newPw !== pwForm.confirm) { Alert.alert('Error', 'Passwords do not match.'); return; }
        Alert.alert('✅ Password Changed', 'Your password has been updated successfully.', [
            { text: 'OK', onPress: () => { setShowChangePassword(false); setPwForm({ current: '', newPw: '', confirm: '' }); } },
        ]);
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            '⚠️ Delete Account',
            'This will permanently delete your account and all your listings. This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Account', style: 'destructive',
                    onPress: async () => {
                        try {
                            const result = await deleteAccount();
                            if (result.success) {
                                Alert.alert('Account Deleted', 'Your account and data have been removed.');
                                // Auth state change will handle navigation
                            } else {
                                Alert.alert('Deletion Failed', result.error);
                            }
                        } catch (err: any) {
                            Alert.alert('Error', err.message || 'Could not complete deletion.');
                        }
                    }
                },
            ]
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
            <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />

            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface }}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 14 }}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPrimary, flex: 1 }}>Privacy & Security</Text>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 60 }}>

                {/* ═══════ PRIVACY ═══════ */}
                <SectionHeader label="Privacy" colors={colors} />
                <SettingsCard colors={colors}>
                    {loadingPrivacy ? (
                        <View style={{ padding: 30, alignItems: 'center' }}>
                            <ActivityIndicator size="small" color={colors.primary} />
                            <Text style={{ color: colors.textSecondary, marginTop: 8, fontSize: 13 }}>Loading settings...</Text>
                        </View>
                    ) : (
                        <>
                            <SwitchRow
                                colors={colors} icon="public" iconColor="#60a5fa" iconBg="rgba(96,165,250,0.15)"
                                title="Public Profile" subtitle="Anyone can view your profile and listings"
                                value={privacy.isPublicProfile}
                                onChange={(v: boolean) => handleToggle('isPublicProfile', v)}
                            />
                            <SwitchRow
                                colors={colors} icon="email" iconColor="#34d399" iconBg="rgba(52,211,153,0.15)"
                                title="Show Email" subtitle="Display your email on your public profile"
                                value={privacy.showEmail}
                                onChange={(v: boolean) => handleToggle('showEmail', v)}
                            />
                            <SwitchRow
                                colors={colors} icon="phone" iconColor="#fbbf24" iconBg="rgba(251,191,36,0.15)"
                                title="Show Phone Number" subtitle="Display your phone number to buyers"
                                value={privacy.showPhoneNumber}
                                onChange={(v: boolean) => handleToggle('showPhoneNumber', v)}
                            />
                            <SwitchRow
                                colors={colors} icon="circle" iconColor="#22c55e" iconBg="rgba(34,197,94,0.15)"
                                title="Activity Status" subtitle="Show when you were last active" last
                                value={privacy.showActivityStatus}
                                onChange={(v: boolean) => handleToggle('showActivityStatus', v)}
                            />
                        </>
                    )}
                </SettingsCard>

                {/* ═══════ PASSWORD ═══════ */}
                <SectionHeader label="Password" colors={colors} />
                <SettingsCard colors={colors}>
                    <TouchableOpacity
                        onPress={() => setShowChangePassword(!showChangePassword)}
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(192,132,252,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                                <MaterialIcons name="lock-reset" size={20} color="#c084fc" />
                            </View>
                            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>Change Password</Text>
                        </View>
                        <MaterialIcons name={showChangePassword ? 'expand-less' : 'expand-more'} size={20} color={colors.textSecondary} />
                    </TouchableOpacity>

                    {showChangePassword && (
                        <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 12, borderTopWidth: 1, borderTopColor: colors.border + '60' }}>
                            {[
                                { key: 'current', label: 'Current Password', showK: 'current' as const },
                                { key: 'newPw', label: 'New Password', showK: 'newPw' as const },
                                { key: 'confirm', label: 'Confirm New Password', showK: 'confirm' as const },
                            ].map(({ key, label, showK }) => (
                                <View key={key} style={{ marginTop: 12 }}>
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 }}>{label}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 10, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 12 : 0 }}>
                                        <TextInput
                                            style={{ flex: 1, fontSize: 14, color: colors.textPrimary }}
                                            secureTextEntry={!showPw[showK]}
                                            placeholder="••••••••"
                                            placeholderTextColor={colors.textMuted}
                                            value={pwForm[key as keyof typeof pwForm]}
                                            onChangeText={t => setPwForm(p => ({ ...p, [key]: t }))}
                                        />
                                        <TouchableOpacity onPress={() => setShowPw(p => ({ ...p, [showK]: !p[showK] }))}>
                                            <MaterialIcons name={showPw[showK] ? 'visibility' : 'visibility-off'} size={18} color={colors.textSecondary} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                            <TouchableOpacity
                                onPress={handleChangePassword}
                                style={{ backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 8 }}
                            >
                                <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>Update Password</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </SettingsCard>

                {/* ═══════ DATA & ACCOUNT ═══════ */}
                <SectionHeader label="Data & Account" colors={colors} />
                <SettingsCard colors={colors}>

                    <TouchableOpacity
                        onPress={handleDeleteAccount}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}
                    >
                        <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                            <MaterialIcons name="delete-forever" size={20} color="#ef4444" />
                        </View>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: '#ef4444' }}>Delete Account</Text>
                    </TouchableOpacity>
                </SettingsCard>
            </ScrollView>
        </SafeAreaView>
    );
}

function SectionHeader({ label, colors }: any) {
    return (
        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 }}>
            {label}
        </Text>
    );
}

function SettingsCard({ children, colors }: any) {
    return (
        <View style={{ marginHorizontal: 16, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: 4 }}>
            {children}
        </View>
    );
}

function SwitchRow({ colors, icon, iconColor, iconBg, title, subtitle, value, onChange, last = false }: any) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.border + '60' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialIcons name={icon} size={20} color={iconColor} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>{title}</Text>
                    {subtitle && <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 1 }}>{subtitle}</Text>}
                </View>
            </View>
            <Switch value={value} onValueChange={onChange} trackColor={{ false: colors.surfaceHighlight, true: colors.primary }} thumbColor={Platform.OS === 'ios' ? undefined : '#f8fafc'} />
        </View>
    );
}
