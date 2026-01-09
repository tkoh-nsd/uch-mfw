<template>
  <div class="appointment-view">
    <div class="header" @click="goToAdmin">
      <h1>
        MSW Appointment Management System
      </h1>
      <p class="admin-hint">Click to access Admin Panel</p>
    </div>

    <!-- Date Navigation -->
    <div class="date-navigation">
      <Button
        label="Previous Day"
        icon="pi pi-chevron-left"
        @click="store.goToPreviousDay()"
        class="p-button-outlined"
      />

      <div class="calendar-container">
        <DatePicker
          v-model="calendarDate"
          @date-select="onDateSelect"
          :inline="true"
          dateFormat="yy-mm-dd"
          :disabledDates="disabledDates"
        />
      </div>

      <Button
        label="Next Day"
        icon="pi pi-chevron-right"
        iconPos="right"
        @click="store.goToNextDay()"
        class="p-button-outlined"
      />
    </div>

    <div class="selected-date">
      <h2>
        <span class="date-label">Appointments for</span>
        <span class="date-value">{{ formattedSelectedDate }}</span>
      </h2>
    </div>

    <!-- Loading Indicator -->
    <div v-if="store.loading" class="loading">
      <ProgressSpinner />
    </div>

    <!-- Appointments Table -->
	    <div v-else-if="store.appointments.length > 0" class="appointments-table">
	      <DataTable
	        :value="filteredAppointments"
	        dataKey="id"
	        :scrollable="true"
	        scrollHeight="600px"
	        class="p-datatable-sm"
	        :rowClass="getRowClass"
	        filterDisplay="row"
	        sortMode="multiple"
	      >
	        <Column field="time" header="Time" :style="{ width: '90px' }" frozen sortable :showFilterMenu="false">
	          <template #body="slotProps">
	            <span class="readonly-field">{{ slotProps.data.time || '--' }}</span>
	          </template>
	          <template #filter>
	            <Select
	              v-model="filters.time.value"
	              @change="applyFilterSnapshot()"
	              :options="uniqueTimeValues"
	              placeholder="All"
	              class="p-column-filter"
	              :showClear="true"
	              @click.stop
	            />
	          </template>
	        </Column>

	        <Column field="service" header="Service" :style="{ width: '140px' }" sortable :showFilterMenu="false">
	          <template #body="slotProps">
	            <span class="readonly-field">{{ slotProps.data.service || '--' }}</span>
	          </template>
	          <template #filter>
	            <Select
	              v-model="filters.service.value"
	              @change="applyFilterSnapshot()"
	              :options="uniqueServiceValues"
	              placeholder="All"
	              class="p-column-filter"
	              :showClear="true"
	              @click.stop
	            />
	          </template>
	        </Column>

	        <Column field="cwa" header="CWA" :style="{ width: '80px' }" sortable :showFilterMenu="false">
	          <template #body="slotProps">
	            <div class="cwa-checkbox-wrapper">
	              <input
	                type="checkbox"
	                :checked="!!slotProps.data.cwa"
	                :disabled="!isEditableByCurrentUser(slotProps.data)"
	                @change="(e) => { slotProps.data.cwa = e.target.checked; markAsEdited(slotProps.data.id); }"
	                @click.stop
	              />
	            </div>
	          </template>
	          <template #filter>
	            <Select
	              v-model="filters.cwa.value"
	              @change="applyFilterSnapshot()"
	              :options="cwaFilterOptions"
	              placeholder="All"
	              class="p-column-filter"
	              :showClear="true"
	              @click.stop
	            />
	          </template>
	        </Column>

	        <Column field="pt_name" header="Pt Name" :style="{ width: '200px' }" sortable :showFilterMenu="false">
	          <template #body="slotProps">
	            <InputText
	              v-model="slotProps.data.pt_name"
	              class="editable-input"
	              :disabled="!isEditableByCurrentUser(slotProps.data)"
	              @input="markAsEdited(slotProps.data.id)"
	              @focus="handleFieldFocus(slotProps.data.id, 'pt_name')"
	              @blur="handleFieldBlur(slotProps.data.id, 'pt_name')"
	              @click.stop
	            />
	          </template>
	          <template #filter>
	            <Select
	              v-model="filters.pt_name.value"
	              @change="applyFilterSnapshot()"
	              :options="uniquePtNameValues"
	              placeholder="All"
	              class="p-column-filter"
	              :showClear="true"
	              filter
	              :filterPlaceholder="'Search...'"
	              @click.stop
	            >
	              <template #value="slotProps">
	                <span v-if="slotProps.value === ''" class="empty-option">(Empty)</span>
	                <span v-else>{{ slotProps.value || 'All' }}</span>
	              </template>
	              <template #option="slotProps">
	                <span v-if="slotProps.option === ''" class="empty-option">(Empty)</span>
	                <span v-else>{{ slotProps.option }}</span>
	              </template>
	            </Select>
	          </template>
	        </Column>

	        <Column field="rmsw" header="RMSW" :style="{ width: '160px' }" sortable :showFilterMenu="false">
	          <template #body="slotProps">
	            <Select
	              v-model="slotProps.data.rmsw"
	              :options="rmswDropdownOptions"
	              class="editable-input"
	              :disabled="!isEditableByCurrentUser(slotProps.data)"
	              @change="markAsEdited(slotProps.data.id)"
	              @focus="handleFieldFocus(slotProps.data.id, 'rmsw')"
	              @blur="handleFieldBlur(slotProps.data.id, 'rmsw')"
	              @click.stop
	              placeholder="--"
	              filter
	              :filterPlaceholder="'Search...'"
	            />
	          </template>
	          <template #filter>
	            <Select
	              v-model="filters.rmsw.value"
	              @change="applyFilterSnapshot()"
	              :options="uniqueRmswValues"
	              placeholder="All"
	              class="p-column-filter"
	              :showClear="true"
	              filter
	              :filterPlaceholder="'Search...'"
	              @click.stop
	            >
	              <template #value="slotProps">
	                <span v-if="slotProps.value === ''" class="empty-option">(Empty)</span>
	                <span v-else>{{ slotProps.value || 'All' }}</span>
	              </template>
	              <template #option="slotProps">
	                <span v-if="slotProps.option === ''" class="empty-option">(Empty)</span>
	                <span v-else>{{ slotProps.option }}</span>
	              </template>
	            </Select>
	          </template>
	        </Column>

	        <Column field="ea" header="EA" :style="{ width: '160px' }" sortable :showFilterMenu="false">
	          <template #body="slotProps">
	            <Select
	              v-model="slotProps.data.ea"
	              :options="eaDropdownOptions"
	              class="editable-input"
	              :disabled="!isEditableByCurrentUser(slotProps.data)"
	              @change="markAsEdited(slotProps.data.id)"
	              @focus="handleFieldFocus(slotProps.data.id, 'ea')"
	              @blur="handleFieldBlur(slotProps.data.id, 'ea')"
	              @click.stop
	              placeholder="--"
	              filter
	              :filterPlaceholder="'Search...'"
	            />
	          </template>
	          <template #filter>
	            <Select
	              v-model="filters.ea.value"
	              @change="applyFilterSnapshot()"
	              :options="uniqueEaValues"
	              placeholder="All"
	              class="p-column-filter"
	              :showClear="true"
	              filter
	              :filterPlaceholder="'Search...'"
	              @click.stop
	            >
	              <template #value="slotProps">
	                <span v-if="slotProps.value === ''" class="empty-option">(Empty)</span>
	                <span v-else>{{ slotProps.value || 'All' }}</span>
	              </template>
	              <template #option="slotProps">
	                <span v-if="slotProps.option === ''" class="empty-option">(Empty)</span>
	                <span v-else>{{ slotProps.option }}</span>
	              </template>
	            </Select>
	          </template>
	        </Column>

	        <Column field="new_fu" header="New/FU" :style="{ width: '160px' }" sortable :showFilterMenu="false">
	          <template #body="slotProps">
	            <div class="newfu-toggle">
	              <Button
	                label="New"
	                size="small"
	                class="newfu-button"
	                :class="{ 'newfu-button--new-active': isNewValue(slotProps.data.new_fu) }"
	                :disabled="!isEditableByCurrentUser(slotProps.data)"
	                @click.stop.prevent="() => { slotProps.data.new_fu = 'New'; markAsEdited(slotProps.data.id); }"
	              />
	              <Button
	                label="FU"
	                size="small"
	                class="newfu-button"
	                :class="{ 'newfu-button--fu-active': isFuValue(slotProps.data.new_fu) }"
	                :disabled="!isEditableByCurrentUser(slotProps.data)"
	                @click.stop.prevent="() => { slotProps.data.new_fu = 'FU'; markAsEdited(slotProps.data.id); }"
	              />
	            </div>
	          </template>
	          <template #filter>
	            <Select
	              v-model="filters.new_fu.value"
	              @change="applyFilterSnapshot()"
	              :options="uniqueNewFuValues"
	              placeholder="All"
	              class="p-column-filter"
	              :showClear="true"
	              filter
	              :filterPlaceholder="'Search...'"
	              @click.stop
	            >
	              <template #value="slotProps">
	                <span v-if="slotProps.value === ''" class="empty-option">(Empty)</span>
	                <span v-else>{{ slotProps.value || 'All' }}</span>
	              </template>
	              <template #option="slotProps">
	                <span v-if="slotProps.option === ''" class="empty-option">(Empty)</span>
	                <span v-else>{{ slotProps.option }}</span>
	              </template>
	            </Select>
	          </template>
	        </Column>

	        <Column field="remarks" header="Remarks" :style="{ width: '280px' }" sortable :showFilterMenu="false">
          <template #body="slotProps">
            <Textarea
              v-model="slotProps.data.remarks"
              rows="2"
              class="editable-input"
              :disabled="!isEditableByCurrentUser(slotProps.data)"
              @input="markAsEdited(slotProps.data.id)"
              @focus="handleFieldFocus(slotProps.data.id, 'remarks')"
              @blur="handleFieldBlur(slotProps.data.id, 'remarks')"
              @click.stop
            />
          </template>
          <template #filter>
            <InputText
              v-model="filters.remarks.value"
              type="text"
              @input="applyFilterSnapshot()"
              placeholder="Filter"
              class="p-column-filter"
            />
          </template>
        </Column>

        <Column field="last_edit" header="Last Edit" :style="{ width: '180px' }" sortable :showFilterMenu="false">
          <template #body="slotProps">
            <span class="readonly-field">{{ slotProps.data.last_edit || '--' }}</span>
          </template>
          <template #filter>
            <Select
              v-model="filters.last_edit.value"
              @change="applyFilterSnapshot()"
              :options="uniqueLastEditValues"
              placeholder="All"
              class="p-column-filter"
              :showClear="true"
              filter
              :filterPlaceholder="'Search...'"
              @click.stop
            >
              <template #value="slotProps">
                <span v-if="slotProps.value === ''" class="empty-option">(Empty)</span>
                <span v-else>{{ slotProps.value || 'All' }}</span>
              </template>
              <template #option="slotProps">
                <span v-if="slotProps.option === ''" class="empty-option">(Empty)</span>
                <span v-else>{{ slotProps.option }}</span>
              </template>
            </Select>
          </template>
        </Column>

        <Column header="Actions" :style="{ width: '180px' }" frozen alignFrozen="right">
          <template #body="slotProps">
            <!-- Book button - shown when not booked by anyone -->
            <Button
              v-if="!slotProps.data.booked_by"
              label="Book"
              icon="pi pi-lock"
              @click.stop.prevent="bookAppointment(slotProps.data)"
              :loading="bookingIds.has(slotProps.data.id)"
              size="small"
              class="p-button-info"
            />

            <!-- Save and Cancel buttons - shown when booked by current user -->
            <div v-else-if="isEditableByCurrentUser(slotProps.data)" class="action-buttons">
              <Button
                label="Save"
                icon="pi pi-save"
                @click.stop.prevent="saveAppointment(slotProps.data)"
                :loading="savingIds.has(slotProps.data.id)"
                size="small"
                class="p-button-success"
              />
              <Button
                label="Cancel"
                icon="pi pi-times"
                @click.stop.prevent="cancelBooking(slotProps.data)"
                :loading="cancelingIds.has(slotProps.data.id)"
                size="small"
                class="p-button-secondary"
              />
            </div>

            <!-- Locked indicator - shown when booked by another user -->
            <div v-else class="locked-indicator">
              <i class="pi pi-lock" style="color: #ef4444;"></i>
              <span class="locked-text">Locked</span>
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- No Data Message -->
    <div v-else class="no-data">
      <Message severity="info" :closable="false">
        No appointments found for this date.
      </Message>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAppointmentStore } from '../stores/appointmentStore';
