import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ScrollView,
    SafeAreaView, Platform, StatusBar, Alert, ActivityIndicator
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { db, storage } from '@/src/config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { CATEGORY_NAMES } from '@/constants/categories';

export default function EditListingScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const { colors } = useTheme();

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [condition, setCondition] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);

    const categories = CATEGORY_NAMES;
    const conditions = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

    useEffect(() => {
        fetchListing();
    }, [id]);

    const fetchListing = async () => {
        try {
            const docRef = doc(db, 'listings', id as string);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                // Security check: only owner can edit
                if (data.userId !== user?.id) {
                    Alert.alert("Unauthorized", "You don't have permission to edit this listing.");
                    router.back();
                    return;
                }

                setTitle(data.title || '');
                setPrice(data.price?.toString() || '');
                setDescription(data.description || '');
                setCategory(data.category || '');
                setCondition(data.condition || '');
                setExistingImages(data.images || (data.imageUrl ? [data.imageUrl] : []));
            } else {
                Alert.alert("Error", "Listing not found.");
                router.back();
            }
        } catch (error) {
            console.error("Error fetching listing:", error);
            Alert.alert("Error", "Could not load listing details.");
        } finally {
            setIsLoading(false);
        }
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permission Required", "Please allow access to your photos to upload images.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            try {
                const manipResult = await manipulateAsync(
                    result.assets[0].uri,
                    [{ resize: { width: 1000 } }],
                    { compress: 0.7, format: SaveFormat.JPEG }
                );
                setImages([...images, manipResult.uri]);
            } catch (error) {
                console.error("Image processing error:", error);
                Alert.alert("Error", "Could not process selected image.");
            }
        }
    };

    const removeExistingImage = (index: number) => {
        const newImages = [...existingImages];
        newImages.splice(index, 1);
        setExistingImages(newImages);
    };

    const removeNewImage = (index: number) => {
        const newImages = [...images];
        newImages.splice(index, 1);
        setImages(newImages);
    };

    const uploadImageToFirebase = async (uri: string, index: number): Promise<string> => {
        const userId = user?.id || 'anonymous';
        const timestamp = Date.now();
        const filename = `listings/${userId}/${timestamp}_edit_${index}.jpg`;
        const storageRef = ref(storage, filename);

        const response = await fetch(uri);
        const blob = await response.blob();

        await uploadBytes(storageRef, blob);
        return await getDownloadURL(storageRef);
    };

    const handleUpdate = async () => {
        if (!title || !price || !category || !condition || (images.length === 0 && existingImages.length === 0)) {
            Alert.alert("Missing Information", "Please fill in all fields and add at least one image.");
            return;
        }

        setIsSubmitting(true);
        setUploadStatus("Starting update...");
        try {
            // Upload new images sequentially for status updates
            const newImageUrls: string[] = [];
            for (let i = 0; i < images.length; i++) {
                setUploadStatus(`Uploading new image ${i + 1} of ${images.length}...`);
                const url = await uploadImageToFirebase(images[i], i);
                newImageUrls.push(url);
            }
            
            const allImages = [...existingImages, ...newImageUrls];

            setUploadStatus("Updating database...");
            await updateDoc(doc(db, 'listings', id as string), {
                title,
                price: parseFloat(price),
                description,
                category,
                condition,
                images: allImages,
                imageUrl: allImages[0], // Keep legacy field updated
                updatedAt: new Date().toISOString()
            });

            Alert.alert("Success", "Listing updated successfully!", [
                { text: "OK", onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error("Error updating listing:", error);
            Alert.alert("Update Failed", error.message || "Could not update listing.");
        } finally {
            setIsSubmitting(false);
            setUploadStatus('');
        }
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
            <View style={{ paddingHorizontal: 20, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 15 }}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.textPrimary }}>Edit Listing</Text>
            </View>

            <ScrollView style={{ flex: 1, padding: 20 }}>
                {/* Image Section */}
                <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 10, color: colors.textPrimary }}>Photos</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                    <TouchableOpacity 
                        onPress={pickImage}
                        style={{
                            width: 100, height: 100, borderRadius: 12,
                            backgroundColor: colors.surfaceHighlight,
                            justifyContent: 'center', alignItems: 'center',
                            borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primary,
                            marginRight: 10
                        }}
                    >
                        <MaterialIcons name="add-a-photo" size={32} color={colors.primary} />
                        <Text style={{ fontSize: 12, color: colors.primary, marginTop: 4 }}>Add New</Text>
                    </TouchableOpacity>

                    {/* Existing Images */}
                    {existingImages.map((uri, index) => (
                        <View key={`existing-${index}`} style={{ position: 'relative', marginRight: 10 }}>
                            <Image source={{ uri }} style={{ width: 100, height: 100, borderRadius: 12 }} />
                            <TouchableOpacity 
                                onPress={() => removeExistingImage(index)}
                                style={{ position: 'absolute', top: -5, right: -5, backgroundColor: 'red', borderRadius: 10 }}
                            >
                                <Ionicons name="close-circle" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                    ))}

                    {/* New Images */}
                    {images.map((uri, index) => (
                        <View key={`new-${index}`} style={{ position: 'relative', marginRight: 10 }}>
                            <Image source={{ uri }} style={{ width: 100, height: 100, borderRadius: 12 }} />
                            <TouchableOpacity 
                                onPress={() => removeNewImage(index)}
                                style={{ position: 'absolute', top: -5, right: -5, backgroundColor: 'red', borderRadius: 10 }}
                            >
                                <Ionicons name="close-circle" size={24} color="white" />
                            </TouchableOpacity>
                            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
                                <Text style={{ color: 'white', fontSize: 10, textAlign: 'center' }}>New</Text>
                            </View>
                        </View>
                    ))}
                </ScrollView>

                {/* Form Fields */}
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 5 }}>Title</Text>
                <TextInput
                    style={{ backgroundColor: colors.surface, borderRadius: 10, padding: 12, marginBottom: 15, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border }}
                    placeholder="What are you selling?"
                    placeholderTextColor={colors.textMuted}
                    value={title}
                    onChangeText={setTitle}
                />

                <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 5 }}>Price (Rs)</Text>
                <TextInput
                    style={{ backgroundColor: colors.surface, borderRadius: 10, padding: 12, marginBottom: 15, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border }}
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={price}
                    onChangeText={setPrice}
                />

                <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 5 }}>Category</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 }}>
                    {categories.map(cat => (
                        <TouchableOpacity 
                            key={cat} 
                            onPress={() => setCategory(cat)}
                            style={{
                                paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
                                backgroundColor: category === cat ? colors.primary : colors.surfaceHighlight,
                                marginRight: 8, marginBottom: 8
                            }}
                        >
                            <Text style={{ color: category === cat ? 'white' : colors.textSecondary }}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 5 }}>Condition</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 }}>
                    {conditions.map(cond => (
                        <TouchableOpacity 
                            key={cond} 
                            onPress={() => setCondition(cond)}
                            style={{
                                paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
                                backgroundColor: condition === cond ? colors.primary : colors.surfaceHighlight,
                                marginRight: 8, marginBottom: 8
                            }}
                        >
                            <Text style={{ color: condition === cond ? 'white' : colors.textSecondary }}>{cond}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 5 }}>Description</Text>
                <TextInput
                    style={{ backgroundColor: colors.surface, borderRadius: 10, padding: 12, marginBottom: 25, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, minHeight: 100 }}
                    placeholder="Tell us more about the item..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    value={description}
                    onChangeText={setDescription}
                />

                {isSubmitting && (
                    <Text style={{ textAlign: 'center', color: colors.primary, marginBottom: 10, fontWeight: '500' }}>
                        {uploadStatus}
                    </Text>
                )}
                <TouchableOpacity 
                    onPress={handleUpdate}
                    disabled={isSubmitting}
                    style={{
                        backgroundColor: colors.primary,
                        paddingVertical: 15, borderRadius: 12,
                        alignItems: 'center', marginBottom: 50,
                        opacity: isSubmitting ? 0.7 : 1
                    }}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Update Listing</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
