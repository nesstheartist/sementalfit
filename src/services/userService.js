import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export const getCurrentUser = async (userId) => {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        return userDoc.exists() ? userDoc.data() : null;
    } catch (error) {
        console.error('Error getting user:', error);
        return null;
    }
};

export const updateUserProfile = async (userId, updates) => {
    try {
        await updateDoc(doc(db, 'users', userId), updates);
        return true;
    } catch (error) {
        console.error('Error updating user profile:', error);
        return false;
    }
}; 