import dayjs from 'dayjs';
import Button from 'primevue/button';
import DatePicker from 'primevue/datepicker';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
	import InputText from 'primevue/inputtext';
	import Textarea from 'primevue/textarea';
import ProgressSpinner from 'primevue/progressspinner';
import Message from 'primevue/message';
	import Select from 'primevue/select';
	import { useToast } from 'primevue/usetoast';
	import { FilterMatchMode } from '@primevue/core/api';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

// Tooltip directive is registered globally in main.js

const router = useRouter();
const store = useAppointmentStore();
const toast = useToast();

// Calendar date (needs to be a Date object for PrimeVue DatePicker)
const calendarDate = ref(new Date());

// Track edited, saving, booking, and canceling appointments
const editedIds = ref(new Set());
const savingIds = ref(new Set());
const bookingIds = ref(new Set());
const cancelingIds = ref(new Set());

// Store original values when booking (for cancel functionality)
const originalValues = ref(new Map());

// Track currently focused field to prevent updates during typing
const focusedField = ref(null); // Format: "appointmentId_fieldName"

// Track last activity time for each appointment (for smart auto-unlock)
const lastActivityTime = ref(new Map()); // appointmentId -> timestamp

// Track which appointment IDs should be visible based on filter snapshot
const visibleAppointmentIds = ref(new Set());
// Track whether any filters are active
const hasActiveFilters = ref(false);

