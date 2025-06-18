import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaGoogle } from 'react-icons/fa';
import Header from './Header';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login, loginWithGoogle } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);
            await login(email, password);
            navigate('/');
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setError('');
            setLoading(true);
            await loginWithGoogle();
            navigate('/');
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <Header />
            <div className="max-w-md mx-auto mt-8 p-6 bg-gray-900 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-yellow-400 mb-6 text-center">Iniciar Sesión</h2>
                {error && <div className="bg-red-500 text-white p-3 rounded mb-4">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-yellow-400 mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-yellow-500 focus:outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-yellow-400 mb-2">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-yellow-500 focus:outline-none"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-yellow-500 text-black font-bold py-2 px-4 rounded hover:bg-yellow-600 disabled:opacity-50"
                    >
                        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </button>
                </form>
                <div className="mt-4">
                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full bg-white text-black font-bold py-2 px-4 rounded hover:bg-gray-100 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <FaGoogle className="text-red-500" />
                        Iniciar sesión con Google
                    </button>
                </div>
                <div className="mt-6 text-center text-sm text-gray-400">
                    ¿No tienes una cuenta?{' '}
                    <Link to="/register" className="text-yellow-400 hover:text-yellow-300">
                        Regístrate aquí
                    </Link>
                </div>
            </div>
        </div>
    );
} 