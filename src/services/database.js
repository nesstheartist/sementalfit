import { 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    getDoc, 
    updateDoc,
    query,
    where,
    arrayUnion,
    setDoc,
    writeBatch,
    limit,
    deleteDoc,
    increment
} from 'firebase/firestore';
import { db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

// Funciones para usuarios
export const createUser = async (userData) => {
    try {
        const docRef = await addDoc(collection(db, "users"), {
            ...userData,
            level: 1,
            xp: 0,
            createdAt: new Date(),
            lastLogin: new Date()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error al crear usuario:", error);
        throw error;
    }
};

// Función para verificar si los ejercicios están inicializados
const checkExercisesInitialized = async () => {
    try {
        const exercisesRef = collection(db, 'exercises');
        const q = query(exercisesRef, limit(1));
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    } catch (error) {
        console.error('Error al verificar ejercicios:', error);
        return false;
    }
};

// Función para inicializar todos los ejercicios automáticamente
const initializeAllExercises = async () => {
    try {
        const categories = ['Pecho', 'Espalda', 'Hombros', 'Piernas', 'Gemelos', 'Bíceps', 'Tríceps', 'Abdominales'];
        for (const category of categories) {
            await initializeExercisesByCategory(category);
        }
        return true;
    } catch (error) {
        console.error('Error al inicializar ejercicios:', error);
        return false;
    }
};

// Función para obtener un usuario
export const getUser = async () => {
    try {
        // Primero verificar si los ejercicios están inicializados
        const exercisesInitialized = await checkExercisesInitialized();
        if (!exercisesInitialized) {
            console.log('Inicializando ejercicios automáticamente...');
            await initializeAllExercises();
        }

        const usersRef = collection(db, 'users');
        const q = query(usersRef, limit(1));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            return {
                id: userDoc.id,
                ...userDoc.data()
            };
        } else {
            // Si no existe ningún usuario, crear uno por defecto
            const defaultUser = {
                name: 'Usuario',
                level: 'Principiante',
                experience: 0,
                goals: ['Ganar masa muscular', 'Mejorar la fuerza'],
                levelName: 'Novato',
                discount: 0.1,
                xp: 0
            };
            
            const docRef = await addDoc(collection(db, 'users'), defaultUser);
            return {
                id: docRef.id,
                ...defaultUser
            };
        }
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        // En caso de error, devolver un usuario por defecto
        return {
            name: 'Usuario',
            level: 'Principiante',
            experience: 0,
            goals: ['Ganar masa muscular', 'Mejorar la fuerza'],
            levelName: 'Novato',
            discount: 0.1,
            xp: 0
        };
    }
};

// Funciones para rutinas
export const saveWorkout = async (userId, workoutData) => {
    try {
        const docRef = await addDoc(collection(db, "workouts"), {
            userId,
            ...workoutData,
            completedAt: new Date()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error al guardar rutina:", error);
        throw error;
    }
};

export const getUserWorkouts = async (userId) => {
    try {
        const q = query(collection(db, "workouts"), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error al obtener rutinas:", error);
        throw error;
    }
};

// Funciones para progreso
export const updateProgress = async (userId, progressData) => {
    try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
            xp: progressData.xp,
            level: progressData.level,
            lastUpdated: new Date()
        });
    } catch (error) {
        console.error("Error al actualizar progreso:", error);
        throw error;
    }
};

// Función para obtener todos los usuarios
export const getUsers = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        throw error;
    }
};

