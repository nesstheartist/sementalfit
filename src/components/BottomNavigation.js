import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaDumbbell, FaAppleAlt, FaShoppingCart, FaUserCog } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

export default function BottomNavigation() {
    const location = useLocation();
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    // No mostrar la navegación en la página de login
    if (location.pathname === '/login') {
        return null;
    }

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex justify-center">
            <div className="flex justify-around items-center h-16 w-full max-w-xs">
                <Link
                    to="/"
                    className={`flex flex-col items-center justify-center w-full h-full ${
                        location.pathname === '/' ? 'text-yellow-500' : 'text-gray-400'
                    }`}
                >
                    <FaHome className="text-xl" />
                    <span className="text-xs mt-1">Inicio</span>
                </Link>

                <Link
                    to="/training"
                    className={`flex flex-col items-center justify-center w-full h-full ${
                        location.pathname === '/training' ? 'text-yellow-500' : 'text-gray-400'
                    }`}
                >
                    <FaDumbbell className="text-xl" />
                    <span className="text-xs mt-1">Entrenar</span>
                </Link>

                <Link
                    to="/nutrition"
                    className={`flex flex-col items-center justify-center w-full h-full ${
                        location.pathname === '/nutrition' ? 'text-yellow-500' : 'text-gray-400'
                    }`}
                >
                    <FaAppleAlt className="text-xl" />
                    <span className="text-xs mt-1">Nutrición</span>
                </Link>

                <Link
                    to="/shop"
                    className={`flex flex-col items-center justify-center w-full h-full ${
                        location.pathname === '/shop' ? 'text-yellow-500' : 'text-gray-400'
                    }`}
                >
                    <FaShoppingCart className="text-xl" />
                    <span className="text-xs mt-1">Tienda</span>
                </Link>

                {currentUser?.role === 3 && (
                    <Link
                        to="/admin"
                        className={`flex flex-col items-center justify-center w-full h-full ${
                            location.pathname === '/admin' ? 'text-yellow-500' : 'text-gray-400'
                        }`}
                    >
                        <FaUserCog className="text-xl" />
                        <span className="text-xs mt-1">Admin</span>
                    </Link>
                )}

                <button
                    onClick={handleLogout}
                    className="flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-red-500"
                >
                    <FaUserCog className="text-xl" />
                    <span className="text-xs mt-1">Salir</span>
                </button>
            </div>
        </div>
    );
} 