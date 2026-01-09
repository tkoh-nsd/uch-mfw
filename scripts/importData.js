import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import dayjs from 'dayjs';

// Convert Excel decimal time (e.g. 0.375) to HH:mm string
function excelDecimalToHHMM(excelTime) {
  if (typeof excelTime !== 'number') {
    return excelTime;
  }
  const totalMinutes = Math.round(excelTime * 24 * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// TODO: Replace with your Firebase project configuration
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

// Read and parse Excel file
const excelFilePath = join(__dirname, '../MFW.xlsx');
const fileBuffer = readFileSync(excelFilePath);
const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

console.log('Starting data import...');
console.log(`Found ${data.length} rows in Excel file`);

// Process data
let currentDate = '';
let currentWeekday = '';
let importCount = 0;

async function importData() {
  // Skip header row (index 0)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    // Skip empty rows
    if (!row || row.every(cell => !cell)) {
      continue;
    }
    
    // Update current date if cell is not empty
    if (row[0]) {
      // Parse date - assuming format like "2024-01-15" or Excel date serial
      const dateValue = row[0];
      if (typeof dateValue === 'number') {
        // Excel date serial number
        const excelDate = XLSX.SSF.parse_date_code(dateValue);
        currentDate = dayjs(new Date(excelDate.y, excelDate.m - 1, excelDate.d)).format('YYYY-MM-DD');
      } else {
        // String date
        currentDate = dayjs(dateValue).format('YYYY-MM-DD');
      }

      // Derive weekday from date (e.g. "Monday")
      currentWeekday = dayjs(currentDate).format('dddd');
    }
    
    // Skip if we don't have a valid date yet
    if (!currentDate) {
      console.log(`Skipping row ${i + 1}: No date available`);
      continue;
    }
    
	    // Convert time from Excel decimal to HH:mm format (column B)
	    let timeValue = row[1] ?? '';
	    if (typeof timeValue === 'number') {
	      // Excel stores time as decimal (e.g., 0.375 = 9:00 AM)
	      timeValue = excelDecimalToHHMM(timeValue);
	    }

	    // Convert remarks if it is an Excel decimal time (Column I)
	    let remarksValue = row[8] ?? '';
	    if (typeof remarksValue === 'number') {
	      remarksValue = excelDecimalToHHMM(remarksValue);
	    }

	    // Create appointment document using new column layout
	    const rawCwa = row[3]; // Column D: CWA ("Y" or empty)
	    const appointment = {
	      date: currentDate,
	      weekday: currentWeekday || '',
	      time: timeValue,
	      service: row[2] || '', // Column C: Service
	      cwa: String(rawCwa).trim().toUpperCase() === 'Y',
	      pt_name: row[4] || '', // Column E: Pt Name
	      rmsw: row[5] || '',    // Column F: RMSW
	      ea: row[6] || '',      // Column G: EA
	      new_fu: row[7] || '',  // Column H: New/FU
	      remarks: remarksValue  // Column I: Remarks (may be converted HH:mm)
	    };
    
    try {
      // New structure: bookings/{date}/appointments/{appointmentId}
      const collectionRef = collection(db, 'bookings', currentDate, 'appointments');
      const docRef = doc(collectionRef);
      
      await setDoc(docRef, appointment);
      importCount++;
      
      if (importCount % 10 === 0) {
        console.log(`Imported ${importCount} appointments...`);
      }
    } catch (error) {
      console.error(`Error importing row ${i + 1}:`, error);
    }
  }
  
  console.log(`\nImport completed! Total appointments imported: ${importCount}`);
  process.exit(0);
}

// Run import
importData().catch(error => {
  console.error('Import failed:', error);
  process.exit(1);
});

