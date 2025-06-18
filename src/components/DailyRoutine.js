import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { 
    collection, 
    doc, 
    setDoc, 
    getDoc, 
    getDocs, 
    query, 
    where,
    serverTimestamp 
} from 'firebase/firestore';
import Header from './Header';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const getToday = () => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[new Date().getDay()];
};

const DailyRoutine = () => {
    const { currentUser } = useAuth();
    const [selectedDay, setSelectedDay] = useState(getToday());
    const [categories, setCategories] = useState([]);
    const [exercises, setExercises] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedExercise, setSelectedExercise] = useState('');
    const [currentRoutine, setCurrentRoutine] = useState({
        exercises: []
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    // Timer helpers
    const [timers, setTimers] = useState({}); // { [exerciseIndex_setIndex]: { running, timeLeft } }
    const timerRefs = useRef({});
    const [showAvailable, setShowAvailable] = useState(false);
    const [availableRoutines, setAvailableRoutines] = useState([]);

    // Cargar categorías
    useEffect(() => {
        const loadCategories = async () => {
            try {
                setError('');
                const categoriesSnapshot = await getDocs(collection(db, 'categories'));
                const categoriesData = categoriesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setCategories(categoriesData);
            } catch (error) {
                console.error('Error al cargar categorías:', error);
                setError('Error al cargar las categorías. Por favor, intenta de nuevo.');
            }
        };
        loadCategories();
    }, []);

    // Cargar ejercicios cuando se selecciona una categoría
    useEffect(() => {
        const loadExercises = async () => {
            if (!selectedCategory) {
                setExercises([]);
                return;
            }
            try {
                setError('');
                const exercisesSnapshot = await getDocs(
                    query(collection(db, 'exercises'), 
                    where('categoryId', '==', selectedCategory))
                );
                const exercisesData = exercisesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setExercises(exercisesData);
            } catch (error) {
                console.error('Error al cargar ejercicios:', error);
                setError('Error al cargar los ejercicios. Por favor, intenta de nuevo.');
            }
        };
        loadExercises();
    }, [selectedCategory]);

    // Cargar rutina del día seleccionado
    useEffect(() => {
        const loadRoutine = async () => {
            if (!currentUser) return;
            const routineRef = doc(db, 'users', currentUser.uid, 'routines', selectedDay);
            const routineDoc = await getDoc(routineRef);
            if (routineDoc.exists()) {
                setCurrentRoutine(routineDoc.data());
            } else {
                setCurrentRoutine({ exercises: [] });
            }
        };
        loadRoutine();
    }, [selectedDay, currentUser]);

    useEffect(() => {
        if (showAvailable) {
            getDocs(collection(db, 'routines')).then(snapshot => {
                setAvailableRoutines(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
        }
    }, [showAvailable]);

    const addExercise = () => {
        if (!selectedExercise) return;
        
        const newExercise = {
            exerciseId: selectedExercise,
            sets: [
                { weight: 0, reps: 0, completed: false }
            ]
        };

        setCurrentRoutine(prev => ({
            ...prev,
            exercises: [...prev.exercises, newExercise]
        }));
    };

    const updateSet = (exerciseIndex, setIndex, field, value) => {
        setCurrentRoutine(prev => {
            const newExercises = [...prev.exercises];
            newExercises[exerciseIndex].sets[setIndex][field] = value;
            return { ...prev, exercises: newExercises };
        });
    };

    const addSet = (exerciseIndex) => {
        setCurrentRoutine(prev => {
            const newExercises = [...prev.exercises];
            newExercises[exerciseIndex].sets.push({
                weight: 0,
                reps: 0,
                completed: false,
                timer: { min: 0, sec: 0 }
            });
            return { ...prev, exercises: newExercises };
        });
    };

    const removeSet = (exerciseIndex, setIndex) => {
        setCurrentRoutine(prev => {
            const newExercises = [...prev.exercises];
            newExercises[exerciseIndex].sets = newExercises[exerciseIndex].sets.filter((_, i) => i !== setIndex);
            return { ...prev, exercises: newExercises };
        });
    };

    const handleTimerChange = (exerciseIndex, setIndex, field, value) => {
        setCurrentRoutine(prev => {
            const newExercises = [...prev.exercises];
            if (!newExercises[exerciseIndex].sets[setIndex].timer) {
                newExercises[exerciseIndex].sets[setIndex].timer = { min: 0, sec: 0 };
            }
            newExercises[exerciseIndex].sets[setIndex].timer[field] = value;
            return { ...prev, exercises: newExercises };
        });
    };

    const startTimer = (exerciseIndex, setIndex) => {
        const key = `${exerciseIndex}_${setIndex}`;
        setTimers(prev => ({
            ...prev,
            [key]: {
                running: true,
                timeLeft: getTimeLeft(exerciseIndex, setIndex)
            }
        }));
        if (timerRefs.current[key]) clearInterval(timerRefs.current[key]);
        timerRefs.current[key] = setInterval(() => {
            setTimers(prev => {
                const t = prev[key]?.timeLeft || 0;
                if (t > 0) {
                    return {
                        ...prev,
                        [key]: { ...prev[key], timeLeft: t - 1 }
                    };
                } else {
                    clearInterval(timerRefs.current[key]);
                    return {
                        ...prev,
                        [key]: { ...prev[key], running: false, timeLeft: 0 }
                    };
                }
            });
        }, 1000);
    };

    const pauseTimer = (exerciseIndex, setIndex) => {
        const key = `${exerciseIndex}_${setIndex}`;
        setTimers(prev => ({
            ...prev,
            [key]: { ...prev[key], running: false }
        }));
        if (timerRefs.current[key]) clearInterval(timerRefs.current[key]);
    };

    const getTimeLeft = (exerciseIndex, setIndex) => {
        const set = currentRoutine.exercises[exerciseIndex].sets[setIndex];
        const min = parseInt(set.timer?.min || 0, 10);
        const sec = parseInt(set.timer?.sec || 0, 10);
        return min * 60 + sec;
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        return () => {
            Object.values(timerRefs.current).forEach(clearInterval);
        };
    }, []);

    const saveRoutine = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const routineRef = doc(db, 'users', currentUser.uid, 'routines', selectedDay);
            await setDoc(routineRef, {
                ...currentRoutine,
                updatedAt: serverTimestamp()
            });
            alert('Rutina guardada exitosamente');
        } catch (error) {
            console.error('Error al guardar la rutina:', error);
            alert('Error al guardar la rutina');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full px-2 py-4">
            <div className="mb-4">
                <h2 className="text-xl font-bold text-yellow-400 mb-3">Rutina Diaria</h2>
                {error && (
                    <div className="bg-red-500 text-white p-2 rounded mb-2 text-xs">{error}</div>
                )}
                <button
                    className="mb-2 px-4 py-2 bg-yellow-500 text-black rounded text-sm"
                    onClick={() => setShowAvailable(v => !v)}
                >
                    {showAvailable ? 'Ocultar Rutinas Prediseñadas' : 'Ver Rutinas Prediseñadas'}
                </button>
                {showAvailable && (
                    <div className="bg-gray-900 p-2 rounded mb-4">
                        <h3 className="text-white text-base mb-2">Rutinas Disponibles</h3>
                        {availableRoutines.length === 0 && <p className="text-gray-400">No hay rutinas prediseñadas.</p>}
                        {availableRoutines.map(routine => (
                            <div key={routine.id} className="mb-2 p-2 bg-gray-800 rounded">
                                <div className="text-yellow-300 font-bold">{routine.name}</div>
                                <div className="text-white text-sm mb-1">{routine.description}</div>
                                <button
                                    className="bg-yellow-500 text-black px-2 py-1 rounded text-xs"
                                    onClick={async () => {
                                        // Copiar la rutina prediseñada a la rutina del usuario para el día seleccionado
                                        setCurrentRoutine({ exercises: routine.exercises });
                                        alert('Rutina copiada. Ahora puedes modificarla y guardarla como tuya.');
                                    }}
                                >
                                    Usar esta rutina
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="flex flex-wrap gap-1 mb-3">
                    {DAYS.map(day => (
                        <button
                            key={day}
                            onClick={() => setSelectedDay(day)}
                            className={`px-2 py-1 text-sm rounded ${
                                selectedDay === day 
                                    ? 'bg-yellow-500 text-black' 
                                    : 'bg-gray-800 text-white'
                            }`}
                        >
                            {day}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mb-4">
                <h3 className="text-lg text-white mb-2">Agregar Ejercicio</h3>
                <div className="space-y-2">
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 text-sm"
                    >
                        <option value="">Seleccionar Grupo Muscular</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={selectedExercise}
                        onChange={(e) => setSelectedExercise(e.target.value)}
                        className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 text-sm"
                        disabled={!selectedCategory}
                    >
                        <option value="">Seleccionar Ejercicio</option>
                        {exercises.map(ex => (
                            <option key={ex.id} value={ex.id}>
                                {ex.name}
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={addExercise}
                        disabled={!selectedExercise}
                        className="w-full px-3 py-2 bg-yellow-500 text-black rounded text-sm hover:bg-yellow-600 disabled:opacity-50"
                    >
                        Agregar Ejercicio
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                {currentRoutine.exercises.map((exercise, exerciseIndex) => {
                    const exerciseData = exercises.find(e => e.id === exercise.exerciseId);
                    return (
                        <div key={exerciseIndex} className="bg-gray-800 p-3 rounded">
                            <h4 className="text-base text-white mb-2">
                                {exerciseData?.name || 'Ejercicio'}
                            </h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-white">
                                    <thead>
                                        <tr>
                                            <th className="px-2 py-1">Serie</th>
                                            <th className="px-2 py-1">Peso</th>
                                            <th className="px-2 py-1">Repeticiones</th>
                                            <th className="px-2 py-1">Timer</th>
                                            <th className="px-2 py-1">✔</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {exercise.sets.map((set, setIndex) => {
                                            const key = `${exerciseIndex}_${setIndex}`;
                                            const timerState = timers[key] || { running: false, timeLeft: getTimeLeft(exerciseIndex, setIndex) };
                                            return (
                                                <tr key={setIndex}>
                                                    <td className="px-2 py-1">{setIndex + 1}</td>
                                                    <td className="px-2 py-1">
                                                        <input
                                                            type="number"
                                                            value={set.weight}
                                                            onChange={(e) => updateSet(exerciseIndex, setIndex, 'weight', e.target.value)}
                                                            placeholder="Peso (kg)"
                                                            className="w-16 p-1 rounded bg-gray-700 text-white border border-gray-600 text-sm"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-1">
                                                        <input
                                                            type="number"
                                                            value={set.reps}
                                                            onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', e.target.value)}
                                                            placeholder="Reps"
                                                            className="w-16 p-1 rounded bg-gray-700 text-white border border-gray-600 text-sm"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-1 flex items-center gap-1">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={set.timer?.min || 0}
                                                            onChange={(e) => handleTimerChange(exerciseIndex, setIndex, 'min', e.target.value)}
                                                            className="w-10 p-1 rounded bg-gray-700 text-white border border-gray-600 text-xs mr-1"
                                                            placeholder="mm"
                                                        />
                                                        :
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="59"
                                                            value={set.timer?.sec || 0}
                                                            onChange={(e) => handleTimerChange(exerciseIndex, setIndex, 'sec', e.target.value)}
                                                            className="w-10 p-1 rounded bg-gray-700 text-white border border-gray-600 text-xs ml-1"
                                                            placeholder="ss"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => timerState.running ? pauseTimer(exerciseIndex, setIndex) : startTimer(exerciseIndex, setIndex)}
                                                            className="ml-2 px-2 py-1 bg-yellow-500 text-black rounded text-xs"
                                                        >
                                                            {timerState.running ? 'Pausar' : 'Iniciar'}
                                                        </button>
                                                        <span className="ml-2 font-mono">{formatTime(timerState.timeLeft)}</span>
                                                    </td>
                                                    <td className="px-2 py-1">
                                                        <input
                                                            type="checkbox"
                                                            checked={set.completed}
                                                            onChange={(e) => updateSet(exerciseIndex, setIndex, 'completed', e.target.checked)}
                                                            className="w-4 h-4"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeSet(exerciseIndex, setIndex)}
                                                            className="ml-2 px-2 py-1 bg-red-500 text-white rounded text-xs"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                <button
                                    onClick={() => addSet(exerciseIndex)}
                                    className="text-yellow-400 hover:text-yellow-500 text-sm mt-2"
                                >
                                    + Agregar Serie
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <button
                onClick={saveRoutine}
                disabled={loading}
                className="mt-4 w-full bg-yellow-500 text-black font-bold py-2 px-4 rounded text-sm hover:bg-yellow-600 disabled:opacity-50"
            >
                {loading ? 'Guardando...' : 'Guardar Rutina'}
            </button>
        </div>
    );
};

export default DailyRoutine; 