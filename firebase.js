// Import Firebase modules (ES6)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, query, where, orderBy, limit } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

// 🔑 Replace these with your Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyC94z-nORMy9glnVPE_HXft65q4Et3gyCg",
  authDomain: "snapangle.firebaseapp.com",
  projectId: "snapangle",
  storageBucket: "snapangle.appspot.com",
  messagingSenderId: "997359239183",
  appId: "1:997359239183:web:41b15057c5d7f0b561e37a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Sign in anonymously
signInAnonymously(auth)
  .catch(err => console.error("Auth error:", err));