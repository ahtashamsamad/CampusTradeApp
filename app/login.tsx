import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, SafeAreaView,
    Platform, StatusBar, KeyboardAvoidingView, ScrollView,
    ActivityIndicator, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const validate = () => {
        const e: typeof errors = {};
        if (!email.trim()) e.email = 'Email is required';
        else if (!email.includes('@')) e.email = 'Enter a valid email';
        if (!password.trim()) e.password = 'Password is required';
        else if (password.length < 6) e.password = 'At least 6 characters';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleLogin = async () => {
        if (!validate()) return;
        setLoading(true);
        const result = await login(email.trim(), password);
        setLoading(false);
        if (result.success) {
            router.replace('/(tabs)' as any);
        } else {
            Alert.alert('Login Failed', result.error || 'Invalid credentials.');
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
            <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 }} keyboardShouldPersistTaps="always">

                    {/* Logo & Title */}
                    <View style={{ alignItems: 'center', marginBottom: 40 }}>
                        <View style={{
                            width: 72, height: 72, borderRadius: 22,
                            backgroundColor: colors.primary,
                            alignItems: 'center', justifyContent: 'center',
                            marginBottom: 20,
                            shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 },
                            shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
                        }}>
                            <MaterialIcons name="school" size={38} color="white" />
                        </View>
                        <Text style={{ fontSize: 28, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 }}>
                            Welcome Back
                        </Text>
                        <Text style={{ fontSize: 15, color: colors.textSecondary, marginTop: 6, textAlign: 'center' }}>
                            Sign in to your Campus Trade account
                        </Text>
                    </View>

                    {/* Form */}
                    <View style={{ gap: 16 }}>
                        {/* Email */}
                        <View>
                            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textPrimary, marginBottom: 6 }}>
                                Student Email
                            </Text>
                            <View style={{
                                flexDirection: 'row', alignItems: 'center',
                                backgroundColor: colors.inputBg, borderWidth: 1.5,
                                borderColor: errors.email ? '#ef4444' : email ? colors.primary : colors.inputBorder,
                                borderRadius: 14, paddingHorizontal: 14,
                                paddingVertical: Platform.OS === 'ios' ? 14 : 0,
                            }}>
                                <MaterialIcons name="email" size={20} color={errors.email ? '#ef4444' : colors.textSecondary} />
                                <TextInput
                                    style={{ flex: 1, marginLeft: 10, fontSize: 15, color: colors.textPrimary }}
                                    placeholder="you@university.edu"
                                    placeholderTextColor={colors.textMuted}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={email}
                                    onChangeText={t => { setEmail(t); if (errors.email) setErrors(p => ({ ...p, email: undefined })); }}
                                />
                            </View>
                            {errors.email && <Text style={{ color: '#ef4444', fontSize: 12, marginTop: 4, marginLeft: 4 }}>{errors.email}</Text>}
                        </View>

                        {/* Password */}
                        <View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textPrimary }}>Password</Text>
                                <TouchableOpacity onPress={() => router.push('/reset_password' as any)}>
                                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary }}>Forgot password?</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={{
                                flexDirection: 'row', alignItems: 'center',
                                backgroundColor: colors.inputBg, borderWidth: 1.5,
                                borderColor: errors.password ? '#ef4444' : password ? colors.primary : colors.inputBorder,
                                borderRadius: 14, paddingHorizontal: 14,
                                paddingVertical: Platform.OS === 'ios' ? 14 : 0,
                            }}>
                                <MaterialIcons name="lock" size={20} color={errors.password ? '#ef4444' : colors.textSecondary} />
                                <TextInput
                                    style={{ flex: 1, marginLeft: 10, fontSize: 15, color: colors.textPrimary }}
                                    placeholder="••••••••"
                                    placeholderTextColor={colors.textMuted}
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={t => { setPassword(t); if (errors.password) setErrors(p => ({ ...p, password: undefined })); }}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                                    <MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                            {errors.password && <Text style={{ color: '#ef4444', fontSize: 12, marginTop: 4, marginLeft: 4 }}>{errors.password}</Text>}
                        </View>

                        {/* Sign In Button */}
                        <TouchableOpacity
                            onPress={handleLogin}
                            disabled={loading}
                            style={{
                                backgroundColor: colors.primary, borderRadius: 14,
                                paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
                                marginTop: 8,
                                shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 },
                                shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
                                opacity: loading ? 0.8 : 1,
                            }}
                        >
                            {loading
                                ? <ActivityIndicator color="white" />
                                : <Text style={{ color: 'white', fontSize: 16, fontWeight: '800' }}>Sign In</Text>
                            }
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 }}>
                            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                            <Text style={{ color: colors.textMuted, fontSize: 13 }}>or continue with</Text>
                            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                        </View>

                        {/* Google / Apple */}
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            {[
                                { label: 'Google', icon: 'language' },
                                { label: 'Apple', icon: 'phone-iphone' },
                            ].map(({ label, icon }) => (
                                <TouchableOpacity
                                    key={label}
                                    onPress={() => Alert.alert(`${label} Sign In`, 'Social login coming soon!')}
                                    style={{
                                        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                                        gap: 8, paddingVertical: 13, borderRadius: 14,
                                        borderWidth: 1.5, borderColor: colors.border,
                                        backgroundColor: colors.surface,
                                    }}
                                >
                                    <MaterialIcons name={icon as any} size={20} color={colors.textPrimary} />
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>{label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 36, gap: 6 }}>
                        <Text style={{ color: colors.textSecondary, fontSize: 14 }}>{"Don't"} have an account?</Text>
                        <TouchableOpacity onPress={() => router.push('/signup' as any)}>
                            <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '700' }}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
