import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import dayjs from 'dayjs';

// Field formatting functions
function formatIdField(value) {
  if (!value) return '';
  const trimmed = String(value).trim().toUpperCase();
  const letters = trimmed.match(/[A-Z]/g) || [];
  const digits = trimmed.match(/\d/g) || [];
  const formattedLetters = letters.slice(0, 2).join('');
  const formattedDigits = digits.slice(0, 3).join('');
  if (formattedLetters.length > 0 && formattedDigits.length > 0) {
    return formattedLetters + formattedDigits;
  }
  return formattedLetters + formattedDigits;
}

function formatPhoneField(value) {
  if (!value) return '';
  const digits = String(value).match(/\d/g) || [];
  return digits.slice(0, 4).join('');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// TODO: Replace with your Firebase project configuration
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
    }
    
    // Update current weekday if cell is not empty
    if (row[1]) {
      currentWeekday = row[1];
    }
    
    // Skip if we don't have a valid date yet
    if (!currentDate) {
      console.log(`Skipping row ${i + 1}: No date available`);
      continue;
    }
    
    // Convert time from Excel decimal to HH:mm format
    let timeValue = row[2] || '';
    if (typeof timeValue === 'number') {
      // Excel stores time as decimal (e.g., 0.375 = 9:00 AM)
      const totalMinutes = Math.round(timeValue * 24 * 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      timeValue = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    // Create appointment document with formatted ID and Phone fields
    const appointment = {
      date: currentDate,
      weekday: currentWeekday || '',
      time: timeValue,
      service: row[3] || '',
      pt_name_1: row[4] || '',
      id_1: formatIdField(row[5] || ''),
      phone_1: formatPhoneField(row[6] || ''),
      pt_name_2: row[7] || '',
      id_2: formatIdField(row[8] || ''),
      phone_2: formatPhoneField(row[9] || ''),
      remarks: row[10] || ''
    };
    
    try {
      // Use date as collection name and auto-generate document ID
      const collectionRef = collection(db, currentDate);
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