// Initialize filters for DataTable
	const filters = ref({
	  time: { value: null, matchMode: FilterMatchMode.EQUALS },
	  service: { value: null, matchMode: FilterMatchMode.EQUALS },
	  cwa: { value: null, matchMode: 'customEquals' },
	  pt_name: { value: null, matchMode: 'customEquals' },
	  rmsw: { value: null, matchMode: 'customEquals' },
	  ea: { value: null, matchMode: 'customEquals' },
	  new_fu: { value: null, matchMode: 'customEquals' },
	  remarks: { value: null, matchMode: FilterMatchMode.CONTAINS },
	  last_edit: { value: null, matchMode: 'customEquals' }
	});

	// Options for CWA filter
	const cwaFilterOptions = ['Yes', 'No'];

// Public holidays and disabled dates
const publicHolidays = ref([]);
const disabledDates = ref([]);

// MSW and EA lists for dropdowns
const mswList = ref([]);
const eaList = ref([]);

// Helpers for case-insensitive handling of New/FU values
const normalizeNewFu = (value) =>
	typeof value === 'string' ? value.trim().toLowerCase() : '';

const isNewValue = (value) => normalizeNewFu(value) === 'new';
const isFuValue = (value) => normalizeNewFu(value) === 'fu';

// Computed formatted date
const formattedSelectedDate = computed(() => {
  return dayjs(store.selectedDate).format('dddd, MMMM D, YYYY');
});

