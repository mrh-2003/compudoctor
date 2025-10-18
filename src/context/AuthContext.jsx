import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pendingReportsCount, setPendingReportsCount] = useState(0);

    useEffect(() => {
        let unsubscribeFirestore = () => {};
        let unsubscribeReports = () => {};

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            unsubscribeFirestore();
            unsubscribeReports();

            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                
                unsubscribeFirestore = onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const userData = {
                            uid: user.uid,
                            email: user.email,
                            ...docSnap.data()
                        };
                        setCurrentUser(userData);

                        if (userData.uid) {
                            const reportsCol = collection(db, 'diagnosticos');
                            const q = query(reportsCol, 
                                where('tecnicoActualId', '==', userData.uid), 
                                where('estado', 'in', ['PENDIENTE', 'ASIGNADO'])
                            );

                            unsubscribeReports = onSnapshot(q, (snapshot) => {
                                setPendingReportsCount(snapshot.size);
                            }, (error) => {
                                console.error("Error al escuchar reportes:", error);
                                setPendingReportsCount(0);
                            });
                        }

                    } else {
                        setCurrentUser(null);
                        setPendingReportsCount(0);
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("Error al escuchar datos del usuario:", error);
                    setCurrentUser(null);
                    setLoading(false);
                    setPendingReportsCount(0);
                });

            } else {
                setCurrentUser(null);
                setLoading(false);
                setPendingReportsCount(0);
            }
        });

        return () => {
            unsubscribeAuth();
            unsubscribeFirestore();
            unsubscribeReports();
        };
    }, []);

    const value = useMemo(() => ({
        currentUser,
        loading,
        pendingReportsCount,
    }), [currentUser, loading, pendingReportsCount]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    return useContext(AuthContext);
};