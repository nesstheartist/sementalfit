import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    function getErrorMessage(error) {
        switch (error.code) {
            case 'auth/user-not-found':
                return 'No existe una cuenta con este email.';
            case 'auth/wrong-password':
                return 'Contraseña incorrecta.';
            case 'auth/email-already-in-use':
                return 'Este email ya está registrado.';
            case 'auth/weak-password':
                return 'La contraseña debe tener al menos 6 caracteres.';
            case 'auth/invalid-email':
                return 'Email inválido.';
            default:
                return error.message;
        }
    }

    async function login(email, password) {
        try {
            setError(null);
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            
            // Actualizar último inicio de sesión
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                lastLogin: serverTimestamp()
            }, { merge: true });

            return userCredential;
        } catch (error) {
            console.error('Error en login:', error);
            setError(getErrorMessage(error));
            throw error;
        }
    }

    async function loginWithGoogle() {
        try {
            setError(null);
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            
            // Verificar si el usuario ya existe en Firestore
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            
            if (!userDoc.exists()) {
                // Si no existe, crear nuevo usuario
                await setDoc(doc(db, 'users', user.uid), {
                    email: user.email,
                    name: user.displayName,
                    role: 1, // Usuario normal por defecto
                    createdAt: serverTimestamp(),
                    lastLogin: serverTimestamp()
                });
            } else {
                // Si existe, actualizar último login
                await setDoc(doc(db, 'users', user.uid), {
                    lastLogin: serverTimestamp()
                }, { merge: true });
            }

            return result;
        } catch (error) {
            console.error('Error en login con Google:', error);
            setError(getErrorMessage(error));
            throw error;
        }
    }

    async function register(email, password, name, role = 1) {
        try {
            setError(null);
            // Si se intenta crear un personal trainer (rol 2) y el usuario actual no es admin (rol 3), lanzar error
            if (role === 2 && (!currentUser || currentUser.role !== 3)) {
                throw new Error('Solo un administrador puede crear un Personal Trainer.');
            }
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Crear documento de usuario en Firestore
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                email,
                name,
                role, // Guardar como número
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
                status: 'active'
            });
            console.log('Documento de usuario creado en Firestore:', userCredential.user.uid);

            return userCredential;
        } catch (error) {
            console.error('Error en registro:', error);
            setError(getErrorMessage(error));
            throw error;
        }
    }

    async function logout() {
        try {
            setError(null);
            await signOut(auth);
        } catch (error) {
            console.error('Error en logout:', error);
            setError(getErrorMessage(error));
            throw error;
        }
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        if (userData.status === 'blocked') {
                            await signOut(auth);
                            setError('Usuario bloqueado');
                            return;
                        }
                        setCurrentUser({
                            ...user,
                            ...userData
                        });
                    }
                } catch (error) {
                    console.error('Error al obtener datos del usuario:', error);
                    setError(getErrorMessage(error));
                }
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        login,
        loginWithGoogle,
        register,
        logout,
        error
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
} 