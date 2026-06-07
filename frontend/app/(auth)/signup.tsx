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
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { auth, db } from '@/src/config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function SignupScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ fullName?: string; email?: string; password?: string; confirmPassword?: string }>({});

  const validate = () => {
    const nextErrors: typeof errors = {};

    if (!fullName.trim()) nextErrors.fullName = 'Full name is required';
    if (!email.trim()) nextErrors.email = 'Email address is required';
    else if (!email.includes('@')) nextErrors.email = 'Enter a valid email address';
    if (!password.trim()) nextErrors.password = 'Password is required';
    else if (password.length < 6) nextErrors.password = 'Password must be at least 6 characters';
    if (!confirmPassword.trim()) nextErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) nextErrors.confirmPassword = 'Passwords do not match';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      const uid = userCredential.user.uid;

      // TODO: Save additional user metadata to Firestore after account creation.
      await setDoc(doc(db, 'users', uid), {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        createdAt: serverTimestamp(),
        role: 'user',
        isVerified: false,
        // add more metadata fields here later
      });

      Alert.alert('Account created', 'Your account has been created. Please verify your email before signing in.');
      router.replace('/login' as any);
    } catch (error: any) {
      Alert.alert('Signup failed', error?.message || 'Unable to create account.');
    } finally {
      setLoading(false);
    }
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
          <View style={{ marginBottom: 40 }}>
            <TouchableOpacity onPress={() => router.push('/login' as any)} style={{ marginBottom: 24, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, borderWidth: 1, borderColor: colors.border }}>
              <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.textPrimary }}>Create your account</Text>
            <Text style={{ marginTop: 8, fontSize: 14, color: colors.textSecondary }}>Sign up with your student email and secure password.</Text>
          </View>

          <View style={{ gap: 20 }}>
            <View>
              <Text style={{ marginBottom: 8, fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>Full Name</Text>
              <View style={{ borderRadius: 24, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 12 }}>
                <TextInput
                  style={{ fontSize: 16, color: colors.textPrimary }}
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.textSecondary}
                  value={fullName}
                  onChangeText={text => {
                    setFullName(text);
                    if (errors.fullName) setErrors(prev => ({ ...prev, fullName: undefined }));
                  }}
                />
              </View>
              {errors.fullName ? <Text style={{ marginTop: 8, fontSize: 12, color: '#ef4444' }}>{errors.fullName}</Text> : null}
            </View>

            <View>
              <Text style={{ marginBottom: 8, fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>Email Address</Text>
              <View style={{ borderRadius: 24, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 12 }}>
                <TextInput
                  style={{ fontSize: 16, color: colors.textPrimary }}
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

            <View>
              <Text style={{ marginBottom: 8, fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>Password</Text>
              <View style={{ borderRadius: 24, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <TextInput
                  style={{ flex: 1, fontSize: 16, color: colors.textPrimary }}
                  placeholder="Create a password"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={text => {
                    setPassword(text);
                    if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                  }}
                />
                <TouchableOpacity onPress={() => setShowPassword(prev => !prev)}>
                  <MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={{ marginTop: 8, fontSize: 12, color: '#ef4444' }}>{errors.password}</Text> : null}
            </View>

            <View>
              <Text style={{ marginBottom: 8, fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>Confirm Password</Text>
              <View style={{ borderRadius: 24, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <TextInput
                  style={{ flex: 1, fontSize: 16, color: colors.textPrimary }}
                  placeholder="Confirm your password"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={text => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                  }}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(prev => !prev)}>
                  <MaterialIcons name={showConfirmPassword ? 'visibility' : 'visibility-off'} size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword ? <Text style={{ marginTop: 8, fontSize: 12, color: '#ef4444' }}>{errors.confirmPassword}</Text> : null}
            </View>

            <TouchableOpacity
              onPress={handleSignup}
              disabled={loading}
              style={{ borderRadius: 24, backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 5 }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, paddingTop: 8 }}>
              <Text style={{ fontSize: 14, color: colors.textSecondary }}>Already have an account?</Text>
              <TouchableOpacity onPress={() => router.push('/login' as any)}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>Log in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
