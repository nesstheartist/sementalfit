import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBga2x6wi9KK70ZCzqyawD90QYyyEdjxMA",
  authDomain: "sementalfit2.firebaseapp.com",
  projectId: "sementalfit2",
  storageBucket: "sementalfit2.appspot.com",
  messagingSenderId: "275976211906",
  appId: "1:275976211906:web:b1d919ec1529e2f71c9a5b",
  measurementId: "G-XXXXXXXXXX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Configure Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
  // Add these parameters to handle COOP warnings
  authType: 'signInWithPopup',
  authMethod: 'google.com'
});

// Configure the authentication language
auth.useDeviceLanguage();

export { db, auth, storage, googleProvider };