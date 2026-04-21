import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, SafeAreaView,
    Platform, StatusBar, KeyboardAvoidingView, ScrollView,
    ActivityIndicator, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth, SignupData } from '@/context/AuthContext';
import app from '@/src/config/firebase';

const UNIVERSITIES = [
    'University of Design', 'State University', 'Tech Institute',
    'Liberal Arts College', 'Community College', 'Other',
];
const YEARS = ["Class of '25", "Class of '26", "Class of '27", "Class of '28", 'Graduate'];

const Field = ({ label, field, placeholder, colors, form, errors, update, keyboardType = 'default', secure = false, showToggle = false, onToggle = () => { }, showPwd = false }: any) => (
    <View>
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textPrimary, marginBottom: 6 }}>{label}</Text>
        <View style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: colors.inputBg, borderWidth: 1.5,
            borderColor: errors[field] ? '#ef4444' : form[field] ? colors.primary : colors.inputBorder,
            borderRadius: 14, paddingHorizontal: 14,
            paddingVertical: Platform.OS === 'ios' ? 14 : 0,
        }}>
            <TextInput
                style={{ flex: 1, fontSize: 15, color: colors.textPrimary }}
                placeholder={placeholder}
                placeholderTextColor={colors.textMuted}
                keyboardType={keyboardType}
                autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
                secureTextEntry={secure && !showPwd}
                value={form[field]}
                onChangeText={t => update(field, t)}
            />
            {showToggle && (
                <TouchableOpacity onPress={onToggle} style={{ padding: 4 }}>
                    <MaterialIcons name={showPwd ? 'visibility' : 'visibility-off'} size={20} color={colors.textSecondary} />
                </TouchableOpacity>
            )}
        </View>
        {errors[field] && <Text style={{ color: '#ef4444', fontSize: 12, marginTop: 4, marginLeft: 4 }}>{errors[field]}</Text>}
    </View>
);

