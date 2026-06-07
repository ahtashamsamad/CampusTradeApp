import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar, Switch, TextInput, Alert, StyleSheet, LayoutAnimation } from 'react-native';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

export default function AdminSettings() {
    const router = useRouter();
    const { colors, themeMode, setThemeMode } = useTheme();
    const { logout } = useAuth();
    
    // Toggles
    const [registrationsEnabled, setRegistrationsEnabled] = useState(true);
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [emailNotifications, setEmailNotifications] = useState(true);
    
    // Inputs
    const [commissionRate, setCommissionRate] = useState('5');
    const [language, setLanguage] = useState('English');
    
    // Collapsible Sections State
    const [expandedSections, setExpandedSections] = useState({
        account: true,
        app: false,
        notifications: false,
        security: false,
        about: false
    });

    const toggleSection = (section: keyof typeof expandedSections) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleClearCache = () => {
        Alert.alert('Clear Cache', 'Are you sure you want to clear the application cache?', [
            { text: 'Cancel' },
            { text: 'Clear', onPress: () => Alert.alert('Success', 'Cache cleared successfully') }
        ]);
    };

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to exit the admin panel?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: async () => {
                await logout();
                router.replace('/login');
            }}
        ]);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle={colors.statusBarStyle} />

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
                
                {/* Appearance Section (Always Visible) */}
                <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 4, marginTop: 8 }}>Appearance</Text>
                <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <SettingRow 
                        icon="palette" 
                        label="Dark Mode" 
                        colors={colors}
                        right={
                            <Switch
                                value={themeMode === 'dark'}
                                onValueChange={(val) => setThemeMode(val ? 'dark' : 'light')}
                                trackColor={{ false: colors.surfaceHighlight, true: colors.primary }}
                            />
                        }
                    />
                    <SettingRow 
                        icon="language" 
                        label="Language" 
                        colors={colors}
                        right={<Text style={{ color: colors.primary, fontWeight: '700' }}>{language}</Text>}
                        onPress={() => Alert.alert('Select Language', 'Multi-language support coming soon')}
                    />
                </View>

                {/* Collapsible: Account Settings */}
                <SectionHeader 
                    label="Account Settings" 
                    icon="person" 
                    isExpanded={expandedSections.account} 
                    onToggle={() => toggleSection('account')} 
                    colors={colors} 
                />
                {expandedSections.account && (
                    <Animated.View entering={FadeIn} exiting={FadeOut} style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <SettingRow icon="lock" label="Change Password" colors={colors} onPress={() => Alert.alert('Security', 'Password reset link sent to admin email')} />
                        <SettingRow icon="security" label="Two-Factor Auth" colors={colors} right={<Text style={{ color: colors.textMuted }}>Enabled</Text>} />
                    </Animated.View>
                )}

                {/* Collapsible: App Settings */}
                <SectionHeader 
                    label="App Settings" 
                    icon="settings" 
                    isExpanded={expandedSections.app} 
                    onToggle={() => toggleSection('app')} 
                    colors={colors} 
                />
                {expandedSections.app && (
                    <Animated.View entering={FadeIn} exiting={FadeOut} style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <SettingRow 
                            icon="person-add" 
                            label="New Registrations" 
                            colors={colors} 
                            right={<Switch value={registrationsEnabled} onValueChange={setRegistrationsEnabled} trackColor={{ false: colors.surfaceHighlight, true: colors.primary }} />} 
                        />
                        <SettingRow 
                            icon="construction" 
                            label="Maintenance Mode" 
                            colors={colors} 
                            right={<Switch value={maintenanceMode} onValueChange={setMaintenanceMode} trackColor={{ false: colors.surfaceHighlight, true: colors.primary }} />} 
                        />
                        <SettingRow 
                            icon="payments" 
                            label="Commission Rate (%)" 
                            colors={colors} 
                            right={
                                <TextInput 
                                    value={commissionRate} 
                                    onChangeText={setCommissionRate}
                                    keyboardType="numeric"
                                    style={{ color: colors.primary, fontWeight: '700', textAlign: 'right', width: 40 }}
                                />
                            } 
                        />
                        <SettingRow icon="delete-sweep" label="Clear Cache" colors={colors} onPress={handleClearCache} />
                    </Animated.View>
                )}

                {/* Collapsible: Notifications */}
                <SectionHeader 
                    label="Notifications" 
                    icon="notifications" 
                    isExpanded={expandedSections.notifications} 
                    onToggle={() => toggleSection('notifications')} 
                    colors={colors} 
                />
                {expandedSections.notifications && (
                    <Animated.View entering={FadeIn} exiting={FadeOut} style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <SettingRow 
                            icon="email" 
                            label="Email Notifications" 
                            colors={colors} 
                            right={<Switch value={emailNotifications} onValueChange={setEmailNotifications} trackColor={{ false: colors.surfaceHighlight, true: colors.primary }} />} 
                        />
                        <SettingRow icon="campaign" label="System Announcements" colors={colors} onPress={() => router.push('/admin/announcements' as any)} />
                    </Animated.View>
                )}

                {/* Collapsible: Security & API */}
                <SectionHeader 
                    label="Security & API" 
                    icon="api" 
                    isExpanded={expandedSections.security} 
                    onToggle={() => toggleSection('security')} 
                    colors={colors} 
                />
                {expandedSections.security && (
                    <Animated.View entering={FadeIn} exiting={FadeOut} style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <SettingRow icon="vpn-key" label="View API Keys" colors={colors} onPress={() => Alert.alert('API Keys', 'Key: ****-****-5521\nEndpoint: https://api.campustrade.app/v1')} />
                        <SettingRow icon="link" label="Webhooks" colors={colors} onPress={() => {}} />
                    </Animated.View>
                )}

                {/* Collapsible: About */}
                <SectionHeader 
                    label="About" 
                    icon="info" 
                    isExpanded={expandedSections.about} 
                    onToggle={() => toggleSection('about')} 
                    colors={colors} 
                />
                {expandedSections.about && (
                    <Animated.View entering={FadeIn} exiting={FadeOut} style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <SettingRow label="App Version" value="1.2.4 (Production)" colors={colors} />
                        <SettingRow label="Last Backup" value="Today, 04:30 AM" colors={colors} />
                        <SettingRow label="Build Environment" value="Expo / React Native" colors={colors} />
                    </Animated.View>
                )}

                {/* Prominent Logout Button */}
                <TouchableOpacity 
                    onPress={handleLogout}
                    style={[styles.logoutBtn, { backgroundColor: '#ef4444' }]}
                >
                    <MaterialIcons name="logout" size={24} color="white" />
                    <Text style={styles.logoutBtnText}>Logout from Admin Portal</Text>
                </TouchableOpacity>

                <Text style={{ textAlign: 'center', color: colors.textMuted, fontSize: 12, marginTop: 20 }}>
                    Logged in as Admin | CampusTrade Inc.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const SectionHeader = ({ label, icon, isExpanded, onToggle, colors }: any) => (
    <TouchableOpacity 
        onPress={onToggle}
        activeOpacity={0.7}
        style={{ flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 12, marginLeft: 4 }}
    >
        <MaterialIcons name={icon} size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
        <Text style={{ flex: 1, fontSize: 13, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Text>
        <MaterialIcons name={isExpanded ? 'expand-less' : 'expand-more'} size={24} color={colors.textMuted} />
    </TouchableOpacity>
);

const SettingRow = ({ icon, label, value, right, colors, onPress }: any) => (
    <TouchableOpacity 
        onPress={onPress}
        disabled={!onPress}
        style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            padding: 16, 
            borderBottomWidth: 1, 
            borderBottomColor: colors.border + '50' 
        }}
    >
        {icon && (
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.surfaceHighlight, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <MaterialIcons name={icon} size={18} color={colors.primary} />
            </View>
        )}
        <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>{label}</Text>
            {value && <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{value}</Text>}
        </View>
        {right || (onPress && <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />)}
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
    logoutBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        paddingVertical: 16, 
        borderRadius: 16, 
        marginTop: 40,
        elevation: 4,
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    logoutBtnText: { color: 'white', fontWeight: '800', fontSize: 16, marginLeft: 12 }
});