// Función para obtener todos los ejercicios
export const getAllExercises = async () => {
    try {
        const exercisesRef = collection(db, 'exercises');
        const querySnapshot = await getDocs(exercisesRef);
        
        if (querySnapshot.empty) {
            console.log('No se encontraron ejercicios, inicializando...');
            await initializeAllExercises();
            // Intentar obtener los ejercicios nuevamente después de inicializar
            const newQuerySnapshot = await getDocs(exercisesRef);
            if (newQuerySnapshot.empty) {
                throw new Error('No se pudieron cargar los ejercicios después de la inicialización');
            }
            return newQuerySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error al obtener ejercicios:', error);
        throw new Error('Error al cargar los ejercicios: ' + error.message);
    }
};

// Funciones para rutinas personalizadas
export const createUserRoutine = async (userId, day, exercises) => {
    try {
        const routineRef = doc(db, "user_routines", userId);
        await setDoc(routineRef, {
            [day]: exercises
        }, { merge: true });
        return true;
    } catch (error) {
        console.error("Error al crear rutina:", error);
        throw error;
    }
};

export const getUserRoutine = async (userId) => {
    try {
        if (!userId) {
            throw new Error('Se requiere userId para obtener la rutina');
        }

        const routineDoc = await getDoc(doc(db, 'user_routines', userId));
        
        if (routineDoc.exists()) {
            return routineDoc.data();
        } else {
            // Si no existe la rutina, crear una nueva con días vacíos
            const newRoutine = {
                Lunes: [],
                Martes: [],
                Miércoles: [],
                Jueves: [],
                Viernes: [],
                Sábado: [],
                Domingo: [],
                lastUpdated: new Date().toISOString()
            };
            await setDoc(doc(db, 'user_routines', userId), newRoutine);
            return newRoutine;
        }
    } catch (error) {
        console.error('Error al obtener rutina:', error);
        throw error;
    }
};

export const updateExerciseInRoutine = async (userId, day, exerciseId, newData) => {
    try {
        const routineRef = doc(db, "user_routines", userId);
        const routineSnap = await getDoc(routineRef);
        if (routineSnap.exists()) {
            const routine = routineSnap.data();
            const dayExercises = routine[day] || [];
            const updatedExercises = dayExercises.map(ex => 
                ex.id === exerciseId ? { ...ex, ...newData } : ex
            );
            await updateDoc(routineRef, {
                [day]: updatedExercises
            });
            return true;
        }
        return false;
    } catch (error) {
        console.error("Error al actualizar ejercicio:", error);
        throw error;
    }
};

// Función para inicializar ejercicios en la base de datos
export const initializeExercises = async () => {
    const exercisesByCategory = {
        'Pecho': [
            { name: 'Press banca plano con barra', category: 'Pecho' },
            { name: 'Press banca plano con mancuernas', category: 'Pecho' },
            { name: 'Press inclinado con barra', category: 'Pecho' },
            { name: 'Press inclinado con mancuernas', category: 'Pecho' },
            { name: 'Press declinado con barra', category: 'Pecho' },
            { name: 'Press declinado con mancuernas', category: 'Pecho' },
            { name: 'Aperturas con mancuernas en banco plano', category: 'Pecho' },
            { name: 'Aperturas en banco inclinado', category: 'Pecho' },
            { name: 'Aperturas en peck-deck (contractora)', category: 'Pecho' },
            { name: 'Fondos en paralelas (pecho)', category: 'Pecho' },
            { name: 'Flexiones clásicas', category: 'Pecho' },
            { name: 'Flexiones inclinadas', category: 'Pecho' },
            { name: 'Flexiones con lastre', category: 'Pecho' },
            { name: 'Flexiones con palmada', category: 'Pecho' },
            { name: 'Press en máquina Hammer', category: 'Pecho' },
            { name: 'Press en máquina inclinada', category: 'Pecho' },
            { name: 'Aperturas con polea alta', category: 'Pecho' },
            { name: 'Aperturas con polea baja', category: 'Pecho' },
            { name: 'Press con polea de pie', category: 'Pecho' },
            { name: 'Svend press (con disco)', category: 'Pecho' }
        ],
        'Espalda': [
            { name: 'Dominadas pronas', category: 'Espalda' },
            { name: 'Dominadas supinas', category: 'Espalda' },
            { name: 'Remo con barra', category: 'Espalda' },
            { name: 'Remo con mancuerna a una mano', category: 'Espalda' },
            { name: 'Remo en máquina Hammer', category: 'Espalda' },
            { name: 'Remo en polea baja', category: 'Espalda' },
            { name: 'Remo en T-bar', category: 'Espalda' },
            { name: 'Jalón al pecho (polea alta)', category: 'Espalda' },
            { name: 'Jalón tras nuca', category: 'Espalda' },
            { name: 'Jalón al pecho con agarre neutro', category: 'Espalda' },
            { name: 'Pull-over con mancuerna', category: 'Espalda' },
            { name: 'Pull-over en polea alta', category: 'Espalda' },
            { name: 'Remo invertido (inverted row)', category: 'Espalda' },
            { name: 'Remo pecho apoyado (chest supported row)', category: 'Espalda' },
            { name: 'Remo con banda elástica', category: 'Espalda' },
            { name: 'Remo unilateral en polea', category: 'Espalda' },
            { name: 'Face pulls', category: 'Espalda' }
        ],
        'Piernas': [
            { name: 'Sentadilla libre con barra', category: 'Piernas' },
            { name: 'Sentadilla frontal', category: 'Piernas' },
            { name: 'Sentadilla hack', category: 'Piernas' },
            { name: 'Sentadilla goblet', category: 'Piernas' },
            { name: 'Sentadilla con mancuerna', category: 'Piernas' },
            { name: 'Prensa 45°', category: 'Piernas' },
            { name: 'Prensa horizontal', category: 'Piernas' },
            { name: 'Zancadas caminando', category: 'Piernas' },
            { name: 'Zancadas con barra', category: 'Piernas' },
            { name: 'Zancadas búlgaras', category: 'Piernas' },
            { name: 'Peso muerto rumano', category: 'Piernas' },
            { name: 'Peso muerto con piernas rígidas', category: 'Piernas' },
            { name: 'Buenos días con barra', category: 'Piernas' },
            { name: 'Curl femoral acostado', category: 'Piernas' },
            { name: 'Curl femoral sentado', category: 'Piernas' },
            { name: 'Hip thrust con barra', category: 'Piernas' },
            { name: 'Hip thrust en máquina', category: 'Piernas' },
            { name: 'Sentadilla sumo con mancuerna', category: 'Piernas' },
            { name: 'Step-ups al banco', category: 'Piernas' },
            { name: 'Desplantes con peso', category: 'Piernas' }
        ],
        'Gemelos': [
            { name: 'Elevación de talones de pie con barra', category: 'Gemelos' },
            { name: 'Elevación de talones en máquina de gemelos', category: 'Gemelos' },
            { name: 'Elevación sentado en máquina', category: 'Gemelos' },
            { name: 'Elevación de talones con mancuerna (una pierna)', category: 'Gemelos' },
            { name: 'Elevación en prensa', category: 'Gemelos' },
            { name: 'Elevación en escalón con barra', category: 'Gemelos' },
            { name: 'Elevación con peso corporal (altas repeticiones)', category: 'Gemelos' },
            { name: 'Saltos en punta de pie', category: 'Gemelos' },
            { name: 'Gemelos en máquina Smith', category: 'Gemelos' },
            { name: 'Elevaciones explosivas', category: 'Gemelos' },
            { name: 'Elevación de talón unilateral', category: 'Gemelos' },
            { name: 'Gemelos en multipower', category: 'Gemelos' },
            { name: 'Gemelos en hack', category: 'Gemelos' },
            { name: 'Gemelos sentado con disco', category: 'Gemelos' },
            { name: 'Saltos con mancuerna', category: 'Gemelos' },
            { name: 'Saltos a la comba (en punta)', category: 'Gemelos' },
            { name: 'Gemelos isométricos', category: 'Gemelos' },
            { name: 'Elevación en escalón con pausa', category: 'Gemelos' },
            { name: 'Elevaciones con tempo lento', category: 'Gemelos' },
            { name: 'Elevación con banda elástica', category: 'Gemelos' }
        ],
        'Hombros': [
            { name: 'Press militar con barra', category: 'Hombros' },
            { name: 'Press militar con mancuernas', category: 'Hombros' },
            { name: 'Press Arnold', category: 'Hombros' },
            { name: 'Elevaciones laterales con mancuernas', category: 'Hombros' },
            { name: 'Elevaciones frontales con mancuernas', category: 'Hombros' },
            { name: 'Elevaciones posteriores (deltoide posterior)', category: 'Hombros' },
            { name: 'Remo al menton con barra', category: 'Hombros' },
            { name: 'Elevaciones con cables', category: 'Hombros' },
            { name: 'Press en máquina', category: 'Hombros' },
            { name: 'Press con barra detrás de la nuca', category: 'Hombros' },
            { name: 'Pájaros con mancuernas', category: 'Hombros' },
            { name: 'Pájaros en peck-deck inversa', category: 'Hombros' },
            { name: 'Press con mancuernas sentado', category: 'Hombros' },
            { name: 'Elevación lateral unilateral', category: 'Hombros' },
            { name: 'Elevación frontal con disco', category: 'Hombros' },
            { name: 'Press de hombro en polea', category: 'Hombros' },
            { name: 'Remo con mancuerna', category: 'Hombros' },
            { name: 'Press landmine unilateral', category: 'Hombros' },
            { name: 'Push press', category: 'Hombros' },
            { name: 'Face pulls', category: 'Hombros' }
        ],
        'Tríceps': [
            { name: 'Fondos en paralelas (tríceps)', category: 'Tríceps' },
            { name: 'Fondos en banco', category: 'Tríceps' },
            { name: 'Extensión de tríceps en polea alta', category: 'Tríceps' },
            { name: 'Extensión de tríceps con cuerda', category: 'Tríceps' },
            { name: 'Extensión con barra recta en polea', category: 'Tríceps' },
            { name: 'Rompecráneos (skullcrushers)', category: 'Tríceps' },
            { name: 'Extensión de tríceps con mancuernas', category: 'Tríceps' },
            { name: 'Patada de tríceps', category: 'Tríceps' },
            { name: 'Press cerrado en banca', category: 'Tríceps' },
            { name: 'Press con barra EZ', category: 'Tríceps' },
            { name: 'Tríceps en máquina', category: 'Tríceps' },
            { name: 'Extensión a una mano en polea', category: 'Tríceps' },
            { name: 'Tríceps overhead con cuerda', category: 'Tríceps' },
            { name: 'Press francés con barra', category: 'Tríceps' },
            { name: 'Tríceps con barra tras nuca', category: 'Tríceps' },
            { name: 'Press de banca con agarre estrecho', category: 'Tríceps' },
            { name: 'Tríceps en polea unilateral', category: 'Tríceps' },
            { name: 'Tríceps en banda elástica', category: 'Tríceps' },
            { name: 'Tríceps con mancuerna sentado', category: 'Tríceps' },
            { name: 'Extensión con kettlebell', category: 'Tríceps' }
        ],
        'Bíceps': [
            { name: 'Curl con barra', category: 'Bíceps' },
            { name: 'Curl con barra EZ', category: 'Bíceps' },
            { name: 'Curl con mancuernas alternado', category: 'Bíceps' },
            { name: 'Curl concentrado', category: 'Bíceps' },
            { name: 'Curl predicador', category: 'Bíceps' },
            { name: 'Curl en banco inclinado', category: 'Bíceps' },
            { name: 'Curl martillo', category: 'Bíceps' },
            { name: 'Curl martillo en cuerda (polea)', category: 'Bíceps' },
            { name: 'Curl con polea baja', category: 'Bíceps' },
            { name: 'Curl de arrastre', category: 'Bíceps' },
            { name: 'Curl spider', category: 'Bíceps' },
            { name: 'Curl con banda elástica', category: 'Bíceps' },
            { name: 'Curl inverso', category: 'Bíceps' },
            { name: 'Curl 21s', category: 'Bíceps' },
            { name: 'Curl Zottman', category: 'Bíceps' },
            { name: 'Curl en máquina Scott', category: 'Bíceps' },
            { name: 'Curl doble con giro', category: 'Bíceps' },
            { name: 'Curl isométrico', category: 'Bíceps' },
            { name: 'Curl con kettlebell', category: 'Bíceps' },
            { name: 'Curl cruzado (tipo Arnold)', category: 'Bíceps' }
        ],
        'Abdominales': [
            { name: 'Crunch abdominal', category: 'Abdominales' },
            { name: 'Crunch con peso', category: 'Abdominales' },
            { name: 'Crunch en máquina', category: 'Abdominales' },
            { name: 'Crunch inverso', category: 'Abdominales' },
            { name: 'Crunch en banco declinado', category: 'Abdominales' },
            { name: 'Elevaciones de piernas', category: 'Abdominales' },
            { name: 'Elevaciones en paralelas', category: 'Abdominales' },
            { name: 'Elevaciones colgado', category: 'Abdominales' },
            { name: 'Plancha abdominal', category: 'Abdominales' },
            { name: 'Plancha lateral', category: 'Abdominales' },
            { name: 'Rueda abdominal (ab wheel)', category: 'Abdominales' },
            { name: 'Ab roll en máquina', category: 'Abdominales' },
            { name: 'Bicicleta en el suelo', category: 'Abdominales' },
            { name: 'Toques al talón', category: 'Abdominales' },
            { name: 'Elevaciones con giro', category: 'Abdominales' },
            { name: 'Crunch en polea alta (cable crunch)', category: 'Abdominales' },
            { name: 'Sit-up con disco', category: 'Abdominales' },
            { name: 'V-ups', category: 'Abdominales' },
            { name: 'Plancha con toque de hombros', category: 'Abdominales' },
            { name: 'Escaladores (mountain climbers)', category: 'Abdominales' }
        ]
    };

    try {
        const batch = writeBatch(db);
        Object.values(exercisesByCategory).flat().forEach(exercise => {
            const docRef = doc(collection(db, 'exercises'));
            batch.set(docRef, exercise);
        });
        await batch.commit();
        return true;
    } catch (error) {
        console.error('Error al inicializar ejercicios:', error);
        throw error;
    }
};

// Función para inicializar ejercicios por categoría
export const initializeExercisesByCategory = async (category) => {
    const exercisesByCategory = {
        'Pecho': [
            { name: 'Press banca plano con barra', category: 'Pecho' },
            { name: 'Press banca plano con mancuernas', category: 'Pecho' },
            { name: 'Press inclinado con barra', category: 'Pecho' },
            { name: 'Press inclinado con mancuernas', category: 'Pecho' },
            { name: 'Press declinado con barra', category: 'Pecho' },
            { name: 'Press declinado con mancuernas', category: 'Pecho' },
            { name: 'Aperturas con mancuernas en banco plano', category: 'Pecho' },
            { name: 'Aperturas en banco inclinado', category: 'Pecho' },
            { name: 'Aperturas en peck-deck (contractora)', category: 'Pecho' },
            { name: 'Fondos en paralelas (pecho)', category: 'Pecho' },
            { name: 'Flexiones clásicas', category: 'Pecho' },
            { name: 'Flexiones inclinadas', category: 'Pecho' },
            { name: 'Flexiones con lastre', category: 'Pecho' },
            { name: 'Flexiones con palmada', category: 'Pecho' },
            { name: 'Press en máquina Hammer', category: 'Pecho' },
            { name: 'Press en máquina inclinada', category: 'Pecho' },
            { name: 'Aperturas con polea alta', category: 'Pecho' },
            { name: 'Aperturas con polea baja', category: 'Pecho' },
            { name: 'Press con polea de pie', category: 'Pecho' },
            { name: 'Svend press (con disco)', category: 'Pecho' }
        ],
        'Espalda': [
            { name: 'Dominadas pronas', category: 'Espalda' },
            { name: 'Dominadas supinas', category: 'Espalda' },
            { name: 'Remo con barra', category: 'Espalda' },
            { name: 'Remo con mancuerna a una mano', category: 'Espalda' },
            { name: 'Remo en máquina Hammer', category: 'Espalda' },
            { name: 'Remo en polea baja', category: 'Espalda' },
            { name: 'Remo en T-bar', category: 'Espalda' },
            { name: 'Jalón al pecho (polea alta)', category: 'Espalda' },
            { name: 'Jalón tras nuca', category: 'Espalda' },
            { name: 'Jalón al pecho con agarre neutro', category: 'Espalda' },
            { name: 'Pull-over con mancuerna', category: 'Espalda' },
            { name: 'Pull-over en polea alta', category: 'Espalda' },
            { name: 'Remo invertido (inverted row)', category: 'Espalda' },
            { name: 'Remo pecho apoyado (chest supported row)', category: 'Espalda' },
            { name: 'Remo con banda elástica', category: 'Espalda' },
            { name: 'Remo unilateral en polea', category: 'Espalda' },
            { name: 'Face pulls', category: 'Espalda' }
        ],
        'Hombros': [
            { name: 'Press militar con barra', category: 'Hombros' },
            { name: 'Press militar con mancuernas', category: 'Hombros' },
            { name: 'Press Arnold', category: 'Hombros' },
            { name: 'Elevaciones laterales con mancuernas', category: 'Hombros' },
            { name: 'Elevaciones frontales con mancuernas', category: 'Hombros' },
            { name: 'Elevaciones posteriores (deltoide posterior)', category: 'Hombros' },
            { name: 'Remo al menton con barra', category: 'Hombros' },
            { name: 'Elevaciones con cables', category: 'Hombros' },
            { name: 'Press en máquina', category: 'Hombros' },
            { name: 'Press con barra detrás de la nuca', category: 'Hombros' },
            { name: 'Pájaros con mancuernas', category: 'Hombros' },
            { name: 'Pájaros en peck-deck inversa', category: 'Hombros' },
            { name: 'Press con mancuernas sentado', category: 'Hombros' },
            { name: 'Elevación lateral unilateral', category: 'Hombros' },
            { name: 'Elevación frontal con disco', category: 'Hombros' },
            { name: 'Press de hombro en polea', category: 'Hombros' },
            { name: 'Remo con mancuerna', category: 'Hombros' },
            { name: 'Press landmine unilateral', category: 'Hombros' },
            { name: 'Push press', category: 'Hombros' },
            { name: 'Face pulls', category: 'Hombros' }
        ],
        'Piernas': [
            { name: 'Sentadilla libre con barra', category: 'Piernas' },
            { name: 'Sentadilla frontal', category: 'Piernas' },
            { name: 'Sentadilla hack', category: 'Piernas' },
            { name: 'Sentadilla goblet', category: 'Piernas' },
            { name: 'Sentadilla con mancuerna', category: 'Piernas' },
            { name: 'Prensa 45°', category: 'Piernas' },
            { name: 'Prensa horizontal', category: 'Piernas' },
            { name: 'Zancadas caminando', category: 'Piernas' },
            { name: 'Zancadas con barra', category: 'Piernas' },
            { name: 'Zancadas búlgaras', category: 'Piernas' },
            { name: 'Peso muerto rumano', category: 'Piernas' },
            { name: 'Peso muerto con piernas rígidas', category: 'Piernas' },
            { name: 'Buenos días con barra', category: 'Piernas' },
            { name: 'Curl femoral acostado', category: 'Piernas' },
            { name: 'Curl femoral sentado', category: 'Piernas' },
            { name: 'Hip thrust con barra', category: 'Piernas' },
            { name: 'Hip thrust en máquina', category: 'Piernas' },
            { name: 'Sentadilla sumo con mancuerna', category: 'Piernas' },
            { name: 'Step-ups al banco', category: 'Piernas' },
            { name: 'Desplantes con peso', category: 'Piernas' }
        ],
        'Gemelos': [
            { name: 'Elevación de talones de pie con barra', category: 'Gemelos' },
            { name: 'Elevación de talones en máquina de gemelos', category: 'Gemelos' },
            { name: 'Elevación sentado en máquina', category: 'Gemelos' },
            { name: 'Elevación de talones con mancuerna (una pierna)', category: 'Gemelos' },
            { name: 'Elevación en prensa', category: 'Gemelos' },
            { name: 'Elevación en escalón con barra', category: 'Gemelos' },
            { name: 'Elevación con peso corporal (altas repeticiones)', category: 'Gemelos' },
            { name: 'Saltos en punta de pie', category: 'Gemelos' },
            { name: 'Gemelos en máquina Smith', category: 'Gemelos' },
            { name: 'Elevaciones explosivas', category: 'Gemelos' },
            { name: 'Elevación de talón unilateral', category: 'Gemelos' },
            { name: 'Gemelos en multipower', category: 'Gemelos' },
            { name: 'Gemelos en hack', category: 'Gemelos' },
            { name: 'Gemelos sentado con disco', category: 'Gemelos' },
            { name: 'Saltos con mancuerna', category: 'Gemelos' },
            { name: 'Saltos a la comba (en punta)', category: 'Gemelos' },
            { name: 'Gemelos isométricos', category: 'Gemelos' },
            { name: 'Elevación en escalón con pausa', category: 'Gemelos' },
            { name: 'Elevaciones con tempo lento', category: 'Gemelos' },
            { name: 'Elevación con banda elástica', category: 'Gemelos' }
        ],
        'Bíceps': [
            { name: 'Curl con barra', category: 'Bíceps' },
            { name: 'Curl con barra EZ', category: 'Bíceps' },
            { name: 'Curl con mancuernas alternado', category: 'Bíceps' },
            { name: 'Curl concentrado', category: 'Bíceps' },
            { name: 'Curl predicador', category: 'Bíceps' },
            { name: 'Curl en banco inclinado', category: 'Bíceps' },
            { name: 'Curl martillo', category: 'Bíceps' },
            { name: 'Curl martillo en cuerda (polea)', category: 'Bíceps' },
            { name: 'Curl con polea baja', category: 'Bíceps' },
            { name: 'Curl de arrastre', category: 'Bíceps' },
            { name: 'Curl spider', category: 'Bíceps' },
            { name: 'Curl con banda elástica', category: 'Bíceps' },
            { name: 'Curl inverso', category: 'Bíceps' },
            { name: 'Curl 21s', category: 'Bíceps' },
            { name: 'Curl Zottman', category: 'Bíceps' },
            { name: 'Curl en máquina Scott', category: 'Bíceps' },
            { name: 'Curl doble con giro', category: 'Bíceps' },
            { name: 'Curl isométrico', category: 'Bíceps' },
            { name: 'Curl con kettlebell', category: 'Bíceps' },
            { name: 'Curl cruzado (tipo Arnold)', category: 'Bíceps' }
        ],
        'Tríceps': [
            { name: 'Fondos en paralelas (tríceps)', category: 'Tríceps' },
            { name: 'Fondos en banco', category: 'Tríceps' },
            { name: 'Extensión de tríceps en polea alta', category: 'Tríceps' },
            { name: 'Extensión de tríceps con cuerda', category: 'Tríceps' },
            { name: 'Extensión con barra recta en polea', category: 'Tríceps' },
            { name: 'Rompecráneos (skullcrushers)', category: 'Tríceps' },
            { name: 'Extensión de tríceps con mancuernas', category: 'Tríceps' },
            { name: 'Patada de tríceps', category: 'Tríceps' },
            { name: 'Press cerrado en banca', category: 'Tríceps' },
            { name: 'Press con barra EZ', category: 'Tríceps' },
            { name: 'Tríceps en máquina', category: 'Tríceps' },
            { name: 'Extensión a una mano en polea', category: 'Tríceps' },
            { name: 'Tríceps overhead con cuerda', category: 'Tríceps' },
            { name: 'Press francés con barra', category: 'Tríceps' },
            { name: 'Tríceps con barra tras nuca', category: 'Tríceps' },
            { name: 'Press de banca con agarre estrecho', category: 'Tríceps' },
            { name: 'Tríceps en polea unilateral', category: 'Tríceps' },
            { name: 'Tríceps en banda elástica', category: 'Tríceps' },
            { name: 'Tríceps con mancuerna sentado', category: 'Tríceps' },
            { name: 'Extensión con kettlebell', category: 'Tríceps' }
        ],
        'Abdominales': [
            { name: 'Crunch abdominal', category: 'Abdominales' },
            { name: 'Crunch con peso', category: 'Abdominales' },
            { name: 'Crunch en máquina', category: 'Abdominales' },
            { name: 'Crunch inverso', category: 'Abdominales' },
            { name: 'Crunch en banco declinado', category: 'Abdominales' },
            { name: 'Elevaciones de piernas', category: 'Abdominales' },
            { name: 'Elevaciones en paralelas', category: 'Abdominales' },
            { name: 'Elevaciones colgado', category: 'Abdominales' },
            { name: 'Plancha abdominal', category: 'Abdominales' },
            { name: 'Plancha lateral', category: 'Abdominales' },
            { name: 'Rueda abdominal (ab wheel)', category: 'Abdominales' },
            { name: 'Ab roll en máquina', category: 'Abdominales' },
            { name: 'Bicicleta en el suelo', category: 'Abdominales' },
            { name: 'Toques al talón', category: 'Abdominales' },
            { name: 'Elevaciones con giro', category: 'Abdominales' },
            { name: 'Crunch en polea alta (cable crunch)', category: 'Abdominales' },
            { name: 'Sit-up con disco', category: 'Abdominales' },
            { name: 'V-ups', category: 'Abdominales' },
            { name: 'Plancha con toque de hombros', category: 'Abdominales' },
            { name: 'Escaladores (mountain climbers)', category: 'Abdominales' }
        ]
    };

    try {
        // Primero, eliminar los ejercicios existentes de la categoría
        const exercisesRef = collection(db, 'exercises');
        const q = query(exercisesRef, where('category', '==', category));
        const querySnapshot = await getDocs(q);
        
        const batch = writeBatch(db);
        
        // Eliminar ejercicios existentes
        querySnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });

        // Agregar nuevos ejercicios
        const exercises = exercisesByCategory[category] || [];
        exercises.forEach(exercise => {
            const docRef = doc(collection(db, 'exercises'));
            batch.set(docRef, exercise);
        });

        await batch.commit();
        return true;
    } catch (error) {
        console.error('Error al inicializar ejercicios:', error);
        throw error;
    }
};

