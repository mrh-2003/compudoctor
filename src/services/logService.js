import { db, auth } from './firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, limit } from 'firebase/firestore';

const COLLECTION_NAME = 'audit_logs';

export const logAction = async (action, entityName, entity, summary, entityId = null) => {
    try {
        const user = auth.currentUser;
        const logEntry = {
            timestamp: serverTimestamp(),
            userId: user ? user.uid : null,
            userEmail: user ? user.email : 'system_or_anonymous',
            action,
            entityName,
            entity, // Store the full object or relevant details
            summary,
            entityId
        };
        await addDoc(collection(db, COLLECTION_NAME), logEntry);
    } catch (error) {
        console.error("Error logging action:", error);
        // We generally don't want to fail the main operation if logging fails, so we just catch.
    }
};

export const getLogs = async (limitCount = 100) => {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching logs:", error);
        throw error;
    }
};
