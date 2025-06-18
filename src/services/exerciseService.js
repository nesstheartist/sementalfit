import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

// Estructura de categorías principales
const CATEGORIES = {
    ABDOMINALES: 'Abdominales',
    CALISTENICOS: 'Calisténicos',
    ANTEBRAZOS: 'Antebrazos',
    GEMELOS: 'Gemelos',
    ESPALDA: 'Espalda',
    HOMBROS: 'Hombros',
    BICEPS: 'Bíceps',
    TRICEPS: 'Tríceps',
    CUADRICEPS: 'Cuádriceps',
    FEMORALES: 'Femorales'
};

// Niveles de dificultad
const DIFFICULTY_LEVELS = {
    PRINCIPIANTE: 'Principiante',
    INTERMEDIO: 'Intermedio',
    AVANZADO: 'Avanzado'
};

// Función para agregar un ejercicio
export const addExercise = async (exercise) => {
    try {
        const exerciseRef = await addDoc(collection(db, 'exercises'), {
            ...exercise,
            createdAt: new Date()
        });
        return exerciseRef.id;
    } catch (error) {
        console.error('Error al agregar ejercicio:', error);
        throw error;
    }
};

// Función para agregar todos los ejercicios
export const addAllExercises = async () => {
    const exercises = [
        // Abdominales
        {
            name: 'Crunch clásico',
            category: CATEGORIES.ABDOMINALES,
            difficulty: DIFFICULTY_LEVELS.PRINCIPIANTE,
            description: 'Eleva el torso desde el suelo contrayendo el abdomen.'
        },
        {
            name: 'Elevación de piernas acostado',
            category: CATEGORIES.ABDOMINALES,
            difficulty: DIFFICULTY_LEVELS.PRINCIPIANTE,
            description: 'Levanta las piernas estiradas para trabajar el abdomen inferior.'
        },
        {
            name: 'Plancha frontal',
            category: CATEGORIES.ABDOMINALES,
            difficulty: DIFFICULTY_LEVELS.PRINCIPIANTE,
            description: 'Mantén el cuerpo recto apoyado en antebrazos y pies.'
        },
        {
            name: 'Crunch con peso sobre pecho',
            category: CATEGORIES.ABDOMINALES,
            difficulty: DIFFICULTY_LEVELS.INTERMEDIO,
            description: 'Añade resistencia al crunch básico para más intensidad.'
        },
        {
            name: 'Crunch en máquina abdominal',
            category: CATEGORIES.ABDOMINALES,
            difficulty: DIFFICULTY_LEVELS.INTERMEDIO,
            description: 'Usa una máquina específica para aislar el recto abdominal.'
        },
        {
            name: 'Toques de talones',
            category: CATEGORIES.ABDOMINALES,
            difficulty: DIFFICULTY_LEVELS.PRINCIPIANTE,
            description: 'Trabaja los oblicuos tocando alternadamente los talones.'
        },
        {
            name: 'Bicicleta abdominal',
            category: CATEGORIES.ABDOMINALES,
            difficulty: DIFFICULTY_LEVELS.INTERMEDIO,
            description: 'Simula pedaleo con piernas alternadas y rotación de torso.'
        },
        {
            name: 'Crunch inverso',
            category: CATEGORIES.ABDOMINALES,
            difficulty: DIFFICULTY_LEVELS.INTERMEDIO,
            description: 'Eleva la cadera contrayendo el abdomen bajo.'
        },
        {
            name: 'Ab wheel rollout',
            category: CATEGORIES.ABDOMINALES,
            difficulty: DIFFICULTY_LEVELS.AVANZADO,
            description: 'Extiende el cuerpo con una rueda trabajando el core completo.'
        },
        {
            name: 'Elevaciones colgado en barra',
            category: CATEGORIES.ABDOMINALES,
            difficulty: DIFFICULTY_LEVELS.AVANZADO,
            description: 'Levanta las piernas rectas colgado de una barra.'
        },
        {
            name: 'Plancha lateral',
            category: CATEGORIES.ABDOMINALES,
            difficulty: DIFFICULTY_LEVELS.INTERMEDIO,
            description: 'Apoya un antebrazo y pies, manteniendo el cuerpo alineado.'
        },
        {
            name: 'V-ups',
            category: CATEGORIES.ABDOMINALES,
            difficulty: DIFFICULTY_LEVELS.AVANZADO,
            description: 'Eleva simultáneamente piernas y tronco formando una "V".'
        },
        {
            name: 'Dragon flag',
            category: CATEGORIES.ABDOMINALES,
            difficulty: DIFFICULTY_LEVELS.AVANZADO,
            description: 'Movimiento explosivo y controlado para abdomen total.'
        },
        {
            name: 'Twist ruso con peso',
            category: CATEGORIES.ABDOMINALES,
            difficulty: DIFFICULTY_LEVELS.INTERMEDIO,
            description: 'Gira el torso con peso en manos, sentado en el suelo.'
        },
        {
            name: 'Mountain climbers',
            category: CATEGORIES.ABDOMINALES,
            difficulty: DIFFICULTY_LEVELS.PRINCIPIANTE,
            description: 'Movimiento rápido de piernas con apoyo en manos.'
        },
        {
            name: 'Plancha con desplazamiento',
            category: CATEGORIES.ABDOMINALES,
            difficulty: DIFFICULTY_LEVELS.INTERMEDIO,
            description: 'Avanza o retrocede manteniendo la postura de plancha.'
        },
        {
            name: 'Flutter kicks',
            category: CATEGORIES.ABDOMINALES,
            difficulty: DIFFICULTY_LEVELS.PRINCIPIANTE,
            description: 'Patea las piernas rectas desde el suelo alternadamente.'
        },
        {
            name: 'Sit-up con disco en pecho',
            category: CATEGORIES.ABDOMINALES,
            difficulty: DIFFICULTY_LEVELS.INTERMEDIO,
            description: 'Eleva el torso con peso extra.'
        },
        {
            name: 'Cable crunch',
            category: CATEGORIES.ABDOMINALES,
            difficulty: DIFFICULTY_LEVELS.INTERMEDIO,
            description: 'Crunch arrodillado usando cuerda de polea.'
        },
        {
            name: 'Toes to bar',
            category: CATEGORIES.ABDOMINALES,
            difficulty: DIFFICULTY_LEVELS.AVANZADO,
            description: 'Eleva los pies hasta tocar la barra desde posición colgado.'
        },
        // Calisténicos
        {
            name: 'Flexiones (push-ups)',
            category: CATEGORIES.CALISTENICOS,
            difficulty: DIFFICULTY_LEVELS.PRINCIPIANTE,
            description: 'Empuje básico desde el suelo con peso corporal.'
        },
        {
            name: 'Dominadas (pull-ups)',
            category: CATEGORIES.CALISTENICOS,
            difficulty: DIFFICULTY_LEVELS.AVANZADO,
            description: 'Subida vertical colgado de barra, enfocada en espalda y brazos.'
        },
        {
            name: 'Dips en paralelas',
            category: CATEGORIES.CALISTENICOS,
            difficulty: DIFFICULTY_LEVELS.INTERMEDIO,
            description: 'Descenso y empuje con brazos para pecho y tríceps.'
        },
        {
            name: 'Chin-ups',
            category: CATEGORIES.CALISTENICOS,
            difficulty: DIFFICULTY_LEVELS.AVANZADO,
            description: 'Más énfasis en bíceps que las dominadas normales.'
        },
        {
            name: 'Sentadillas con peso corporal',
            category: CATEGORIES.CALISTENICOS,
            difficulty: DIFFICULTY_LEVELS.PRINCIPIANTE,
            description: 'Bajada y subida controlada, sin carga adicional.'
        },
        {
            name: 'Burpees',
            category: CATEGORIES.CALISTENICOS,
            difficulty: DIFFICULTY_LEVELS.INTERMEDIO,
            description: 'Ejercicio dinámico de cuerpo completo.'
        },
        {
            name: 'Flexiones diamante',
            category: CATEGORIES.CALISTENICOS,
            difficulty: DIFFICULTY_LEVELS.INTERMEDIO,
            description: 'Flexiones con manos juntas para mayor énfasis en tríceps.'
        },
        {
            name: 'Flexiones en pica',
            category: CATEGORIES.CALISTENICOS,
            difficulty: DIFFICULTY_LEVELS.INTERMEDIO,
            description: 'Caderas elevadas, enfoque en hombros.'
        },
        {
            name: 'Pistol squat',
            category: CATEGORIES.CALISTENICOS,
            difficulty: DIFFICULTY_LEVELS.AVANZADO,
            description: 'Control y fuerza unilaterales.'
        },
        {
            name: 'Muscle-up',
            category: CATEGORIES.CALISTENICOS,
            difficulty: DIFFICULTY_LEVELS.AVANZADO,
            description: 'Combinación de dominada y fondo explosivo.'
        },
        {
            name: 'Planche lean',
            category: CATEGORIES.CALISTENICOS,
            difficulty: DIFFICULTY_LEVELS.AVANZADO,
            description: 'Apoyo inclinado hacia delante para aumentar carga en hombros.'
        },
        {
            name: 'Australian pull-up',
            category: CATEGORIES.CALISTENICOS,
            difficulty: DIFFICULTY_LEVELS.PRINCIPIANTE,
            description: 'Variante horizontal de la dominada.'
        },
        {
            name: 'Flexiones con palmada',
            category: CATEGORIES.CALISTENICOS,
            difficulty: DIFFICULTY_LEVELS.AVANZADO,
            description: 'Ejercicio explosivo que mejora potencia.'
        },
        {
            name: 'Wall walk',
            category: CATEGORIES.CALISTENICOS,
            difficulty: DIFFICULTY_LEVELS.INTERMEDIO,
            description: 'Desafío para hombros y core.'
        },
        {
            name: 'Step-ups a banco',
            category: CATEGORIES.CALISTENICOS,
            difficulty: DIFFICULTY_LEVELS.PRINCIPIANTE,
            description: 'Subir y bajar a una plataforma con control.'
        },
        {
            name: 'Plancha isométrica lateral',
            category: CATEGORIES.CALISTENICOS,
            difficulty: DIFFICULTY_LEVELS.INTERMEDIO,
            description: 'Estabilidad core lateral sin movimiento.'
        },
        {
            name: 'Leg raises colgado en barra',
            category: CATEGORIES.CALISTENICOS,
            difficulty: DIFFICULTY_LEVELS.INTERMEDIO,
            description: 'Abdomen y control de core.'
        },
        {
            name: 'Flexiones declinadas',
            category: CATEGORIES.CALISTENICOS,
            difficulty: DIFFICULTY_LEVELS.INTERMEDIO,
            description: 'Mayor carga en hombros y parte superior del pecho.'
        },
        {
            name: 'Front lever',
            category: CATEGORIES.CALISTENICOS,
            difficulty: DIFFICULTY_LEVELS.AVANZADO,
            description: 'Fuerza total de core y dorsales.'
        },
        {
            name: 'Planchas con desplazamiento lateral',
            category: CATEGORIES.CALISTENICOS,
            difficulty: DIFFICULTY_LEVELS.INTERMEDIO,
            description: 'Trabajo de core y coordinación.'
        }
    ];

    try {
        for (const exercise of exercises) {
            await addExercise(exercise);
        }
        console.log('Ejercicios agregados correctamente');
    } catch (error) {
        console.error('Error al agregar ejercicios:', error);
        throw error;
    }
};

// Función para obtener ejercicios por categoría
export const getExercisesByCategory = async (category) => {
    try {
        const q = query(collection(db, 'exercises'), where('category', '==', category));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error al obtener ejercicios por categoría:', error);
        throw error;
    }
};

// Función para obtener ejercicios por nivel
export const getExercisesByDifficulty = async (difficulty) => {
    try {
        const q = query(collection(db, 'exercises'), where('difficulty', '==', difficulty));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error al obtener ejercicios por dificultad:', error);
        throw error;
    }
};

// Función para obtener todos los ejercicios
export const getAllExercises = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, 'exercises'));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error al obtener todos los ejercicios:', error);
        throw error;
    }
};

export { CATEGORIES, DIFFICULTY_LEVELS }; 