// Función para guardar la rutina del usuario
export const saveUserRoutine = async (userId, routine) => {
    try {
        if (!userId) {
            throw new Error('Se requiere userId para guardar la rutina');
        }

        // Crear un objeto limpio para la rutina
        const routineToSave = {
            lastUpdated: new Date().toISOString()
        };

        // Asegurarse de que cada día tenga un array de ejercicios válido
        const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        days.forEach(day => {
            // Si existe la rutina y tiene ejercicios para este día, copiarlos
            if (routine && routine[day] && Array.isArray(routine[day])) {
                routineToSave[day] = routine[day].map(exercise => {
                    // Asegurarse de que cada ejercicio tenga los campos necesarios
                    const cleanExercise = {
                        id: exercise.id || '',
                        name: exercise.name || '',
                        category: exercise.category || '',
                        series: Array.isArray(exercise.series) ? exercise.series.map(serie => ({
                            reps: Number(serie.reps) || 0,
                            weight: Number(serie.weight) || 0,
                            completed: Boolean(serie.completed)
                        })) : []
                    };
                    return cleanExercise;
                });
            } else {
                // Si no hay ejercicios para este día, crear un array vacío
                routineToSave[day] = [];
            }
        });

        // Guardar en Firestore
        await setDoc(doc(db, 'user_routines', userId), routineToSave);
        return true;
    } catch (error) {
        console.error('Error al guardar la rutina:', error);
        throw error;
    }
};

