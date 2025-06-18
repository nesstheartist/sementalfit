import React from 'react';
import Header from './Header';

export default function NutritionPage() {
  return (
    <div className="min-h-screen bg-black text-white p-4 pb-20">
      <Header />
      <h1 className="text-2xl font-bold text-yellow-500 mb-6">Nutrición</h1>
      <div className="bg-gray-800 rounded-xl p-6">
        <p className="text-gray-300">Contenido de nutrición en desarrollo...</p>
      </div>
    </div>
  );
} 