// Computed filtered appointments - only filters based on snapshot
const filteredAppointments = computed(() => {
  // If no filters are active, show all appointments
  if (!hasActiveFilters.value) {
    return store.appointments;
  }

  // Otherwise, only show appointments that were visible when filter was applied
  return store.appointments.filter(apt => visibleAppointmentIds.value.has(apt.id));
});

// Apply filters and create a snapshot of visible appointments
const applyFilterSnapshot = () => {
  // Check if any filters are active
	  const anyFilterActive =
	    (filters.value.time.value !== null && filters.value.time.value !== undefined) ||
	    (filters.value.service.value !== null && filters.value.service.value !== undefined) ||
	    (filters.value.cwa.value !== null && filters.value.cwa.value !== undefined) ||
	    (filters.value.pt_name.value !== null && filters.value.pt_name.value !== undefined) ||
	    (filters.value.rmsw.value !== null && filters.value.rmsw.value !== undefined) ||
	    (filters.value.ea.value !== null && filters.value.ea.value !== undefined) ||
	    (filters.value.new_fu.value !== null && filters.value.new_fu.value !== undefined) ||
	    (filters.value.remarks.value !== null && filters.value.remarks.value !== undefined && filters.value.remarks.value !== '') ||
	    (filters.value.last_edit.value !== null && filters.value.last_edit.value !== undefined);

  hasActiveFilters.value = anyFilterActive;

  // If no filters are active, clear the snapshot and show all
  if (!anyFilterActive) {
    visibleAppointmentIds.value.clear();
    return;
  }

  const filtered = store.appointments.filter(appointment => {
    // Check time filter
    if (filters.value.time.value !== null && filters.value.time.value !== undefined) {
      if (appointment.time !== filters.value.time.value) return false;
    }

	    // Check service filter
	    if (filters.value.service.value !== null && filters.value.service.value !== undefined) {
	      if (appointment.service !== filters.value.service.value) return false;
	    }

	    // Check CWA filter
	    if (filters.value.cwa.value !== null && filters.value.cwa.value !== undefined) {
	      const filterValue = filters.value.cwa.value; // 'Yes' or 'No'
	      const value = !!appointment.cwa;
	      if (filterValue === 'Yes' && !value) return false;
	      if (filterValue === 'No' && value) return false;
	    }

	    // Check pt_name filter
	    if (filters.value.pt_name.value !== null && filters.value.pt_name.value !== undefined) {
	      const value = appointment.pt_name;
	      const filterValue = filters.value.pt_name.value;
	      if (filterValue === '') {
	        if (value && value.trim() !== '') return false;
	      } else {
	        if (value !== filterValue) return false;
	      }
	    }

	    // Check rmsw filter
	    if (filters.value.rmsw.value !== null && filters.value.rmsw.value !== undefined) {
	      const value = appointment.rmsw;
	      const filterValue = filters.value.rmsw.value;
	      if (filterValue === '') {
	        if (value && value.trim() !== '') return false;
	      } else {
	        if (value !== filterValue) return false;
	      }
	    }

	    // Check ea filter
	    if (filters.value.ea.value !== null && filters.value.ea.value !== undefined) {
	      const value = appointment.ea;
	      const filterValue = filters.value.ea.value;
	      if (filterValue === '') {
	        if (value && value.trim() !== '') return false;
	      } else {
	        if (value !== filterValue) return false;
	      }
	    }

	    // Check new_fu filter
	    if (filters.value.new_fu.value !== null && filters.value.new_fu.value !== undefined) {
	      const value = appointment.new_fu;
	      const filterValue = filters.value.new_fu.value;
	      if (filterValue === '') {
	        if (value && value.trim() !== '') return false;
	      } else {
	        if (value !== filterValue) return false;
	      }
	    }

    // Check remarks filter (contains)
    if (filters.value.remarks.value !== null && filters.value.remarks.value !== undefined && filters.value.remarks.value !== '') {
      const value = appointment.remarks || '';
      const filterValue = filters.value.remarks.value;
      if (!value.toLowerCase().includes(filterValue.toLowerCase())) return false;
    }

    // Check last_edit filter
    if (filters.value.last_edit.value !== null && filters.value.last_edit.value !== undefined) {
      const value = appointment.last_edit;
      const filterValue = filters.value.last_edit.value;
      if (filterValue === '') {
        if (value && value.trim() !== '') return false;
      } else {
        if (value !== filterValue) return false;
      }
    }

    return true;
  });

  // Update the visible IDs set
  visibleAppointmentIds.value = new Set(filtered.map(apt => apt.id));
};

