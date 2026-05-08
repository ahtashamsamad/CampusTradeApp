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
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface }}>
                <View style={{ width: 40 }}></View>
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.5 }}>Post an Item</Text>
                <TouchableOpacity onPress={clearFields}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>Clear</Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 120 }}>

                    {/* Photo Upload Area */}
                    <View style={{ marginBottom: 24 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 8, marginLeft: 4 }}>Photos (Up to 5)</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                            <TouchableOpacity
                                onPress={pickImage}
                                disabled={images.length >= 5}
                                style={{ width: 96, height: 96, borderRadius: 12, backgroundColor: colors.surfaceHighlight + '40', borderWidth: 2, borderStyle: 'dashed', borderColor: images.length >= 5 ? colors.border : colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}
                            >
                                <MaterialIcons name="add-a-photo" size={28} color={colors.primary} />
                                <Text style={{ fontSize: 12, color: colors.primary, marginTop: 4, fontWeight: '500' }}>Add Photo</Text>
                            </TouchableOpacity>

                            {images.map((uri, index) => (
                                <View key={index} style={{ position: 'relative', marginRight: 12 }}>
                                    <Image source={{ uri }} style={{ width: 96, height: 96, borderRadius: 12 }} />
                                    <TouchableOpacity
                                        onPress={() => removeImage(index)}
                                        style={{ position: 'absolute', top: -8, right: -8, backgroundColor: '#ef4444', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.background }}
                                    >
                                        <MaterialIcons name="close" size={16} color="white" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Title Input */}
                    <View style={{ marginBottom: 20 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 8, marginLeft: 4 }}>Title</Text>
                        <TextInput
                            style={{ width: '100%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: colors.textPrimary }}
                            placeholder="E.g. Chemistry 101 Textbook"
                            placeholderTextColor={colors.textSecondary}
                            value={title}
                            onChangeText={setTitle}
                        />
                    </View>

                    {/* Price Input & Negotiable */}
                    <View style={{ flexDirection: 'row', gap: 16, marginBottom: 20 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 8, marginLeft: 4 }}>Price in Rs</Text>
                            <View style={{ position: 'relative', justifyContent: 'center' }}>
                                <Text style={{ position: 'absolute', left: 14, zIndex: 10, color: colors.textSecondary, fontSize: 14, fontWeight: '600' }}>Rs</Text>
                                <TextInput
                                    style={{ width: '100%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingLeft: 38, paddingRight: 16, paddingVertical: 12, color: colors.textPrimary }}
                                    placeholder="0"
                                    placeholderTextColor={colors.textSecondary}
                                    keyboardType="numeric"
                                    value={price}
                                    onChangeText={setPrice}
                                />
                            </View>
                        </View>
                        <View style={{ justifyContent: 'flex-end', paddingBottom: 8 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={{ fontSize: 14, fontWeight: '500', color: colors.textPrimary }}>Negotiable</Text>
                                <Switch
                                    value={isNegotiable}
                                    onValueChange={setIsNegotiable}
                                    trackColor={{ false: colors.border, true: colors.primary }}
                                    thumbColor={Platform.OS === 'ios' ? undefined : '#f8fafc'}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Category Selection */}
                    <View style={{ marginBottom: 20 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 8, marginLeft: 4 }}>Category</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', paddingVertical: 4 }}>
                            {categories.map((cat) => (
                                <TouchableOpacity
                                    key={cat}
                                    onPress={() => setCategory(cat)}
                                    style={{ marginRight: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, backgroundColor: category === cat ? colors.primary + '20' : colors.surface, borderColor: category === cat ? colors.primary : colors.border }}
                                >
                                    <Text style={{ fontSize: 14, fontWeight: '500', color: category === cat ? colors.primary : colors.textSecondary }}>{cat}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Condition Selection */}
                    <View style={{ marginBottom: 20 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 8, marginLeft: 4 }}>Condition</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', paddingVertical: 4 }}>
                            {conditions.map((cond) => (
                                <TouchableOpacity
                                    key={cond}
                                    onPress={() => setCondition(cond)}
                                    style={{ marginRight: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, backgroundColor: condition === cond ? colors.primary + '20' : colors.surface, borderColor: condition === cond ? colors.primary : colors.border }}
                                >
                                    <Text style={{ fontSize: 14, fontWeight: '500', color: condition === cond ? colors.primary : colors.textSecondary }}>{cond}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Description */}
                    <View style={{ marginBottom: 24 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 8, marginLeft: 4 }}>Description</Text>
                        <TextInput
                            style={{ width: '100%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16, color: colors.textPrimary, minHeight: 120 }}
                            placeholder="Describe what you are selling. Include relevant details like size, wear and tear, etc."
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            textAlignVertical="top"
                            value={description}
                            onChangeText={setDescription}
                        />
                    </View>

                    {/* Meetup Location */}
                    <View style={{ marginBottom: 32 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 8, marginLeft: 4 }}>Meetup Location</Text>
                        <View style={{ position: 'relative', justifyContent: 'center' }}>
                            <MaterialIcons name="location-on" size={18} color={colors.primary} style={{ position: 'absolute', left: 14, zIndex: 10 }} />
                            <TextInput
                                style={{ width: '100%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingLeft: 40, paddingRight: 16, paddingVertical: 12, color: colors.textPrimary }}
                                placeholder="E.g. Library, Student Center 2nd Floor"
                                placeholderTextColor={colors.textSecondary}
                                value={meetupLocation}
                                onChangeText={setMeetupLocation}
                            />
                        </View>
                        <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 8, marginLeft: 4 }}>
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
                        style={{ width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: isSubmitting ? colors.primary + 'B3' : colors.primary, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}
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
                            <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 16 }}>Post Listing</Text>
                        )}
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
