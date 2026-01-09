// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDCAYOZUwhAf3GZZO3pQ3A2fWkfseEcCXo",
  authDomain: "uch-mfw.firebaseapp.com",
  projectId: "uch-mfw",
  storageBucket: "uch-mfw.firebasestorage.app",
  messagingSenderId: "97638314402",
  appId: "1:97638314402:web:8a73941ba7cf01ce4e02fb",
  measurementId: "G-HV3N1WGXYW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


// Initialize Firestore
const db = getFirestore(app);

export { db };

