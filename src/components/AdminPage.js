import React, { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';
import { addAllExercises } from '../services/exerciseService';
import { useNavigate } from 'react-router-dom';
import RoutinesNew from './RoutinesNew';
import { createUserWithEmailAndPassword, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export default function AdminPage() {
  const [section, setSection] = useState('main');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [personalTrainers, setPersonalTrainers] = useState([]);
  const { register } = useAuth();

  // Estados para nutrición
  const [nutritionForm, setNutritionForm] = useState({
    name: '',
    description: ''
  });

  // Estados para shop
  const [shopForm, setShopForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    imageUrl: ''
  });

  // Estados para ejercicios
  const [exerciseForm, setExerciseForm] = useState({
    name: '',
    categoryId: '',
    description: '',
    difficulty: 'Principiante',
    imageUrl: ''
  });
  const [categories, setCategories] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [editExerciseId, setEditExerciseId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [exercisePage, setExercisePage] = useState(1);
  const exercisesPerPage = 10;

  const loadPersonalTrainers = useCallback(async () => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 2));
      const querySnapshot = await getDocs(q);
      const trainers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPersonalTrainers(trainers);
    } catch (error) {
      console.error('Error al cargar personal trainers:', error);
    }
  }, []);

  useEffect(() => {
    if (section === 'pt') {
      loadPersonalTrainers();
    }
  }, [section, loadPersonalTrainers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      await register(email, password, name, 2);
      setSuccess('Personal Trainer creado exitosamente');
      setEmail('');
      setPassword('');
      setName('');
      loadPersonalTrainers();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNutritionChange = (e) => {
    setNutritionForm({
      ...nutritionForm,
      [e.target.name]: e.target.value
    });
  };

  const handleAddNutrition = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'nutrition'), {
        ...nutritionForm,
        createdAt: new Date().toISOString()
      });
      setNutritionForm({ name: '', description: '' });
      alert('Plan nutricional agregado correctamente');
    } catch (error) {
      console.error('Error al agregar plan nutricional:', error);
      alert('Error al agregar plan nutricional');
    }
  };

  const handleShopChange = (e) => {
    setShopForm({
      ...shopForm,
      [e.target.name]: e.target.value
    });
  };

  const handleAddShop = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'shop'), {
        ...shopForm,
        createdAt: new Date().toISOString()
      });
      setShopForm({ name: '', description: '', price: '', stock: '', imageUrl: '' });
      alert('Producto agregado correctamente');
    } catch (error) {
      console.error('Error al agregar producto:', error);
      alert('Error al agregar producto');
    }
  };

  const handleExerciseChange = (e) => {
    setExerciseForm({
      ...exerciseForm,
      [e.target.name]: e.target.value
    });
  };

  const loadCategories = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'categories'));
      const categoriesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(categoriesList);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const loadExercises = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'exercises'));
      const exercisesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setExercises(exercisesList);
    } catch (error) {
      console.error('Error al cargar ejercicios:', error);
    }
  };

  useEffect(() => {
    if (section === 'exercises') {
      loadCategories();
      loadExercises();
    }
  }, [section]);

  const handleAddExercise = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editExerciseId) {
        await updateDoc(doc(db, 'exercises', editExerciseId), {
          ...exerciseForm,
          updatedAt: new Date().toISOString()
        });
        alert('Ejercicio actualizado correctamente');
        setEditExerciseId(null);
      } else {
        await addDoc(collection(db, 'exercises'), {
          ...exerciseForm,
          createdAt: new Date().toISOString()
        });
        alert('Ejercicio agregado correctamente');
      }
      setExerciseForm({
        name: '',
        categoryId: '',
        description: '',
        difficulty: 'Principiante',
        imageUrl: ''
      });
      loadExercises();
    } catch (error) {
      console.error('Error al guardar ejercicio:', error);
      alert('Error al guardar ejercicio');
    } finally {
      setIsLoading(false);
    }
  };

  const totalExercisePages = Math.ceil(exercises.length / exercisesPerPage);
  const paginatedExercises = exercises.slice(
    (exercisePage - 1) * exercisesPerPage,
    exercisePage * exercisesPerPage
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-yellow-400 mb-8">Panel de Administración</h1>
        
        {section === 'main' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <button 
              onClick={() => setSection('pt')} 
              className="bg-gray-900 p-6 rounded-lg shadow-lg hover:bg-gray-800 transition-colors"
            >
              <h2 className="text-2xl font-bold text-yellow-400 mb-2">Personal Trainer</h2>
              <p className="text-gray-400">Gestionar personal trainers y sus cuentas</p>
            </button>
            
            <button 
              onClick={() => setSection('nutrition')} 
              className="bg-gray-900 p-6 rounded-lg shadow-lg hover:bg-gray-800 transition-colors"
            >
              <h2 className="text-2xl font-bold text-yellow-400 mb-2">Nutrición</h2>
              <p className="text-gray-400">Gestionar planes nutricionales</p>
            </button>
            
            <button 
              onClick={() => setSection('routines')} 
              className="bg-gray-900 p-6 rounded-lg shadow-lg hover:bg-gray-800 transition-colors"
            >
              <h2 className="text-2xl font-bold text-yellow-400 mb-2">Rutinas</h2>
              <p className="text-gray-400">Gestionar rutinas de ejercicios</p>
            </button>
            
            <button 
              onClick={() => setSection('shop')} 
              className="bg-gray-900 p-6 rounded-lg shadow-lg hover:bg-gray-800 transition-colors"
            >
              <h2 className="text-2xl font-bold text-yellow-400 mb-2">Shop</h2>
              <p className="text-gray-400">Gestionar productos y servicios</p>
            </button>
            
            <button 
              onClick={() => setSection('exercises')} 
              className="bg-gray-900 p-6 rounded-lg shadow-lg hover:bg-gray-800 transition-colors"
            >
              <h2 className="text-2xl font-bold text-yellow-400 mb-2">Ejercicios</h2>
              <p className="text-gray-400">Gestionar ejercicios y categorías</p>
            </button>
          </div>
        )}

        {section === 'pt' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Formulario de creación */}
            <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold text-yellow-400 mb-6">Crear Personal Trainer</h2>
              {error && <div className="bg-red-500 text-white p-3 rounded mb-4">{error}</div>}
              {success && <div className="bg-green-500 text-white p-3 rounded mb-4">{success}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-yellow-400 mb-2">Nombre</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-yellow-500 focus:outline-none"
                    required
                  />
                </div>
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
                  {loading ? 'Creando...' : 'Crear Personal Trainer'}
                </button>
              </form>
            </div>

            {/* Lista de Personal Trainers */}
            <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold text-yellow-400 mb-6">Personal Trainers Registrados</h2>
              {personalTrainers.length === 0 ? (
                <p className="text-gray-400">No hay personal trainers registrados</p>
              ) : (
                <div className="space-y-4">
                  {personalTrainers.map((trainer) => (
                    <div key={trainer.id} className="bg-gray-800 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-yellow-400">{trainer.name}</h3>
                      <p className="text-gray-300">{trainer.email}</p>
                      <p className="text-sm text-gray-400">
                        Registrado: {trainer.createdAt?.toDate().toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button 
              onClick={() => setSection('main')} 
              className="col-span-2 mt-4 bg-yellow-500 text-black font-bold py-2 px-4 rounded hover:bg-yellow-600"
            >
              Volver al menú principal
            </button>
          </div>
        )}

        {section === 'nutrition' && (
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-yellow-400 mb-6">Gestión de Nutrición</h2>
            <form onSubmit={handleAddNutrition} className="space-y-4">
              <div>
                <label className="block text-yellow-400 mb-2">Nombre del Plan</label>
                <input
                  type="text"
                  name="name"
                  value={nutritionForm.name}
                  onChange={handleNutritionChange}
                  className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-yellow-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-yellow-400 mb-2">Descripción</label>
                <textarea
                  name="description"
                  value={nutritionForm.description}
                  onChange={handleNutritionChange}
                  className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-yellow-500 focus:outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-yellow-500 text-black font-bold py-2 px-4 rounded hover:bg-yellow-600"
              >
                Agregar Plan
              </button>
            </form>
            <button 
              onClick={() => setSection('main')} 
              className="mt-4 bg-yellow-500 text-black font-bold py-2 px-4 rounded hover:bg-yellow-600"
            >
              Volver al menú principal
            </button>
          </div>
        )}

        {section === 'routines' && (
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-yellow-400 mb-6">Gestión de Rutinas</h2>
            <RoutinesNew />
            <button 
              onClick={() => setSection('main')} 
              className="mt-4 bg-yellow-500 text-black font-bold py-2 px-4 rounded hover:bg-yellow-600"
            >
              Volver al menú principal
            </button>
          </div>
        )}

        {section === 'shop' && (
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-yellow-400 mb-6">Gestión de Shop</h2>
            <form onSubmit={handleAddShop} className="space-y-4">
              <div>
                <label className="block text-yellow-400 mb-2">Nombre del Producto</label>
                <input
                  type="text"
                  name="name"
                  value={shopForm.name}
                  onChange={handleShopChange}
                  className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-yellow-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-yellow-400 mb-2">Descripción</label>
                <textarea
                  name="description"
                  value={shopForm.description}
                  onChange={handleShopChange}
                  className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-yellow-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-yellow-400 mb-2">Precio</label>
                <input
                  type="number"
                  name="price"
                  value={shopForm.price}
                  onChange={handleShopChange}
                  className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-yellow-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-yellow-400 mb-2">Stock</label>
                <input
                  type="number"
                  name="stock"
                  value={shopForm.stock}
                  onChange={handleShopChange}
                  className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-yellow-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-yellow-400 mb-2">URL de Imagen (opcional)</label>
                <input
                  type="text"
                  name="imageUrl"
                  value={shopForm.imageUrl}
                  onChange={handleShopChange}
                  className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-yellow-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-yellow-500 text-black font-bold py-2 px-4 rounded hover:bg-yellow-600"
              >
                Agregar Producto
              </button>
            </form>
            <button 
              onClick={() => setSection('main')} 
              className="mt-4 bg-yellow-500 text-black font-bold py-2 px-4 rounded hover:bg-yellow-600"
            >
              Volver al menú principal
            </button>
          </div>
        )}

        {section === 'exercises' && (
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-yellow-400 mb-6">Gestión de Ejercicios</h2>
            <form onSubmit={handleAddExercise} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-yellow-400 mb-2">Nombre del Ejercicio</label>
                  <input
                    type="text"
                    name="name"
                    value={exerciseForm.name}
                    onChange={handleExerciseChange}
                    className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-yellow-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-yellow-400 mb-2">Categoría</label>
                  <select
                    name="categoryId"
                    value={exerciseForm.categoryId}
                    onChange={handleExerciseChange}
                    className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-yellow-500 focus:outline-none"
                    required
                  >
                    <option value="">Seleccionar categoría</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-yellow-400 mb-2">Dificultad</label>
                  <select
                    name="difficulty"
                    value={exerciseForm.difficulty}
                    onChange={handleExerciseChange}
                    className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-yellow-500 focus:outline-none"
                    required
                  >
                    <option value="Principiante">Principiante</option>
                    <option value="Intermedio">Intermedio</option>
                    <option value="Avanzado">Avanzado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-yellow-400 mb-2">URL de Imagen (opcional)</label>
                  <input
                    type="text"
                    name="imageUrl"
                    value={exerciseForm.imageUrl}
                    onChange={handleExerciseChange}
                    className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-yellow-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-yellow-400 mb-2">Descripción</label>
                <textarea
                  name="description"
                  value={exerciseForm.description}
                  onChange={handleExerciseChange}
                  className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-yellow-500 focus:outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-yellow-500 text-black font-bold py-2 px-4 rounded hover:bg-yellow-600 disabled:opacity-50"
              >
                {editExerciseId ? 'Guardar Cambios' : isLoading ? 'Agregando...' : 'Agregar Ejercicio'}
              </button>
            </form>

            <div className="mt-8">
              <h3 className="text-xl font-bold text-yellow-400 mb-4">Ejercicios Existentes</h3>
              <div className="space-y-4">
                {paginatedExercises.map(ex => (
                  <div key={ex.id} className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-semibold text-yellow-400">{ex.name}</h4>
                        <p className="text-sm text-gray-300">
                          Categoría: {categories.find(c => c.id === ex.categoryId)?.name || 'Sin categoría'}
                        </p>
                        <p className="text-sm text-gray-300">Dificultad: {ex.difficulty}</p>
                        <p className="text-sm text-gray-400 mt-2">{ex.description}</p>
                      </div>
                      <button
                        onClick={() => {
                          setEditExerciseId(ex.id);
                          setExerciseForm({
                            name: ex.name,
                            categoryId: ex.categoryId,
                            difficulty: ex.difficulty,
                            description: ex.description,
                            imageUrl: ex.imageUrl || ''
                          });
                        }}
                        className="bg-yellow-500 text-black px-3 py-1 rounded text-sm font-bold hover:bg-yellow-600"
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center items-center gap-4 mt-4">
                <button
                  disabled={exercisePage === 1}
                  onClick={() => setExercisePage(p => Math.max(1, p - 1))}
                  className="bg-yellow-500 text-black px-4 py-2 rounded font-bold hover:bg-yellow-600 disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="text-yellow-400">
                  Página {exercisePage} de {totalExercisePages}
                </span>
                <button
                  disabled={exercisePage === totalExercisePages}
                  onClick={() => setExercisePage(p => Math.min(totalExercisePages, p + 1))}
                  className="bg-yellow-500 text-black px-4 py-2 rounded font-bold hover:bg-yellow-600 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
            <button 
              onClick={() => setSection('main')} 
              className="mt-4 bg-yellow-500 text-black font-bold py-2 px-4 rounded hover:bg-yellow-600"
            >
              Volver al menú principal
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 