// Función para crear el usuario administrador
export const createAdminUser = async () => {
    try {
        const adminEmail = 'admin@sementalfit.com';
        const adminPassword = 'Admin123!';
        
        // Intentar iniciar sesión primero
        try {
            const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
            const user = userCredential.user;
            
            // Actualizar el rol a admin
            await setDoc(doc(db, 'users', user.uid), {
                role: 'admin'
            }, { merge: true });
            
            console.log('Usuario admin actualizado');
            return true;
        } catch (error) {
            // Si el usuario no existe, crearlo
            if (error.code === 'auth/user-not-found') {
                const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
                const user = userCredential.user;

                // Crear documento de usuario en Firestore
                await setDoc(doc(db, 'users', user.uid), {
                    name: 'Administrador',
                    email: adminEmail,
                    role: 'admin',
                    createdAt: new Date().toISOString(),
                    level: 'Administrador',
                    levelName: 'Admin',
                    experience: 999999,
                    nextLevelExp: 999999
                });

                console.log('Usuario administrador creado exitosamente');
                return true;
            }
            throw error;
        }
    } catch (error) {
        console.error('Error al crear/actualizar usuario administrador:', error);
        return false;
    }
};

// Función para actualizar el rol de administrador
export const updateUserToAdmin = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            role: 'admin'
        });
        console.log('Usuario actualizado a administrador');
        return true;
    } catch (error) {
        console.error('Error al actualizar rol de administrador:', error);
        return false;
    }
};

