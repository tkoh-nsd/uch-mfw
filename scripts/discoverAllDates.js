import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
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

console.log('🔍 Discovering all date collections in the database...\n');

// Generate a comprehensive list of dates to check
// From 2024-01-01 to 2026-12-31 (3 years)
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

async function discoverAllDates() {
  const foundDates = [];
  
  // Check dates from 2024-01-01 to 2026-12-31
  const datesToCheck = generateDateRange('2024-01-01', '2026-12-31');
  
  console.log(`Checking ${datesToCheck.length} possible dates...\n`);
  
  let checkedCount = 0;
  const progressInterval = 100;
  
  for (const dateStr of datesToCheck) {
    try {
      const collectionRef = collection(db, dateStr);
      const q = query(collectionRef, limit(1));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const docCount = (await getDocs(collectionRef)).size;
        foundDates.push({ date: dateStr, count: docCount });
        console.log(`✓ Found: ${dateStr} (${docCount} appointments)`);
      }
      
      checkedCount++;
      if (checkedCount % progressInterval === 0) {
        console.log(`   ... checked ${checkedCount}/${datesToCheck.length} dates`);
      }
    } catch (error) {
      // Collection doesn't exist, skip
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Discovery completed!`);
  console.log(`   Found ${foundDates.length} date collections with data`);
  console.log('='.repeat(60));
  
  if (foundDates.length > 0) {
    console.log('\n📅 All dates with data:');
    console.log('');
    
    let totalAppointments = 0;
    foundDates.forEach(({ date, count }) => {
      console.log(`   ${date}: ${count} appointments`);
      totalAppointments += count;
    });
    
    console.log('');
    console.log(`📊 Total: ${totalAppointments} appointments across ${foundDates.length} dates`);
    console.log('');
    console.log('💾 Saving to file: discovered-dates.json');
    
    // Save to file
    const fs = await import('fs');
    const dateList = foundDates.map(d => d.date);
    fs.writeFileSync(
      'discovered-dates.json',
      JSON.stringify({ dates: dateList, details: foundDates }, null, 2)
    );
    
    console.log('✅ Saved! You can use this list for migration.');
  } else {
    console.log('\n⚠️  No date collections found.');
  }
  
  process.exit(0);
}

discoverAllDates().catch(error => {
  console.error('❌ Discovery failed:', error);
  process.exit(1);
});

