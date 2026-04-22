import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, SafeAreaView,
    Platform, StatusBar, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { storage } from '@/src/config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const LabeledInput = ({ label, field, placeholder, colors, form, update, multiline = false, keyboardType = 'default', editable = true }: any) => (
    <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {label}
        </Text>
        <TextInput
            editable={editable}
            multiline={multiline}
            numberOfLines={multiline ? 4 : 1}
            textAlignVertical={multiline ? 'top' : 'center'}
            style={{
                backgroundColor: editable ? colors.inputBg : colors.surfaceHighlight + '80',
                borderWidth: 1.5, borderColor: colors.border,
                borderRadius: 12, paddingHorizontal: 14,
                paddingVertical: multiline ? 12 : Platform.OS === 'ios' ? 13 : 10,
                fontSize: 15, color: editable ? colors.textPrimary : colors.textMuted,
                minHeight: multiline ? 100 : undefined,
            }}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            keyboardType={keyboardType}
            autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
            value={form[field]}
            onChangeText={t => update(field, t)}
        />
        {!editable && (
            <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4, marginLeft: 2 }}>
                Contact support to change this field
            </Text>
        )}
    </View>
);

export default function EditProfileScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const { user, updateUser } = useAuth();

    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: user?.name || '',
        username: user?.username || '',
        email: user?.email || '',
        phone: user?.phone || '',
        university: user?.university || '',
        studentId: user?.studentId || '',
        major: user?.major || '',
        classYear: user?.classYear || '',
        bio: user?.bio || '',
        avatar: user?.avatar || '',
        preferredMeetupLocation: user?.preferredMeetupLocation || '',
    });

    const update = (field: string, value: string) =>
        setForm(p => ({ ...p, [field]: value }));

    const uploadImage = async (uri: string): Promise<string> => {
        try {
            const userId = user?.id || 'anonymous';
            const storageRef = ref(storage, `avatars/${userId}.jpg`);
            
            // Convert local URI to blob
            const response = await fetch(uri);
            const blob = await response.blob();
            
            // Upload to Firebase Storage
            await uploadBytes(storageRef, blob);
            
            // Get download URL
            return await getDownloadURL(storageRef);
        } catch (error: any) {
            console.error("Avatar upload error:", error);
            throw error;
        }
    };

    const handlePickAvatar = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permission Required", "Please allow access to your photos to change your avatar.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled && result.assets[0]) {
            setSaving(true);
            try {
                const downloadUrl = await uploadImage(result.assets[0].uri);
                update('avatar', downloadUrl);
                // Also update user immediately in AuthContext if desired, 
                // but handleSave will do it for all fields.
            } catch (error) {
                Alert.alert("Error", "Failed to upload avatar. Please try again.");
            } finally {
                setSaving(false);
            }
        }
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            Alert.alert('Validation', 'Name cannot be empty.');
            return;
        }
        setSaving(true);
        try {
            await updateUser({
                name: form.name.trim(),
                username: form.username.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                university: form.university.trim(),
                studentId: form.studentId.trim(),
                major: form.major.trim(),
                classYear: form.classYear.trim(),
                bio: form.bio.trim(),
                avatar: form.avatar,
                preferredMeetupLocation: form.preferredMeetupLocation.trim(),
            });
            Alert.alert('✅ Saved', 'Your profile has been updated.', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        } finally {
            setSaving(false);
        }
    };


    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
            <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />

            {/* Header */}
            <View style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                paddingHorizontal: 16, paddingVertical: 13,
                borderBottomWidth: 1, borderBottomColor: colors.border,
                backgroundColor: colors.surface,
            }}>
                <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
                    <MaterialIcons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPrimary }}>Edit Profile</Text>
                <TouchableOpacity onPress={handleSave} disabled={saving}
                    style={{ paddingHorizontal: 14, paddingVertical: 7, backgroundColor: colors.primary, borderRadius: 20 }}
                >
                    {saving
                        ? <ActivityIndicator size="small" color="white" />
                        : <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>Save</Text>
                    }
                </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 60 }} keyboardShouldPersistTaps="handled">

                {/* Avatar Picker */}
                <View style={{ alignItems: 'center', paddingVertical: 28, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface }}>
                    <TouchableOpacity onPress={handlePickAvatar} style={{ position: 'relative' }}>
                        <View style={{ width: 100, height: 100, borderRadius: 50, overflow: 'hidden', backgroundColor: colors.surfaceHighlight, borderWidth: 3, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                            <Image 
                                source={{ uri: form.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random` }} 
                                style={{ width: '100%', height: '100%' }} 
                                contentFit="cover" 
                            />
                        </View>
                        <View style={{
                            position: 'absolute', bottom: 0, right: 0,
                            width: 32, height: 32, borderRadius: 16,
                            backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.surface,
                            alignItems: 'center', justifyContent: 'center',
                        }}>
                            <MaterialIcons name="camera-alt" size={16} color="white" />
                        </View>
                    </TouchableOpacity>
                    <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600', marginTop: 12 }}>
                        Change Photo
                    </Text>
                </View>

                {/* Stats Row */}
                <View style={{
                    flexDirection: 'row', paddingVertical: 16, paddingHorizontal: 20,
                    borderBottomWidth: 1, borderBottomColor: colors.border,
                    backgroundColor: colors.surface, marginBottom: 16,
                }}>
                    {[
                        { label: 'Sales', value: `${user?.totalSales || 0}` },
                        { label: 'Member Since', value: user?.memberSince || '—' },
                    ].map(({ label, value }) => (
                        <View key={label} style={{ flex: 1, alignItems: 'center' }}>
                            <Text style={{ fontSize: 17, fontWeight: '800', color: colors.textPrimary }}>{value}</Text>
                            <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>{label}</Text>
                        </View>
                    ))}
                </View>

                <View style={{ paddingHorizontal: 20 }}>
                    {/* Section: Personal */}
                    <SectionDivider label="Identity & Contact" colors={colors} />
                    <LabeledInput label="Full Name" field="name" placeholder="Your full name" colors={colors} form={form} update={update} />
                    <LabeledInput label="Username" field="username" placeholder="alex_s" colors={colors} form={form} update={update} />
                    <LabeledInput label="Email" field="email" placeholder="student@university.edu" keyboardType="email-address" editable={false} colors={colors} form={form} update={update} />
                    <LabeledInput label="Phone" field="phone" placeholder="+1 (555) 000-0000" keyboardType="phone-pad" colors={colors} form={form} update={update} />
                    <LabeledInput label="Meetup Location" field="preferredMeetupLocation" placeholder="e.g. Campus Library, Student Center" colors={colors} form={form} update={update} />
                    <LabeledInput label="Bio" field="bio" placeholder="Tell others a bit about yourself…" multiline colors={colors} form={form} update={update} />

                    {/* Section: Academic */}
                    <SectionDivider label="Academic Info" colors={colors} />
                    <LabeledInput label="University" field="university" placeholder="e.g. State University" colors={colors} form={form} update={update} />
                    <LabeledInput label="Student ID" field="studentId" placeholder="e.g. 12345678" keyboardType="number-pad" colors={colors} form={form} update={update} />
                    <LabeledInput label="Major / Program" field="major" placeholder="e.g. Computer Science" colors={colors} form={form} update={update} />
                    <LabeledInput label="Class Year" field="classYear" placeholder="e.g. Class of '25" colors={colors} form={form} update={update} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function SectionDivider({ label, colors }: { label: string; colors: any }) {
    return (
        <View style={{ marginBottom: 16, marginTop: 8, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 1 }}>
                {label}
            </Text>
        </View>
    );
}
