import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch } from 'firebase/firestore';
import readline from 'readline';
import dayjs from 'dayjs';

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

// Generate date range
function generateDateRange(startDate, endDate) {
  const dates = [];
  let currentDate = dayjs(startDate);
  const end = dayjs(endDate);

  while (currentDate.isBefore(end) || currentDate.isSame(end)) {
    dates.push(currentDate.format('YYYY-MM-DD'));
    currentDate = currentDate.add(1, 'day');
  }

  return dates;
}

// List of old date collections to delete (ALL migrated dates)
const datesToDelete = generateDateRange('2026-01-01', '2026-06-08');

function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

async function deleteOldStructure() {
  console.log('⚠️  WARNING: This will DELETE all data in the old structure!');
  console.log('');
  console.log(`Old structure collections to be deleted: ${datesToDelete.length} dates`);
  console.log(`  Date range: 2026-01-01 to 2026-06-08`);
  console.log('');
  console.log('Make sure you have:');
  console.log('  1. ✅ Run the migration scripts');
  console.log('  2. ✅ Verified the new data exists in bookings/{date}/appointments');
  console.log('  3. ✅ Tested the application with the new structure');
  console.log('');

  const confirmed = await askConfirmation('Type "yes" to proceed with deletion: ');
  
  if (!confirmed) {
    console.log('❌ Deletion cancelled.');
    process.exit(0);
  }

  console.log('\n🗑️  Starting deletion...\n');

  let totalDeleted = 0;
  const BATCH_SIZE = 500;

  for (const dateStr of datesToDelete) {
    try {
      console.log(`📅 Deleting collection: ${dateStr}`);
      
      const collectionRef = collection(db, dateStr);
      const snapshot = await getDocs(collectionRef);
      
      if (snapshot.empty) {
        console.log(`   ⚠️  Collection ${dateStr} is already empty`);
        continue;
      }

      console.log(`   Found ${snapshot.docs.length} documents to delete`);
      
      // Delete in batches
      const docs = snapshot.docs;
      let batchCount = 0;
      
      for (let i = 0; i < docs.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const batchDocs = docs.slice(i, i + BATCH_SIZE);
        
        for (const docSnapshot of batchDocs) {
          batch.delete(docSnapshot.ref);
        }
        
        await batch.commit();
        batchCount++;
        totalDeleted += batchDocs.length;
        
        console.log(`   ✅ Batch ${batchCount} deleted: ${batchDocs.length} documents`);
      }
      
      console.log(`   ✓ Completed ${dateStr}: ${docs.length} documents deleted`);
      
    } catch (error) {
      console.error(`   ❌ Error deleting ${dateStr}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Deletion completed!`);
  console.log(`   Total documents deleted: ${totalDeleted}`);
  console.log('='.repeat(60));
  
  process.exit(0);
}

// Run deletion
deleteOldStructure().catch(error => {
  console.error('❌ Deletion failed:', error);
  process.exit(1);
});

