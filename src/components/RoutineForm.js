import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import Header from './Header';

const RoutineForm = () => {
    const { currentUser } = useAuth();
    const [routineName, setRoutineName] = useState('');
    const [routineDesc, setRoutineDesc] = useState('');
    const [categories, setCategories] = useState([]);
    const [exercises, setExercises] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedExercise, setSelectedExercise] = useState('');
    const [exerciseImageUrl, setExerciseImageUrl] = useState('');
    const [routineExercises, setRoutineExercises] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadCategories = async () => {
            const categoriesSnapshot = await getDocs(collection(db, 'categories'));
            setCategories(categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
        loadCategories();
    }, []);

    useEffect(() => {
        const loadExercises = async () => {
            if (!selectedCategory) return;
            const exercisesSnapshot = await getDocs(
                query(collection(db, 'exercises'), where('categoryId', '==', selectedCategory))
            );
            setExercises(exercisesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
        loadExercises();
    }, [selectedCategory]);

    const isValidRoutine = () => {
        if (routineExercises.length === 0) return false;
        for (const ex of routineExercises) {
            if (!ex.exerciseId || !ex.categoryId) return false;
            if (!Array.isArray(ex.sets) || ex.sets.length === 0) return false;
            for (const set of ex.sets) {
                if (set.weight === '' || set.reps === '' || isNaN(set.weight) || isNaN(set.reps)) return false;
            }
        }
        return true;
    };

    const addExercise = () => {
        if (!selectedExercise) return;
        setRoutineExercises(prev => ([
            ...prev,
            {
                exerciseId: selectedExercise,
                categoryId: selectedCategory,
                imageUrl: exerciseImageUrl,
                sets: [
                    { weight: 0, reps: 0 }
                ]
            }
        ]));
        setExerciseImageUrl('');
    };

    const addSet = (exerciseIndex) => {
        setRoutineExercises(prev => {
            const newExercises = [...prev];
            newExercises[exerciseIndex].sets.push({ weight: 0, reps: 0 });
            return newExercises;
        });
    };

    const removeSet = (exerciseIndex, setIndex) => {
        setRoutineExercises(prev => {
            const newExercises = [...prev];
            newExercises[exerciseIndex].sets = newExercises[exerciseIndex].sets.filter((_, i) => i !== setIndex);
            return newExercises;
        });
    };

    const updateSet = (exerciseIndex, setIndex, field, value) => {
        setRoutineExercises(prev => {
            const newExercises = [...prev];
            // Convertir a número si es weight o reps
            if (field === 'weight' || field === 'reps') {
                newExercises[exerciseIndex].sets[setIndex][field] = Number(value);
            } else {
                newExercises[exerciseIndex].sets[setIndex][field] = value;
            }
            return newExercises;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) return;
        if (routineExercises.length === 0) {
            alert('Debes agregar al menos un ejercicio a la rutina.');
            return;
        }
        // Validar estructura de ejercicios y sets
        for (const ex of routineExercises) {
            if (!ex.exerciseId || !ex.categoryId) {
                alert('Todos los ejercicios deben tener grupo muscular y ejercicio seleccionado.');
                return;
            }
            if (!Array.isArray(ex.sets) || ex.sets.length === 0) {
                alert('Cada ejercicio debe tener al menos una serie.');
                return;
            }
            for (const set of ex.sets) {
                if (typeof set.weight !== 'number' || typeof set.reps !== 'number') {
                    alert('El peso y las repeticiones deben ser números en todas las series.');
                    return;
                }
            }
        }
        setLoading(true);
        try {
            const dataToSave = {
                name: routineName,
                description: routineDesc,
                createdBy: currentUser.uid,
                exercises: routineExercises
            };
            console.log('Guardando rutina prediseñada:', dataToSave);
            await addDoc(collection(db, 'routines'), dataToSave);
            setRoutineName('');
            setRoutineDesc('');
            setRoutineExercises([]);
            alert('Rutina prediseñada creada exitosamente');
        } catch (error) {
            alert('Error al crear la rutina');
        } finally {
            setLoading(false);
        }
    };

    // Agrupar ejercicios por categoría para el select
    const exercisesByCategory = categories.reduce((acc, cat) => {
        acc[cat.id] = exercises.filter(ex => ex.categoryId === cat.id);
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-black text-yellow-400">
            <Header />
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-gray-900 rounded-xl p-6 shadow-lg">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-yellow-400">Crear Rutina Prediseñada</h2>
                        <p className="text-yellow-400 mt-2">Diseña tu rutina personalizada agregando ejercicios y series</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-white mb-2">Nombre de la Rutina</label>
                                <input
                                    type="text"
                                    value={routineName}
                                    onChange={e => setRoutineName(e.target.value)}
                                    className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-yellow-500 focus:outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-white mb-2">Descripción</label>
                                <textarea
                                    value={routineDesc}
                                    onChange={e => setRoutineDesc(e.target.value)}
                                    className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-yellow-500 focus:outline-none"
                                    rows={2}
                                />
                            </div>
                        </div>

                        <div className="bg-gray-700 rounded-lg p-4">
                            <h3 className="text-lg text-yellow-400 mb-4">Agregar Ejercicio</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <select
                                    value={selectedCategory}
                                    onChange={e => setSelectedCategory(e.target.value)}
                                    className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600 focus:border-yellow-500 focus:outline-none"
                                >
                                    <option value="">Seleccionar Grupo Muscular</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                                <select
                                    value={selectedExercise}
                                    onChange={e => setSelectedExercise(e.target.value)}
                                    className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600 focus:border-yellow-500 focus:outline-none"
                                    disabled={!selectedCategory}
                                >
                                    <option value="">Seleccionar Ejercicio</option>
                                    {categories.map(cat => (
                                        exercisesByCategory[cat.id]?.length > 0 && (
                                            <optgroup key={cat.id} label={cat.name}>
                                                {exercisesByCategory[cat.id].map(ex => (
                                                    <option key={ex.id} value={ex.id}>{ex.name} ({ex.difficulty})</option>
                                                ))}
                                            </optgroup>
                                        )
                                    ))}
                                </select>
                            </div>
                            <div className="mt-4">
                                <input
                                    type="url"
                                    value={exerciseImageUrl}
                                    onChange={e => setExerciseImageUrl(e.target.value)}
                                    placeholder="URL de la imagen del ejercicio (opcional)"
                                    className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600 focus:border-yellow-500 focus:outline-none"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={addExercise}
                                disabled={!selectedExercise}
                                className="w-full mt-4 px-4 py-2 bg-yellow-500 text-black font-semibold rounded hover:bg-yellow-400 disabled:opacity-50"
                            >
                                Agregar Ejercicio
                            </button>
                        </div>

                        <div className="space-y-4">
                            {routineExercises.map((exercise, exerciseIndex) => {
                                const exerciseData = exercises.find(e => e.id === exercise.exerciseId);
                                return (
                                    <div key={exerciseIndex} className="bg-gray-700 p-4 rounded-lg">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-lg text-white font-semibold">{exerciseData?.name || 'Ejercicio'}</h4>
                                                {exercise.imageUrl && (
                                                    <span className="text-sm text-gray-400">(con imagen)</span>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setRoutineExercises(prev => prev.filter((_, i) => i !== exerciseIndex));
                                                }}
                                                className="text-red-500 hover:text-red-400"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-white">
                                                <thead>
                                                    <tr className="border-b border-gray-600">
                                                        <th className="px-4 py-2 text-left">Serie</th>
                                                        <th className="px-4 py-2 text-left">Peso (kg)</th>
                                                        <th className="px-4 py-2 text-left">Reps</th>
                                                        <th className="px-4 py-2 text-left"></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {exercise.sets.map((set, setIndex) => (
                                                        <tr key={setIndex} className="border-b border-gray-600">
                                                            <td className="px-4 py-2">{setIndex + 1}</td>
                                                            <td className="px-4 py-2">
                                                                <input
                                                                    type="number"
                                                                    value={set.weight}
                                                                    onChange={e => updateSet(exerciseIndex, setIndex, 'weight', e.target.value)}
                                                                    placeholder="Peso"
                                                                    className="w-20 p-1 rounded bg-gray-800 text-white border border-gray-600 focus:border-yellow-500 focus:outline-none"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-2">
                                                                <input
                                                                    type="number"
                                                                    value={set.reps}
                                                                    onChange={e => updateSet(exerciseIndex, setIndex, 'reps', e.target.value)}
                                                                    placeholder="Reps"
                                                                    className="w-20 p-1 rounded bg-gray-800 text-white border border-gray-600 focus:border-yellow-500 focus:outline-none"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeSet(exerciseIndex, setIndex)}
                                                                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                                                >
                                                                    Eliminar
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => addSet(exerciseIndex)}
                                            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
                                        >
                                            Agregar Serie
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={!isValidRoutine() || loading}
                                className="px-6 py-3 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 disabled:opacity-50"
                            >
                                {loading ? 'Guardando...' : 'Guardar Rutina'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RoutineForm; 