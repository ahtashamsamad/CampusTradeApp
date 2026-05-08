import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '@/src/config/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Platform } from 'react-native';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile as firebaseUpdateProfile,
    deleteUser,
    sendEmailVerification
} from 'firebase/auth';
import { collection, where, onSnapshot, query, getDocs, deleteDoc } from 'firebase/firestore';
import { registerForPushNotificationsAsync, sendLocalNotification, savePushToken } from '@/src/utils/notifications';
import { useRef } from 'react';
import Constants from 'expo-constants';

const isBrowser = typeof window !== 'undefined';
const isExpoGo = Constants.appOwnership === 'expo';

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
    preferences?: {
        pushNotifications: boolean;
    };
    preferredMeetupLocation?: string;
    profileComplete?: boolean;
    role?: string;
};

const DEFAULT_USER: User = {
    id: 'dev-user-123',
    name: 'Alex Student',
    username: 'alex_s',
    email: 'alex.student@university.edu',
    major: 'Computer Science',
    department: 'Computer Science Dept',
    rollNumber: 'BSCSE-22-01',
    startYear: '2022',
    bio: '',
    avatar: 'https://ui-avatars.com/api/?name=User&background=6366f1&color=fff&size=300',
    phone: '',
    isVerified: false,
    totalSales: 0,
    savedItems: [],
    preferences: {
        pushNotifications: true,
    },
    preferredMeetupLocation: ''
};

interface AuthContextType {
    user: User | null;
    userRole: string;
    isLoggedIn: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string; unverified?: boolean }>;
    signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
    resendVerificationEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    updateUser: (updates: Partial<User>) => Promise<void>;
    toggleSavedItem: (itemId: string) => Promise<void>;
    deleteAccount: () => Promise<{ success: boolean; error?: string }>;
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
    isLoggedIn: false,
    isLoading: true,
    login: async () => ({ success: false }),
    signup: async () => ({ success: false }),
    resendVerificationEmail: async () => ({ success: false }),
    logout: async () => { },
    updateUser: async () => { },
    toggleSavedItem: async () => { },
    deleteAccount: async () => ({ success: false }),
    totalUnreadCount: 0,
    unreadNotifsCount: 0,
});

