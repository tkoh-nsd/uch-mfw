import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

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

// Public holidays to add
const publicHolidays = [
  '2026-02-17',
  '2026-02-18',
  '2026-02-19',
  '2026-04-03',
  '2026-04-04',
  '2026-04-06',
  '2026-04-07',
  '2026-05-01',
  '2026-05-25'
];

async function addPublicHolidays() {
  console.log('📅 Adding public holidays to Firestore...\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const date of publicHolidays) {
    try {
      // Create document with date as ID
      const docRef = doc(db, 'public_holidays', date);
      await setDoc(docRef, {
        date: date,
        description: 'Public Holiday',
        createdAt: new Date().toISOString()
      });
      
      console.log(`✅ Added: ${date}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error adding ${date}:`, error.message);
      errorCount++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Public holidays added successfully!`);
  console.log(`   Total: ${publicHolidays.length}`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Errors: ${errorCount}`);
  console.log('='.repeat(60));
  
  process.exit(0);
}

// Run the script
addPublicHolidays().catch(error => {
  console.error('❌ Failed to add public holidays:', error);
  process.exit(1);
});

