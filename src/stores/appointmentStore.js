import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { collection, query, onSnapshot, doc, updateDoc, serverTimestamp, deleteField } from 'firebase/firestore';
import { db } from '../firebase';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

// Generate a unique user ID for this session
const generateUserId = () => {
  const stored = localStorage.getItem('userId');
  if (stored) return stored;

  const newId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('userId', newId);
  return newId;
};

export const useAppointmentStore = defineStore('appointment', () => {
  // State
  const selectedDate = ref(dayjs().format('YYYY-MM-DD'));
  const appointments = ref([]);
  const loading = ref(false);
  const unsubscribe = ref(null);
  const userId = ref(generateUserId());
  const autoUnlockInterval = ref(null);

  // Computed
  const formattedDate = computed(() => {
    return dayjs(selectedDate.value).format('YYYY-MM-DD');
  });

  // Actions
  const setDate = (date) => {
    selectedDate.value = dayjs(date).format('YYYY-MM-DD');
    subscribeToAppointments();
  };

  const goToToday = () => {
    setDate(dayjs());
  };

  const goToPreviousDay = () => {
    const prevDay = dayjs(selectedDate.value).subtract(1, 'day');
    setDate(prevDay);
  };

  const goToNextDay = () => {
    const nextDay = dayjs(selectedDate.value).add(1, 'day');
    setDate(nextDay);
  };

  // Auto-unlock stale bookings (older than 10 minutes)
  const checkAndUnlockStaleBookings = async () => {
    const now = dayjs().tz('Asia/Hong_Kong');
    const dateStr = formattedDate.value;

    for (const appointment of appointments.value) {
      // Skip if not booked
      if (!appointment.booked_by || !appointment.booked_at) {
        continue;
      }

      // Check if this is the current user's booking
      const isOwnBooking = appointment.booked_by === userId.value;

      // For own bookings, check last activity time
      if (isOwnBooking) {
        const activityTimeStr = localStorage.getItem(`activity_${appointment.id}`);

        if (activityTimeStr) {
          // User has activity recorded - check if it's recent
          const activityTime = parseInt(activityTimeStr, 10);
          const secondsSinceActivity = Math.floor((Date.now() - activityTime) / 1000);
          const minutesSinceActivity = Math.floor(secondsSinceActivity / 60);

          if (minutesSinceActivity < 8) {
            // User was active within last 8 minutes - skip auto-unlock
            const secondsRemaining = (8 * 60) - secondsSinceActivity;
            console.log(`Skipping auto-unlock for own booking: ${appointment.id} (active ${minutesSinceActivity}m ${secondsSinceActivity % 60}s ago, will unlock in ${Math.floor(secondsRemaining / 60)}m ${secondsRemaining % 60}s)`);
            continue;
          } else {
            // User hasn't been active for 8+ minutes - proceed to unlock
            console.log(`Auto-unlocking own booking due to inactivity: ${appointment.id} (inactive for ${minutesSinceActivity} minutes)`);
          }
        } else {
          // No activity recorded - use booking time
          console.log(`No activity recorded for own booking: ${appointment.id}, using booking time`);
        }
      }

      // Parse the booked_at timestamp
      const bookedAt = dayjs.tz(appointment.booked_at, 'YYYY-MM-DD HH:mm', 'Asia/Hong_Kong');
      const minutesElapsed = now.diff(bookedAt, 'minute');

      // If booking is older than 8 minutes, auto-unlock
      if (minutesElapsed >= 8) {
        const userLabel = isOwnBooking ? 'own booking' : `booking by ${appointment.booked_by}`;
        console.log(`Auto-unlocking stale ${userLabel}: ${appointment.id} (booked ${minutesElapsed} minutes ago)`);

        try {
          const appointmentRef = doc(db, 'bookings', dateStr, 'appointments', appointment.id);

          // Check if we have original values stored in component's localStorage
          // (This won't work across page refreshes, but that's okay - we'll just unlock without restoring)
          const originalValuesKey = `original_${appointment.id}`;
          const storedOriginal = localStorage.getItem(originalValuesKey);

	          const updates = {
	            booked_by: deleteField(),
	            booked_at: deleteField()
	          };

	          // If we have stored original values, restore them
	          if (storedOriginal && isOwnBooking) {
	            try {
	              const original = JSON.parse(storedOriginal);
	              updates.cwa = typeof original.cwa === 'boolean' ? original.cwa : !!original.cwa;
	              updates.pt_name = original.pt_name || '';
	              updates.rmsw = original.rmsw || '';
	              updates.ea = original.ea || '';
	              updates.new_fu = original.new_fu || '';
	              updates.remarks = original.remarks || '';
	              console.log(`Restoring original values for auto-unlocked appointment: ${appointment.id}`);
	            } catch (e) {
	              console.error('Error parsing stored original values:', e);
	            }
	          }

          await updateDoc(appointmentRef, updates);

          // Clean up stored data
          if (isOwnBooking) {
            localStorage.removeItem(`activity_${appointment.id}`);
            localStorage.removeItem(originalValuesKey);
          }
        } catch (error) {
          console.error('Error auto-unlocking appointment:', error);
        }
      }
    }
  };

  // Start auto-unlock checker (runs every minute)
  const startAutoUnlockChecker = () => {
    // Clear existing interval if any
    if (autoUnlockInterval.value) {
      clearInterval(autoUnlockInterval.value);
    }

    // Run immediately
    checkAndUnlockStaleBookings();

    // Then run every minute
    autoUnlockInterval.value = setInterval(() => {
      checkAndUnlockStaleBookings();
    }, 60000); // 60 seconds
  };

  // Stop auto-unlock checker
  const stopAutoUnlockChecker = () => {
    if (autoUnlockInterval.value) {
      clearInterval(autoUnlockInterval.value);
      autoUnlockInterval.value = null;
    }
  };

  // Subscribe to real-time updates from Firestore
  const subscribeToAppointments = () => {
    // Unsubscribe from previous listener if exists
    if (unsubscribe.value) {
      unsubscribe.value();
    }

    loading.value = true;
    const dateStr = formattedDate.value;

    // Query the subcollection for the selected date
    // Structure: bookings/{date}/appointments/{appointmentId}
    const appointmentsRef = collection(db, 'bookings', dateStr, 'appointments');

    // Set up real-time listener
    unsubscribe.value = onSnapshot(
      appointmentsRef,
      (snapshot) => {
        // Use smart update to preserve Vue reactivity and prevent focus loss
        // Instead of replacing the entire array, we update/add/remove individual items

        if (appointments.value.length === 0) {
          // Initial load - just set the array
          const docs = [];
          snapshot.forEach((doc) => {
            docs.push({
              id: doc.id,
              ...doc.data()
            });
          });

          // Sort by time if available
          docs.sort((a, b) => {
            if (a.time && b.time) {
              const timeA = String(a.time);
              const timeB = String(b.time);
              return timeA.localeCompare(timeB);
            }
            return 0;
          });

          appointments.value = docs;
        } else {
          // Incremental update - only update changed documents
          const newIds = new Set();

          snapshot.forEach((doc) => {
            const docData = {
              id: doc.id,
              ...doc.data()
            };
            newIds.add(doc.id);

            // Find existing appointment
            const existingIndex = appointments.value.findIndex(a => a.id === doc.id);

            if (existingIndex >= 0) {
              // Update existing appointment - preserve object reference if data hasn't changed
              const existing = appointments.value[existingIndex];

              // Check if data actually changed (deep comparison of relevant fields)
	              const hasChanged =
	                existing.booked_by !== docData.booked_by ||
	                existing.booked_at !== docData.booked_at ||
	                existing.cwa !== docData.cwa ||
	                existing.pt_name !== docData.pt_name ||
	                existing.rmsw !== docData.rmsw ||
	                existing.ea !== docData.ea ||
	                existing.new_fu !== docData.new_fu ||
	                existing.remarks !== docData.remarks ||
	                existing.last_edit !== docData.last_edit;

              if (hasChanged) {
                // Only update if data actually changed
                // If this appointment is CURRENTLY booked by current user (in the new data), preserve their local edits
                // But if it's being unlocked (docData.booked_by is null/undefined), accept all updates from Firestore
                if (docData.booked_by === userId.value) {
                  // Still editing - preserve user's local edits, only update booking metadata
                  appointments.value[existingIndex] = {
                    ...existing,
                    booked_by: docData.booked_by,
                    booked_at: docData.booked_at,
                    last_edit: docData.last_edit
                  };
                } else {
                  // Not editing or being unlocked - safe to update everything
                  appointments.value[existingIndex] = docData;
                }
              }
            } else {
              // New appointment - add it
              appointments.value.push(docData);
            }
          });

          // Remove appointments that no longer exist
          appointments.value = appointments.value.filter(a => newIds.has(a.id));

          // Re-sort after updates
          appointments.value.sort((a, b) => {
            if (a.time && b.time) {
              const timeA = String(a.time);
              const timeB = String(b.time);
              return timeA.localeCompare(timeB);
            }
            return 0;
          });
        }

        loading.value = false;

        // Start auto-unlock checker when appointments are loaded
        startAutoUnlockChecker();
      },
      (error) => {
        console.error('Error fetching appointments:', error);
        loading.value = false;
      }
    );
  };

  // Book appointment (lock for editing)
  const bookAppointment = async (appointmentId) => {
    try {
      const dateStr = formattedDate.value;
      // New structure: bookings/{date}/appointments/{appointmentId}
      const appointmentRef = doc(db, 'bookings', dateStr, 'appointments', appointmentId);

      await updateDoc(appointmentRef, {
        booked_by: userId.value,
        booked_at: dayjs().tz('Asia/Hong_Kong').format('YYYY-MM-DD HH:mm')
      });

      return { success: true };
    } catch (error) {
      console.error('Error booking appointment:', error);
      return { success: false, error };
    }
  };

  // Cancel booking (unlock) and optionally restore original values
  const cancelBooking = async (appointmentId, originalValues = null) => {
    try {
      const dateStr = formattedDate.value;
      // New structure: bookings/{date}/appointments/{appointmentId}
      const appointmentRef = doc(db, 'bookings', dateStr, 'appointments', appointmentId);

	      const updates = {
	        booked_by: deleteField(),
	        booked_at: deleteField()
	      };

	      // If original values are provided, restore them
	      if (originalValues) {
	        updates.cwa = typeof originalValues.cwa === 'boolean' ? originalValues.cwa : !!originalValues.cwa;
	        updates.pt_name = originalValues.pt_name || '';
	        updates.rmsw = originalValues.rmsw || '';
	        updates.ea = originalValues.ea || '';
	        updates.new_fu = originalValues.new_fu || '';
	        updates.remarks = originalValues.remarks || '';
	      }

      await updateDoc(appointmentRef, updates);

      return { success: true };
    } catch (error) {
      console.error('Error canceling booking:', error);
      return { success: false, error };
    }
  };

  // Save appointment changes and release lock
  const saveAppointment = async (appointmentId, updates) => {
    try {
      const dateStr = formattedDate.value;
      // New structure: bookings/{date}/appointments/{appointmentId}
      const appointmentRef = doc(db, 'bookings', dateStr, 'appointments', appointmentId);

      // Add last_edit timestamp in Hong Kong timezone
      const now = dayjs().tz('Asia/Hong_Kong').format('YYYY-MM-DD HH:mm');

      await updateDoc(appointmentRef, {
        ...updates,
        last_edit: now,
        booked_by: deleteField(),
        booked_at: deleteField()
      });

      return { success: true };
    } catch (error) {
      console.error('Error saving appointment:', error);
      return { success: false, error };
    }
  };

  // Cleanup function
  const cleanup = () => {
    if (unsubscribe.value) {
      unsubscribe.value();
      unsubscribe.value = null;
    }
    stopAutoUnlockChecker();
  };

  return {
    selectedDate,
    appointments,
    loading,
    formattedDate,
    userId,
    setDate,
    goToToday,
    goToPreviousDay,
    goToNextDay,
    subscribeToAppointments,
    bookAppointment,
    cancelBooking,
    saveAppointment,
    cleanup
  };
});

