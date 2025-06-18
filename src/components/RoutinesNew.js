import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export default function RoutinesNew() {
  const [categories, setCategories] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedExercise, setSelectedExercise] = useState('');
  const [routineExerciseSets, setRoutineExerciseSets] = useState([
    { weight: 0, reps: 0, timerMin: 0, timerSec: 0 }
  ]);
  const [routineExercises, setRoutineExercises] = useState([]);
  const [routineForm, setRoutineForm] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      const categoriesRef = collection(db, 'categories');
      const exercisesRef = collection(db, 'exercises');
      
      const categoriesSnapshot = await getDocs(categoriesRef);
      const exercisesSnapshot = await getDocs(exercisesRef);
      
      setCategories(categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setExercises(exercisesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    
    fetchData();
  }, []);

  const handleRoutineChange = (e) => {
    setRoutineForm({
      ...routineForm,
      [e.target.name]: e.target.value
    });
  };

  const updateRoutineSet = (idx, field, value) => {
    setRoutineExerciseSets(prev => prev.map((set, i) => i === idx ? { ...set, [field]: value } : set));
  };

  const removeRoutineSet = (idx) => {
    setRoutineExerciseSets(prev => prev.filter((_, i) => i !== idx));
  };

  const addRoutineSet = () => {
    setRoutineExerciseSets(prev => [...prev, { weight: 0, reps: 0, timerMin: 0, timerSec: 0 }]);
  };

  const addRoutineExercise = () => {
    if (!selectedExercise) return;
    const exerciseObj = exercises.find(e => e.id === selectedExercise);
    setRoutineExercises(prev => ([
      ...prev,
      {
        exerciseId: selectedExercise,
        exerciseName: exerciseObj?.name || '',
        sets: routineExerciseSets.map(set => ({
          weight: Number(set.weight) || 0,
          reps: Number(set.reps) || 0,
          timer: {
            min: Number(set.timerMin) || 0,
            sec: Number(set.timerSec) || 0
          }
        }))
      }
    ]));
    setSelectedExercise('');
    setRoutineExerciseSets([{ weight: 0, reps: 0, timerMin: 0, timerSec: 0 }]);
  };

  const removeRoutineExercise = (idx) => {
    setRoutineExercises(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddRoutine = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, 'routines'), {
      ...routineForm,
      exercises: routineExercises
    });
    setRoutineForm({ name: '', description: '' });
    setRoutineExercises([]);
    alert('Rutina agregada correctamente');
  };

  return (
    <form onSubmit={handleAddRoutine} className="mb-6">
      <input 
        type="text" 
        name="name" 
        value={routineForm.name} 
        onChange={handleRoutineChange} 
        placeholder="Nombre de la rutina" 
        className="p-2 rounded bg-gray-800 text-yellow-400 border border-yellow-500 focus:outline-none mb-2 w-full" 
        required 
      />
      <textarea 
        name="description" 
        value={routineForm.description} 
        onChange={handleRoutineChange} 
        placeholder="Descripción" 
        className="w-full p-2 rounded bg-gray-800 text-yellow-400 border border-yellow-500 focus:outline-none mb-2" 
        required 
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <select 
          value={selectedCategory} 
          onChange={e => setSelectedCategory(e.target.value)} 
          className="p-2 rounded bg-gray-800 text-yellow-400 border border-yellow-500 focus:outline-none" 
          required
        >
          <option value="">Seleccionar categoría</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <select 
          value={selectedExercise} 
          onChange={e => setSelectedExercise(e.target.value)} 
          className="p-2 rounded bg-gray-800 text-yellow-400 border border-yellow-500 focus:outline-none" 
          disabled={!selectedCategory} 
          required
        >
          <option value="">Seleccionar ejercicio</option>
          {exercises.filter(ex => ex.categoryId === selectedCategory).map(ex => (
            <option key={ex.id} value={ex.id}>{ex.name} ({ex.difficulty})</option>
          ))}
        </select>
      </div>
      {selectedExercise && (
        <div className="bg-gray-800 p-4 rounded mb-4">
          <h4 className="text-yellow-400 font-bold mb-2">Sets para el ejercicio</h4>
          {routineExerciseSets.map((set, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input
                type="number"
                value={set.weight}
                onChange={(e) => updateRoutineSet(idx, 'weight', e.target.value)}
                className="w-20 px-2 py-1 bg-gray-800 text-white rounded"
                placeholder="Peso"
              />
              <input
                type="number"
                value={set.reps}
                onChange={(e) => updateRoutineSet(idx, 'reps', e.target.value)}
                className="w-20 px-2 py-1 bg-gray-800 text-white rounded"
                placeholder="Reps"
              />
              <div className="flex gap-1 items-center">
                <input
                  type="number"
                  value={set.timerMin}
                  onChange={(e) => updateRoutineSet(idx, 'timerMin', e.target.value)}
                  className="w-16 px-2 py-1 bg-gray-800 text-white rounded"
                  placeholder="Min"
                  min="0"
                />
                <span className="text-white">:</span>
                <input
                  type="number"
                  value={set.timerSec}
                  onChange={(e) => updateRoutineSet(idx, 'timerSec', e.target.value)}
                  className="w-16 px-2 py-1 bg-gray-800 text-white rounded"
                  placeholder="Seg"
                  min="0"
                  max="59"
                />
              </div>
              <button
                onClick={() => removeRoutineSet(idx)}
                className="p-1 bg-red-500 text-white rounded"
              >
                ×
              </button>
            </div>
          ))}
          <button type="button" onClick={addRoutineSet} className="px-3 py-1 bg-yellow-500 text-black rounded font-bold hover:bg-yellow-600 mt-2">Agregar Set</button>
          <button type="button" onClick={addRoutineExercise} className="ml-4 px-3 py-1 bg-yellow-500 text-black rounded font-bold hover:bg-yellow-600 mt-2">Agregar Ejercicio a la Rutina</button>
        </div>
      )}
      <div className="mb-4">
        <h4 className="text-yellow-400 font-bold mb-2">Ejercicios en la rutina</h4>
        {routineExercises.length === 0 && <p className="text-yellow-300">No hay ejercicios agregados.</p>}
        {routineExercises.map((ex, idx) => (
          <div key={idx} className="bg-gray-800 p-3 rounded mb-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-yellow-400">{ex.exerciseName}</span>
              <button type="button" onClick={() => removeRoutineExercise(idx)} className="px-2 py-1 bg-red-500 text-white rounded">Eliminar</button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {ex.sets.map((set, sidx) => (
                <span key={sidx} className="bg-gray-900 text-yellow-300 px-2 py-1 rounded text-xs">
                  {set.weight}kg x {set.reps} reps {set.timer.min}min {set.timer.sec}s
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button type="submit" className="px-4 py-2 bg-yellow-500 text-black rounded font-bold hover:bg-yellow-600">Guardar Rutina</button>
    </form>
  );
} 