// Get unique time values for dropdown filter
const uniqueTimeValues = computed(() => {
  const times = store.appointments
    .map(apt => apt.time)
    .filter(time => time && time !== '--');
  return [...new Set(times)].sort();
});

// Get unique service values for dropdown filter
const uniqueServiceValues = computed(() => {
  const services = store.appointments
    .map(apt => apt.service)
    .filter(service => service && service !== '--');
  return [...new Set(services)].sort();
});

	// Get unique Pt Name values for dropdown filter
	const uniquePtNameValues = computed(() => {
	  const names = store.appointments
	    .map(apt => apt.pt_name)
	    .filter(name => name && name.trim() !== '');
	  return ['', ...new Set(names)].sort((a, b) => {
	    if (a === '') return -1;
	    if (b === '') return 1;
	    return a.localeCompare(b);
	  });
	});

	// Get unique RMSW values for dropdown filter
	const uniqueRmswValues = computed(() => {
	  const values = store.appointments
	    .map(apt => apt.rmsw)
	    .filter(v => v && v.trim() !== '');
	  return ['', ...new Set(values)].sort((a, b) => {
	    if (a === '') return -1;
	    if (b === '') return 1;
	    return a.localeCompare(b);
	  });
	});

	// Get unique EA values for dropdown filter
	const uniqueEaValues = computed(() => {
	  const values = store.appointments
	    .map(apt => apt.ea)
	    .filter(v => v && v.trim() !== '');
	  return ['', ...new Set(values)].sort((a, b) => {
	    if (a === '') return -1;
	    if (b === '') return 1;
	    return a.localeCompare(b);
	  });
	});

	// Get unique New/FU values for dropdown filter
	const uniqueNewFuValues = computed(() => {
	  const values = store.appointments
	    .map(apt => apt.new_fu)
	    .filter(v => v && v.trim() !== '');
	  return ['', ...new Set(values)].sort((a, b) => {
	    if (a === '') return -1;
	    if (b === '') return 1;
	    return a.localeCompare(b);
	  });
	});

// Get unique last edit values for dropdown filter
const uniqueLastEditValues = computed(() => {
  const lastEdits = store.appointments
    .map(apt => apt.last_edit)
    .filter(lastEdit => lastEdit && lastEdit.trim() !== '');
  return ['', ...new Set(lastEdits)].sort((a, b) => {
    if (a === '') return -1;
    if (b === '') return 1;
    return a.localeCompare(b);
  });
});

// Navigate to admin page
const goToAdmin = () => {
  router.push('/admin');
};

// Check if appointment is editable by current user
const isEditableByCurrentUser = (appointment) => {
  return appointment.booked_by === store.userId;
};

// Get row class based on timeslot for color coding
const getRowClass = (data) => {
  const classes = [];

  // Add saving indicator
  if (savingIds.value.has(data.id)) {
    classes.push('row-saving');
  }

  // Add booking indicator
  if (bookingIds.value.has(data.id)) {
    classes.push('row-booking');
  }

  // Add timeslot color
  if (data.time) {
    const timeHash = data.time.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorIndex = timeHash % 8; // 8 different color schemes
    classes.push(`timeslot-color-${colorIndex}`);
  }

  return classes.join(' ');
};

// Watch for store date changes and update calendar
watch(() => store.selectedDate, (newDate) => {
  calendarDate.value = dayjs(newDate).toDate();
  // Clear filter snapshot when date changes
  visibleAppointmentIds.value.clear();
  hasActiveFilters.value = false;
});

// Fetch public holidays from Firestore
const fetchPublicHolidays = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'public_holidays'));
    const holidays = [];
    querySnapshot.forEach((doc) => {
      holidays.push(doc.id); // Document ID is the date string
    });
    publicHolidays.value = holidays;
    generateDisabledDates();
  } catch (error) {
    console.error('Error fetching public holidays:', error);
  }
};

// Fetch MSW list from Firestore
const fetchMswList = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'msw'));
    const list = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data().name);
    });
    mswList.value = list.sort();
    console.log(`Loaded ${mswList.value.length} MSW entries for dropdown`);
  } catch (error) {
    console.error('Error fetching MSW list:', error);
    // Set empty list on error so dropdown still works with just '--'
    mswList.value = [];
  }
};

// Fetch EA list from Firestore
const fetchEaList = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'ea'));
    const list = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data().name);
    });
    eaList.value = list.sort();
    console.log(`Loaded ${eaList.value.length} EA entries for dropdown`);
  } catch (error) {
    console.error('Error fetching EA list:', error);
    // Set empty list on error so dropdown still works with just '--'
    eaList.value = [];
  }
};

// Computed dropdown options for RMSW (with '--' as first option)
const rmswDropdownOptions = computed(() => {
  return ['--', ...mswList.value];
});

// Computed dropdown options for EA (with '--' as first option)
const eaDropdownOptions = computed(() => {
  return ['--', ...eaList.value];
});