export default function SignupScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const { signup } = useAuth();

    const [step, setStep] = useState(1); // 2-step form
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [form, setForm] = useState({
        name: '', username: '', email: '', password: '', confirmPassword: '',
        university: '', studentId: '', major: '', classYear: "Class of '27",
        phone: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const update = (field: string, value: string) => {
        setForm(p => ({ ...p, [field]: value }));
        if (errors[field]) setErrors(p => { const n = { ...p }; delete n[field]; return n; });
    };

    const validateStep1 = () => {
        const e: Record<string, string> = {};
        if (!form.name.trim()) e.name = 'Full name is required';
        if (!form.username.trim()) e.username = 'Username is required';
        if (!form.email.trim()) e.email = 'Email is required';
        else if (!form.email.includes('@')) e.email = 'Enter a valid email';
        if (!form.password) e.password = 'Password is required';
        else if (form.password.length < 6) e.password = 'At least 6 characters';
        if (!form.phone.trim()) e.phone = 'Phone number is required';
        if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const validateStep2 = () => {
        const e: Record<string, string> = {};
        if (!form.university) e.university = 'Please select your university';
        if (!form.studentId.trim()) e.studentId = 'Student ID is required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleNext = () => {
        if (validateStep1()) setStep(2);
    };

    const handleSignup = async () => {
        if (!validateStep2()) return;
        setLoading(true);
        const result = await signup(form as SignupData);
        setLoading(false);
        if (result.success) {
            router.replace('/(tabs)' as any);
        } else {
            Alert.alert('Sign Up Failed', result.error || 'Something went wrong.');
        }
    };


    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
            <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 32 }} keyboardShouldPersistTaps="always">

                    {/* Back */}
                    <TouchableOpacity onPress={() => step === 1 ? router.back() : setStep(1)} style={{ marginBottom: 24 }}>
                        <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>

                    {/* Progress */}
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 28 }}>
                        {[1, 2].map(s => (
                            <View key={s} style={{
                                flex: 1, height: 4, borderRadius: 2,
                                backgroundColor: s <= step ? colors.primary : colors.surfaceHighlight,
                            }} />
                        ))}
                    </View>

                    {/* Header */}
                    <Text style={{ fontSize: 28, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5, marginBottom: 6 }}>
                        {step === 1 ? 'Create Account' : 'Your University'}
                    </Text>
                    <Text style={{ fontSize: 15, color: colors.textSecondary, marginBottom: 28 }}>
                        {step === 1 ? 'Join thousands of campus traders' : 'Tell us about your studies'}
                    </Text>

                    {step === 1 ? (
                        <View style={{ gap: 16 }}>
                            <Field label="Full Name" field="name" placeholder="Alex Student" colors={colors} form={form} errors={errors} update={update} />
                            <Field label="Username" field="username" placeholder="alex_s" colors={colors} form={form} errors={errors} update={update} />
                            <Field label="Student Email" field="email" placeholder="you@university.edu" keyboardType="email-address" colors={colors} form={form} errors={errors} update={update} />
                            <Field label="Password" field="password" placeholder="Min. 6 characters" secure showToggle onToggle={() => setShowPassword(!showPassword)} showPwd={showPassword} colors={colors} form={form} errors={errors} update={update} />
                            <Field label="Confirm Password" field="confirmPassword" placeholder="Re-enter password" secure showToggle onToggle={() => setShowConfirm(!showConfirm)} showPwd={showConfirm} colors={colors} form={form} errors={errors} update={update} />
                            <Field label="Phone Number" field="phone" placeholder="+1 (555) 000-0000" keyboardType="phone-pad" colors={colors} form={form} errors={errors} update={update} />

                            <TouchableOpacity
                                onPress={handleNext}
                                style={{
                                    backgroundColor: colors.primary, borderRadius: 14,
                                    paddingVertical: 16, alignItems: 'center', marginTop: 8,
                                    shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 },
                                    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
                                }}
                            >
                                <Text style={{ color: 'white', fontSize: 16, fontWeight: '800' }}>Continue →</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={{ gap: 16 }}>
                            {/* University picker */}
                            <View>
                                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 }}>University *</Text>
                                {UNIVERSITIES.map(u => (
                                    <TouchableOpacity
                                        key={u}
                                        onPress={() => update('university', u)}
                                        style={{
                                            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                                            padding: 14, borderRadius: 12,
                                            marginBottom: 8,
                                            backgroundColor: form.university === u ? colors.primary + '15' : colors.surface,
                                            borderWidth: 1.5,
                                            borderColor: form.university === u ? colors.primary : colors.border,
                                        }}
                                    >
                                        <Text style={{ fontSize: 14, fontWeight: '600', color: form.university === u ? colors.primary : colors.textPrimary }}>
                                            {u}
                                        </Text>
                                        {form.university === u && <MaterialIcons name="check-circle" size={20} color={colors.primary} />}
                                    </TouchableOpacity>
                                ))}
                                {errors.university && <Text style={{ color: '#ef4444', fontSize: 12, marginTop: 2, marginLeft: 4 }}>{errors.university}</Text>}
                            </View>

                            <Field label="Student ID" field="studentId" placeholder="e.g. 12345678" keyboardType="number-pad" colors={colors} form={form} errors={errors} update={update} />
                            <Field label="Major / Program" field="major" placeholder="e.g. Computer Science" colors={colors} form={form} errors={errors} update={update} />

                            {/* Class Year Picker */}
                            <View>
                                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 }}>Class Year</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                                    {YEARS.map(y => (
                                        <TouchableOpacity
                                            key={y}
                                            onPress={() => update('classYear', y)}
                                            style={{
                                                paddingHorizontal: 16, paddingVertical: 9,
                                                borderRadius: 24, borderWidth: 1.5,
                                                backgroundColor: form.classYear === y ? colors.primary : colors.surface,
                                                borderColor: form.classYear === y ? colors.primary : colors.border,
                                            }}
                                        >
                                            <Text style={{ fontSize: 13, fontWeight: '600', color: form.classYear === y ? 'white' : colors.textSecondary }}>{y}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            <TouchableOpacity
                                onPress={handleSignup}
                                disabled={loading}
                                style={{
                                    backgroundColor: colors.primary, borderRadius: 14,
                                    paddingVertical: 16, alignItems: 'center', marginTop: 8,
                                    shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 },
                                    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
                                    opacity: loading ? 0.8 : 1,
                                }}
                            >
                                {loading
                                    ? <ActivityIndicator color="white" />
                                    : <Text style={{ color: 'white', fontSize: 16, fontWeight: '800' }}>Create Account 🎓</Text>
                                }
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 28, gap: 6 }}>
                        <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Already have an account?</Text>
                        <TouchableOpacity onPress={() => router.push('/login' as any)}>
                            <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '700' }}>Sign In</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
