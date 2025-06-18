import React from 'react';
import { useAuth } from '../contexts/AuthContext';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function Header() {
  const { currentUser } = useAuth();
  return (
    <header className="w-full flex flex-col items-center justify-center bg-black py-4 border-b border-gray-800">
      <img src="/logo.png" alt="Logo" className="h-12 w-12 mb-1" style={{objectFit: 'contain'}} />
      {currentUser && (
        <span className="text-base text-yellow-400 font-semibold mt-1">
          {getGreeting()}, {currentUser.name || currentUser.displayName || currentUser.email}
        </span>
      )}
    </header>
  );
} 