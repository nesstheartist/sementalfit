export const initializeExercisesByCategory = async (db) => {
    const exercisesByCategory = {
        'Piernas': [
            {
                id: '1',
                name: 'Sentadillas',
                muscleGroup: 'Cuádriceps',
                difficulty: 'Principiante'
            },
            {
                id: '4',
                name: 'Peso Muerto',
                muscleGroup: 'Isquiotibiales',
                difficulty: 'Intermedio'
            }
        ],
        'Pecho': [
            {
                id: '2',
                name: 'Press de Banca',
                muscleGroup: 'Pectoral Mayor',
                difficulty: 'Intermedio'
            },
            {
                id: '5',
                name: 'Flexiones',
                muscleGroup: 'Pectoral Mayor',
                difficulty: 'Principiante'
            }
        ],
        'Espalda': [
            {
                id: '3',
                name: 'Dominadas',
                muscleGroup: 'Dorsal Ancho',
                difficulty: 'Avanzado'
            },
            {
                id: '6',
                name: 'Remo con Barra',
                muscleGroup: 'Dorsal Ancho',
                difficulty: 'Intermedio'
            }
        ]
    };

    try {
        for (const [category, exercises] of Object.entries(exercisesByCategory)) {
            await db.collection('exercisesByCategory').doc(category).set({ exercises });
        }
        console.log('Ejercicios por categoría inicializados correctamente');
    } catch (error) {
        console.error('Error al inicializar ejercicios por categoría:', error);
    }
}; 