import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import Header from './Header';
import { useAuth } from '../contexts/AuthContext';

export default function ShopPage() {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            let productsQuery = collection(db, 'products');
            if (selectedCategory) {
                productsQuery = query(productsQuery, where('category', '==', selectedCategory));
            }
            const querySnapshot = await getDocs(productsQuery);
            const productsList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setProducts(productsList);
        } catch (error) {
            console.error('Error al cargar productos:', error);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                return prevCart.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prevCart, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId) => {
        setCart(prevCart => prevCart.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity < 1) return;
        setCart(prevCart =>
            prevCart.map(item =>
                item.id === productId
                    ? { ...item, quantity: newQuantity }
                    : item
            )
        );
    };

    const getTotal = () => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const categories = ['Suplementos', 'Ropa', 'Accesorios', 'Equipamiento'];

    return (
        <div className="min-h-screen bg-black text-yellow-400 p-4 pb-20">
            <Header />
            <h1 className="text-2xl font-bold text-yellow-400 mb-6">Tienda</h1>

            {/* Filtro de categorías */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                <button
                    onClick={() => setSelectedCategory('')}
                    className={`px-3 py-1 rounded-full text-sm ${
                        selectedCategory === '' 
                            ? 'bg-yellow-500 text-black' 
                            : 'bg-gray-800 text-white'
                    }`}
                >
                    Todos
                </button>
                {categories.map(category => (
                    <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-3 py-1 rounded-full text-sm ${
                            selectedCategory === category 
                                ? 'bg-yellow-500 text-black' 
                                : 'bg-gray-800 text-white'
                        }`}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {/* Lista de productos */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                {products.map(product => (
                    <div key={product.id} className="bg-gray-800 rounded-lg overflow-hidden">
                        {product.imageUrl && (
                            <img 
                                src={product.imageUrl} 
                                alt={product.name}
                                className="w-full h-32 object-cover"
                            />
                        )}
                        <div className="p-3">
                            <h3 className="font-bold text-yellow-400 mb-1">{product.name}</h3>
                            <p className="text-sm text-gray-300 mb-2">{product.description}</p>
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-bold">${product.price}</span>
                                <button
                                    onClick={() => addToCart(product)}
                                    className="px-3 py-1 bg-yellow-500 text-black rounded text-sm hover:bg-yellow-400"
                                >
                                    Agregar
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Carrito de compras */}
            {cart.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4">
                    <div className="max-w-md mx-auto">
                        <h2 className="text-lg font-bold text-yellow-400 mb-2">Carrito</h2>
                        <div className="max-h-40 overflow-y-auto mb-2">
                            {cart.map(item => (
                                <div key={item.id} className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm">{item.name}</span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                className="px-1 bg-gray-700 rounded"
                                            >-</button>
                                            <span className="text-sm">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="px-1 bg-gray-700 rounded"
                                            >+</button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm">${item.price * item.quantity}</span>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="text-red-400"
                                        >×</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold">Total: ${getTotal()}</span>
                            <button
                                className="px-4 py-2 bg-yellow-500 text-black rounded font-semibold hover:bg-yellow-400"
                            >
                                Comprar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 