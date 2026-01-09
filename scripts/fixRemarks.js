import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch } from 'firebase/firestore';

// Firebase configuration for uch-mfw (matches src/firebase.js and scripts/importData.js)
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

async function fixRemarks() {
  try {
	    console.log('Starting remarks fix for bookings/{date}/appointments...');

	    const BATCH_SIZE = 500;
	    let totalUpdated = 0;

	    // Iterate over a reasonable date range and process bookings/{date}/appointments
	    const startDate = new Date('2024-01-01');
	    const endDate = new Date('2027-12-31');
	    let currentDate = new Date(startDate);

	    while (currentDate <= endDate) {
	      const dateId = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
	      const appointmentsCol = collection(db, 'bookings', dateId, 'appointments');
	      const apptSnapshot = await getDocs(appointmentsCol);

	      if (!apptSnapshot.empty) {
	        let batch = writeBatch(db);
	        let batchCount = 0;
	        let updatedForDate = 0;

	        for (const apptDoc of apptSnapshot.docs) {
	          const data = apptDoc.data();
	          const remarks = data.remarks;

	          if (typeof remarks === 'number') {
	            const formatted = excelDecimalToHHMM(remarks);
	            if (formatted !== remarks) {
	              batch.update(apptDoc.ref, { remarks: formatted });
	              batchCount += 1;
	              updatedForDate += 1;
	              totalUpdated += 1;
	            }
	          }

	          if (batchCount >= BATCH_SIZE) {
	            await batch.commit();
	            console.log(`Committed batch of ${batchCount} remark updates for ${dateId}...`);
	            batch = writeBatch(db);
	            batchCount = 0;
	          }
	        }

	        if (batchCount > 0) {
	          await batch.commit();
	          console.log(`Committed final batch of ${batchCount} remark updates for ${dateId}.`);
	        }

	        if (updatedForDate > 0) {
	          console.log(`Updated ${updatedForDate} appointment remarks in bookings/${dateId}/appointments`);
	        }
	      }

	      // Move to next day
	      currentDate.setDate(currentDate.getDate() + 1);
	    }

    console.log('');
    console.log(`Remarks fix completed. Total appointments updated: ${totalUpdated}`);
    process.exit(0);
  } catch (error) {
    console.error('Error fixing remarks:', error);
    process.exit(1);
  }
}

fixRemarks();

