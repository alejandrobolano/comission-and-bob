import React, { createContext, useContext, useState, useEffect } from "react";
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
} from "firebase/auth";
import { auth, db } from "../services/firebaseConfig";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

interface User {
    id: string;
    email: string;
    hasMembership: boolean;
    membershipStatus: "active" | "inactive" | "pending";
    stripeCustomerId?: string;
    currentPeriodEnd?: number;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    hasMembership: boolean;
    login: (email: string, password: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    goToCheckout: () => Promise<void>;
    checkMembershipStatus: () => Promise<void>;
    cancelPlan: () => Promise<void>;
    resumePlan: () => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setLoading(true);
            try {
                if (!firebaseUser) {
                    setUser(null);
                    setIsAuthenticated(false);
                    return;
                }

                setIsAuthenticated(true);
                let userData: any = null;
                try {
                    const snap = await getDoc(doc(db, "users", firebaseUser.uid));
                    if (snap.exists()) userData = snap.data();
                } catch (e) {
                    console.warn("Firestore users read failed:", e);
                }

                setUser({
                    id: firebaseUser.uid,
                    email: firebaseUser.email || "",
                    hasMembership: userData?.hasMembership ?? false,
                    membershipStatus: userData?.membershipStatus ?? "inactive",
                    stripeCustomerId: userData?.stripeCustomerId,
                    currentPeriodEnd: userData?.currentPeriodEnd,
                });
            } finally {
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    const login = async (email: string, password: string) => {
        setLoading(true);
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            const userRef = doc(db, "users", result.user.uid);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                await setDoc(userRef, {
                    email: result.user.email,
                    hasMembership: false,
                    membershipStatus: "inactive",
                    createdAt: serverTimestamp(),
                });
            }
        } catch (error: any) {
            console.error("Auth error code:", error?.code);
            console.error("Auth error message:", error?.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            await signOut(auth);
        } finally {
            setLoading(false);
        }
    };

    const goToCheckout = async () => {
        if (!auth.currentUser) return;

        try {
            const idToken = await auth.currentUser.getIdToken();

            const response = await fetch("/api/createCheckoutSession", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({}),
            });

            console.log("Checkout response status:", response.status);
            console.log("Checkout response headers:", response.headers);

            if (!response.ok) {
                const msg = await response.text().catch(() => "");
                console.error("Checkout error response:", msg);
                throw new Error(`Checkout error (${response.status}): ${msg}`);
            }

            const text = await response.text();
            console.log("Response text:", text);

            const data = JSON.parse(text);
            console.log("Checkout data:", data);

            if (!data?.url) throw new Error("Backend no devolvió url de Checkout Session");

            console.log("Redirigiendo a Stripe:", data.url);
            window.location.assign(data.url);
        } catch (error) {
            console.error("Error al ir a checkout:", error);
            throw error;
        }
    };

    const checkMembershipStatus = async () => {
        if (!user) return;

        try {
            const userDoc = await getDoc(doc(db, "users", user.id));
            const userData = userDoc.data();

            setUser((prev) =>
                prev
                    ? {
                        ...prev,
                        hasMembership: userData?.hasMembership ?? false,
                        membershipStatus: userData?.membershipStatus ?? "inactive",
                        stripeCustomerId: userData?.stripeCustomerId,
                        currentPeriodEnd: userData?.currentPeriodEnd,
                    }
                    : null
            );
        } catch (error) {
            console.error("Error al verificar membresía:", error);
        }
    };

    const cancelPlan = async () => {
        if (!auth.currentUser) return;

        const idToken = await auth.currentUser.getIdToken();

        const res = await fetch("/api/cancelSubscription", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({}),
        });

        if (!res.ok) {
            const msg = await res.text().catch(() => "");
            throw new Error(`Cancel error (${res.status}): ${msg}`);
        }
    };

    const resumePlan = async () => {
        if (!auth.currentUser) return;
        const idToken = await auth.currentUser.getIdToken();

        const res = await fetch("/api/resumeSubscription", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({}),
        });

        if (!res.ok) {
            const msg = await res.text().catch(() => "");
            throw new Error(`Resume error (${res.status}): ${msg}`);
        }
    };

    const loginWithGoogle = async () => {
        setLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);

            const userRef = doc(db, "users", result.user.uid);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                await setDoc(
                    userRef,
                    {
                        email: result.user.email,
                        hasMembership: false,
                        membershipStatus: "inactive",
                        createdAt: serverTimestamp(),
                    },
                    { merge: true }
                );
            }
        } catch (error: any) {
            console.error("Google login error:", error?.code, error?.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };



    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated,
                hasMembership: user?.hasMembership ?? false,
                login,
                loginWithGoogle,
                logout,
                goToCheckout,
                checkMembershipStatus,
                cancelPlan,
                resumePlan,
                loading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};
