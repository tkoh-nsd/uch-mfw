import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import dayjs from 'dayjs';

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

const BATCH_SIZE = 400;

// Generate date range
function generateDateRange(startDate, endDate) {
  const dates = [];
  let currentDate = dayjs(startDate);
  const end = dayjs(endDate);
  
  while (currentDate.isBefore(end) || currentDate.isSame(end, 'day')) {
    dates.push(currentDate.format('YYYY-MM-DD'));
    currentDate = currentDate.add(1, 'day');
  }
  
  return dates;
}

// Get weekday label
function getWeekdayLabel(dateStr) {
  const weekdayLabels = ['(日)', '(一)', '(二)', '(三)', '(四)', '(五)', '(六)'];
  const date = dayjs(dateStr);
  return weekdayLabels[date.day()];
}

async function addMissingTimeslots() {
  console.log('🔧 Adding missing timeslots for date range 2026-02-02 to 2026-03-02...\n');
  
  try {
    // 1. Get UCH_1 template
    const templateRef = doc(db, 'timeslot_templates', 'UCH_1');
    const templateSnap = await getDoc(templateRef);
    
    if (!templateSnap.exists()) {
      console.log('❌ UCH_1 template not found!');
      process.exit(1);
    }
    
    const templateData = templateSnap.data();
    const expectedTimeslots = templateData.timeslots || [];
    
    console.log(`✅ UCH_1 Template loaded with ${expectedTimeslots.length} timeslots\n`);
    
    // 2. Generate date range
    const dateRange = generateDateRange('2026-02-02', '2026-03-02');
    console.log(`📅 Processing ${dateRange.length} dates from 2026-02-02 to 2026-03-02\n`);
    
    let totalAdded = 0;
    let totalDatesProcessed = 0;
    
    // 3. Process each date
    for (const dateStr of dateRange) {
      console.log(`Processing ${dateStr}...`);
      
      // Get existing appointments for this date
      const appointmentsRef = collection(db, 'bookings', dateStr, 'appointments');
      const snapshot = await getDocs(appointmentsRef);
      
      // Build map of existing timeslots
      const existingTimeslots = new Set();
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const key = `${data.time}-${data.service}`;
        existingTimeslots.add(key);
      });
      
      // Find missing timeslots
      const missingSlots = [];
      const weekday = getWeekdayLabel(dateStr);
      
      for (const slot of expectedTimeslots) {
        const key = `${slot.time}-${slot.service}`;
        
        if (!existingTimeslots.has(key)) {
          // This timeslot is missing, add it with the expected quantity
          const qty = Number(slot.quantity) || 1;
          
          for (let i = 0; i < qty; i++) {
            missingSlots.push({
              date: dateStr,
              weekday,
              time: slot.time,
              service: slot.service,
              id_1: '',
              phone_1: '',
              pt_name_1: '',
              id_2: '',
              phone_2: '',
              pt_name_2: '',
              remarks: ''
            });
          }
        }
      }
      
      if (missingSlots.length === 0) {
        console.log(`  ✓ No missing timeslots for ${dateStr}`);
        totalDatesProcessed++;
        continue;
      }
      
      console.log(`  📝 Adding ${missingSlots.length} missing appointment(s)...`);
      
      // 4. Write missing timeslots in batches
      for (let i = 0; i < missingSlots.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const batchItems = missingSlots.slice(i, i + BATCH_SIZE);
        
        for (const appointment of batchItems) {
          const docRef = doc(collection(db, 'bookings', dateStr, 'appointments'));
          batch.set(docRef, appointment);
        }
        
        await batch.commit();
        totalAdded += batchItems.length;
      }
      
      console.log(`  ✅ Added ${missingSlots.length} appointment(s) for ${dateStr}`);
      totalDatesProcessed++;
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Process completed!');
    console.log(`   Dates processed: ${totalDatesProcessed}`);
    console.log(`   Total appointments added: ${totalAdded}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the script
addMissingTimeslots().catch(error => {
  console.error('❌ Failed:', error);
  process.exit(1);
});

