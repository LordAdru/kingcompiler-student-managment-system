
// @ts-ignore
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
// @ts-ignore
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
// @ts-ignore
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyBQZxatyfbgQCcZdAFIV2ucanowLuIZhn8",
  authDomain: "kingcompiler-academy-manager.firebaseapp.com",
  projectId: "kingcompiler-academy-manager",
  storageBucket: "kingcompiler-academy-manager.firebasestorage.app",
  messagingSenderId: "1090473289859",
  appId: "1:1090473289859:web:d0d7f1a9f51987a9c453b6",
  measurementId: "G-NZ6DX2XDSP"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
