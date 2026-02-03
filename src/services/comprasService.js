import { db } from './firebase';
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
    deleteDoc
} from 'firebase/firestore';

const COLLECTION_NAME = 'purchases';

export const createPurchase = async (purchaseData) => {
    try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...purchaseData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        throw error;
    }
};

export const getPurchases = async (filters = {}) => {
    try {
        let q = query(collection(db, COLLECTION_NAME), orderBy('date', 'desc'));

        if (filters.tipoComprobante) {
            q = query(q, where('tipoComprobante', '==', filters.tipoComprobante));
        }

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        throw error;
    }
};

export const getPurchaseById = async (id) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            return null;
        }
    } catch (error) {
        throw error;
    }
};

export const updatePurchase = async (id, data) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        throw error;
    }
};

export const deletePurchase = async (id) => {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
        throw error;
    }
};
