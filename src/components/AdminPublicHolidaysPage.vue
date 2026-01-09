<template>
  <div class="admin-page">
    <div class="admin-header">
      <Button 
        label="Back to Admin Panel" 
        icon="pi pi-arrow-left" 
        @click="goBack"
        class="p-button-text"
      />
      <h1>Public Holidays Management</h1>
    </div>

    <div class="admin-content">
      <Card class="list-card">
        <template #title>
          <div class="card-title">
            <i class="pi pi-calendar-times"></i>
            Public Holidays
          </div>
        </template>
        <template #content>
          <Message severity="info" :closable="false" class="info-message">
            Manage public holidays that will be disabled in the calendar. Only dates in YYYY-MM-DD format are allowed.
          </Message>

          <!-- Add New Holiday -->
          <div class="add-section">
            <h3>Add New Public Holiday</h3>
            <div class="add-form">
              <InputText
                v-model="newHolidayDate"
                placeholder="YYYY-MM-DD (e.g., 2026-12-25)"
                class="date-input"
                @keyup.enter="addHoliday"
              />
              <InputText
                v-model="newHolidayDescription"
                placeholder="Description (optional)"
                class="description-input"
                @keyup.enter="addHoliday"
              />
              <Button
                label="Add"
                icon="pi pi-plus"
                @click="addHoliday"
                :disabled="!isValidDate(newHolidayDate)"
                class="p-button-success"
              />
            </div>
            <small v-if="newHolidayDate && !isValidDate(newHolidayDate)" class="error-text">
              Invalid date format. Use YYYY-MM-DD (e.g., 2026-12-25)
            </small>
          </div>

          <Divider />

          <!-- Holidays List with Filters -->
          <div class="list-section">
            <div class="filter-section">
              <h3>Public Holidays ({{ filteredHolidays.length }} entries)</h3>
              <div class="filters">
                <Select
                  v-model="filterYear"
                  :options="availableYears"
                  placeholder="All Years"
                  :showClear="true"
                  class="filter-select"
                />
                <Select
                  v-model="filterMonth"
                  :options="availableMonths"
                  placeholder="All Months"
                  :showClear="true"
                  class="filter-select"
                />
              </div>
            </div>
            <DataTable
              :value="filteredHolidays"
              :loading="loading"
              class="holidays-table"
              :paginator="true"
              :rows="10"
              sortField="date"
              :sortOrder="1"
            >
              <Column field="date" header="Date" sortable>
                <template #body="slotProps">
                  <InputText
                    v-if="editingId === slotProps.data.id"
                    v-model="editingDate"
                    class="edit-input"
                    @keyup.enter="saveEdit(slotProps.data.id)"
                  />
                  <span v-else>{{ slotProps.data.date }}</span>
                </template>
              </Column>
              <Column field="description" header="Description" sortable>
                <template #body="slotProps">
                  <InputText
                    v-if="editingId === slotProps.data.id"
                    v-model="editingDescription"
                    class="edit-input"
                    @keyup.enter="saveEdit(slotProps.data.id)"
                  />
                  <span v-else>{{ slotProps.data.description || '-' }}</span>
                </template>
              </Column>
              <Column header="Actions" :style="{ width: '200px' }">
                <template #body="slotProps">
                  <div class="action-buttons">
                    <template v-if="editingId === slotProps.data.id">
                      <Button
                        icon="pi pi-check"
                        class="p-button-success p-button-sm"
                        @click="saveEdit(slotProps.data.id)"
                        v-tooltip.top="'Save'"
                      />
                      <Button
                        icon="pi pi-times"
                        class="p-button-secondary p-button-sm"
                        @click="cancelEdit"
                        v-tooltip.top="'Cancel'"
                      />
                    </template>
                    <template v-else>
                      <Button
                        icon="pi pi-pencil"
                        class="p-button-info p-button-sm"
                        @click="startEdit(slotProps.data)"
                        v-tooltip.top="'Edit'"
                      />
                      <Button
                        icon="pi pi-trash"
                        class="p-button-danger p-button-sm"
                        @click="confirmDelete(slotProps.data)"
                        v-tooltip.top="'Delete'"
                      />
                    </template>
                  </div>
                </template>
              </Column>
            </DataTable>
          </div>
        </template>
      </Card>
    </div>

    <!-- Delete Confirmation Dialog -->
    <Dialog
      v-model:visible="deleteDialogVisible"
      header="Confirm Delete"
      :modal="true"
      :style="{ width: '450px' }"
    >
      <p>Are you sure you want to delete the holiday on <strong>{{ holidayToDelete?.date }}</strong>?</p>
      <template #footer>
        <Button label="Cancel" icon="pi pi-times" @click="deleteDialogVisible = false" class="p-button-text" />
        <Button label="Delete" icon="pi pi-trash" @click="deleteHoliday" class="p-button-danger" />
      </template>
    </Dialog>

    <Toast />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { db } from '../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Card from 'primevue/card';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Message from 'primevue/message';
