import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// Firebase configuration
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
const db = getFirestore(app);

// Sample MSW names
const mswNames = [
  'Alice Wong',
  'Bob Chen',
  'Carol Lee',
  'David Tan',
  'Emma Liu'
];

// Sample EA names
const eaNames = [
  'Frank Zhang',
  'Grace Kim',
  'Henry Ng',
  'Iris Lam',
  'Jack Wu'
];

async function addTestData() {
  console.log('Adding test MSW data...');
  
  // Add MSW names
  for (const name of mswNames) {
    try {
      await addDoc(collection(db, 'msw'), { name });
      console.log(`Added MSW: ${name}`);
    } catch (error) {
      console.error(`Error adding MSW ${name}:`, error);
    }
  }
  
  console.log('\nAdding test EA data...');
  
  // Add EA names
  for (const name of eaNames) {
    try {
      await addDoc(collection(db, 'ea'), { name });
      console.log(`Added EA: ${name}`);
    } catch (error) {
      console.error(`Error adding EA ${name}:`, error);
    }
  }
  
  console.log('\nTest data added successfully!');
  process.exit(0);
}

// Run the script
addTestData().catch(error => {
  console.error('Failed to add test data:', error);
  process.exit(1);
});

