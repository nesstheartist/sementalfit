export const initializeExercises = async (db) => {
    const exercises = [
        {
            id: '1',
            name: 'Sentadillas',
            category: 'Piernas',
            muscleGroup: 'Cuádriceps',
            difficulty: 'Principiante',
            description: 'Ejercicio básico para fortalecer las piernas',
            instructions: 'Párate con los pies al ancho de los hombros y baja como si te sentaras en una silla'
        },
        {
            id: '2',
            name: 'Press de Banca',
            category: 'Pecho',
            muscleGroup: 'Pectoral Mayor',
            difficulty: 'Intermedio',
            description: 'Ejercicio clásico para el pecho',
            instructions: 'Acuéstate en el banco y empuja la barra hacia arriba'
        },
        {
            id: '3',
            name: 'Dominadas',
            category: 'Espalda',
            muscleGroup: 'Dorsal Ancho',
            difficulty: 'Avanzado',
            description: 'Ejercicio para la espalda superior',
            instructions: 'Cuelga de la barra y tira hacia arriba hasta que tu barbilla pase la barra'
        }
    ];

    try {
        for (const exercise of exercises) {
            await db.collection('exercises').doc(exercise.id).set(exercise);
        }
        console.log('Ejercicios inicializados correctamente');
    } catch (error) {
        console.error('Error al inicializar ejercicios:', error);
    }
}; 