// Generate disabled dates (Saturdays, Sundays, and public holidays)
const generateDisabledDates = () => {
  const disabled = [];

  // Generate dates for the next 2 years to cover calendar range
  const startDate = dayjs().subtract(1, 'year');
  const endDate = dayjs().add(2, 'year');
  let currentDate = startDate;

  while (currentDate.isBefore(endDate)) {
    const dayOfWeek = currentDate.day(); // 0 = Sunday, 6 = Saturday
    const dateStr = currentDate.format('YYYY-MM-DD');

    // Disable Saturdays (6) and Sundays (0)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      disabled.push(currentDate.toDate());
    }

    // Disable public holidays
    if (publicHolidays.value.includes(dateStr)) {
      disabled.push(currentDate.toDate());
    }

    currentDate = currentDate.add(1, 'day');
  }

  disabledDates.value = disabled;
};

// Handle calendar date selection
const onDateSelect = (event) => {
  const selectedDateStr = dayjs(event).format('YYYY-MM-DD');
  store.setDate(selectedDateStr);
  editedIds.value.clear();
  // Clear filter snapshot when changing dates
  visibleAppointmentIds.value.clear();
  hasActiveFilters.value = false;
};

// Mark appointment as edited and update last activity time
const markAsEdited = (appointmentId) => {
  editedIds.value.add(appointmentId);
  const now = Date.now();
  lastActivityTime.value.set(appointmentId, now);

  // Store in localStorage for persistence and access by store
  localStorage.setItem(`activity_${appointmentId}`, now.toString());
  console.log(`Activity recorded for ${appointmentId} at ${new Date().toLocaleTimeString()}`);
};

// Track field focus to prevent updates during typing
const handleFieldFocus = (appointmentId, fieldName) => {
  focusedField.value = `${appointmentId}_${fieldName}`;
  const now = Date.now();
  lastActivityTime.value.set(appointmentId, now);

  // Store in localStorage for persistence and access by store
  localStorage.setItem(`activity_${appointmentId}`, now.toString());
  console.log('Field focused:', focusedField.value);
};

const handleFieldBlur = (appointmentId, fieldName) => {
  const key = `${appointmentId}_${fieldName}`;
  if (focusedField.value === key) {
    focusedField.value = null;
    console.log('Field blurred:', key);
  }
  // NOTE: We do NOT update activity time on blur - only on focus and input
  // This ensures that when user clicks away, the idle timer starts counting
};

// Get last activity time for an appointment (for auto-unlock logic)
const getLastActivityTime = (appointmentId) => {
  return lastActivityTime.value.get(appointmentId) || null;
};

	// ID/Phone fields have been removed in the new layout, so no special formatters are needed.

// Book appointment
const bookAppointment = async (appointment) => {
  // Prevent multiple simultaneous bookings
  if (bookingIds.value.has(appointment.id)) {
    console.log('Booking already in progress for:', appointment.id);
    return;
  }

  // Check if already booked
  if (appointment.booked_by) {
    console.log('Appointment already booked by:', appointment.booked_by);
    toast.add({
      severity: 'warn',
      summary: 'Already Booked',
      detail: 'This appointment is already booked',
      life: 3000
    });
    return;
  }

  console.log('Booking appointment:', appointment.id);
  bookingIds.value.add(appointment.id);

  try {
    const result = await store.bookAppointment(appointment.id);

    if (result.success) {
      // Initialize activity time when booking
      const now = Date.now();
      lastActivityTime.value.set(appointment.id, now);
      localStorage.setItem(`activity_${appointment.id}`, now.toString());
      console.log(`Activity time initialized for ${appointment.id}`);

      // Save original values for cancel functionality
	      const original = {
	        cwa: !!appointment.cwa,
	        pt_name: appointment.pt_name,
	        rmsw: appointment.rmsw,
	        ea: appointment.ea,
	        new_fu: appointment.new_fu,
	        remarks: appointment.remarks
	      };
      originalValues.value.set(appointment.id, original);

      // Also store in localStorage for auto-unlock to access
      localStorage.setItem(`original_${appointment.id}`, JSON.stringify(original));
      console.log(`Original values saved for ${appointment.id}`);

      toast.add({
        severity: 'success',
        summary: 'Booked',
        detail: 'Appointment booked for editing',
        life: 3000
      });
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to book appointment',
        life: 3000
      });
    }
  } catch (error) {
    console.error('Error in bookAppointment:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'An error occurred while booking',
      life: 3000
    });
  } finally {
    bookingIds.value.delete(appointment.id);
  }
};

