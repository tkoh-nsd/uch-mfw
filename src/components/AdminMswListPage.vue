<template>
  <div class="admin-page">
    <div class="admin-header">
      <Button 
        label="Back to Admin Panel" 
        icon="pi pi-arrow-left" 
        @click="goBack"
        class="p-button-text"
      />
      <h1>MSW List Management</h1>
    </div>

    <div class="admin-content">
      <Card class="list-card">
        <template #title>
          <div class="card-title">
            <i class="pi pi-users"></i>
            Medical Social Workers
          </div>
        </template>
        <template #content>
          <Message severity="info" :closable="false" class="info-message">
            Manage the list of Medical Social Workers. This list is used in the RMSW dropdown field in the appointment view.
          </Message>

          <!-- Add New MSW -->
          <div class="add-section">
            <h3>Add New MSW</h3>
            <div class="add-form">
              <InputText
                v-model="newMswName"
                placeholder="Enter MSW name"
                class="name-input"
                @keyup.enter="addMsw"
              />
              <Button
                label="Add"
                icon="pi pi-plus"
                @click="addMsw"
                :disabled="!newMswName.trim()"
                class="p-button-success"
              />
            </div>
          </div>

          <Divider />

          <!-- Import from Excel -->
          <div class="import-section">
            <h3>Import from Excel</h3>
            <p class="import-description">
              Upload an Excel file with MSW names. The file should have a single column with header "Name".
            </p>
            <div class="import-form">
              <FileUpload
                ref="fileUploader"
                mode="basic"
                accept=".xlsx,.xls"
                :maxFileSize="1000000"
                :auto="false"
                chooseLabel="Choose Excel File"
                @select="onFileSelect"
                class="file-upload"
              />
              <Button
                v-if="selectedFile"
                label="Import"
                icon="pi pi-upload"
                @click="importFromExcel"
                :loading="importing"
                class="p-button-info"
              />
            </div>
          </div>

          <Divider />

          <!-- MSW List -->
          <div class="list-section">
            <h3>Current MSW List ({{ mswList.length }} entries)</h3>
            <DataTable
              :value="mswList"
              :loading="loading"
              class="msw-table"
              :paginator="true"
              :rows="10"
              sortField="name"
              :sortOrder="1"
            >
              <Column field="name" header="Name" sortable>
                <template #body="slotProps">
                  <InputText
                    v-if="editingId === slotProps.data.id"
                    v-model="editingName"
                    class="edit-input"
                    @keyup.enter="saveEdit(slotProps.data.id)"
                  />
                  <span v-else>{{ slotProps.data.name }}</span>
                </template>
              </Column>
              <Column header="Actions" style="width: 200px">
                <template #body="slotProps">
                  <div class="action-buttons">
                    <template v-if="editingId === slotProps.data.id">
                      <Button
                        icon="pi pi-check"
                        size="small"
                        class="p-button-success p-button-sm"
                        @click="saveEdit(slotProps.data.id)"
                      />
                      <Button
                        icon="pi pi-times"
                        size="small"
                        class="p-button-secondary p-button-sm"
                        @click="cancelEdit"
                      />
                    </template>
                    <template v-else>
                      <Button
                        icon="pi pi-pencil"
                        size="small"
                        class="p-button-info p-button-sm"
                        @click="startEdit(slotProps.data)"
                      />
                      <Button
                        icon="pi pi-trash"
                        size="small"
                        class="p-button-danger p-button-sm"
                        @click="confirmDelete(slotProps.data)"
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
      <p>Are you sure you want to delete "{{ itemToDelete?.name }}"?</p>
      <template #footer>
        <Button label="Cancel" icon="pi pi-times" @click="deleteDialogVisible = false" class="p-button-text" />
        <Button label="Delete" icon="pi pi-trash" @click="deleteMsw" class="p-button-danger" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Message from 'primevue/message';
import InputText from 'primevue/inputtext';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Divider from 'primevue/divider';
import FileUpload from 'primevue/fileupload';
import Dialog from 'primevue/dialog';
import { useToast } from 'primevue/usetoast';
import * as XLSX from 'xlsx';

const router = useRouter();
const toast = useToast();

const mswList = ref([]);
const loading = ref(false);
const newMswName = ref('');
const editingId = ref(null);
const editingName = ref('');
const deleteDialogVisible = ref(false);
const itemToDelete = ref(null);
const selectedFile = ref(null);
const fileUploader = ref(null);
const importing = ref(false);

