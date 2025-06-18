import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // Importar getStorage

const firebaseConfig = {
  apiKey: "AIzaSyBga2x6wi9KK70ZCzqyawD90QYyyEdjxMA",
  authDomain: "sementalfit2.firebaseapp.com",
  projectId: "sementalfit2",
  storageBucket: "sementalfit2.firebasestorage.app",
  messagingSenderId: "275976211906",
  appId: "1:275976211906:web:b1d919ec1529e2f71c9a5b"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app); // Exportar storage