import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribeFirestore = () => {};

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            unsubscribeFirestore();

            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                
                unsubscribeFirestore = onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setCurrentUser({
                            uid: user.uid,
                            email: user.email,
                            ...docSnap.data()
                        });
                    } else {
                        setCurrentUser(null);
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("Error al escuchar datos del usuario:", error);
                    setCurrentUser(null);
                    setLoading(false);
                });

            } else {
                setCurrentUser(null);
                setLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            unsubscribeFirestore();
        };
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