import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';

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

console.log('🔄 Starting database migration...');
console.log('Old structure: {date}/{appointmentId}');
console.log('New structure: bookings/{date}/appointments/{appointmentId}');
console.log('');

// List of dates to migrate (you can expand this list)
const datesToMigrate = [
  '2026-01-06', '2026-01-07', '2026-01-08', '2026-01-09', '2026-01-10',
  '2026-01-13', '2026-01-14', '2026-01-15', '2026-01-16', '2026-01-17',
  '2026-01-20', '2026-01-21', '2026-01-22', '2026-01-23', '2026-01-24',
  '2026-01-27', '2026-01-28', '2026-01-29', '2026-01-30', '2026-01-31'
];

async function migrateData() {
  let totalMigrated = 0;
  const BATCH_SIZE = 500;

  for (const dateStr of datesToMigrate) {
    try {
      console.log(`\n📅 Processing date: ${dateStr}`);
      
      // Read from old structure
      const oldCollectionRef = collection(db, dateStr);
      const snapshot = await getDocs(oldCollectionRef);
      
      if (snapshot.empty) {
        console.log(`   ⚠️  No data found for ${dateStr}`);
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
        
        console.log(`   ✅ Batch ${batchCount} migrated: ${batchDocs.length} appointments`);
      }
      
      console.log(`   ✓ Completed ${dateStr}: ${docs.length} appointments migrated`);
      
    } catch (error) {
      console.error(`   ❌ Error migrating ${dateStr}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Migration completed!`);
  console.log(`   Total appointments migrated: ${totalMigrated}`);
  console.log('');
  console.log('⚠️  IMPORTANT: Old data still exists in the old structure.');
  console.log('   After verifying the migration, you can delete the old collections.');
  console.log('   Run: node scripts/deleteOldStructure.js');
  console.log('='.repeat(60));
  
  process.exit(0);
}

// Run migration
migrateData().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});