// Cancel booking
const cancelBooking = async (appointment) => {
  // Prevent multiple simultaneous cancellations
  if (cancelingIds.value.has(appointment.id)) {
    console.log('Cancellation already in progress for:', appointment.id);
    return;
  }

  // Check if user can cancel
  if (!isEditableByCurrentUser(appointment)) {
    console.log('Cannot cancel - not editable by current user');
    toast.add({
      severity: 'warn',
      summary: 'Cannot Cancel',
      detail: 'You cannot cancel this booking',
      life: 3000
    });
    return;
  }

  console.log('Cancelling booking:', appointment.id);
  cancelingIds.value.add(appointment.id);

  try {
    // Get original values to restore
    const original = originalValues.value.get(appointment.id);

    // Pass original values to store so it can restore them in the database
    const result = await store.cancelBooking(appointment.id, original);

    if (result.success) {
      // Clean up
      originalValues.value.delete(appointment.id);
      editedIds.value.delete(appointment.id);
      lastActivityTime.value.delete(appointment.id);
      localStorage.removeItem(`activity_${appointment.id}`);
      localStorage.removeItem(`original_${appointment.id}`);

      toast.add({
        severity: 'info',
        summary: 'Cancelled',
        detail: 'Booking cancelled',
        life: 3000
      });
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to cancel booking',
        life: 3000
      });
    }
  } catch (error) {
    console.error('Error in cancelBooking:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'An error occurred while cancelling',
      life: 3000
    });
  } finally {
    cancelingIds.value.delete(appointment.id);
  }
};

// Save appointment
const saveAppointment = async (appointment) => {
  // Prevent multiple simultaneous saves
  if (savingIds.value.has(appointment.id)) {
    console.log('Save already in progress for:', appointment.id);
    return;
  }

  // Check if user can save
  if (!isEditableByCurrentUser(appointment)) {
    console.log('Cannot save - not editable by current user');
    toast.add({
      severity: 'warn',
      summary: 'Cannot Save',
      detail: 'You cannot save this appointment',
      life: 3000
    });
    return;
  }

  console.log('Saving appointment:', appointment.id);
  savingIds.value.add(appointment.id);

  try {
    // Format ID and Phone fields before saving
	    const updates = {
	      cwa: !!appointment.cwa,
	      pt_name: appointment.pt_name || '',
	      rmsw: appointment.rmsw || '',
	      ea: appointment.ea || '',
	      new_fu: appointment.new_fu || '',
	      remarks: appointment.remarks || ''
	    };

    const result = await store.saveAppointment(appointment.id, updates);

    if (result.success) {
      // Clean up original values since we saved
      originalValues.value.delete(appointment.id);

      editedIds.value.delete(appointment.id);
      lastActivityTime.value.delete(appointment.id);
      localStorage.removeItem(`activity_${appointment.id}`);
      localStorage.removeItem(`original_${appointment.id}`);

      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Appointment saved successfully',
        life: 3000
      });
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to save appointment',
        life: 3000
      });
    }
  } catch (error) {
    console.error('Error in saveAppointment:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'An error occurred while saving',
      life: 3000
    });
  } finally {
    savingIds.value.delete(appointment.id);
  }
};

// Initialize on mount
onMounted(() => {
  store.subscribeToAppointments();
  fetchPublicHolidays();
  fetchMswList();
  fetchEaList();
});

// Cleanup on unmount
onUnmounted(() => {
  store.cleanup();
});
</script>

<style scoped>
.appointment-view {
  padding: 0.5rem;
  max-width: 100%;
  margin: 0 auto;
  width: 100%;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
  padding: 2rem 1rem;
  background: linear-gradient(135deg, var(--app-primary) 0%, var(--app-primary-alt) 100%);
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(15, 118, 110, 0.35);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.header:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 40px rgba(102, 126, 234, 0.4);
}

.header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);
  pointer-events: none;
}

