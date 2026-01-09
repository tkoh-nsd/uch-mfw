<template>
  <div class="admin-page">
    <div class="admin-header">
      <Button 
        label="Back to Admin Panel" 
        icon="pi pi-arrow-left" 
        @click="goBack"
        class="p-button-text"
      />
      <h1>Excel Data Import</h1>
    </div>

    <div class="admin-content">
      <Card class="import-card">
        <template #title>
          <div class="card-title">
            <i class="pi pi-upload"></i>
            Import Excel Data
          </div>
        </template>
        <template #content>
          <Message severity="warn" :closable="false" class="warning-message">
            <strong>⚠️ WARNING:</strong> This will OVERWRITE all existing data in the database.
          </Message>

          <div class="file-upload-section">
            <FileUpload
              ref="fileUploader"
              mode="basic"
              accept=".xlsx,.xls"
              :maxFileSize="10000000"
              :auto="false"
              chooseLabel="Choose Excel File"
              @select="onFileSelect"
              class="file-upload"
            />
            
            <Button
              v-if="selectedFile"
              label="Import Data"
              icon="pi pi-cloud-upload"
              @click="importData"
              :loading="importing"
              class="p-button-success import-button"
            />
          </div>

          <div v-if="selectedFile" class="file-info">
            <p><strong>Selected file:</strong> {{ selectedFile.name }}</p>
            <p><strong>Size:</strong> {{ formatFileSize(selectedFile.size) }}</p>
          </div>

          <div v-if="importProgress" class="import-progress">
            <p class="progress-text">{{ importProgress }}</p>
            <ProgressBar mode="indeterminate" style="height: 6px" />
          </div>

          <div v-if="importStatus" class="import-status">
            <Message :severity="importStatus.type" :closable="false">
              {{ importStatus.message }}
            </Message>
          </div>

          <Divider />

          <div class="table-structure">
            <h3>📋 Expected Table Structure</h3>
            <p class="structure-description">
	              Your Excel file must have the following columns in this exact order:
            </p>
            
            <DataTable :value="tableStructure" class="structure-table">
              <Column field="column" header="Column" style="width: 100px"></Column>
              <Column field="name" header="Field Name"></Column>
              <Column field="description" header="Description"></Column>
              <Column field="example" header="Example"></Column>
            </DataTable>

            <div class="structure-notes">
              <h4>Important Notes:</h4>
              <ul>
	                <li>First row must contain column headers</li>
	                <li>Date format: YYYY-MM-DD (e.g., 2024-01-15) or Excel date</li>
	                <li>Time format: HH:mm (e.g., 09:00, 14:30) or Excel time</li>
	                <li>If a Date cell is empty, the last non-empty date above will be reused</li>
	                <li>CWA: use "Y" for true; leave empty for false</li>
	                <li>All other fields can be empty strings</li>
              </ul>
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Message from 'primevue/message';
import FileUpload from 'primevue/fileupload';
import Divider from 'primevue/divider';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import ProgressBar from 'primevue/progressbar';
import { useToast } from 'primevue/usetoast';
import { validateExcelFile, importExcelData } from '../utils/excelImport';

const router = useRouter();
const toast = useToast();
const fileUploader = ref(null);
const selectedFile = ref(null);
const importing = ref(false);
const importStatus = ref(null);
const importProgress = ref('');
const validationResult = ref(null);

const tableStructure = [
	  { column: 'A', name: 'Date', description: 'Appointment date', example: '2024-01-15' },
	  { column: 'B', name: 'Time', description: 'Appointment time', example: '09:00' },
	  { column: 'C', name: 'Service', description: 'Service type/Location', example: 'MFW' },
	  { column: 'D', name: 'CWA', description: '"Y" for CWA, leave empty otherwise', example: 'Y' },
	  { column: 'E', name: 'Pt Name', description: 'Patient name', example: 'John Doe' },
	  { column: 'F', name: 'RMSW', description: 'Responsible medical social worker', example: 'RMSW Name' },
	  { column: 'G', name: 'EA', description: 'EA in charge (if any)', example: 'EA Name' },
	  { column: 'H', name: 'New/FU', description: '"New" or "FU" (follow-up)', example: 'New' },
	  { column: 'I', name: 'Remarks', description: 'Additional notes', example: 'Follow-up' }
];

const goBack = () => {
  router.push('/admin');
};

const onFileSelect = async (event) => {
  selectedFile.value = event.files[0];
  importStatus.value = null;
  validationResult.value = null;

  // Validate file structure immediately
  if (selectedFile.value) {
    const result = await validateExcelFile(selectedFile.value);
    validationResult.value = result;

    if (result.valid) {
      importStatus.value = {
        type: 'success',
        message: '✓ File structure is valid and ready to import'
      };
    } else {
      importStatus.value = {
        type: 'error',
        message: result.message
      };
    }
  }
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const importData = async () => {
  if (!selectedFile.value) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Please select a file first',
      life: 3000
    });
    return;
  }

  if (!validationResult.value || !validationResult.value.valid) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'File validation failed. Please check the file structure.',
      life: 3000
    });
    return;
  }

  importing.value = true;
  importProgress.value = 'Starting import...';
  importStatus.value = {
    type: 'info',
    message: 'Importing data, please wait...'
  };

  try {
    const result = await importExcelData(selectedFile.value, (progress) => {
      importProgress.value = progress;
    });

    if (result.success) {
      importStatus.value = {
        type: 'success',
        message: result.message
      };
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: result.message,
        life: 5000
      });

      // Clear file selection
      selectedFile.value = null;
      validationResult.value = null;
      if (fileUploader.value) {
        fileUploader.value.clear();
      }
    } else {
      importStatus.value = {
        type: 'error',
        message: result.message
      };
      toast.add({
        severity: 'error',
        summary: 'Import Failed',
        detail: result.message,
        life: 5000
      });
    }
  } catch (error) {
    importStatus.value = {
      type: 'error',
      message: `Import failed: ${error.message}`
    };
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message,
      life: 5000
    });
  } finally {
    importing.value = false;
    importProgress.value = '';
  }
};
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

.import-card {
  width: 100%;
  max-width: 1200px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
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

.warning-message {
  margin-bottom: 1.5rem;
}

.file-upload-section {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.file-upload {
  flex: 1;
  min-width: 200px;
}

.import-button {
  min-width: 150px;
}

.file-info {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.file-info p {
  margin: 0.5rem 0;
  color: #495057;
}

.import-progress {
  margin: 1rem 0;
  padding: 1rem;
  background: #f0f9ff;
  border-radius: 8px;
}

.progress-text {
  margin: 0 0 0.5rem 0;
  color: #0369a1;
  font-weight: 500;
}

.import-status {
  margin-top: 1rem;
}

.table-structure {
  margin-top: 1rem;
}

.table-structure h3 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.structure-description {
  color: #64748b;
  margin-bottom: 1rem;
}

.structure-table {
  margin: 1rem 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

:deep(.structure-table .p-datatable-thead > tr > th) {
  background-color: #667eea;
  color: white;
  font-weight: 600;
}

.structure-notes {
  background: #e0e7ff;
  padding: 1.5rem;
  border-radius: 8px;
  margin-top: 1.5rem;
}

.structure-notes h4 {
  color: #4c1d95;
  margin-top: 0;
  margin-bottom: 1rem;
}

.structure-notes ul {
  margin: 0;
  padding-left: 1.5rem;
  color: #5b21b6;
}

.structure-notes li {
  margin-bottom: 0.5rem;
}
</style>
