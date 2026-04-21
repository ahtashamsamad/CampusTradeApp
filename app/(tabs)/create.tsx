import { View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Platform, KeyboardAvoidingView, Switch, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import app, { db } from '@/src/config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

import { API_BASE_URL } from '@/constants/Config';

export default function CreateListingScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Textbooks');
    const [condition, setCondition] = useState('Good');
    const [isNegotiable, setIsNegotiable] = useState(false);
    const [meetupLocation, setMeetupLocation] = useState(user?.preferredMeetupLocation || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [images, setImages] = useState<string[]>([]);

    const categories = ['Textbooks', 'Electronics', 'Dorm Decor', 'Clothing', 'Other'];
    const conditions = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            try {
                // Compress image immediately after picking
                const manipResult = await manipulateAsync(
                    result.assets[0].uri,
                    [{ resize: { width: 800 } }],
                    { compress: 0.7, format: SaveFormat.JPEG }
                );
                setImages([...images, manipResult.uri].slice(0, 5));
            } catch (error) {
                console.error("Compression error:", error);
                Alert.alert("Error", "Could not process image.");
            }
        }
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const clearFields = () => {
        setTitle('');
        setPrice('');
        setDescription('');
        setCategory('Textbooks');
        setCondition('Good');
        setIsNegotiable(false);
        setMeetupLocation(user?.preferredMeetupLocation || '');
        setImages([]);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-surface-highlight">
                <View className="w-10"></View>
                <Text className="text-lg font-bold text-white tracking-tight">Post an Item</Text>
                <TouchableOpacity onPress={clearFields}>
                    <Text className="text-sm font-semibold text-primary">Clear</Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView className="flex-1 px-4 py-4" contentContainerStyle={{ paddingBottom: 120 }}>

                    {/* Photo Upload Area */}
                    <View className="mb-6">
                        <Text className="text-sm font-semibold text-white mb-2 ml-1">Photos (Up to 5)</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                            <TouchableOpacity
                                onPress={pickImage}
                                disabled={images.length >= 5}
                                className={`w-24 h-24 rounded-xl bg-surface-dark border-2 border-dashed items-center justify-center mr-3 ${images.length >= 5 ? 'border-surface-highlight opacity-50' : 'border-primary'}`}
                            >
                                <MaterialIcons name="add-a-photo" size={28} color="#6366f1" />
                                <Text className="text-xs text-primary mt-1 font-medium">Add Photo</Text>
                            </TouchableOpacity>

                            {images.map((uri, index) => (
                                <View key={index} className="relative mr-3">
                                    <Image source={{ uri }} style={{ width: 96, height: 96, borderRadius: 12 }} />
                                    <TouchableOpacity
                                        onPress={() => removeImage(index)}
                                        className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center border-2 border-background-dark"
                                    >
                                        <MaterialIcons name="close" size={16} color="white" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Title Input */}
                    <View className="mb-5">
                        <Text className="text-sm font-semibold text-white mb-2 ml-1">Title</Text>
                        <TextInput
                            className="w-full bg-surface-dark border border-surface-highlight rounded-xl px-4 py-3.5 text-white"
                            placeholder="E.g. Chemistry 101 Textbook"
                            placeholderTextColor="#94a3b8"
                            value={title}
                            onChangeText={setTitle}
                        />
                    </View>

                    {/* Price Input & Negotiable */}
                    <View className="flex-row gap-4 mb-5">
                        <View className="flex-1">
                            <Text className="text-sm font-semibold text-white mb-2 ml-1">Price in Rs</Text>
                            <View style={{ position: 'relative', justifyContent: 'center' }}>
                                <Text style={{ position: 'absolute', left: 14, zIndex: 10, color: colors.textSecondary, fontSize: 14, fontWeight: '600' }}>Rs</Text>
                                <TextInput
                                    style={{ width: '100%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingLeft: 34, paddingRight: 16, paddingVertical: 12, color: colors.textPrimary }}
                                    placeholder="0"
                                    placeholderTextColor="#94a3b8"
                                    keyboardType="numeric"
                                    value={price}
                                    onChangeText={setPrice}
                                />
                            </View>
                        </View>
                        <View className="justify-end pb-2">
                            <View className="flex-row items-center gap-2">
                                <Text className="text-sm font-medium text-white">Negotiable</Text>
                                <Switch
                                    value={isNegotiable}
                                    onValueChange={setIsNegotiable}
                                    trackColor={{ false: '#334155', true: '#6366f1' }}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Category Selection */}
                    <View className="mb-5">
                        <Text className="text-sm font-semibold text-white mb-2 ml-1">Category</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row py-1">
                            {categories.map((cat) => (
                                <TouchableOpacity
                                    key={cat}
                                    onPress={() => setCategory(cat)}
                                    className={`mr-2 px-4 py-2 rounded-full border ${category === cat ? 'bg-primary/20 border-primary' : 'bg-surface-dark border-surface-highlight'}`}
                                >
                                    <Text className={`text-sm font-medium ${category === cat ? 'text-primary' : 'text-text-secondary'}`}>{cat}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Condition Selection */}
                    <View className="mb-5">
                        <Text className="text-sm font-semibold text-white mb-2 ml-1">Condition</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row py-1">
                            {conditions.map((cond) => (
                                <TouchableOpacity
                                    key={cond}
                                    onPress={() => setCondition(cond)}
                                    className={`mr-2 px-4 py-2 rounded-full border ${condition === cond ? 'bg-primary/20 border-primary' : 'bg-surface-dark border-surface-highlight'}`}
                                >
                                    <Text className={`text-sm font-medium ${condition === cond ? 'text-primary' : 'text-text-secondary'}`}>{cond}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Description */}
                    <View className="mb-6">
                        <Text className="text-sm font-semibold text-white mb-2 ml-1">Description</Text>
                        <TextInput
                            className="w-full bg-surface-dark border border-surface-highlight rounded-xl p-4 text-white min-h-[120px]"
                            placeholder="Describe what you are selling. Include relevant details like size, wear and tear, etc."
                            placeholderTextColor="#94a3b8"
                            multiline
                            textAlignVertical="top"
                            value={description}
                            onChangeText={setDescription}
                        />
                    </View>

                    {/* Meetup Location */}
                    <View className="mb-8">
                        <Text className="text-sm font-semibold text-white mb-2 ml-1">Meetup Location</Text>
                        <View style={{ position: 'relative', justifyContent: 'center' }}>
                            <MaterialIcons name="location-on" size={18} color={colors.primary} style={{ position: 'absolute', left: 14, zIndex: 10 }} />
                            <TextInput
                                style={{ width: '100%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingLeft: 40, paddingRight: 16, paddingVertical: 12, color: colors.textPrimary }}
                                placeholder="E.g. Library, Student Center 2nd Floor"
                                placeholderTextColor="#94a3b8"
                                value={meetupLocation}
                                onChangeText={setMeetupLocation}
                            />
                        </View>
                        <Text className="text-[11px] text-text-muted mt-2 ml-1">
                            Suggested meeting place for a safe exchange.
                        </Text>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        className={`w-full py-4 rounded-xl items-center justify-center shadow-lg shadow-primary/30 ${isSubmitting ? 'bg-primary/70' : 'bg-primary'}`}
                        disabled={isSubmitting}
                        onPress={async () => {
                            if (!title || !price || !description) {
                                Alert.alert("Missing Fields", "Please fill in all required fields.");
                                return;
                            }

                            setIsSubmitting(true);
                            try {
                                let imageUrl = null;

                                // Upload the first image to Cloudinary (Bypasses Firebase Storage CC requirement)
                                console.log('Images state before upload check:', images);

                                if (images && images.length > 0 && typeof images[0] === 'string' && images[0].trim() !== '') {
                                    const uri = images[0];
                                    console.log('Attempting Cloudinary upload for URI:', uri);

                                    const data = new FormData();

                                    // Prepare file for upload
                                    const filename = uri.split('/').pop() || `upload_${Date.now()}.jpg`;
                                    const match = /\.(\w+)$/.exec(filename);
                                    let type = match ? `image/${match[1].toLowerCase()}` : `image/jpeg`;
                                    if (type === 'image/jpg') type = 'image/jpeg';

                                    // Android requires the file:// prefix for FormData to work correctly
                                    const finalUri = Platform.OS === 'android' && !uri.startsWith('file://')
                                        ? `file://${uri}`
                                        : uri;

                                    // @ts-ignore
                                    data.append('file', {
                                        uri: finalUri,
                                        name: filename,
                                        type
                                    });
                                    data.append('upload_preset', 'ItemPosts');
                                    data.append('cloud_name', 'dxys8ppb6');

                                    console.log('Sending Cloudinary request to:', 'https://api.cloudinary.com/v1_1/dxys8ppb6/image/upload');
                                    console.log('Using upload_preset:', 'ItemPosts');

                                    const cloudRes = await fetch('https://api.cloudinary.com/v1_1/dxys8ppb6/image/upload', {
                                        method: 'POST',
                                        body: data,
                                    });

                                    if (!cloudRes.ok) {
                                        const cloudDataText = await cloudRes.text();
                                        throw new Error(`Cloudinary error response: ${cloudDataText}`);
                                    }
                                    
                                    const cloudData = await cloudRes.json();

                                    if (cloudData.secure_url) {
                                        imageUrl = cloudData.secure_url;
                                        console.log('Cloudinary upload success:', imageUrl);
                                    } else {
                                        throw new Error("Cloudinary secure_url missing in response");
                                    }
                                } else {
                                    console.log('No valid image to upload, skipping Cloudinary.');
                                }

                                // Save a summary to Firestore for discovery (Free tier optimized)
                                await addDoc(collection(db, 'listings'), {
                                    title,
                                    price: parseFloat(price),
                                    description,
                                    category,
                                    condition,
                                    isNegotiable,
                                    meetupLocation,
                                    imageUrl,
                                    images: imageUrl ? [imageUrl] : [],
                                    status: 'active',
                                    userId: user?.id || 'dev-user-123',
                                    createdAt: serverTimestamp(),
                                });

                                try {
                                    await fetch(`${API_BASE_URL}/listings`, {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                            title,
                                            price: parseFloat(price),
                                            description,
                                            category,
                                            condition,
                                            isNegotiable,
                                            image: imageUrl,
                                            status: 'active',
                                            userId: user?.id || 'dev-user-123'
                                        })
                                    });
                                } catch (e) {
                                    console.log("Network fallback fetch failed, but Firestore upload succeeded. Continuing...");
                                }

                                Alert.alert("Success", "Your listing is now live! 🚀", [
                                    { text: "View Listings", onPress: () => router.push('/manage_listings') }
                                ]);
                                clearFields();
                            } catch (error) {
                                console.error("Error creating listing:", error);
                                Alert.alert("Error", "Could not upload image or connect to the server.");
                            } finally {
                                setIsSubmitting(false);
                            }
                        }}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-bold text-base">Post Listing</Text>
                        )}
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
