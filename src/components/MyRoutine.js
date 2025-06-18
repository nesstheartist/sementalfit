import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import Header from './Header';

const MyRoutine = () => {
    const { currentUser } = useAuth();
    const [routine, setRoutine] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadRoutine = async () => {
            if (!currentUser) return;
            try {
                const routinesSnapshot = await getDocs(
                    query(collection(db, 'routines'), where('createdBy', '==', currentUser.uid))
                );
                if (!routinesSnapshot.empty) {
                    setRoutine(routinesSnapshot.docs[0].data());
                }
            } catch (error) {
                console.error('Error loading routine:', error);
            } finally {
                setLoading(false);
            }
        };
        loadRoutine();
    }, [currentUser]);

    const motivationalMessages = [
        "El éxito no es final, el fracaso no es fatal: lo que cuenta es el coraje para continuar.",
        "Tu cuerpo puede aguantar casi cualquier cosa. Es tu mente la que necesitas convencer.",
        "El dolor que sientes hoy será la fuerza que sentirás mañana.",
        "No te rindas cuando estés cansado. Ríndete cuando hayas terminado.",
        "La diferencia entre lo imposible y lo posible está en la determinación de una persona.",
        "El único entrenamiento malo es el que no se hace.",
        "Tu cuerpo puede aguantar casi cualquier cosa. Es tu mente la que necesitas convencer.",
        "El éxito es la suma de pequeños esfuerzos repetidos día tras día.",
        "No importa qué tan lento vayas, siempre y cuando no te detengas.",
        "La disciplina es elegir entre lo que quieres ahora y lo que quieres más."
    ];

    const getRandomMessage = () => {
        return motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white">
                <Header />
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mx-auto"></div>
                        <p className="mt-4 text-gray-400">Cargando tu rutina...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!routine) {
        return (
            <div className="min-h-screen bg-black text-white">
                <Header />
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="bg-gray-800 rounded-xl p-6 shadow-lg text-center">
                        <h2 className="text-2xl font-bold text-yellow-400 mb-4">No tienes una rutina asignada</h2>
                        <p className="text-gray-400 mb-6">Crea tu rutina personalizada para comenzar tu entrenamiento</p>
                        <a
                            href="/add-routine"
                            className="inline-block px-6 py-3 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400"
                        >
                            Crear Rutina
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <Header />
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-gray-800 rounded-xl p-6 shadow-lg mb-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-yellow-400 mb-2">{routine.name}</h2>
                        <p className="text-gray-400 mb-4">{routine.description}</p>
                        <div className="bg-gray-700 rounded-lg p-4">
                            <p className="text-lg text-yellow-400 italic">"{getRandomMessage()}"</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {routine.exercises.map((exercise, index) => (
                        <div key={index} className="bg-gray-800 rounded-xl p-6 shadow-lg">
                            <div className="flex items-center gap-4 mb-4">
                                {exercise.imageUrl && (
                                    <img
                                        src={exercise.imageUrl}
                                        alt={exercise.name}
                                        className="w-16 h-16 object-cover rounded-lg"
                                    />
                                )}
                                <h3 className="text-xl font-semibold text-white">{exercise.name}</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-white">
                                    <thead>
                                        <tr className="border-b border-gray-600">
                                            <th className="px-4 py-2 text-left">Serie</th>
                                            <th className="px-4 py-2 text-left">Peso (kg)</th>
                                            <th className="px-4 py-2 text-left">Reps</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {exercise.sets.map((set, setIndex) => (
                                            <tr key={setIndex} className="border-b border-gray-600">
                                                <td className="px-4 py-2">{setIndex + 1}</td>
                                                <td className="px-4 py-2">{set.weight}</td>
                                                <td className="px-4 py-2">{set.reps}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MyRoutine; 