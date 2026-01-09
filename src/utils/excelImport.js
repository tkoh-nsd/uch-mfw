import * as XLSX from 'xlsx';
import { collection, doc, setDoc, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import dayjs from 'dayjs';

// Expected column headers for new layout
// A: Date, B: Time, C: Service, D: CWA, E: Pt Name, F: RMSW, G: EA, H: New/FU, I: Remarks
const EXPECTED_HEADERS = [
	  'Date', 'Time', 'Service', 'CWA',
	  'Pt Name', 'RMSW', 'EA', 'New/FU', 'Remarks'
];

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

/**
 * Validate Excel file structure
 * @param {File} file - The Excel file to validate
 * @returns {Promise<{valid: boolean, message: string, data: Array}>}
 */
export async function validateExcelFile(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    if (workbook.SheetNames.length === 0) {
      return { valid: false, message: 'Excel file has no sheets', data: null };
    }
    
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    
    if (data.length < 2) {
      return { valid: false, message: 'Excel file must have at least a header row and one data row', data: null };
    }
    
    // Check headers (case-insensitive)
    const headers = data[0].map(h => String(h).trim());
    const headersMatch = EXPECTED_HEADERS.every((expected, index) => {
      const actual = headers[index] || '';
      return actual.toLowerCase() === expected.toLowerCase();
    });
    
    if (!headersMatch) {
      return { 
        valid: false, 
        message: `Invalid column structure. Expected: ${EXPECTED_HEADERS.join(', ')}. Got: ${headers.join(', ')}`,
        data: null 
      };
    }
    
    return { valid: true, message: 'File structure is valid', data };
  } catch (error) {
    return { valid: false, message: `Error reading file: ${error.message}`, data: null };
  }
}

/**
 * Delete all documents in subcollections for the dates found in the import data
 * New structure: bookings/{date}/appointments/{appointmentId}
 * @param {Array} dates - Array of unique dates to clear
 * @param {Function} progressCallback - Callback for progress updates
 */
async function clearDataForDates(dates, progressCallback) {
  progressCallback(`Clearing existing data for ${dates.length} date(s)...`);

  let totalDeleted = 0;
  const BATCH_SIZE = 500;

  for (const date of dates) {
    // New structure: bookings/{date}/appointments
    const appointmentsRef = collection(db, 'bookings', date, 'appointments');
    const snapshot = await getDocs(appointmentsRef);

    if (snapshot.empty) {
      continue;
    }

    // Delete in batches
    const docs = snapshot.docs;
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const batchDocs = docs.slice(i, i + BATCH_SIZE);

      for (const docSnapshot of batchDocs) {
        batch.delete(docSnapshot.ref);
      }

      await batch.commit();
      totalDeleted += batchDocs.length;
    }
  }

  progressCallback(`Cleared ${totalDeleted} existing appointment(s)`);
}

/**
 * Import Excel data to Firestore using batch writes
 * @param {File} file - The Excel file to import
 * @param {Function} progressCallback - Callback for progress updates
 * @returns {Promise<{success: boolean, message: string, count: number}>}
 */
export async function importExcelData(file, progressCallback) {
  try {
    // Validate file first
    const validation = await validateExcelFile(file);
    if (!validation.valid) {
      return { success: false, message: validation.message, count: 0 };
    }

    const data = validation.data;
    progressCallback('File validated successfully');

	    let currentDate = '';
	    let currentWeekday = '';
    let importCount = 0;
    const totalRows = data.length - 1; // Exclude header

    // Prepare all appointments to be imported
    const appointments = [];
    const uniqueDates = new Set();

    // Process data row by row to build appointments array
    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Skip empty rows
      if (!row || row.every(cell => !cell)) {
        continue;
      }

	      // Update current date if cell is not empty
	      if (row[0]) {
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
        continue;
      }

      // Track unique dates
      uniqueDates.add(currentDate);

	      // Convert time from Excel decimal to HH:mm format (column B)
	      let timeValue = row[1] ?? '';
	      if (typeof timeValue === 'number') {
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

      appointments.push(appointment);
    }

    progressCallback(`Prepared ${appointments.length} appointments for ${uniqueDates.size} date(s)`);

    // Clear existing data for the dates in the import file
    await clearDataForDates(Array.from(uniqueDates), progressCallback);

    progressCallback('Starting batch import...');

    // Import using batch writes (max 500 operations per batch)
    // New structure: bookings/{date}/appointments/{appointmentId}
    const BATCH_SIZE = 500;
    let batchCount = 0;

    for (let i = 0; i < appointments.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const batchAppointments = appointments.slice(i, i + BATCH_SIZE);

      for (const appointment of batchAppointments) {
        // New structure: bookings/{date}/appointments/{appointmentId}
        const appointmentsRef = collection(db, 'bookings', appointment.date, 'appointments');
        const docRef = doc(appointmentsRef);
        batch.set(docRef, appointment);
      }

      // Commit the batch
      await batch.commit();
      batchCount++;
      importCount += batchAppointments.length;

      progressCallback(`Batch ${batchCount} committed: ${importCount} of ${appointments.length} appointments imported...`);
    }

    progressCallback(`Import completed! Total: ${importCount} appointments in ${batchCount} batches`);
    return { success: true, message: `Successfully imported ${importCount} appointments in ${batchCount} batch(es)`, count: importCount };

  } catch (error) {
    console.error('Import error:', error);
    return { success: false, message: `Import failed: ${error.message}`, count: 0 };
  }
}

