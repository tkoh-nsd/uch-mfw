import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';
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

console.log('🔄 Migrating remaining dates...');
console.log('Old structure: {date}/{appointmentId}');
console.log('New structure: bookings/{date}/appointments/{appointmentId}');
console.log('');

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

// Dates to migrate (excluding already migrated 2026-01-06 to 2026-01-31)
const datesToMigrate = [
  ...generateDateRange('2026-01-01', '2026-01-05'),  // Jan 1-5
  ...generateDateRange('2026-02-01', '2026-06-08')   // Feb 1 to Jun 8
];

console.log(`📅 Total dates to migrate: ${datesToMigrate.length}`);
console.log(`   - 2026-01-01 to 2026-01-05: 5 dates`);
console.log(`   - 2026-02-01 to 2026-06-08: ${generateDateRange('2026-02-01', '2026-06-08').length} dates`);
console.log('');

async function migrateData() {
  let totalMigrated = 0;
  const BATCH_SIZE = 500;
  let processedDates = 0;

  for (const dateStr of datesToMigrate) {
    try {
      processedDates++;
      console.log(`\n[${processedDates}/${datesToMigrate.length}] 📅 Processing: ${dateStr}`);
      
      // Read from old structure
      const oldCollectionRef = collection(db, dateStr);
      const snapshot = await getDocs(oldCollectionRef);
      
      if (snapshot.empty) {
        console.log(`   ⚠️  No data found`);
        continue;
      }

      console.log(`   Found ${snapshot.docs.length} appointments`);
      
      // Migrate in batches
      const docs = snapshot.docs;
      let batchCount = 0;
      
      for (let i = 0; i < docs.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const batchDocs = docs.slice(i, i + BATCH_SIZE);
        
        for (const docSnapshot of batchDocs) {
          // Write to new structure: bookings/{date}/appointments/{appointmentId}
          const newDocRef = doc(db, 'bookings', dateStr, 'appointments', docSnapshot.id);
          batch.set(newDocRef, docSnapshot.data());
        }
        
        await batch.commit();
        batchCount++;
        totalMigrated += batchDocs.length;
        
        console.log(`   ✅ Batch ${batchCount}: ${batchDocs.length} appointments migrated`);
      }
      
      console.log(`   ✓ Completed: ${docs.length} appointments`);
      
    } catch (error) {
      console.error(`   ❌ Error migrating ${dateStr}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Migration completed!`);
  console.log(`   Dates processed: ${processedDates}`);
  console.log(`   Total appointments migrated: ${totalMigrated}`);
  console.log('');
  console.log('📊 Combined with previous migration:');
  console.log(`   Previous: 1,680 appointments (2026-01-06 to 2026-01-31)`);
  console.log(`   This run: ${totalMigrated} appointments`);
  console.log(`   Grand total: ${1680 + totalMigrated} appointments`);
  console.log('='.repeat(60));
  
  process.exit(0);
}

// Run migration
migrateData().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});

