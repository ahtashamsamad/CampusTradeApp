import { useAuth } from '@/context/AuthContext';
import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Alert } from 'react-native';

export default function AdminLayout() {
    const { userRole } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (userRole && userRole !== 'admin') {
            Alert.alert('Access Denied', 'You do not have permission.');
            router.replace('/(tabs)' as any);
        }
    }, [userRole]);

    if (userRole !== 'admin') {
        return null;
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="users" />
            <Stack.Screen name="listings" />
            <Stack.Screen name="reports" />
            <Stack.Screen name="announcements" />
        </Stack>
    );
}