// Función para limpiar todos los usuarios excepto el admin
export const cleanUsers = async () => {
    try {
        // Obtener todos los usuarios
        const usersSnapshot = await getDocs(collection(db, 'users'));
        
        // Eliminar cada usuario que no sea admin
        const deletePromises = usersSnapshot.docs.map(async (doc) => {
            const userData = doc.data();
            if (userData.email !== 'nestor.salum@gmail.com') {
                await deleteDoc(doc.ref);
                console.log('Usuario eliminado:', userData.email);
            }
        });

        await Promise.all(deletePromises);
        console.log('Limpieza de usuarios completada');
        return true;
    } catch (error) {
        console.error('Error al limpiar usuarios:', error);
        return false;
    }
};

// Función para actualizar el progreso del usuario
export const updateUserProgress = async (userId, action) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            const currentProgress = userData.progress || 0;
            let increment = 0;

            // Determinar el incremento basado en la acción
            switch (action) {
                case 'day_change':
                    increment = 0.1; // Incremento por cambio de día
                    break;
                case 'weight_update':
                    increment = 0.05; // Incremento por actualización de peso
                    break;
                default:
                    increment = 0;
            }

            // Actualizar el progreso
            const newProgress = Math.min(currentProgress + increment, 100);
            await updateDoc(userRef, {
                progress: newProgress,
                lastUpdated: new Date()
            });

            console.log(`Progreso actualizado: ${newProgress}%`);
            return newProgress;
        }
    } catch (error) {
        console.error('Error al actualizar progreso:', error);
        throw error;
    }
};

