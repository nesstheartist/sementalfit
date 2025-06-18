import React, { useState, useEffect, useRef } from 'react';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase';
import Header from './Header';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function getTodayIndex() {
  const jsDay = new Date().getDay(); // 0=Domingo, 1=Lunes...
  return jsDay === 0 ? 6 : jsDay - 1;
}

const defaultSet = () => ({ weight: '', reps: '', timer: 60, completed: false });

function useSetTimers(routine, today) {
  // Estructura: timers[exIdx][setIdx] = { running, timeLeft, intervalId }
  const [timers, setTimers] = useState({});
  const audioRef = useRef(null);

  useEffect(() => {
    // Reset timers si cambia el día o la rutina
    setTimers({});
  }, [routine, today]);

  const startTimer = (exIdx, setIdx, initial) => {
    setTimers(prev => {
      const key = `${exIdx}-${setIdx}`;
      if (prev[key]?.running) return prev;
      const timeLeft = prev[key]?.timeLeft ?? initial;
      let lastTick = Date.now();
      const intervalId = setInterval(() => {
        setTimers(current => {
          const now = current[key]?.timeLeft ?? initial;
          // Calcular el tiempo real transcurrido para evitar saltos dobles
          const nowTick = Date.now();
          const elapsed = Math.floor((nowTick - lastTick) / 1000);
          if (elapsed >= 1) {
            lastTick = nowTick;
            if (now > 0) {
              return { ...current, [key]: { ...current[key], timeLeft: now - 1, running: true, intervalId } };
            } else {
              clearInterval(intervalId);
              if (window.navigator.vibrate) {
                window.navigator.vibrate(200);
              }
              return { ...current, [key]: { ...current[key], timeLeft: 0, running: false, intervalId: null } };
            }
          }
          return current;
        });
      }, 250); // Intervalo más corto para mayor precisión
      return { ...prev, [key]: { running: true, timeLeft, intervalId } };
    });
  };

  const pauseTimer = (exIdx, setIdx) => {
    setTimers(prev => {
      const key = `${exIdx}-${setIdx}`;
      if (prev[key]?.intervalId) clearInterval(prev[key].intervalId);
      return { ...prev, [key]: { ...prev[key], running: false, intervalId: null } };
    });
  };

  const resetTimer = (exIdx, setIdx, value) => {
    setTimers(prev => {
      const key = `${exIdx}-${setIdx}`;
      if (prev[key]?.intervalId) clearInterval(prev[key].intervalId);
      return { ...prev, [key]: { running: false, timeLeft: value, intervalId: null } };
    });
  };

  return { timers, startTimer, pauseTimer, resetTimer, audioRef };
}

