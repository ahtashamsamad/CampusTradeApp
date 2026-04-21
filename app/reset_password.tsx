import { View, Text, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, StatusBar } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';

export default function ResetPasswordScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');

    return (
        <SafeAreaView className="flex-1 bg-background-dark">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Navigation Bar */}
            <View className="flex-row items-center justify-between px-4 py-3 bg-background-dark/95 z-10 pt-6">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-10 h-10 items-center justify-center rounded-full hover:bg-slate-800"
                >
                    <MaterialIcons name="arrow-back-ios" size={20} color="white" />
                </TouchableOpacity>
                <Text className="text-base font-semibold tracking-wide text-white flex-1 text-center pr-10">
                    Reset Password
                </Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, paddingBottom: 40 }}>

                    {/* Header Illustration Area */}
                    <View className="items-center justify-center mb-10 mt-6 relative">
                        <View className="absolute w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
                        <View className="w-24 h-24 rounded-full bg-surface-dark items-center justify-center shadow-lg mb-6 border border-surface-highlight">
                            <MaterialIcons name="lock-reset" size={48} color="#6366f1" />
                        </View>
                        <Text className="text-2xl font-bold text-center text-white mb-3">Forgot Password?</Text>
                        <Text className="text-text-secondary text-center text-sm leading-relaxed px-4">
                            No worries! Enter your university email linked to your account and {"we'll"} send you a recovery link.
                        </Text>
                    </View>

                    {/* Form Area */}
                    <View className="w-full gap-6 mb-8">
                        <View className="gap-2">
                            <Text className="text-sm font-medium text-slate-300 ml-1">University Email</Text>
                            <View className="relative justify-center">
                                <View className="absolute left-3 z-10">
                                    <MaterialIcons name="school" size={20} color="#94a3b8" />
                                </View>
                                <TextInput
                                    className="w-full bg-surface-dark border border-surface-highlight rounded-lg py-3.5 pl-10 pr-12 text-white"
                                    placeholder="student@university.edu"
                                    placeholderTextColor="#94a3b8"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={email}
                                    onChangeText={setEmail}
                                />
                                <View className="absolute right-3 z-10">
                                    <Text className="text-xs text-text-secondary font-mono">.edu</Text>
                                </View>
                            </View>
                            <Text className="text-xs text-text-secondary ml-1">Please use your .edu email address.</Text>
                        </View>

                        <TouchableOpacity className="w-full rounded-lg bg-primary py-3.5 items-center shadow-sm">
                            <Text className="text-sm font-semibold text-white">Send Reset Link</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Spacer */}
                    <View className="flex-1" />

                    {/* Divider */}
                    <View className="relative my-8 justify-center items-center">
                        <View className="absolute w-full h-[1px] bg-surface-highlight" />
                        <View className="bg-background-dark px-4">
                            <Text className="text-xs text-text-secondary uppercase tracking-wider">Or</Text>
                        </View>
                    </View>

                    {/* Support Section */}
                    <View className="items-center gap-4">
                        <Text className="text-xs text-text-secondary text-center">
                            Having trouble? Ensure you check your spam folder if the email {"doesn't"} arrive within 5 minutes.
                        </Text>
                        <TouchableOpacity className="flex-row items-center gap-1.5">
                            <MaterialIcons name="headset-mic" size={18} color="#6366f1" />
                            <Text className="text-sm font-medium text-primary">Contact Student Support</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
