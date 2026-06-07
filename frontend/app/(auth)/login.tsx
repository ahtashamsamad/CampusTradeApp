import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

export default function LoginScreen() {
    const router = useRouter();
    const { login, signInWithGoogle } = useAuth();

    const { colors } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const validate = () => {
        const nextErrors: typeof errors = {};
        if (!email.trim()) nextErrors.email = 'Email is required';
        else if (!email.includes('@')) nextErrors.email = 'Enter a valid email address';
        if (!password.trim()) nextErrors.password = 'Password is required';
        else if (password.length < 6) nextErrors.password = 'At least 6 characters';

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleLogin = async () => {
        if (!validate()) return;

        setLoading(true);
        const result = await login(email.trim(), password);
        setLoading(false);

        if (result.success) {
            router.replace('/(tabs)' as any);
            return;
        }

        if (result.unverified) {
            Alert.alert('Email not verified', result.error || 'Please verify your email before signing in.');
            return;
        }

        Alert.alert('Login failed', result.error || 'Please check your email and password and try again.');
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        const result = await signInWithGoogle();
        setLoading(false);

        if (result.success) {
            router.replace('/(tabs)' as any);
            return;
        }

        Alert.alert('Google Sign-In', result.error || 'Unable to sign in with Google. Please try again.');
    };

    const handleBrowseAsGuest = () => {
        Alert.alert('Browse as Guest', 'You can explore the marketplace anonymously. Some features may require signing up.');
        router.replace('/(tabs)' as any);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    style={{ flex: 1, paddingHorizontal: 24 }}
                    contentContainerStyle={{ paddingVertical: 32 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={{ alignItems: 'center', marginBottom: 40 }}>
                        <View style={{ marginBottom: 20, borderRadius: 24, backgroundColor: colors.primary, padding: 20, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 }}>
                            <MaterialIcons name="school" size={34} color="white" />
                        </View>
                        <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.textPrimary }}>Welcome back</Text>
                        <Text style={{ marginTop: 8, textAlign: 'center', fontSize: 14, color: colors.textSecondary }}>
                            Sign in with your student email or continue as a guest.
                        </Text>
                    </View>

                    <View style={{ gap: 20 }}>
                        <View style={{ gap: 12 }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>Email</Text>
                            <View style={{ borderRadius: 24, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <MaterialIcons name="email" size={20} color={colors.textSecondary} />
                                <TextInput
                                    style={{ flex: 1, fontSize: 16, color: colors.textPrimary }}
                                    placeholder="student@university.edu"
                                    placeholderTextColor={colors.textSecondary}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={email}
                                    onChangeText={text => {
                                        setEmail(text);
                                        if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                                    }}
                                />
                            </View>
                            {errors.email ? <Text style={{ marginTop: 8, fontSize: 12, color: '#ef4444' }}>{errors.email}</Text> : null}
                        </View>

                        <View style={{ gap: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>Password</Text>
                                <TouchableOpacity onPress={() => router.push('/reset_password' as any)}>
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>Forgot password?</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={{ borderRadius: 24, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <MaterialIcons name="lock" size={20} color={colors.textSecondary} />
                                <TextInput
                                    style={{ flex: 1, fontSize: 16, color: colors.textPrimary }}
                                    placeholder="Enter your password"
                                    placeholderTextColor={colors.textSecondary}
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={text => {
                                        setPassword(text);
                                        if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                                    }}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(prev => !prev)}>
                                    <MaterialIcons
                                        name={showPassword ? 'visibility' : 'visibility-off'}
                                        size={20}
                                        color={colors.textSecondary}
                                    />
                                </TouchableOpacity>
                            </View>
                            {errors.password ? <Text style={{ marginTop: 8, fontSize: 12, color: '#ef4444' }}>{errors.password}</Text> : null}
                        </View>

                        <TouchableOpacity
                            onPress={handleLogin}
                            disabled={loading}
                            style={{ borderRadius: 24, backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 5 }}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>Login</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleGoogleSignIn}
                            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, borderRadius: 24, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 20, paddingVertical: 16 }}
                        >
                            <AntDesign name="google" size={20} color={colors.textPrimary} />
                            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary }}>Continue with Google</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleBrowseAsGuest} style={{ alignItems: 'center', paddingVertical: 12 }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary }}>Browse as Guest</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ marginTop: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <Text style={{ fontSize: 14, color: colors.textSecondary }}>Don't have an account?</Text>
                        <TouchableOpacity onPress={() => router.push('/signup' as any)}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
