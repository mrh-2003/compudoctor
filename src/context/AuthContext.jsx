import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            try {
                if (user) {
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        setCurrentUser({
                            uid: user.uid,
                            email: user.email,
                            ...userDocSnap.data()
                        });
                    } else {
                        // Si el usuario existe en Auth pero no en Firestore, lo deslogueamos.
                        setCurrentUser(null);
                    }
                } else {
                    setCurrentUser(null);
                }
            } catch (error) {
                console.error("Error al obtener datos del usuario:", error);
                setCurrentUser(null);
            } finally {
                // crucial: setLoading(false) solo se llama después de que todas las
                // operaciones asíncronas (incluida la de Firestore) hayan terminado.
                setLoading(false);
            }
        });
        return unsubscribe;
    }, []);

    const value = useMemo(() => ({
        currentUser,
        loading
    }), [currentUser, loading]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    return useContext(AuthContext);
};