// Función para obtener el perfil completo del usuario
export const getUserProfile = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            return {
                ...userData,
                progress: userData.progress || 0,
                stats: userData.stats || {
                    totalWorkouts: 0,
                    totalExercises: 0,
                    totalWeightLifted: 0,
                    lastWorkout: null
                },
                preferences: userData.preferences || {
                    theme: 'dark',
                    notifications: true,
                    language: 'es'
                }
            };
        }
        return null;
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        throw error;
    }
};

// Función para actualizar las estadísticas del usuario de forma simple
export const updateUserStats = async (userId, exerciseData) => {
    try {
        console.log('Iniciando actualización de estadísticas...');
        console.log('userId:', userId);
        console.log('exerciseData:', exerciseData);

        const userRef = doc(db, 'users', userId);
        
        // Calcular los nuevos valores
        const totalWeight = exerciseData.series.reduce((sum, serie) => 
            sum + (Number(serie.weight) * Number(serie.reps)), 0);
        const totalSets = exerciseData.series.length;
        const totalReps = exerciseData.series.reduce((sum, serie) => 
            sum + Number(serie.reps), 0);

        console.log('Valores calculados:', {
            totalWeight,
            totalSets,
            totalReps
        });

        // Actualizar directamente en Firestore
        await updateDoc(userRef, {
            stats: {
                totalExercises: increment(1),
                totalWeightLifted: increment(totalWeight),
                totalSets: increment(totalSets),
                totalReps: increment(totalReps),
                lastUpdated: new Date()
            }
        });

        console.log('Estadísticas actualizadas correctamente');
        return true;
    } catch (error) {
        console.error('Error al actualizar estadísticas:', error);
        return false;
    }
};

