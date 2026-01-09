import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import dayjs from 'dayjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read and parse Excel file
const excelFilePath = join(__dirname, '../MFW.xlsx');
const fileBuffer = readFileSync(excelFilePath);
const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

console.log('Excel file analysis:');
console.log('Total rows:', data.length);
console.log('\nFirst 5 rows:');

for (let i = 0; i < Math.min(5, data.length); i++) {
  console.log(`\nRow ${i}:`, data[i]);
  if (i > 0 && data[i][0]) {
    console.log('  Date value:', data[i][0], 'Type:', typeof data[i][0]);
    if (typeof data[i][0] === 'number') {
      const excelDate = XLSX.SSF.parse_date_code(data[i][0]);
      const formatted = dayjs(new Date(excelDate.y, excelDate.m - 1, excelDate.d)).format('YYYY-MM-DD');
      console.log('  Converted date:', formatted);
    }
  }
  if (i > 0 && data[i][2]) {
    console.log('  Time value:', data[i][2], 'Type:', typeof data[i][2]);
    if (typeof data[i][2] === 'number') {
      const totalMinutes = Math.round(data[i][2] * 24 * 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      console.log('  Converted time:', formatted);
    }
  }
}

console.log('\n\nLast 3 rows:');
for (let i = Math.max(0, data.length - 3); i < data.length; i++) {
  console.log(`\nRow ${i}:`, data[i].slice(0, 5)); // Show first 5 columns only
}

process.exit(0);

