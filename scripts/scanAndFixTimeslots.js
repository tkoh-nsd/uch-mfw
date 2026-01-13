import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import dayjs from 'dayjs';
import readline from 'readline';

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyDCAYOZUwhAf3GZZO3pQ3A2fWkfseEcCXo',
  authDomain: 'uch-mfw.firebaseapp.com',
  projectId: 'uch-mfw',
  storageBucket: 'uch-mfw.firebasestorage.app',
  messagingSenderId: '97638314402',
  appId: '1:97638314402:web:8a73941ba7cf01ce4e02fb',
  measurementId: 'G-HV3N1WGXYW',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const EXPECTED_SLOTS_PER_TIME = 4;

// Function to scan appointments for a date range
async function scanDateRange(startDate, endDate) {
  console.log(`\n🔍 Scanning appointments from ${startDate} to ${endDate}...\n`);
  
  const missingAppointments = [];
  let currentDate = dayjs(startDate);
  const end = dayjs(endDate);
  
  while (currentDate.isBefore(end) || currentDate.isSame(end, 'day')) {
    const dateStr = currentDate.format('YYYY-MM-DD');
    const weekday = currentDate.format('dddd');
    
    console.log(`Checking ${dateStr} (${weekday})...`);
    
    // Get all appointments for this date
    const appointmentsRef = collection(db, 'bookings', dateStr, 'appointments');
    const snapshot = await getDocs(appointmentsRef);
    
    if (snapshot.empty) {
      console.log(`  ⚠️  No appointments found for ${dateStr}`);
      currentDate = currentDate.add(1, 'day');
      continue;
    }
    
    // Group appointments by time and service
    const timeServiceMap = new Map();
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const key = `${data.time}|${data.service}`;
      
      if (!timeServiceMap.has(key)) {
        timeServiceMap.set(key, []);
      }
      timeServiceMap.get(key).push(data);
    });
    
    // Check each time-service combination
    for (const [key, appointments] of timeServiceMap.entries()) {
      const [time, service] = key.split('|');
      const count = appointments.length;
      
      if (count < EXPECTED_SLOTS_PER_TIME) {
        const missing = EXPECTED_SLOTS_PER_TIME - count;
        console.log(`  ⚠️  ${time} (${service}): Only ${count} slots, missing ${missing}`);
        
        // Add missing appointments to the list
        for (let i = 0; i < missing; i++) {
          missingAppointments.push({
            date: dateStr,
            weekday: weekday,
            time: time,
            service: service,
            cwa: false,
            pt_name: '',
            rmsw: '',
            ea: '',
            new_fu: '',
            remarks: ''
          });
        }
      } else if (count === EXPECTED_SLOTS_PER_TIME) {
        console.log(`  ✓ ${time} (${service}): ${count} slots (OK)`);
      } else {
        console.log(`  ⚠️  ${time} (${service}): ${count} slots (MORE than expected!)`);
      }
    }
    
    currentDate = currentDate.add(1, 'day');
  }
  
  return missingAppointments;
}

// Function to add missing appointments
async function addMissingAppointments(appointments) {
  console.log(`\n📝 Adding ${appointments.length} missing appointments...\n`);
  
  const BATCH_SIZE = 500;
  let addedCount = 0;
  
  for (let i = 0; i < appointments.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const batchItems = appointments.slice(i, i + BATCH_SIZE);
    
    for (const appointment of batchItems) {
      const appointmentsRef = collection(db, 'bookings', appointment.date, 'appointments');
      const docRef = doc(appointmentsRef);
      batch.set(docRef, appointment);
    }
    
    await batch.commit();
    addedCount += batchItems.length;
    console.log(`  Added ${addedCount} / ${appointments.length} appointments...`);
  }
  
  console.log(`\n✅ Successfully added ${addedCount} appointments!\n`);
}

// Function to prompt user for confirmation
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

// Main function
async function main() {
  const startDate = '2026-02-02';
  const endDate = '2026-03-02';
  
  try {
    const missingAppointments = await scanDateRange(startDate, endDate);
    
    if (missingAppointments.length === 0) {
      console.log('\n✅ No missing appointments found! All timeslots have 4 appointments.\n');
      process.exit(0);
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total missing appointments: ${missingAppointments.length}\n`);
    
    // Group by date for display
    const byDate = new Map();
    missingAppointments.forEach(apt => {
      if (!byDate.has(apt.date)) {
        byDate.set(apt.date, []);
      }
      byDate.get(apt.date).push(apt);
    });
    
    console.log('Missing appointments by date:');
    for (const [date, apts] of byDate.entries()) {
      console.log(`\n  ${date}:`);
      const byTime = new Map();
      apts.forEach(apt => {
        const key = `${apt.time} (${apt.service})`;
        byTime.set(key, (byTime.get(key) || 0) + 1);
      });
      for (const [timeService, count] of byTime.entries()) {
        console.log(`    - ${timeService}: ${count} missing`);
      }
    }
    
    const answer = await askQuestion('\n❓ Do you want to add these missing appointments? (yes/no): ');
    
    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
      await addMissingAppointments(missingAppointments);
    } else {
      console.log('\n❌ Operation cancelled. No appointments were added.\n');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

main();