import Divider from 'primevue/divider';
import Dialog from 'primevue/dialog';
import Toast from 'primevue/toast';

const router = useRouter();
const toast = useToast();

// State
const holidaysList = ref([]);
const loading = ref(false);
const newHolidayDate = ref('');
const newHolidayDescription = ref('');
const editingId = ref(null);
const editingDate = ref('');
const editingDescription = ref('');
const deleteDialogVisible = ref(false);
const holidayToDelete = ref(null);
const filterYear = ref(null);
const filterMonth = ref(null);

// Validate date format YYYY-MM-DD
const isValidDate = (dateStr) => {
  if (!dateStr) return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date) && dateStr === date.toISOString().split('T')[0];
};

// Get available years from holidays list
const availableYears = computed(() => {
  const years = new Set();
  holidaysList.value.forEach(holiday => {
    const year = holiday.date.split('-')[0];
    years.add(year);
  });
  return Array.from(years).sort();
});

// Get available months
const availableMonths = computed(() => {
  return [
    { label: 'January', value: '01' },
    { label: 'February', value: '02' },
    { label: 'March', value: '03' },
    { label: 'April', value: '04' },
    { label: 'May', value: '05' },
    { label: 'June', value: '06' },
    { label: 'July', value: '07' },
    { label: 'August', value: '08' },
    { label: 'September', value: '09' },
    { label: 'October', value: '10' },
    { label: 'November', value: '11' },
    { label: 'December', value: '12' }
  ];
});

// Filter holidays by year and month
const filteredHolidays = computed(() => {
  let filtered = [...holidaysList.value];

  if (filterYear.value) {
    filtered = filtered.filter(h => h.date.startsWith(filterYear.value));
  }

  if (filterMonth.value) {
    filtered = filtered.filter(h => {
      const month = h.date.split('-')[1];
      return month === filterMonth.value;
    });
  }

  return filtered;
});

// Navigate back to admin panel
const goBack = () => {
  router.push('/admin');
};

// Load holidays list from Firestore
const loadHolidaysList = async () => {
  loading.value = true;
  try {
    const querySnapshot = await getDocs(collection(db, 'public_holidays'));
    holidaysList.value = [];
    querySnapshot.forEach((docSnap) => {
      holidaysList.value.push({
        id: docSnap.id,
        date: docSnap.data().date || docSnap.id,
        description: docSnap.data().description || ''
      });
    });
    holidaysList.value.sort((a, b) => a.date.localeCompare(b.date));
    console.log(`Loaded ${holidaysList.value.length} public holidays`);
  } catch (error) {
    console.error('Error loading public holidays:', error);

    if (error.code === 'permission-denied') {
      toast.add({
        severity: 'error',
        summary: 'Permission Denied',
        detail: 'Unable to access public holidays. Please check Firestore rules.',
        life: 5000
      });
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: `Failed to load public holidays: ${error.message}`,
        life: 5000
      });
    }
  } finally {
    loading.value = false;
  }
};