const AUTH_USER_KEY = '@campus_trade_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userRole, setUserRole] = useState('user');
    const [isLoading, setIsLoading] = useState(true);
    const [totalUnreadCount, setTotalUnreadCount] = useState(0);
    const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
    const lastUnreadCounts = useRef<Record<string, number>>({});

    useEffect(() => {
        if (Platform.OS !== 'web' && isBrowser && user?.id && !isExpoGo) {
            registerForPushNotificationsAsync().then(token => {
                if (token && user?.id) {
                    savePushToken(user.id, token);
                }
            });
        }
    }, [user?.id]);

    useEffect(() => {
        // Listen for Firebase auth state changes
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                if (Platform.OS !== 'web' && isBrowser && !isExpoGo) {
                    registerForPushNotificationsAsync().then(token => {
                        if (token) savePushToken(firebaseUser.uid, token);
                    }).catch(console.warn);
                }
                
                // User is signed in, try to get extra data from Firestore first
                try {
                    await firebaseUser.reload(); // get latest emailVerified status

                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                    let role = 'user';
                    if (userDoc.exists()) {
                        role = userDoc.data()?.role || 'user';
                    }

                    // Check verification unless admin
                    if (role !== 'admin' && !firebaseUser.emailVerified) {
                        setUser(null);
                        await AsyncStorage.removeItem(AUTH_USER_KEY);
                        setIsLoading(false);
                        return; // do not set user in context
                    }

                    if (userDoc.exists()) {
                        const userData = userDoc.data() as User;
                        setUser(userData);
                        const role = userData.role || 'user';
                        setUserRole(role);
                        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
                    } else {
                        // If no Firestore doc, check AsyncStorage as fallback
                        const saved = await AsyncStorage.getItem(AUTH_USER_KEY);
                        if (saved) {
                            try { setUser(JSON.parse(saved)); } catch { }
                        } else {
                            // Fallback to minimal user info from Firebase Auth
                            const minimalUser: User = {
                                ...DEFAULT_USER,
                                id: firebaseUser.uid,
                                email: firebaseUser.email || '',
                                name: firebaseUser.displayName || 'Anonymous User',
                                avatar: firebaseUser.photoURL || DEFAULT_USER.avatar,
                            };
                            setUser(minimalUser);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching user doc:", error);
                }
            } else {
                // User is signed out
                setUser(null);
                await AsyncStorage.removeItem(AUTH_USER_KEY);
            }
            setIsLoading(false);
        });

        return unsubscribe;
    }, []);

    useEffect(() => {
        if (!user?.id) {
            setTotalUnreadCount(0);
            setUnreadNotifsCount(0);
            return;
        }

        // 1. Listen for Chat Unread Messages
        const qChats = query(
            collection(db, 'chats'),
            where('participantIds', 'array-contains', user.id)
        );

        const unsubscribeChats = onSnapshot(qChats, (snapshot) => {
            let total = 0;
            const newCounts: Record<string, number> = {};
            
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                const chatId = doc.id;

                // Skip soft-deleted chats for this user
                if ((data.deletedBy || []).includes(user.id)) return;

                const unread = data.unreadCounts?.[user.id] || 0;
                total += unread;
                newCounts[chatId] = unread;

                const prevUnread = lastUnreadCounts.current[chatId] || 0;
                if (Platform.OS !== 'web' && isBrowser && unread > prevUnread && !isExpoGo) {
                    const otherParticipant = data.participants?.find((p: any) => p.id !== user.id);
                    sendLocalNotification(
                        `New Message from ${otherParticipant?.name || 'Campus Student'}`,
                        data.lastMessage || 'Sent you a message',
                        { chatId: doc.id, screen: `/chat/${doc.id}` }
                    );
                }
            });
            
            lastUnreadCounts.current = newCounts;
            setTotalUnreadCount(total);
        });

        // 2. Listen for General Unread Notifications
        const qNotifs = query(
            collection(db, 'notifications'),
            where('toUserId', '==', user.id),
            where('isRead', '==', false)
        );

        const unsubscribeNotifs = onSnapshot(qNotifs, (snapshot) => {
            setUnreadNotifsCount(snapshot.size);
        }, (error: any) => {
            if (error.code === 'failed-precondition') {
                console.warn("Notifications index is still building...");
            } else {
                console.error("Notifications listener error:", error.message);
            }
            // Ensure no alert/toast is triggered during background sync
            setUnreadNotifsCount(0);
        });

        return () => {
            unsubscribeChats();
            unsubscribeNotifs();
        };
    }, [user?.id]);

    const login = async (email: string, password: string) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;

            // Wait for the auth state to be fully established before touching Firestore.
            // This prevents the "Missing or insufficient permissions" error that occurs
            // when the Firestore SDK hasn't received the auth token yet.
            await new Promise<void>((resolve) => {
                const unsubscribe = onAuthStateChanged(auth, (confirmedUser) => {
                    if (confirmedUser?.uid === firebaseUser.uid) {
                        unsubscribe();
                        resolve();
                    }
                });
            });

            // Now it's safe to fetch the user's Firestore document
            await firebaseUser.reload();
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            let role = 'user';
            if (userDoc.exists()) {
                role = userDoc.data()?.role || 'user';
            }

            if (role !== 'admin' && !firebaseUser.emailVerified) {
                await signOut(auth);
                return { success: false, error: 'Please verify your email first. Check your inbox for the verification link.', unverified: true };
            }

            let loggedInUser: User;

            if (userDoc.exists()) {
                loggedInUser = userDoc.data() as User;
            } else {
                loggedInUser = {
                    ...DEFAULT_USER,
                    id: firebaseUser.uid,
                    email: firebaseUser.email || email,
                    name: firebaseUser.displayName || 'Campus User'
                };
            }

            await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(loggedInUser));
            setUser(loggedInUser);
            return { success: true };
        } catch (error: any) {
            console.error("Login error:", error);
            return { success: false, error: error.message || 'Invalid credentials.' };
        }
    };

    const signup = async (data: SignupData) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
            const firebaseUser = userCredential.user;

            // Update display name in Firebase Auth
            await firebaseUpdateProfile(firebaseUser, {
                displayName: data.name
            });

            const newUser: User = {
                ...DEFAULT_USER,
                id: firebaseUser.uid,
                name: data.name,
                username: data.username,
                email: data.email,
                major: data.major || 'Undecided',
                department: data.department || '',
                rollNumber: data.rollNumber || '',
                startYear: data.startYear || '',
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=6366f1&color=fff&size=300`,
                isVerified: false,
                totalSales: 0,
                memberSince: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                phone: data.phone || '',
                savedItems: [],
                preferences: { pushNotifications: true },
                preferredMeetupLocation: '',
                profileComplete: true
            };

            // Save to Firestore
            await setDoc(doc(db, 'users', firebaseUser.uid), {
                ...newUser,
                createdAt: serverTimestamp()
            });

            await sendEmailVerification(firebaseUser);
            await signOut(auth);

            return { success: true };
        } catch (error: any) {
            console.error("Signup error:", error);
            return { success: false, error: error.message || 'Signup failed.' };
        }
    };

    const logout = async () => {
        try {
            console.log("Starting Firebase signOut...");
            await signOut(auth);
            console.log("Firebase signed out successfully.");
            await AsyncStorage.removeItem(AUTH_USER_KEY);
            setUser(null);
            console.log("Auth session cleared locally.");
        } catch (error) {
            console.error("Logout error in AuthContext:", error);
            throw error;
        }
    };

    const resendVerificationEmail = async (email: string, password: string) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            if (user && !user.emailVerified) {
                await sendEmailVerification(user);
                await signOut(auth);
                return { success: true };
            }
            await signOut(auth);
            return { success: false, error: 'User is already verified.' };
        } catch (error: any) {
            return { success: false, error: error.message || 'Failed to resend email. Please check your credentials.' };
        }
    };

    const updateUser = async (updates: Partial<User>) => {
        if (!user) return;
        const updated = { ...user, ...updates };

        // Save to Firestore
        try {
            await setDoc(doc(db, 'users', user.id), updated, { merge: true });
        } catch (error) {
            console.error("Error updating user doc:", error);
        }

        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated));
        setUser(updated);
    };

    const toggleSavedItem = async (itemId: string) => {
        if (!user) return;
        
        const isSaved = (user.savedItems || []).includes(itemId);
        let newSavedItems = [...(user.savedItems || [])];
        
        if (isSaved) {
            newSavedItems = newSavedItems.filter(id => id !== itemId);
        } else {
            newSavedItems.push(itemId);
        }

        await updateUser({ savedItems: newSavedItems });
    };

    const deleteAccount = async () => {
        if (!user || !auth.currentUser) return { success: false, error: 'No authenticated user found.' };

        try {
            const userId = user.id;
            const firebaseUser = auth.currentUser;

            // 1. Delete user's listings
            const listingsQuery = query(collection(db, 'listings'), where('sellerId', '==', userId));
            const listingsSnap = await getDocs(listingsQuery);
            const deleteListingsPromises = listingsSnap.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deleteListingsPromises);

            // 2. Delete user's profile document
            await deleteDoc(doc(db, 'users', userId));

            // 3. Delete user's notifications
            const notifsQuery = query(collection(db, 'notifications'), where('recipientId', '==', userId));
            const notifsSnap = await getDocs(notifsQuery);
            const deleteNotifsPromises = notifsSnap.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deleteNotifsPromises);

            // 4. Delete user's auth account
            await deleteUser(firebaseUser);

            // 5. Cleanup local state
            await AsyncStorage.removeItem(AUTH_USER_KEY);
            setUser(null);

            return { success: true };
        } catch (error: any) {
            console.error("Delete account error:", error);
            // If it's a "requires-recent-login" error, we should probably inform the user
            if (error.code === 'auth/requires-recent-login') {
                return { success: false, error: 'Please log out and log back in before deleting your account for security.' };
            }
            return { success: false, error: error.message || 'Failed to delete account.' };
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            userRole,
            isLoggedIn: !!user, isLoading, login, signup, resendVerificationEmail, logout, updateUser, 
            toggleSavedItem, deleteAccount, totalUnreadCount, unreadNotifsCount 
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
