import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc, updateDoc, deleteField } from 'firebase/firestore';
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

// Legacy fields that should be removed
const LEGACY_FIELDS = ['id_1', 'id_2', 'phone_1', 'phone_2', 'pt_name_1', 'pt_name_2', 'weekday'];

// Function to generate date range
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

// Function to scan all appointments and find those with legacy fields
async function scanAllAppointments(startDate, endDate) {
  console.log(`\n🔍 Scanning all appointments from ${startDate} to ${endDate} for legacy fields...\n`);

  const dates = generateDateRange(startDate, endDate);
  console.log(`Scanning ${dates.length} dates.\n`);
  
  const appointmentsToClean = [];
  let totalScanned = 0;
  let datesWithIssues = 0;
  
  for (const dateStr of dates) {
    const appointmentsRef = collection(db, 'bookings', dateStr, 'appointments');
    const snapshot = await getDocs(appointmentsRef);
    
    if (snapshot.empty) {
      continue;
    }
    
    let dateHasIssues = false;
    
    snapshot.forEach((docSnapshot) => {
      totalScanned++;
      const data = docSnapshot.data();
      const legacyFieldsFound = [];
      
      // Check for each legacy field
      LEGACY_FIELDS.forEach(field => {
        if (field in data) {
          legacyFieldsFound.push(field);
        }
      });
      
      if (legacyFieldsFound.length > 0) {
        if (!dateHasIssues) {
          dateHasIssues = true;
          datesWithIssues++;
        }
        
        appointmentsToClean.push({
          date: dateStr,
          appointmentId: docSnapshot.id,
          time: data.time || 'unknown',
          service: data.service || 'unknown',
          legacyFields: legacyFieldsFound
        });
      }
    });
    
    if (dateHasIssues) {
      const issuesInDate = appointmentsToClean.filter(a => a.date === dateStr).length;
      console.log(`  ${dateStr}: Found ${issuesInDate} appointments with legacy fields`);
    }
  }
  
  console.log(`\n📊 Scan complete:`);
  console.log(`   Total appointments scanned: ${totalScanned}`);
  console.log(`   Dates with issues: ${datesWithIssues}`);
  console.log(`   Appointments to clean: ${appointmentsToClean.length}\n`);
  
  return appointmentsToClean;
}

// Function to remove legacy fields from appointments
async function cleanAppointments(appointments) {
  console.log(`\n🧹 Cleaning ${appointments.length} appointments...\n`);
  
  const BATCH_SIZE = 500;
  let cleanedCount = 0;
  
  for (let i = 0; i < appointments.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const batchItems = appointments.slice(i, i + BATCH_SIZE);
    
    for (const appointment of batchItems) {
      const appointmentRef = doc(db, 'bookings', appointment.date, 'appointments', appointment.appointmentId);
      
      // Create update object with deleteField() for each legacy field
      const updates = {};
      appointment.legacyFields.forEach(field => {
        updates[field] = deleteField();
      });
      
      batch.update(appointmentRef, updates);
    }
    
    await batch.commit();
    cleanedCount += batchItems.length;
    console.log(`  Cleaned ${cleanedCount} / ${appointments.length} appointments...`);
  }
  
  console.log(`\n✅ Successfully cleaned ${cleanedCount} appointments!\n`);
}

// Function to display detailed breakdown
function displayBreakdown(appointments) {
  console.log('\n📋 Detailed breakdown of legacy fields found:\n');
  
  const fieldCounts = {};
  LEGACY_FIELDS.forEach(field => {
    fieldCounts[field] = 0;
  });
  
  appointments.forEach(apt => {
    apt.legacyFields.forEach(field => {
      fieldCounts[field]++;
    });
  });
  
  console.log('Legacy field occurrences:');
  Object.entries(fieldCounts).forEach(([field, count]) => {
    if (count > 0) {
      console.log(`  - ${field}: ${count} appointments`);
    }
  });
  
  console.log('\nSample appointments with legacy fields (first 10):');
  appointments.slice(0, 10).forEach((apt, idx) => {
    console.log(`  ${idx + 1}. ${apt.date} ${apt.time} (${apt.service}) - Fields: ${apt.legacyFields.join(', ')}`);
  });
  
  if (appointments.length > 10) {
    console.log(`  ... and ${appointments.length - 10} more`);
  }
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
  // Scan from 2026-01-01 to 2026-06-30 (covers the full range mentioned in deployment docs)
  const startDate = '2026-01-01';
  const endDate = '2026-06-30';

  try {
    const appointmentsToClean = await scanAllAppointments(startDate, endDate);

    if (appointmentsToClean.length === 0) {
      console.log('✅ No legacy fields found! All appointments are clean.\n');
      process.exit(0);
    }

    displayBreakdown(appointmentsToClean);

    const answer = await askQuestion('\n❓ Do you want to remove these legacy fields? (yes/no): ');

    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
      await cleanAppointments(appointmentsToClean);
    } else {
      console.log('\n❌ Operation cancelled. No fields were removed.\n');
    }

  } catch (error) {
    console.error('Error:', error);
  }

  process.exit(0);
}

main();

