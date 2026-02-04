import * as XLSX from 'xlsx';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import dayjs from 'dayjs';

/**
 * Export appointments for a date range to Excel
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<{success: boolean, message: string, count: number}>}
 */
export async function exportAppointmentsByDateRange(startDate, endDate) {
  try {
    const start = dayjs(startDate);
    const end = dayjs(endDate);

    if (start.isAfter(end)) {
      return { success: false, message: 'Start date must be before or equal to end date', count: 0 };
    }

    // Collect all appointments for the date range
    const allAppointments = [];
    let currentDate = start.clone();

    // Loop through each date in the range
    while (currentDate.format('YYYY-MM-DD') <= end.format('YYYY-MM-DD')) {
      const dateStr = currentDate.format('YYYY-MM-DD');

      try {
        // Query appointments for this date
        const appointmentsRef = collection(db, 'bookings', dateStr, 'appointments');
        const snapshot = await getDocs(appointmentsRef);

        snapshot.forEach((doc) => {
          allAppointments.push({
            id: doc.id,
            ...doc.data()
          });
        });
      } catch (error) {
        console.log(`No data for date ${dateStr}, continuing...`);
      }

      currentDate = currentDate.add(1, 'day');
    }

    // Filter: only include appointments with Pt Name
    const filteredAppointments = allAppointments.filter(apt => apt.pt_name && String(apt.pt_name).trim());

    if (filteredAppointments.length === 0) {
      return { success: false, message: 'No appointments with patient names found for the selected date range', count: 0 };
    }

    // Sort by date, then by time
    filteredAppointments.sort((a, b) => {
      const dateCompare = (a.date || '').localeCompare(b.date || '');
      if (dateCompare !== 0) {
        return dateCompare;
      }
      return (a.time || '').localeCompare(b.time || '');
    });

    // Format data for Excel
    const rows = filteredAppointments.map((apt, index) => ({
      '#': index + 1,
      Date: apt.date || '',
      Time: apt.time || '',
      Service: apt.service || '',
      CWA: apt.cwa ? 'Yes' : 'No',
      'Pt Name': apt.pt_name || '',
      RMSW: apt.rmsw || '',
      EA: apt.ea || '',
      'New/FU': apt.new_fu || '',
      Remarks: apt.remarks || '',
      'Last Edit': apt.last_edit || ''
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Appointments');

    // Generate filename
    const startLabel = dayjs(startDate).format('YYYY-MM-DD');
    const endLabel = dayjs(endDate).format('YYYY-MM-DD');
    const fileName = `appointments_${startLabel}_to_${endLabel}.xlsx`;

    // Write file
    XLSX.writeFile(workbook, fileName);

    return { success: true, message: `Exported ${filteredAppointments.length} appointments`, count: filteredAppointments.length };
  } catch (error) {
    console.error('Error exporting appointments:', error);
    return { success: false, message: `Export failed: ${error.message}`, count: 0 };
  }
}

