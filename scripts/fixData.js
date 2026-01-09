import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, writeBatch, deleteField } from 'firebase/firestore';

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

// Function to convert Excel time decimal to HH:mm format
function excelTimeToHHMM(excelTime) {
  if (typeof excelTime === 'string') {
    // Already a string, check if it's in HH:mm format
    if (/^\d{1,2}:\d{2}$/.test(excelTime)) {
      return excelTime;
    }
    // Try to parse as decimal
    const decimal = parseFloat(excelTime);
    if (!isNaN(decimal)) {
      excelTime = decimal;
    } else {
      return excelTime; // Return as-is if can't parse
    }
  }
  
  if (typeof excelTime === 'number') {
    // Excel stores time as decimal (e.g., 0.375 = 9:00 AM)
    const totalMinutes = Math.round(excelTime * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
  
  return excelTime;
}

// Helper function to add delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

console.log('Starting data fix...');
console.log('This will:');
console.log('1. Rename "venue" field to "service"');
console.log('2. Convert time from decimal to HH:mm format');
console.log('3. Use batch writes (up to 500 operations per batch) for efficiency');
console.log('');

async function fixData() {
  try {
    // Get all collections (dates)
    const collectionsSnapshot = await getDocs(collection(db, '__not_a_real_collection__')).catch(() => null);
    
    // Since Firestore doesn't have a direct way to list all collections,
    // we'll need to get the collection names from the data
    // For now, let's process all documents we can find
    
    // We need to know which collections exist
    // Let's read from a sample to understand the structure
    console.log('Note: This script will process documents as they are found.');
    console.log('You may need to provide a list of dates to process.');
    console.log('');
    
    // For demonstration, let's create a function that processes a specific date collection
    async function processDateCollection(dateStr) {
      const collectionRef = collection(db, dateStr);
      const snapshot = await getDocs(collectionRef);

      let processedCount = 0;
      let batch = writeBatch(db);
      let batchCount = 0;
      const BATCH_SIZE = 500; // Firestore limit

      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();
        const updates = {};

        // 1. Rename venue to service
        if (data.venue !== undefined) {
          updates.service = data.venue;
          updates.venue = deleteField(); // Delete the old field
        }

        // 2. Convert time format
        if (data.time !== undefined && data.time !== '') {
          const formattedTime = excelTimeToHHMM(data.time);
          if (formattedTime !== data.time) {
            updates.time = formattedTime;
          }
        }

        // Add to batch if there are changes
        if (Object.keys(updates).length > 0) {
          batch.update(doc(db, dateStr, docSnapshot.id), updates);
          processedCount++;
          batchCount++;

          // Commit batch when it reaches the limit
          if (batchCount >= BATCH_SIZE) {
            await batch.commit();
            console.log(`Committed batch of ${batchCount} documents in ${dateStr}... (Total: ${processedCount})`);
            batch = writeBatch(db);
            batchCount = 0;
            // Small delay between batches
            await delay(200);
          }
        }
      }

      // Commit any remaining documents in the batch
      if (batchCount > 0) {
        await batch.commit();
        console.log(`Committed final batch of ${batchCount} documents in ${dateStr}`);
      }

      return processedCount;
    }
    
    // Since we can't list all collections easily, we'll process based on a date range
    // Resuming from 2026-03-21 (after 2026-03-20 which was already processed)
    const startDate = new Date('2026-03-21');
    const endDate = new Date('2027-12-31');
    
    let totalProcessed = 0;
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      try {
        const count = await processDateCollection(dateStr);
        if (count > 0) {
          console.log(`✓ Fixed ${count} documents in collection: ${dateStr}`);
          totalProcessed += count;
          // Small delay between collections (100ms)
          await delay(100);
        }
      } catch (error) {
        // Collection might not exist, skip silently
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    console.log('');
    console.log(`Fix completed! Total documents processed: ${totalProcessed}`);
    process.exit(0);
    
  } catch (error) {
    console.error('Error fixing data:', error);
    process.exit(1);
  }
}

fixData();