// Add new holiday
const addHoliday = async () => {
  if (!isValidDate(newHolidayDate.value)) {
    toast.add({
      severity: 'error',
      summary: 'Invalid Date',
      detail: 'Please enter a valid date in YYYY-MM-DD format',
      life: 3000
    });
    return;
  }

  try {
    // Use the date as the document ID
    const docRef = doc(db, 'public_holidays', newHolidayDate.value);
    await setDoc(docRef, {
      date: newHolidayDate.value,
      description: newHolidayDescription.value || 'Public Holiday',
      createdAt: new Date().toISOString()
    });

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Public holiday added successfully',
      life: 3000
    });

    newHolidayDate.value = '';
    newHolidayDescription.value = '';
    await loadHolidaysList();
  } catch (error) {
    console.error('Error adding holiday:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to add public holiday',
      life: 3000
    });
  }
};

// Start editing a holiday
const startEdit = (holiday) => {
  editingId.value = holiday.id;
  editingDate.value = holiday.date;
  editingDescription.value = holiday.description;
};

// Cancel editing
const cancelEdit = () => {
  editingId.value = null;
  editingDate.value = '';
  editingDescription.value = '';
};

// Save edited holiday
const saveEdit = async (oldId) => {
  if (!isValidDate(editingDate.value)) {
    toast.add({
      severity: 'error',
      summary: 'Invalid Date',
      detail: 'Please enter a valid date in YYYY-MM-DD format',
      life: 3000
    });
    return;
  }

  try {
    // If date changed, delete old document and create new one
    if (editingDate.value !== oldId) {
      await deleteDoc(doc(db, 'public_holidays', oldId));
    }

    // Create/update document with new date as ID
    const docRef = doc(db, 'public_holidays', editingDate.value);
    await setDoc(docRef, {
      date: editingDate.value,
      description: editingDescription.value || 'Public Holiday',
      createdAt: new Date().toISOString()
    });

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Public holiday updated successfully',
      life: 3000
    });

    cancelEdit();
    await loadHolidaysList();
  } catch (error) {
    console.error('Error updating holiday:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update public holiday',
      life: 3000
    });
  }
};

// Confirm delete
const confirmDelete = (holiday) => {
  holidayToDelete.value = holiday;
  deleteDialogVisible.value = true;
};

// Delete holiday
const deleteHoliday = async () => {
  if (!holidayToDelete.value) return;

  try {
    await deleteDoc(doc(db, 'public_holidays', holidayToDelete.value.id));

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Public holiday deleted successfully',
      life: 3000
    });

    deleteDialogVisible.value = false;
    holidayToDelete.value = null;
    await loadHolidaysList();
  } catch (error) {
    console.error('Error deleting holiday:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to delete public holiday',
      life: 3000
    });
  }
};

// Load holidays on mount
onMounted(() => {
  loadHolidaysList();
});
</script>

<style scoped>
.admin-page {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.admin-header {
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.admin-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.admin-content {
  margin-top: 1rem;
}

.list-card {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  color: #2c3e50;
}

.card-title i {
  color: #667eea;
}

.info-message {
  margin-bottom: 1.5rem;
}

.add-section {
  margin-bottom: 1.5rem;
}

.add-section h3 {
  margin-bottom: 1rem;
  color: #2c3e50;
}

.add-form {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.date-input {
  flex: 1;
  max-width: 250px;
}

.description-input {
  flex: 2;
}

.error-text {
  color: #dc2626;
  display: block;
  margin-top: 0.5rem;
}

.list-section {
  margin-top: 1.5rem;
}

.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.filter-section h3 {
  margin: 0;
  color: #2c3e50;
}

.filters {
  display: flex;
  gap: 0.75rem;
}

.filter-select {
  min-width: 150px;
}

.holidays-table {
  margin-top: 1rem;
}

.edit-input {
  width: 100%;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}
</style>

