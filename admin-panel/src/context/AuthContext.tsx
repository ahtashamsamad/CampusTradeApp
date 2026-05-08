import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../config/firebase";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export interface AdminUser {
  uid: string;
  email: string;
  name: string;
  avatar: string;
  role: string;
}

interface AuthContextType {
  admin: AdminUser | null;
  loading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  admin: null,
  loading: true,
  login: async () => ({ success: false }),
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const isAdmin = await checkAdmin(firebaseUser);
        if (isAdmin) {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          const data = userDoc.data();
          setAdmin({
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            name: data?.name || firebaseUser.displayName || "Admin",
            avatar:
              data?.avatar ||
              `https://ui-avatars.com/api/?name=Admin&background=4F46E5&color=fff&size=200`,
            role: "admin",
          });
        } else {
          // Not admin — sign out
          await signOut(auth);
          setAdmin(null);
        }
      } else {
        setAdmin(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const checkAdmin = async (firebaseUser: FirebaseUser): Promise<boolean> => {
    try {
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      if (userDoc.exists()) {
        return userDoc.data()?.role === "admin";
      }
      return false;
    } catch (err) {
      console.error("Admin check error:", err);
      return false;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const isAdmin = await checkAdmin(cred.user);
      if (!isAdmin) {
        await signOut(auth);
        return { success: false, error: "Access denied. Admin only." };
      }
      const userDoc = await getDoc(doc(db, "users", cred.user.uid));
      const data = userDoc.data();
      setAdmin({
        uid: cred.user.uid,
        email: cred.user.email || "",
        name: data?.name || cred.user.displayName || "Admin",
        avatar:
          data?.avatar ||
          `https://ui-avatars.com/api/?name=Admin&background=4F46E5&color=fff&size=200`,
        role: "admin",
      });
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Login failed.",
      };
    }
  };

  const logout = async () => {
    await signOut(auth);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