.header h1 {
  color: #ffffff;
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.5px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.header-icon {
  font-size: 2.5rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.header-subtitle {
  color: rgba(255, 255, 255, 0.95);
  font-size: 1.1rem;
  font-weight: 400;
  letter-spacing: 1px;
  text-transform: uppercase;
  position: relative;
  z-index: 1;
}

.admin-hint {
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.9rem;
  margin-top: 0.5rem;
  font-style: italic;
  position: relative;
  z-index: 1;
}

.date-navigation {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.calendar-container {
  display: flex;
  justify-content: center;
}

.selected-date {
  text-align: center;
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f9fafb 0%, var(--app-primary-soft) 100%);
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.selected-date h2 {
  color: #2c3e50;
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
}

.date-label {
  font-size: 1rem;
  font-weight: 400;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.date-value {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--app-primary) 0%, var(--app-primary-alt) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.appointments-table {
  margin-top: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
  width: 100%;
}

.newfu-toggle {
	display: flex;
	gap: 0.25rem;
}

.newfu-button {
	/* base (unselected) state: light, outlined look */
	border-radius: 999px;
	padding: 0.15rem 0.6rem;
	font-size: 0.75rem;
	background-color: #ffffff;
	color: #374151;
	border: 1px solid #d1d5db;
}

.newfu-button--new-active {
	/* New selected: green background, white font */
	background-color: #16a34a !important; /* green-600 */
	color: #ffffff !important;
	border-color: #15803d !important;
	box-shadow: 0 0 0 1px rgba(22, 163, 74, 0.6);
}

.newfu-button--fu-active {
	/* FU selected: dark yellow background, dark font */
	background-color: #e4f30d !important; /* amber-700 */
	color: #111827 !important; /* near-black */
	border-color: #b1ae02 !important;
	box-shadow: 0 0 0 1px rgba(217, 119, 6, 0.6);
}

.readonly-field {
  display: block;
  padding: 0.25rem;
  color: #495057;
  font-weight: 500;
  font-size: 0.85rem;
}

.editable-input {
  width: 100%;
}

.no-data {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
  background-color: var(--app-primary-alt);
  color: white;
  font-weight: 600;
  padding: 0.4rem 0.3rem;
  font-size: 0.85rem;
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 0.25rem 0.3rem;
}

:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background-color: #f8f9fa;
}

:deep(.p-inputtext),
:deep(.p-inputtextarea) {
  font-size: 0.85rem;
  padding: 0.3rem 0.4rem;
}

:deep(.p-button-sm) {
  padding: 0.3rem 0.6rem;
  font-size: 0.8rem;
}

.action-buttons {
  display: flex;
  gap: 0.3rem;
  flex-wrap: wrap;
}

.action-buttons .p-button {
  flex: 1;
  min-width: 70px;
}

.locked-indicator {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: #ef4444;
  font-size: 0.85rem;
  font-weight: 500;
}

.locked-text {
  font-size: 0.8rem;
}

:deep(.p-inputtext:disabled),
:deep(.p-inputtextarea:disabled) {
  background-color: #f3f4f6;
  opacity: 0.7;
  cursor: not-allowed;
}

/* Row state indicators */
:deep(.row-saving) {
  position: relative;
  opacity: 0.7;
  pointer-events: none;
}

:deep(.row-saving::after) {
  content: 'Saving...';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(34, 197, 94, 0.95);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 600;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

:deep(.row-booking) {
  position: relative;
  opacity: 0.7;
}

:deep(.row-booking::after) {
  content: 'Booking...';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(37, 99, 235, 0.95);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 600;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* Timeslot color coding - 8 different color schemes */
:deep(.timeslot-color-0) {
  background-color: #fef3c7 !important;
}

:deep(.timeslot-color-1) {
  background-color: #dbeafe !important;
}

:deep(.timeslot-color-2) {
  background-color: #fce7f3 !important;
}

:deep(.timeslot-color-3) {
  background-color: #d1fae5 !important;
}

:deep(.timeslot-color-4) {
  background-color: #e0e7ff !important;
}

:deep(.timeslot-color-5) {
  background-color: #fce4ec !important;
}

:deep(.timeslot-color-6) {
  background-color: #e1f5fe !important;
}

:deep(.timeslot-color-7) {
  background-color: #f3e5f5 !important;
}

:deep(.timeslot-color-0:hover),
:deep(.timeslot-color-1:hover),
:deep(.timeslot-color-2:hover),
:deep(.timeslot-color-3:hover),
:deep(.timeslot-color-4:hover),
:deep(.timeslot-color-5:hover),
:deep(.timeslot-color-6:hover),
:deep(.timeslot-color-7:hover) {
  filter: brightness(0.95);
}

/* Invalid input styling */
.p-invalid {
  border-color: #ef4444 !important;
  border-width: 2px !important;
}

.p-invalid:focus {
  outline: none;
  box-shadow: 0 0 0 0.2rem rgba(239, 68, 68, 0.25) !important;
}

/* Filter input styling */
:deep(.p-column-filter) {
  width: 100%;
  font-size: 0.75rem;
  padding: 0.25rem 0.35rem;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
}

:deep(.p-column-filter:focus) {
	border-color: var(--app-primary-alt);
	box-shadow: 0 0 0 0.1rem rgba(37, 99, 235, 0.25);
}

/* Select dropdown filter styling */
:deep(.p-column-filter.p-select) {
  padding: 0;
}

:deep(.p-column-filter.p-select .p-select-label) {
  font-size: 0.75rem;
  padding: 0.25rem 0.35rem;
}

:deep(.p-column-filter.p-select .p-select-dropdown) {
  width: 1.5rem;
}

:deep(.p-select-overlay .p-select-option) {
  font-size: 0.75rem;
  padding: 0.3rem 0.5rem;
}

/* Empty option styling */
.empty-option {
  font-style: italic;
  color: #6c757d;
  opacity: 0.8;
}

/* Prevent Select overlay from interfering with underlying elements */
:deep(.p-select-overlay) {
  z-index: 9999 !important;
  pointer-events: auto !important;
}

/* Ensure filter cells stop event propagation */
:deep(.p-datatable .p-datatable-thead > tr:last-child > th) {
  position: relative;
  isolation: isolate;
}

/* Sort icons styling */
:deep(.p-datatable .p-sortable-column .p-sortable-column-icon) {
  color: rgba(255, 255, 255, 0.7);
  margin-left: 0.25rem;
}

:deep(.p-datatable .p-sortable-column:hover .p-sortable-column-icon) {
  color: rgba(255, 255, 255, 1);
}

:deep(.p-datatable .p-sortable-column.p-highlight .p-sortable-column-icon) {
  color: #ffffff;
}

/* Filter row styling */
:deep(.p-datatable .p-datatable-thead > tr:last-child > th) {
	background-color: var(--app-primary-soft);
  padding: 0.3rem 0.3rem;
}

:deep(.p-datatable .p-datatable-thead > tr:first-child > th) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
}
</style>

