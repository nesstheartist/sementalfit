import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Frases motivadoras
const QUOTES = [
    "Tu cuerpo puede aguantar casi cualquier cosa. Es tu mente la que necesitas convencer.",
    "El dolor que sientes hoy será la fuerza que sentirás mañana.",
    "No te rindas cuando estés cansado. Ríndete cuando hayas terminado.",
    "El éxito no es siempre grande. Es el progreso constante lo que importa.",
    "Tu cuerpo es el reflejo de tu estilo de vida.",
    "La disciplina es elegir entre lo que quieres ahora y lo que quieres más.",
    "No hay atajos para cualquier lugar que valga la pena ir.",
    "El único entrenamiento malo es el que no se hace.",
    "Tu límite es solo tu mente.",
    "El cambio no es fácil, pero siempre es posible."
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

const HomePage = () => {
    const [quote, setQuote] = useState('');
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    useEffect(() => {
        // Seleccionar una frase aleatoria al cargar
        const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
        setQuote(randomQuote);

        // Función para reproducir el audio
        const speakQuote = () => {
            if ('speechSynthesis' in window) {
                const voices = window.speechSynthesis.getVoices();
                // Buscar una voz masculina en español con más opciones
                const maleSpanishVoice = voices.find(voice => 
                    (voice.lang.includes('es') || voice.name.includes('Spanish') || voice.name.includes('Español')) &&
                    (voice.name.toLowerCase().includes('male') || 
                     voice.name.toLowerCase().includes('masculino') ||
                     voice.name.toLowerCase().includes('jorge') ||
                     voice.name.toLowerCase().includes('juan') ||
                     voice.name.toLowerCase().includes('diego') ||
                     voice.name.toLowerCase().includes('carlos'))
                ) || voices.find(voice => 
                    voice.lang.includes('es') || 
                    voice.name.includes('Spanish') || 
                    voice.name.includes('Español')
                );

                const utterance = new SpeechSynthesisUtterance(randomQuote);
                utterance.lang = 'es-ES';
                if (maleSpanishVoice) {
                    utterance.voice = maleSpanishVoice;
                    console.log('Usando voz:', maleSpanishVoice.name);
                } else {
                    console.log('No se encontró voz masculina en español');
                }
                
                // Configuración para una voz masculina más poderosa
                utterance.rate = 0.7; // Velocidad más lenta para un tono más dramático
                utterance.pitch = 0.3; // Tono mucho más grave para sonar más masculino y poderoso
                utterance.volume = 1.0; // Volumen máximo

                // Agregar pausas más dramáticas
                utterance.text = randomQuote
                    .replace(/\./g, '. ')
                    .replace(/,/g, ', ')
                    .replace(/!/g, '! ')
                    .replace(/\?/g, '? ');

                // Intentar forzar una voz más grave
                if (utterance.voice) {
                    utterance.voice.pitch = 0.5;
                }

                utterance.onend = () => {
                    navigate('/training');
                };

                window.speechSynthesis.speak(utterance);
            }
        };

        // Reproducir inmediatamente si las voces están disponibles
        if (window.speechSynthesis.getVoices().length > 0) {
            speakQuote();
        } else {
            window.speechSynthesis.onvoiceschanged = speakQuote;
        }

        return () => {
            window.speechSynthesis.cancel();
        };
    }, [navigate]);

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
            <div className="text-center">
                <img 
                    src="/logo.png" 
                    alt="SementalFit Logo" 
                    className="w-64 h-64 mx-auto mb-8"
                />
                <div className="max-w-2xl mx-auto">
                    <p className="text-2xl text-yellow-400 mb-4 font-semibold">{quote}</p>
                    {currentUser && (
                        <p className="text-xl text-white mt-4 font-bold">{getGreeting()}, {currentUser.name || currentUser.displayName || currentUser.email}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HomePage; 