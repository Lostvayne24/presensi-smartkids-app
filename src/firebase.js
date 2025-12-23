import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// PASTE CONFIG YANG SUDAH ANDA COPY DI SINI
const firebaseConfig = {
  apiKey: "AIzaSyD05anfW1NbX99czkCts-dO3JmWA-kdJHc",
  authDomain: "bimbel-smartkids.firebaseapp.com",
  projectId: "bimbel-smartkids",
  storageBucket: "bimbel-smartkids.firebasestorage.app",
  messagingSenderId: "455519051093",
  appId: "1:455519051093:web:b3a2b49d5812d778b3e3dc",
  measurementId: "G-ZJTZE5TQCC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;