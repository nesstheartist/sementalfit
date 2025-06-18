import { 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    arrayUnion, 
    arrayRemove,
    increment,
    collection,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

// Obtener el carrito del usuario
export const getCart = async (userId) => {
    try {
        const cartRef = doc(db, 'carts', userId);
        const cartDoc = await getDoc(cartRef);
        
        if (cartDoc.exists()) {
            return cartDoc.data();
        } else {
            // Crear un carrito vacío si no existe
            const emptyCart = {
                items: [],
                total: 0,
                updatedAt: serverTimestamp()
            };
            await setDoc(cartRef, emptyCart);
            return emptyCart;
        }
    } catch (error) {
        console.error('Error al obtener el carrito:', error);
        throw error;
    }
};

// Agregar un producto al carrito
export const addToCart = async (userId, product) => {
    try {
        const cartRef = doc(db, 'carts', userId);
        const cartDoc = await getDoc(cartRef);
        
        if (!cartDoc.exists()) {
            // Crear nuevo carrito
            await setDoc(cartRef, {
                items: [{
                    productId: product.id,
                    name: product.name,
                    price: product.price,
                    quantity: 1,
                    imageUrl: product.imageUrl
                }],
                total: product.price,
                updatedAt: serverTimestamp()
            });
        } else {
            const cartData = cartDoc.data();
            const existingItemIndex = cartData.items.findIndex(
                item => item.productId === product.id
            );
            
            if (existingItemIndex > -1) {
                // Actualizar cantidad si el producto ya existe
                const updatedItems = [...cartData.items];
                updatedItems[existingItemIndex].quantity += 1;
                
                await updateDoc(cartRef, {
                    items: updatedItems,
                    total: cartData.total + product.price,
                    updatedAt: serverTimestamp()
                });
            } else {
                // Agregar nuevo producto
                await updateDoc(cartRef, {
                    items: arrayUnion({
                        productId: product.id,
                        name: product.name,
                        price: product.price,
                        quantity: 1,
                        imageUrl: product.imageUrl
                    }),
                    total: increment(product.price),
                    updatedAt: serverTimestamp()
                });
            }
        }
    } catch (error) {
        console.error('Error al agregar al carrito:', error);
        throw error;
    }
};

// Remover un producto del carrito
export const removeFromCart = async (userId, productId) => {
    try {
        const cartRef = doc(db, 'carts', userId);
        const cartDoc = await getDoc(cartRef);
        
        if (cartDoc.exists()) {
            const cartData = cartDoc.data();
            const itemToRemove = cartData.items.find(item => item.productId === productId);
            
            if (itemToRemove) {
                const updatedItems = cartData.items.filter(item => item.productId !== productId);
                const newTotal = cartData.total - (itemToRemove.price * itemToRemove.quantity);
                
                await updateDoc(cartRef, {
                    items: updatedItems,
                    total: newTotal,
                    updatedAt: serverTimestamp()
                });
            }
        }
    } catch (error) {
        console.error('Error al remover del carrito:', error);
        throw error;
    }
};

// Actualizar cantidad de un producto en el carrito
export const updateCartItemQuantity = async (userId, productId, quantity) => {
    try {
        const cartRef = doc(db, 'carts', userId);
        const cartDoc = await getDoc(cartRef);
        
        if (cartDoc.exists()) {
            const cartData = cartDoc.data();
            const itemIndex = cartData.items.findIndex(item => item.productId === productId);
            
            if (itemIndex > -1) {
                const updatedItems = [...cartData.items];
                const oldQuantity = updatedItems[itemIndex].quantity;
                updatedItems[itemIndex].quantity = quantity;
                
                const quantityDiff = quantity - oldQuantity;
                const pricePerUnit = updatedItems[itemIndex].price;
                
                await updateDoc(cartRef, {
                    items: updatedItems,
                    total: cartData.total + (pricePerUnit * quantityDiff),
                    updatedAt: serverTimestamp()
                });
            }
        }
    } catch (error) {
        console.error('Error al actualizar cantidad:', error);
        throw error;
    }
};

// Crear una orden
export const createOrder = async (userId, cartData) => {
    try {
        const orderRef = await addDoc(collection(db, 'orders'), {
            userId,
            items: cartData.items,
            total: cartData.total,
            status: 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        
        // Limpiar el carrito después de crear la orden
        await setDoc(doc(db, 'carts', userId), {
            items: [],
            total: 0,
            updatedAt: serverTimestamp()
        });
        
        return orderRef.id;
    } catch (error) {
        console.error('Error al crear la orden:', error);
        throw error;
    }
};

// Obtener las órdenes de un usuario
export const getUserOrders = async (userId) => {
    try {
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error al obtener órdenes:', error);
        throw error;
    }
}; 