const goBack = () => {
  router.push('/admin');
};

// Load MSW list from Firestore
const loadMswList = async () => {
  loading.value = true;
  try {
    const querySnapshot = await getDocs(collection(db, 'msw'));
    mswList.value = [];
    querySnapshot.forEach((doc) => {
      mswList.value.push({
        id: doc.id,
        name: doc.data().name
      });
    });
    mswList.value.sort((a, b) => a.name.localeCompare(b.name));

    // Only show message if there's an actual error, not when list is empty
    console.log(`Loaded ${mswList.value.length} MSW entries`);
  } catch (error) {
    console.error('Error loading MSW list:', error);

    // Check if it's a permission error
    if (error.code === 'permission-denied') {
      toast.add({
        severity: 'error',
        summary: 'Permission Denied',
        detail: 'Unable to access MSW list. Please check Firestore rules.',
        life: 5000
      });
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: `Failed to load MSW list: ${error.message}`,
        life: 5000
      });
    }
  } finally {
    loading.value = false;
  }
};

// Add new MSW
const addMsw = async () => {
  const name = newMswName.value.trim();
  if (!name) return;

  try {
    await addDoc(collection(db, 'msw'), { name });
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'MSW added successfully',
      life: 3000
    });
    newMswName.value = '';
    await loadMswList();
  } catch (error) {
    console.error('Error adding MSW:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to add MSW',
      life: 3000
    });
  }
};

// Start editing
const startEdit = (item) => {
  editingId.value = item.id;
  editingName.value = item.name;
};

// Cancel editing
const cancelEdit = () => {
  editingId.value = null;
  editingName.value = '';
};

// Save edit
const saveEdit = async (id) => {
  const name = editingName.value.trim();
  if (!name) return;

  try {
    await updateDoc(doc(db, 'msw', id), { name });
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'MSW updated successfully',
      life: 3000
    });
    editingId.value = null;
    editingName.value = '';
    await loadMswList();
  } catch (error) {
    console.error('Error updating MSW:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update MSW',
      life: 3000
    });
  }
};

// Confirm delete
const confirmDelete = (item) => {
  itemToDelete.value = item;
  deleteDialogVisible.value = true;
};

// Delete MSW
const deleteMsw = async () => {
  if (!itemToDelete.value) return;

  try {
    await deleteDoc(doc(db, 'msw', itemToDelete.value.id));
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'MSW deleted successfully',
      life: 3000
    });
    deleteDialogVisible.value = false;
    itemToDelete.value = null;
    await loadMswList();
  } catch (error) {
    console.error('Error deleting MSW:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to delete MSW',
      life: 3000
    });
  }
};

// File selection
const onFileSelect = (event) => {
  selectedFile.value = event.files[0];
};

// Import from Excel
const importFromExcel = async () => {
  if (!selectedFile.value) return;

  importing.value = true;
  try {
    const arrayBuffer = await selectedFile.value.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Skip header row and extract names
    const names = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row && row[0]) {
        const name = String(row[0]).trim();
        if (name) {
          names.push(name);
        }
      }
    }

    if (names.length === 0) {
      toast.add({
        severity: 'warn',
        summary: 'No Data',
        detail: 'No valid names found in the Excel file',
        life: 3000
      });
      return;
    }

    // Add all names to Firestore
    let addedCount = 0;
    for (const name of names) {
      try {
        await addDoc(collection(db, 'msw'), { name });
        addedCount++;
      } catch (error) {
        console.error('Error adding MSW:', name, error);
      }
    }

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Imported ${addedCount} MSW names`,
      life: 3000
    });

    selectedFile.value = null;
    if (fileUploader.value) {
      fileUploader.value.clear();
    }
    await loadMswList();
  } catch (error) {
    console.error('Error importing Excel:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to import Excel file',
      life: 3000
    });
  } finally {
    importing.value = false;
  }
};

onMounted(() => {
  loadMswList();
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
  display: flex;
  justify-content: center;
}

.list-card {
  width: 100%;
  max-width: 900px;
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

.add-section h3,
.import-section h3,
.list-section h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.add-form,
.import-form {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.name-input {
  flex: 1;
}

.import-description {
  color: #64748b;
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
}

.msw-table {
  margin-top: 1rem;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.edit-input {
  width: 100%;
}
</style>