// Función para recalcular todas las estadísticas del usuario
export const recalculateUserStats = async (userId) => {
    try {
        console.log('Iniciando recálculo de estadísticas...');
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
            console.log('Usuario no encontrado');
            return false;
        }

        const userData = userDoc.data();
        const routine = userData.routine || {};
        
        // Inicializar contadores
        let totalExercises = 0;
        let totalWeightLifted = 0;
        let totalSets = 0;
        let totalReps = 0;

        // Recorrer todos los días de la rutina
        Object.values(routine).forEach(dayExercises => {
            if (Array.isArray(dayExercises)) {
                dayExercises.forEach(exercise => {
                    if (exercise.series && Array.isArray(exercise.series)) {
                        totalExercises++;
                        exercise.series.forEach(serie => {
                            const weight = Number(serie.weight) || 0;
                            const reps = Number(serie.reps) || 0;
                            totalWeightLifted += weight * reps;
                            totalSets++;
                            totalReps += reps;
                        });
                    }
                });
            }
        });

        console.log('Estadísticas calculadas:', {
            totalExercises,
            totalWeightLifted,
            totalSets,
            totalReps
        });

        // Actualizar en Firestore
        await updateDoc(userRef, {
            stats: {
                totalExercises,
                totalWeightLifted,
                totalSets,
                totalReps,
                lastUpdated: new Date()
            }
        });

        console.log('Estadísticas actualizadas correctamente');
        return true;
    } catch (error) {
        console.error('Error al recalcular estadísticas:', error);
        return false;
    }
}; 