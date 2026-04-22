import { View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Platform, KeyboardAvoidingView, Switch, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { launchImageLibraryAsync, requestMediaLibraryPermissionsAsync, MediaTypeOptions } from 'expo-image-picker';
import { Image } from 'expo-image';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import app, { db, auth } from '@/src/config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { CLOUDINARY_CONFIG } from '@/src/config/cloudinary';

import { API_BASE_URL } from '@/constants/Config';
import { CATEGORY_NAMES } from '@/constants/categories';

export default function CreateListingScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState(CATEGORY_NAMES[0]);
    const [condition, setCondition] = useState('Good');
    const [isNegotiable, setIsNegotiable] = useState(false);
    const [meetupLocation, setMeetupLocation] = useState(user?.preferredMeetupLocation || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    const [images, setImages] = useState<string[]>([]);

    const categories = CATEGORY_NAMES;
    const conditions = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

    const pickImage = async () => {
        // Request permissions first
        const { status } = await requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permission Required", "Please allow access to your photos to upload images.");
            return;
        }

        const result = await launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8, // Slightly lower quality for faster uploads
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            try {
                // Compress image immediately after picking to save storage and bandwidth
                const manipResult = await manipulateAsync(
                    result.assets[0].uri,
                    [{ resize: { width: 1000 } }], // Reasonable width for listings
                    { compress: 0.7, format: SaveFormat.JPEG }
                );
                setImages([...images, manipResult.uri].slice(0, 5));
            } catch (error) {
                console.error("Image processing error:", error);
                Alert.alert("Error", "Could not process selected image.");
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
        setCategory('Books');
        setCondition('Good');
        setIsNegotiable(false);
        setMeetupLocation(user?.preferredMeetupLocation || '');
        setImages([]);
    };

    const uploadImageToCloudinary = async (
      uri: string
    ): Promise<string> => {
      try {
        const formData = new FormData();
        
        formData.append('file', {
          uri: uri,
          type: 'image/jpeg',
          name: `listing_${Date.now()}.jpg`,
        } as any);
        
        formData.append('upload_preset', 'ItemPosts');
        formData.append('folder', 'campus_trade/listings');

        const response = await fetch(
          'https://api.cloudinary.com/v1_1/dxys8ppb6/image/upload',
          {
            method: 'POST',
            body: formData,
            headers: {
              'Accept': 'application/json',
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error?.message || 
            'Cloudinary upload failed'
          );
        }

        const data = await response.json();
        console.log('Upload success:', data.secure_url);
        return data.secure_url;

      } catch (error: any) {
        console.error('Upload error:', error.message);
        throw new Error(
          `Image upload failed: ${error.message}`
        );
      }
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
                    {isSubmitting && (
                        <Text style={{ textAlign: 'center', color: colors.primary, marginBottom: 10, fontWeight: '500' }}>
                            {uploadStatus}
                        </Text>
                    )}
                    <TouchableOpacity
                        className={`w-full py-4 rounded-xl items-center justify-center shadow-lg shadow-primary/30 ${isSubmitting ? 'bg-primary/70' : 'bg-primary'}`}
                        disabled={isSubmitting}
                        onPress={async () => {
                            if (!title || !price || !description) {
                                Alert.alert("Missing Fields", "Please fill in all required fields.");
                                return;
                            }

                            setIsSubmitting(true);
                            setUploadStatus("Starting upload...");
                            try {
                                // Upload all selected images to Cloudinary
                                const uploadedUrls: string[] = [];

                                if (images && images.length > 0) {
                                    console.log(`Uploading ${images.length} image(s) to Cloudinary...`);
                                    for (let i = 0; i < images.length; i++) {
                                        setUploadStatus(`Uploading image ${i + 1} of ${images.length}...`);
                                        const url = await uploadImageToCloudinary(images[i]);
                                        uploadedUrls.push(url);
                                    }
                                    console.log('Cloudinary upload success:', uploadedUrls);
                                } else {
                                    console.log('No images to upload, skipping.');
                                }

                                const imageUrl = uploadedUrls.length > 0 ? uploadedUrls[0] : null;

                                // Save listing to Firestore
                                await addDoc(collection(db, 'listings'), {
                                    title,
                                    price: parseFloat(price),
                                    description,
                                    category,
                                    condition,
                                    isNegotiable,
                                    meetupLocation,
                                    imageUrl,
                                    images: uploadedUrls,
                                    status: 'active',
                                    userId: user?.id || 'anonymous',
                                    createdAt: serverTimestamp(),
                                });

                                Alert.alert("Success", "Your listing is now live! 🚀", [
                                    { text: "View Listings", onPress: () => router.push('/manage_listings') }
                                ]);
                                clearFields();
                            } catch (error: any) {
                                console.error("Error creating listing:", error);
                                const errorMessage = error.message?.includes("Image upload failed") 
                                    ? "Image upload failed. Please try again." 
                                    : "Could not save your listing. Please check your connection and try again.";
                                Alert.alert("Upload Failed", errorMessage);
                            } finally {
                                setIsSubmitting(false);
                                setUploadStatus('');
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