export default function TrainingPage() {
  const [categories, setCategories] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [routine, setRoutine] = useState({});
  const [setsCount, setSetsCount] = useState(1);
  const [today, setToday] = useState(getTodayIndex());

  // Timers para sets
  const { timers, startTimer, pauseTimer, resetTimer, audioRef } = useSetTimers(routine, today);

  // Cargar categorías y ejercicios
  useEffect(() => {
    async function fetchData() {
      const catSnap = await getDocs(collection(db, 'categories'));
      const cats = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(cats);
      const exSnap = await getDocs(collection(db, 'exercises'));
      const exs = exSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExercises(exs);
    }
    fetchData();
  }, []);

  // Filtrar ejercicios por categoría
  useEffect(() => {
    if (selectedCategory) {
      setFilteredExercises(exercises.filter(e => e.categoryId === selectedCategory));
    } else {
      setFilteredExercises([]);
    }
    setSelectedExercise('');
  }, [selectedCategory, exercises]);

  // Cargar rutina del día desde localStorage
  useEffect(() => {
    const saved = localStorage.getItem('training_routine');
    if (saved) setRoutine(JSON.parse(saved));
  }, []);

  // Guardar rutina en localStorage
  useEffect(() => {
    localStorage.setItem('training_routine', JSON.stringify(routine));
  }, [routine]);

  // Agrupar ejercicios por categoría para el select
  const exercisesByCategory = categories.reduce((acc, cat) => {
    acc[cat.id] = exercises.filter(ex => ex.categoryId === cat.id);
    return acc;
  }, {});

  const handleAddExercise = () => {
    if (!selectedExercise) return;
    const ex = exercises.find(e => e.id === selectedExercise);
    const newSets = Array.from({ length: setsCount }, defaultSet);
    setRoutine(prev => {
      const day = DAYS[today];
      const prevDay = prev[day] || [];
      return {
        ...prev,
        [day]: [
          ...prevDay,
          {
            id: ex.id,
            name: ex.name,
            category: categories.find(c => c.id === ex.categoryId)?.name || '',
            series: newSets
          }
        ]
      };
    });
    setSelectedExercise('');
    setSetsCount(1);
  };

  const handleSetChange = (exIdx, setIdx, field, value) => {
    const day = DAYS[today];
    setRoutine(prev => {
      const updated = [...(prev[day] || [])];
      const ex = { ...updated[exIdx] };
      const series = [...ex.series];
      series[setIdx] = { ...series[setIdx], [field]: value };
      ex.series = series;
      updated[exIdx] = ex;
      return { ...prev, [day]: updated };
    });
    if (field === 'timer') resetTimer(exIdx, setIdx, Number(value));
  };

  const handleRemoveExercise = (exIdx) => {
    const day = DAYS[today];
    setRoutine(prev => {
      const updated = [...(prev[day] || [])];
      updated.splice(exIdx, 1);
      return { ...prev, [day]: updated };
    });
  };

  const handleDayChange = (idx) => setToday(idx);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-2 pb-20 max-w-xs mx-auto">
      <Header />
      <div className="flex justify-between mb-2">
        {DAYS.map((d, i) => (
          <button
            key={d}
            onClick={() => handleDayChange(i)}
            className={`flex-1 px-1 py-1 rounded text-xs ${today === i ? 'bg-yellow-500 text-gray-900 font-bold' : 'bg-gray-800 text-gray-300'}`}
          >{d.slice(0,3)}</button>
        ))}
      </div>
      <div className="bg-gray-800 rounded-lg shadow p-2 mb-2">
        <div className="grid grid-cols-1 gap-2 mb-2">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="w-full px-2 py-1 rounded bg-gray-700 border border-gray-600 text-xs mb-2"
          >
            <option value="">Selecciona categoría</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            value={selectedExercise}
            onChange={e => setSelectedExercise(e.target.value)}
            className="w-full px-2 py-1 rounded bg-gray-700 border border-gray-600 text-xs mb-2"
            disabled={!selectedCategory}
          >
            <option value="">Selecciona ejercicio</option>
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
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs">Sets:</span>
          <input
            type="number"
            min={1}
            max={10}
            value={setsCount}
            onChange={e => setSetsCount(Number(e.target.value))}
            className="w-12 px-1 py-1 rounded bg-gray-700 border border-gray-600 text-xs"
          />
          <button
            onClick={handleAddExercise}
            className="px-2 py-1 bg-yellow-500 text-gray-900 font-semibold rounded text-xs hover:bg-yellow-400"
            disabled={!selectedExercise}
          >Agregar</button>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {(routine[DAYS[today]] || []).map((ex, exIdx) => (
          <div key={exIdx} className="bg-gray-700 p-2 rounded flex flex-col text-xs mb-1">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-yellow-300">{ex.name}</span>
              <button onClick={() => handleRemoveExercise(exIdx)} className="text-red-400 hover:text-red-300">🗑️</button>
            </div>
            {ex.series.map((set, setIdx) => {
              const key = `${exIdx}-${setIdx}`;
              const timerState = timers[key] || { running: false, timeLeft: set.timer };
              return (
                <div key={setIdx} className="flex items-center gap-1 mb-1">
                  <span className="text-gray-400">Set {setIdx + 1}</span>
                  <input
                    type="number"
                    placeholder="Kg"
                    value={set.weight}
                    onChange={e => handleSetChange(exIdx, setIdx, 'weight', e.target.value)}
                    className="w-12 px-1 py-1 rounded bg-gray-800 border border-gray-600 text-xs"
                  />
                  <input
                    type="number"
                    placeholder="Reps"
                    value={set.reps}
                    onChange={e => handleSetChange(exIdx, setIdx, 'reps', e.target.value)}
                    className="w-12 px-1 py-1 rounded bg-gray-800 border border-gray-600 text-xs"
                  />
                  <input
                    type="number"
                    placeholder="⏱"
                    value={timerState.timeLeft ?? set.timer}
                    onChange={e => handleSetChange(exIdx, setIdx, 'timer', e.target.value)}
                    className="w-12 px-1 py-1 rounded bg-gray-800 border border-gray-600 text-xs"
                  />
                  <span className="text-gray-500">seg</span>
                  <button
                    type="button"
                    className={`px-1 py-1 rounded ${timerState.running ? 'bg-yellow-500 text-gray-900' : 'bg-gray-600 text-yellow-200'}`}
                    onClick={() => timerState.running
                      ? pauseTimer(exIdx, setIdx)
                      : startTimer(exIdx, setIdx, Number(set.timer) || 0)}
                  >{timerState.running ? '⏸' : '▶️'}</button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
} 