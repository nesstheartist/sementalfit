import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export const saveUserRoutine = async (userId, routine) => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { routine });
};

export const getUserProfile = async (userId) => {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    return userDoc.exists() ? userDoc.data() : null;
};

export const updateUserProgress = async (userId, type) => {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    
    const progress = userData.progress || {};
    const today = new Date().toISOString().split('T')[0];
    
    if (!progress[today]) {
        progress[today] = {
            exercises: 0,
            weight_updates: 0,
            last_update: new Date().toISOString()
        };
    }
    
    if (type === 'weight_update') {
        progress[today].weight_updates = (progress[today].weight_updates || 0) + 1;
    }
    
    progress[today].last_update = new Date().toISOString();
    
    await updateDoc(userRef, { progress });
};

export const updateUserStats = async (userId, stats) => {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    
    const currentStats = userData.stats || {};
    const updatedStats = {
        ...currentStats,
        ...stats
    };
    
    await updateDoc(userRef, { stats: updatedStats });
}; 