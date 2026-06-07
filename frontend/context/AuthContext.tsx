import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '@/src/config/firebase';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, collection, where, onSnapshot, query, getDocs, deleteDoc } from 'firebase/firestore';
import { Platform, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile as firebaseUpdateProfile,
    deleteUser,
    sendEmailVerification,
    signInAnonymously as firebaseSignInAnonymously,
    GoogleAuthProvider,
    signInWithCredential,
} from 'firebase/auth';
import Constants from 'expo-constants';

// --- Safe Notification Import ---
let initNotifications: () => Promise<void> = async () => {};
let requestNotificationPermissions: () => Promise<boolean> = async () => false;
let sendNotification: (title: string, body: string, data?: any) => Promise<void> = async () => {};

try {
  const notifModule = require('../src/utils/notifications');
  initNotifications = notifModule.initNotifications;
  requestNotificationPermissions = notifModule.requestNotificationPermissions;
  sendNotification = notifModule.sendNotification;
} catch (error) {
  console.warn('[AuthContext] Notifications utility unavailable:', error);
}

// --- Types ---
export type User = {
    id: string;
    name: string;
    username: string;
    email: string;
    major: string;
    department: string;
    rollNumber: string;
    startYear: string;
    bio: string;
    avatar: string;
    phone: string;
    isVerified: boolean;
    totalSales: number;
    memberSince: string;
    savedItems?: string[];
    role?: string;
    expoPushToken?: string;
    preferredMeetupLocation?: string;
    fullName?: string;
    displayName?: string;
    campus?: string;
    preferences?: any;
    program?: string;
    semester?: string;
    session?: string;
    bzu_verified?: boolean;
};

interface AuthContextType {
    user: User | null;
    userRole: string;
    authMethod: 'anonymous' | 'google' | 'password' | 'unknown';
    isLoggedIn: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string; unverified?: boolean }>;
    signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
    signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
    signInAnonymously: () => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    updateUser: (updates: Partial<User>) => Promise<void>;
    toggleSavedItem: (itemId: string) => Promise<void>;
    resendVerificationEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    deleteAccount: () => Promise<{ success: boolean; error?: string }>;
    getIdToken: () => Promise<string | null>;
    totalUnreadCount: number;
    unreadNotifsCount: number;
}

export type SignupData = {
    name: string;
    username: string;
    email: string;
    password: string;
    major: string;
    department: string;
    rollNumber: string;
    startYear: string;
    phone: string;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    userRole: 'user',
    authMethod: 'unknown',
    isLoggedIn: false,
    isLoading: true,
    login: async () => ({ success: false }),
    signup: async () => ({ success: false }),
    signInWithGoogle: async () => ({ success: false }),
    signInAnonymously: async () => ({ success: false }),
    logout: async () => { },
    updateUser: async () => { },
    toggleSavedItem: async () => { },
    resendVerificationEmail: async () => ({ success: false }),
    deleteAccount: async () => ({ success: false }),
    getIdToken: async () => null,
    totalUnreadCount: 0,
    unreadNotifsCount: 0,
});

