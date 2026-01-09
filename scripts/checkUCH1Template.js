import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
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

async function checkUCH1Template() {
  console.log('🔍 Checking UCH_1 template and date range...\n');
  
  try {
    // 1. Get UCH_1 template
    const templateRef = doc(db, 'timeslot_templates', 'UCH_1');
    const templateSnap = await getDoc(templateRef);
    
    if (!templateSnap.exists()) {
      console.log('❌ UCH_1 template not found!');
      console.log('Checking all available templates...\n');
      
      const templatesSnapshot = await getDocs(collection(db, 'timeslot_templates'));
      console.log(`Found ${templatesSnapshot.docs.length} templates:`);
      templatesSnapshot.docs.forEach(doc => {
        console.log(`  - ${doc.id}: ${JSON.stringify(doc.data(), null, 2)}`);
      });
      return;
    }
    
    const templateData = templateSnap.data();
    console.log('✅ UCH_1 Template found:');
    console.log(JSON.stringify(templateData, null, 2));
    console.log('');
    
    const expectedTimeslots = templateData.timeslots || [];
    console.log(`Expected timeslots (${expectedTimeslots.length}):`);
    expectedTimeslots.forEach((slot, idx) => {
      console.log(`  ${idx + 1}. ${slot.time} - ${slot.service} (qty: ${slot.quantity})`);
    });
    console.log('');
    
    // 2. Check a sample date in the range
    const sampleDates = ['2026-02-02', '2026-02-15', '2026-03-01'];
    
    for (const dateStr of sampleDates) {
      console.log(`\n📅 Checking ${dateStr}...`);
      const appointmentsRef = collection(db, 'bookings', dateStr, 'appointments');
      const snapshot = await getDocs(appointmentsRef);
      
      if (snapshot.empty) {
        console.log(`  ⚠️  No appointments found for ${dateStr}`);
        continue;
      }
      
      console.log(`  Found ${snapshot.docs.length} appointments`);
      
      // Group by time
      const timeSlotMap = new Map();
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const key = `${data.time}-${data.service}`;
        if (!timeSlotMap.has(key)) {
          timeSlotMap.set(key, []);
        }
        timeSlotMap.get(key).push(data);
      });
      
      console.log(`  Actual timeslots (${timeSlotMap.size}):`);
      Array.from(timeSlotMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([key, appointments]) => {
          const [time, service] = key.split('-');
          console.log(`    ${time} - ${service} (qty: ${appointments.length})`);
        });
      
      // Compare with expected
      const expectedKeys = new Set(expectedTimeslots.map(s => `${s.time}-${s.service}`));
      const actualKeys = new Set(timeSlotMap.keys());
      
      const missing = [...expectedKeys].filter(k => !actualKeys.has(k));
      const extra = [...actualKeys].filter(k => !expectedKeys.has(k));
      
      if (missing.length > 0) {
        console.log(`  ❌ Missing timeslots:`);
        missing.forEach(key => {
          const [time, service] = key.split('-');
          const expected = expectedTimeslots.find(s => `${s.time}-${s.service}` === key);
          console.log(`    ${time} - ${service} (expected qty: ${expected?.quantity || 0})`);
        });
      }
      
      if (extra.length > 0) {
        console.log(`  ⚠️  Extra timeslots (not in template):`);
        extra.forEach(key => {
          const [time, service] = key.split('-');
          console.log(`    ${time} - ${service} (qty: ${timeSlotMap.get(key).length})`);
        });
      }
      
      if (missing.length === 0 && extra.length === 0) {
        console.log(`  ✅ All timeslots match the template!`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

// Run the script
checkUCH1Template().catch(error => {
  console.error('❌ Failed:', error);
  process.exit(1);
});

