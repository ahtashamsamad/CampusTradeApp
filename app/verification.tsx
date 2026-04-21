import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ScrollView, Platform, KeyboardAvoidingView, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';

import { API_BASE_URL } from '@/constants/Config';
import { Image } from 'expo-image';

export default function VerificationScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const MOCK_USER_ID = 'dev-user-123';

    const handleSendVerification = async () => {
        if (!email.trim() || !email.includes('@')) {
            Alert.alert("Invalid Email", "Please enter a valid university email address.");
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/verification/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: MOCK_USER_ID,
                    email: email.trim(),
                })
            });

            if (response.ok) {
                Alert.alert("Link Sent", "Please check your university email to verify your account.", [
                    { text: "OK", onPress: () => router.push('/(tabs)') }
                ]);
            } else {
                Alert.alert("Error", "Failed to send verification link.");
            }
        } catch (error) {
            console.error("Error sending verification:", error);
            Alert.alert("Error", "Could not connect to the server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background-dark">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="flex-row items-center justify-between p-4 pb-2 z-10 pt-6">
                <TouchableOpacity onPress={() => router.back()} className="w-12 h-12 items-center justify-center rounded-full hover:bg-slate-800">
                    <MaterialIcons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity className="h-10 px-4 items-center justify-center rounded-full hover:bg-slate-800" onPress={() => router.push('/(tabs)')}>
                    <Text className="text-sm font-bold tracking-wide text-text-secondary">Skip</Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView className="flex-1 px-4 py-2" contentContainerStyle={{ paddingBottom: 150 }}>

                    {/* Hero Section */}
                    <View className="items-center gap-6 mt-2 mb-8">
                        <View className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-surface-dark items-center justify-center">
                            <View className="absolute inset-0 bg-primary/10" />
                            <Image
                                source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDDZ76RyaJH7M4qcTwBeZVAgx3i7I9JRaq6lZVlzkmMR-zhy8Q9ZOoxQFCT0KNe3pK1HNEck7dEKYfsQZXq9ieyJI376W8fMGizugUa3pR_FmQ_yRBCQ1EvrTTo6In_YPd7fMXDNa1Dfh111PgPYhNX8P2B_hq43wYL4jAETxYvdDyVPLkNRbhC_4uGwTHFsA_M8P7p29O1ScHxImsnay5JnXLaleUt-Bfzm-SGuADIYgE49G22jyLZnZrnMEeBzSovx4TlMmiemkcz" }}
                                className="w-3/4 h-3/4"
                                contentFit="contain"
                            />
                        </View>
                        <View className="items-center gap-3">
                            <Text className="text-2xl font-bold tracking-tight text-white">Keep our campus safe</Text>
                            <Text className="text-base text-text-secondary text-center px-4">
                                To ensure a secure trading environment, we require all users to verify their student status.
                            </Text>
                        </View>
                    </View>

                    {/* Benefits List */}
                    <View className="gap-2">
                        <BenefitItem
                            icon="verified-user"
                            title="Verified Students Only"
                            desc="Connect with real students on your campus."
                        />
                        <BenefitItem
                            icon="location-on"
                            title="Safe Meetups"
                            desc="Trade safely in familiar campus locations."
                        />
                        <BenefitItem
                            icon="gpp-good"
                            title="No Scams"
                            desc="A trusted community with verified identities."
                        />
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Fixed Bottom Section */}
            <View className="absolute bottom-0 left-0 right-0 p-4 pb-8 bg-background-dark border-t border-surface-highlight z-20">
                <View className="gap-4">
                    <View className="gap-2">
                        <Text className="text-sm font-medium text-white ml-1">University Email</Text>
                        <View className="relative justify-center">
                            <View className="absolute left-3 z-10">
                                <MaterialIcons name="mail" size={20} color="#94a3b8" />
                            </View>
                            <TextInput
                                className="w-full h-12 rounded-xl bg-surface-dark border border-surface-highlight text-white pl-10 pr-4"
                                placeholder="yourname@university.edu"
                                placeholderTextColor="#94a3b8"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>
                    </View>
                    <TouchableOpacity
                        className={`w-full h-12 items-center justify-center rounded-xl shadow-md border ${loading ? 'bg-primary/70 border-primary/10' : 'bg-primary border-primary/20'}`}
                        onPress={handleSendVerification}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-bold text-base">Send Verification Link</Text>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity className="items-center mt-2">
                        <Text className="text-sm font-medium text-text-secondary">I {"don't"} have a .edu email</Text>
                    </TouchableOpacity>
                </View>
            </View>

        </SafeAreaView>
    );
}

function BenefitItem({ icon, title, desc }: any) {
    return (
        <View className="flex-row gap-4 p-4 rounded-xl bg-surface-dark border border-surface-highlight/50">
            <View className="w-10 h-10 items-center justify-center rounded-full bg-primary/20">
                <MaterialIcons name={icon} size={24} color="#6366f1" />
            </View>
            <View className="flex-1 justify-center">
                <Text className="text-sm font-semibold text-white">{title}</Text>
                <Text className="text-sm text-text-secondary">{desc}</Text>
            </View>
        </View>
    );
}
