import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '@/src/config/firebase';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * Admin main layout with proper navigation and logout functionality.
 */
export default function AdminLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
        router.replace('/(tabs)');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#1a1a2e',
          borderBottomColor: '#16213e',
          borderBottomWidth: 1,
        } as any,
        headerTintColor: '#fff', // Fixed to white as per user's Step 1 code
        headerTitleStyle: {
          color: '#fff',
          fontWeight: '600',
        },
        contentStyle: {
          backgroundColor: '#0f1419',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Admin Dashboard',
          headerRight: () => (
            <TouchableOpacity
              onPress={handleLogout}
              disabled={loading}
              style={styles.logoutButton}
            >
              <MaterialIcons name="logout" size={24} color="#ff6b6b" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="users"
        options={{
          title: 'User Management',
        }}
      />
      <Stack.Screen
        name="approvals"
        options={{
          title: 'Pending Approvals',
        }}
      />
      <Stack.Screen
        name="reports"
        options={{
          title: 'Reports & Complaints',
        }}
      />
      <Stack.Screen
        name="verifications"
        options={{
          title: 'Student Verification',
        }}
      />
      <Stack.Screen
        name="announcements"
        options={{
          title: 'Send Announcement',
        }}
      />
      <Stack.Screen
        name="listings"
        options={{
          title: 'Global Listings',
        }}
      />
      <Stack.Screen
        name="analytics"
        options={{
          title: 'Platform Analytics',
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1419',
  },
  logoutButton: {
    marginRight: 15,
    padding: 5,
  },
});