const AUTH_USER_KEY = '@campus_trade_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);
    const [userRole, setUserRole] = useState('user');
    const [authMethod, setAuthMethod] = useState<'anonymous' | 'google' | 'password' | 'unknown'>('unknown');
    const [isLoading, setIsLoading] = useState(true);
    const [totalUnreadCount, setTotalUnreadCount] = useState(0);
    const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

    const getAuthMethod = (firebaseUser: any) => {
        if (!firebaseUser) return 'unknown';
        if (firebaseUser.isAnonymous) return 'anonymous';
        const providers = firebaseUser.providerData?.map((item: any) => item.providerId) || [];
        if (providers.includes('google.com')) return 'google';
        if (providers.includes('password')) return 'password';
        return 'unknown';
    };

    // Initialize Notifications
    useEffect(() => {
        initNotifications().catch(console.warn);
    }, []);

    // Auth State Listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    await firebaseUser.reload();
                    setAuthMethod(getAuthMethod(firebaseUser));

                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                    let role = 'user';

                    if (userDoc.exists()) {
                        role = userDoc.data()?.role || 'user';
                    }

                    if (role !== 'admin' && !firebaseUser.emailVerified && !firebaseUser.isAnonymous) {
                        setUser(null);
                        setUserRole('user');
                        setAuthMethod('unknown');
                        setIsLoading(false);
                        return;
                    }

                    if (userDoc.exists()) {
                        const userData = userDoc.data() as User;
                        setUser(userData);
                        setUserRole(role);
                        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
                    } else {
                        const fallbackUser: User = {
                            id: firebaseUser.uid,
                            name: firebaseUser.displayName || (firebaseUser.isAnonymous ? 'Guest User' : firebaseUser.email?.split('@')[0] || 'Campus User'),
                            username: firebaseUser.displayName
                                ? firebaseUser.displayName.toLowerCase().replace(/\s+/g, '_')
                                : firebaseUser.email?.split('@')[0] || 'guest',
                            email: firebaseUser.email || '',
                            major: '',
                            department: '',
                            rollNumber: '',
                            startYear: '',
                            bio: '',
                            avatar: firebaseUser.photoURL || '',
                            phone: firebaseUser.phoneNumber || '',
                            isVerified: firebaseUser.emailVerified || firebaseUser.isAnonymous,
                            totalSales: 0,
                            memberSince: new Date().getFullYear().toString(),
                            role: 'user',
                        };

                        setUser(fallbackUser);
                        setUserRole('user');
                        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(fallbackUser));
                    }
                } catch (error) {
                    console.error("[AuthContext] Auth check error:", error);
                }
            } else {
                setUser(null);
                setUserRole('user');
                setAuthMethod('unknown');
                await AsyncStorage.removeItem(AUTH_USER_KEY);
            }

            setIsLoading(false);
        });

        return unsubscribe;
    }, []);

    useEffect(() => {
        if (isLoading || !pathname) return;

        const authRoutes = ['/login', '/signup', '/reset_password'];
        const isOnAuthRoute = authRoutes.includes(pathname);

        if (user && isOnAuthRoute) {
            router.replace('/');
            return;
        }

        if (!user && !isOnAuthRoute) {
            router.replace('/login');
        }
    }, [isLoading, pathname, router, user]);

    const login = async (email: string, password: string) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const fbUser = userCredential.user;
            
            await fbUser.reload();
            const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
            let role = 'user';
            if (userDoc.exists()) role = userDoc.data()?.role || 'user';

            if (role !== 'admin' && !fbUser.emailVerified) {
                await signOut(auth);
                return { success: false, error: 'Please verify your email.', unverified: true };
            }

            const userData = userDoc.exists() ? (userDoc.data() as User) : null;
            if (userData) {
                setUser(userData);
                setUserRole(role);
                await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
            }

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    };

    const signup = async (data: SignupData) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
            const fbUser = userCredential.user;

            const newUser: User = {
                id: fbUser.uid,
                name: data.name,
                username: data.username,
                email: data.email,
                major: data.major,
                department: data.department,
                rollNumber: data.rollNumber,
                startYear: data.startYear,
                phone: data.phone,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=4B7BE5&color=fff`,
                isVerified: false,
                totalSales: 0,
                memberSince: new Date().getFullYear().toString(),
                bio: ''
            };

            await setDoc(doc(db, 'users', fbUser.uid), { ...newUser, role: 'user', createdAt: serverTimestamp() });
            await sendEmailVerification(fbUser);
            await signOut(auth);

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    };

    const signInWithGoogle = async () => {
        try {
            // For Expo apps, we'll use a simplified approach with Google sign-in
            // This requires setting up OAuth consent screen and redirect URIs in Firebase Console
            
            // Get the ID token from Google Sign-In
            // For now, we'll implement a web-based flow using Firebase
            
            const provider = new GoogleAuthProvider();
            provider.addScope('profile');
            provider.addScope('email');
            
            // For React Native, use signInWithCredential after getting the token
            // This is a placeholder that users need to complete with their Google Sign-In setup
            
            // Alternative simple implementation for testing:
            // 1. User must configure Google Sign-In in Firebase Console
            // 2. Add OAuth 2.0 Client IDs for Android, iOS, and Web
            // 3. Download configuration files
            
            return { 
                success: false, 
                error: 'Google Sign-In requires additional Firebase Console setup. Please configure OAuth credentials.' 
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    };

    const signInAnonymously = async () => {
        try {
            await firebaseSignInAnonymously(auth);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    };

    const logout = async () => {
        await signOut(auth);
        await AsyncStorage.removeItem(AUTH_USER_KEY);
        setUser(null);
    };

    const getIdToken = async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) return null;
        try {
            return await currentUser.getIdToken();
        } catch (error) {
            console.error('[AuthContext] getIdToken failed:', error);
            return null;
        }
    };

    const updateUser = async (updates: Partial<User>) => {
        if (!user) return;
        try {
            await updateDoc(doc(db, 'users', user.id), updates);
            const updated = { ...user, ...updates };
            setUser(updated);
            await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated));
        } catch (error) {
            console.error("[AuthContext] Update failed:", error);
        }
    };

    const toggleSavedItem = async (itemId: string) => {
        if (!user) return;
        try {
            const savedItems = user.savedItems || [];
            const isSaved = savedItems.includes(itemId);
            const updatedSavedItems = isSaved
                ? savedItems.filter(id => id !== itemId)
                : [...savedItems, itemId];
            
            await updateDoc(doc(db, 'users', user.id), {
                savedItems: updatedSavedItems
            });

            const updatedUser = { ...user, savedItems: updatedSavedItems };
            setUser(updatedUser);
            await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
        } catch (error) {
            console.error("[AuthContext] toggleSavedItem failed:", error);
            throw error;
        }
    };

    const resendVerificationEmail = async (email: string, password: string) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const fbUser = userCredential.user;
            await sendEmailVerification(fbUser);
            await signOut(auth);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    };

    const deleteAccount = async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            return { success: false, error: 'No user signed in' };
        }
        try {
            const uid = currentUser.uid;
            await deleteDoc(doc(db, 'users', uid));
            await deleteUser(currentUser);
            await AsyncStorage.removeItem(AUTH_USER_KEY);
            setUser(null);
            return { success: true };
        } catch (error: any) {
            console.error("Account deletion failed:", error);
            if (error.code === 'auth/requires-recent-login') {
                return { success: false, error: 'Please sign out and sign back in, then try again to delete your account.' };
            }
            return { success: false, error: error.message };
        }
    };

    if (isLoading) {
        return <View style={{ flex: 1, backgroundColor: '#0D1B2A' }} />;
    }

    return (
        <AuthContext.Provider value={{
            user,
            userRole,
            authMethod,
            isLoggedIn: !!user,
            isLoading,
            login,
            signup,
            signInWithGoogle,
            signInAnonymously,
            logout,
            updateUser,
            toggleSavedItem,
            resendVerificationEmail,
            deleteAccount,
            getIdToken,
            totalUnreadCount,
            unreadNotifsCount,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
