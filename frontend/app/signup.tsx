import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, SafeAreaView,
    Platform, StatusBar, KeyboardAvoidingView, ScrollView,
    ActivityIndicator, Alert,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth, SignupData } from '@/context/AuthContext';
import app from '@/src/config/firebase';



const Field = ({ label, field, placeholder, colors, form, errors, update, keyboardType = 'default', secure = false, showToggle = false, onToggle = () => { }, showPwd = false, maxLength }: any) => (
    <View>
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textPrimary, marginBottom: 6 }}>{label}</Text>
        <View style={{
            position: 'relative',
            backgroundColor: colors.inputBg, borderWidth: 1.5,
            borderColor: errors[field] ? '#ef4444' : form[field] ? colors.primary : colors.inputBorder,
            borderRadius: 14,
        }}>
            <TextInput
                style={{ 
                    fontSize: 15, color: colors.textPrimary,
                    paddingHorizontal: 14,
                    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
                    paddingRight: showToggle ? 40 : 14
                }}
                placeholder={placeholder}
                placeholderTextColor={colors.textMuted}
                keyboardType={keyboardType}
                autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
                secureTextEntry={secure ? !showPwd : false}
                value={form[field]}
                onChangeText={t => update(field, t)}
                maxLength={maxLength}
            />
            {showToggle && (
                <TouchableOpacity onPress={onToggle} style={{ 
                    position: 'absolute', 
                    right: 12, 
                    top: '50%',
                    marginTop: -10
                }}>
                    <Ionicons name={showPwd ? 'eye' : 'eye-off'} size={20} color={colors.textSecondary} />
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
        rollNumber: '', major: '', department: '', startYear: '',
        phone: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const update = (field: string, value: string) => {
        setForm(p => ({ ...p, [field]: value }));
        if (errors[field]) setErrors(p => { const n = { ...p }; delete n[field]; return n; });
    };

    const validatePhone = (phone: string): boolean => {
        const phoneRegex = /^03[0-9]{9}$/;
        return phoneRegex.test(phone.replace(/-/g, ''));
    };

    const handleNext = () => {
        if (!form.name.trim()) {
            Alert.alert('Validation Error', 'Please enter your full name');
            return;
        }
        if (!form.username.trim()) {
            Alert.alert('Validation Error', 'Please enter a username');
            return;
        }
        if (!form.email.trim() || !form.email.includes('@')) {
            Alert.alert('Validation Error', 'Please enter a valid email address');
            return;
        }
        if (form.password.length < 6) {
            Alert.alert('Validation Error', 'Password must be at least 6 characters');
            return;
        }
        if (form.password !== form.confirmPassword) {
            Alert.alert('Validation Error', 'Passwords do not match');
            return;
        }
        if (!validatePhone(form.phone)) {
            Alert.alert('Validation Error', 'Please enter a valid 11-digit Pakistani mobile number starting with 03');
            return;
        }
        
        // Clear any inline errors
        setErrors({});
        setStep(2);
    };

    const validateStep2 = () => {
        const e: Record<string, string> = {};
        if (!form.rollNumber.trim()) e.rollNumber = 'Roll Number is required';
        if (!form.major.trim()) e.major = 'Major is required';
        if (!form.department.trim()) e.department = 'Department is required';
        if (!form.startYear.trim()) e.startYear = 'Start Year is required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };



    const handleSignup = async () => {
        if (!validateStep2()) return;
        setLoading(true);
        const result = await signup(form as SignupData);
        setLoading(false);
        if (result.success) {
            Alert.alert(
                'Account Created!',
                'A verification email has been sent to your email address. Please verify your email before logging in.',
                [{ text: 'OK', onPress: () => router.replace('/login' as any) }]
            );
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
                        {step === 1 ? 'Create Account' : 'Academic Details'}
                    </Text>
                    <Text style={{ fontSize: 15, color: colors.textSecondary, marginBottom: 28 }}>
                        {step === 1 ? 'Join thousands of campus traders' : 'Tell us about your studies'}
                    </Text>

                    {step === 1 ? (
                        <View style={{ gap: 16 }}>
                            <Field label="Full Name" field="name" placeholder="Enter your full name" colors={colors} form={form} errors={errors} update={update} />
                            <Field label="Username" field="username" placeholder="Enter username" colors={colors} form={form} errors={errors} update={update} />
                            <Field label="Student Email" field="email" placeholder="yourname@gmail.com" keyboardType="email-address" colors={colors} form={form} errors={errors} update={update} />
                            <View>
                                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textPrimary, marginBottom: 6 }}>Password</Text>
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: colors.inputBg,
                                    borderRadius: 14,
                                    borderWidth: 1.5,
                                    borderColor: errors.password ? '#ef4444' : form.password ? colors.primary : colors.inputBorder,
                                    paddingHorizontal: 14,
                                }}>
                                    <TextInput
                                        style={{
                                            flex: 1,
                                            color: colors.textPrimary,
                                            fontSize: 15,
                                            paddingVertical: Platform.OS === 'ios' ? 14 : 12,
                                        }}
                                        value={form.password}
                                        onChangeText={t => update('password', t)}
                                        placeholder="Password"
                                        placeholderTextColor={colors.textMuted}
                                        secureTextEntry={!showPassword}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowPassword(prev => !prev)}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Ionicons
                                            name={showPassword ? 'eye' : 'eye-off'}
                                            size={22}
                                            color={colors.textSecondary}
                                        />
                                    </TouchableOpacity>
                                </View>
                                {errors.password && <Text style={{ color: '#ef4444', fontSize: 12, marginTop: 4, marginLeft: 4 }}>{errors.password}</Text>}
                            </View>

                            <View>
                                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textPrimary, marginBottom: 6 }}>Confirm Password</Text>
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: colors.inputBg,
                                    borderRadius: 14,
                                    borderWidth: 1.5,
                                    borderColor: errors.confirmPassword ? '#ef4444' : form.confirmPassword ? colors.primary : colors.inputBorder,
                                    paddingHorizontal: 14,
                                }}>
                                    <TextInput
                                        style={{
                                            flex: 1,
                                            color: colors.textPrimary,
                                            fontSize: 15,
                                            paddingVertical: Platform.OS === 'ios' ? 14 : 12,
                                        }}
                                        value={form.confirmPassword}
                                        onChangeText={t => update('confirmPassword', t)}
                                        placeholder="Re-enter password"
                                        placeholderTextColor={colors.textMuted}
                                        secureTextEntry={!showConfirm}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowConfirm(prev => !prev)}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Ionicons
                                            name={showConfirm ? 'eye' : 'eye-off'}
                                            size={22}
                                            color={colors.textSecondary}
                                        />
                                    </TouchableOpacity>
                                </View>
                                {errors.confirmPassword && <Text style={{ color: '#ef4444', fontSize: 12, marginTop: 4, marginLeft: 4 }}>{errors.confirmPassword}</Text>}
                            </View>
                            <Field label="Phone Number" field="phone" placeholder="03XX-XXXXXXX" keyboardType="phone-pad" maxLength={11} colors={colors} form={form} errors={errors} update={update} />

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
                            <Field label="Roll Number" field="rollNumber" placeholder="e.g. BSCSE-22-01" keyboardType="default" colors={colors} form={form} errors={errors} update={update} />
                            <Field label="Major / Program" field="major" placeholder="e.g. Computer Science" colors={colors} form={form} errors={errors} update={update} />
                            <Field label="Department" field="department" placeholder="e.g. Computer Science Dept" colors={colors} form={form} errors={errors} update={update} />
                            <Field label="Start Year" field="startYear" placeholder="e.g. 2022" keyboardType="numeric" maxLength={4} colors={colors} form={form} errors={errors} update={update} />

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
