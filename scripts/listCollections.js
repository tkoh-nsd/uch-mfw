import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBDWsSD3BNnu6FJqqLns8Vs8M42jj2jKIo",
  authDomain: "tkoh-mfw.firebaseapp.com",
  projectId: "tkoh-mfw",
  storageBucket: "tkoh-mfw.firebasestorage.app",
  messagingSenderId: "874621881576",
  appId: "1:874621881576:web:e29140cc1e06c28d664d5d",
  measurementId: "G-E3W0X5MK5Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('Checking for collections...');
console.log('Trying some sample dates from your Excel file...\n');

// Try some sample dates
const sampleDates = [
  '2024-01-01', '2024-01-15', '2024-02-01', '2024-03-01',
  '2024-04-01', '2024-05-01', '2024-06-01', '2024-07-01',
  '2024-08-01', '2024-09-01', '2024-10-01', '2024-11-01', '2024-12-01',
  '2025-01-01', '2025-02-01', '2025-03-01'
];

async function checkCollections() {
  const foundCollections = [];
  
  for (const dateStr of sampleDates) {
    try {
      const collectionRef = collection(db, dateStr);
      const q = query(collectionRef, limit(1));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        foundCollections.push(dateStr);
        console.log(`✓ Found collection: ${dateStr}`);
        console.log(`  Sample document:`, {
          time: data.time,
          timeType: typeof data.time,
          venue: data.venue,
          service: data.service
        });
      }
    } catch (error) {
      // Collection doesn't exist, skip
    }
  }
  
  console.log(`\nFound ${foundCollections.length} collections with data`);
  
  if (foundCollections.length > 0) {
    console.log('\nCollections found:', foundCollections);
  } else {
    console.log('\nNo collections found. Your data might be in a different date range.');
    console.log('Please check your Excel file for the actual date range.');
  }
  
  process.exit(0);
}

checkCollections();

