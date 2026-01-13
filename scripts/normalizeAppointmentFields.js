import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc, deleteField } from 'firebase/firestore';
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

// Required fields with their default values
const REQUIRED_FIELDS = {
  date: '',
  time: '',
  cwa: false,
  service: '',
  pt_name: '',
  rmsw: '',
  ea: '',
  new_fu: '',
  remarks: ''
};

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

// Function to scan all appointments and find those needing normalization
async function scanAllAppointments(startDate, endDate) {
  console.log(`\n🔍 Scanning all appointments from ${startDate} to ${endDate}...\n`);
  
  const dates = generateDateRange(startDate, endDate);
  console.log(`Scanning ${dates.length} dates.\n`);
  
  const appointmentsToNormalize = [];
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
      
      const missingFields = [];
      const extraFields = [];
      
      // Check for missing required fields
      Object.keys(REQUIRED_FIELDS).forEach(field => {
        if (!(field in data)) {
          missingFields.push(field);
        }
      });
      
      // Check for extra fields
      Object.keys(data).forEach(field => {
        if (!(field in REQUIRED_FIELDS) && !['booked_by', 'booked_at', 'last_edit'].includes(field)) {
          extraFields.push(field);
        }
      });
      
      if (missingFields.length > 0 || extraFields.length > 0) {
        if (!dateHasIssues) {
          dateHasIssues = true;
          datesWithIssues++;
        }
        
        appointmentsToNormalize.push({
          date: dateStr,
          appointmentId: docSnapshot.id,
          time: data.time || 'unknown',
          service: data.service || 'unknown',
          missingFields,
          extraFields,
          currentData: data
        });
      }
    });
    
    if (dateHasIssues) {
      const issuesInDate = appointmentsToNormalize.filter(a => a.date === dateStr).length;
      console.log(`  ${dateStr}: Found ${issuesInDate} appointments needing normalization`);
    }
  }
  
  console.log(`\n📊 Scan complete:`);
  console.log(`   Total appointments scanned: ${totalScanned}`);
  console.log(`   Dates with issues: ${datesWithIssues}`);
  console.log(`   Appointments to normalize: ${appointmentsToNormalize.length}\n`);
  
  return appointmentsToNormalize;
}

// Function to normalize appointments
async function normalizeAppointments(appointments) {
  console.log(`\n🔧 Normalizing ${appointments.length} appointments...\n`);
  
  const BATCH_SIZE = 500;
  let normalizedCount = 0;
  
  for (let i = 0; i < appointments.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const batchItems = appointments.slice(i, i + BATCH_SIZE);
    
    for (const appointment of batchItems) {
      const appointmentRef = doc(db, 'bookings', appointment.date, 'appointments', appointment.appointmentId);
      
      const updates = {};
      
      // Add missing fields with defaults
      appointment.missingFields.forEach(field => {
        updates[field] = REQUIRED_FIELDS[field];
      });
      
      // Remove extra fields
      appointment.extraFields.forEach(field => {
        updates[field] = deleteField();
      });
      
      batch.update(appointmentRef, updates);
    }
    
    await batch.commit();
    normalizedCount += batchItems.length;
    console.log(`  Normalized ${normalizedCount} / ${appointments.length} appointments...`);
  }
  
  console.log(`\n✅ Successfully normalized ${normalizedCount} appointments!\n`);
}

// Function to display detailed breakdown
function displayBreakdown(appointments) {
  console.log('\n📋 Detailed breakdown:\n');

  const missingFieldCounts = {};
  const extraFieldCounts = {};

  Object.keys(REQUIRED_FIELDS).forEach(field => {
    missingFieldCounts[field] = 0;
  });

  appointments.forEach(apt => {
    apt.missingFields.forEach(field => {
      missingFieldCounts[field]++;
    });
    apt.extraFields.forEach(field => {
      extraFieldCounts[field] = (extraFieldCounts[field] || 0) + 1;
    });
  });

  console.log('Missing required fields:');
  Object.entries(missingFieldCounts).forEach(([field, count]) => {
    if (count > 0) {
      console.log(`  - ${field}: ${count} appointments`);
    }
  });

  console.log('\nExtra fields to remove:');
  Object.entries(extraFieldCounts).forEach(([field, count]) => {
    console.log(`  - ${field}: ${count} appointments`);
  });

  console.log('\nSample appointments needing normalization (first 5):');
  appointments.slice(0, 5).forEach((apt, idx) => {
    console.log(`  ${idx + 1}. ${apt.date} ${apt.time} (${apt.service})`);
    if (apt.missingFields.length > 0) {
      console.log(`     Missing: ${apt.missingFields.join(', ')}`);
    }
    if (apt.extraFields.length > 0) {
      console.log(`     Extra: ${apt.extraFields.join(', ')}`);
    }
  });

  if (appointments.length > 5) {
    console.log(`  ... and ${appointments.length - 5} more`);
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
  // Scan from 2026-01-01 to 2026-06-30
  const startDate = '2026-01-01';
  const endDate = '2026-06-30';

  try {
    const appointmentsToNormalize = await scanAllAppointments(startDate, endDate);

    if (appointmentsToNormalize.length === 0) {
      console.log('✅ All appointments are properly normalized!\n');
      process.exit(0);
    }

    displayBreakdown(appointmentsToNormalize);

    const answer = await askQuestion('\n❓ Do you want to normalize these appointments? (yes/no): ');

    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
      await normalizeAppointments(appointmentsToNormalize);
    } else {
      console.log('\n❌ Operation cancelled. No changes were made.\n');
    }

  } catch (error) {
    console.error('Error:', error);
  }

  process.exit(0);
}

main();


