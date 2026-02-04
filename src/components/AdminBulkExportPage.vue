<template>
  <div class="admin-page">
    <div class="admin-header">
      <Button 
        label="Back to Admin" 
        icon="pi pi-arrow-left" 
        @click="goBack"
        class="p-button-text"
      />
      <h1>Bulk Export</h1>
    </div>

    <div class="admin-content">
      <Card class="export-card">
        <template #title>
          <div class="card-title">
            <i class="pi pi-file-excel"></i>
            Export Appointments by Date Range
          </div>
        </template>
        <template #content>
          <Message severity="info" :closable="false" class="info-message">
            Select a date range to export all appointments to an Excel file.
          </Message>

          <div class="export-form">
            <div class="form-group">
              <label for="startDate">Start Date</label>
              <Calendar
                id="startDate"
                v-model="startDate"
                dateFormat="yy-mm-dd"
                :showIcon="true"
                class="date-picker"
              />
            </div>

            <div class="form-group">
              <label for="endDate">End Date</label>
              <Calendar
                id="endDate"
                v-model="endDate"
                dateFormat="yy-mm-dd"
                :showIcon="true"
                class="date-picker"
              />
            </div>

            <Button
              label="Export to Excel"
              icon="pi pi-download"
              @click="handleExport"
              :loading="exporting"
              class="p-button-success export-button"
              :disabled="!startDate || !endDate"
            />
          </div>

          <div v-if="exportStatus" class="export-status">
            <Message :severity="exportStatus.type" :closable="true">
              {{ exportStatus.message }}
            </Message>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Calendar from 'primevue/calendar';
import Message from 'primevue/message';
import dayjs from 'dayjs';
import { exportAppointmentsByDateRange } from '../utils/excelExport';

const router = useRouter();
const toast = useToast();

const startDate = ref(null);
const endDate = ref(null);
const exporting = ref(false);
const exportStatus = ref(null);

const goBack = () => {
  router.push('/admin');
};

const handleExport = async () => {
  if (!startDate.value || !endDate.value) {
    toast.add({
      severity: 'warn',
      summary: 'Missing Dates',
      detail: 'Please select both start and end dates',
      life: 3000
    });
    return;
  }

  exporting.value = true;
  exportStatus.value = null;

  try {
    const startStr = dayjs(startDate.value).format('YYYY-MM-DD');
    const endStr = dayjs(endDate.value).format('YYYY-MM-DD');

    const result = await exportAppointmentsByDateRange(startStr, endStr);

    if (result.success) {
      exportStatus.value = {
        type: 'success',
        message: `✓ ${result.message}`
      };
      toast.add({
        severity: 'success',
        summary: 'Export Successful',
        detail: result.message,
        life: 5000
      });
    } else {
      exportStatus.value = {
        type: 'error',
        message: result.message
      };
      toast.add({
        severity: 'error',
        summary: 'Export Failed',
        detail: result.message,
        life: 5000
      });
    }
  } catch (error) {
    exportStatus.value = {
      type: 'error',
      message: `Export failed: ${error.message}`
    };
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message,
      life: 5000
    });
  } finally {
    exporting.value = false;
  }
};
</script>

<style scoped>
.admin-page {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
  background: linear-gradient(135deg, #f9fafb 0%, var(--app-primary-soft) 100%);
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
  background: linear-gradient(135deg, var(--app-primary) 0%, var(--app-primary-alt) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.admin-content {
  margin-top: 1rem;
}

.export-card {
  max-width: 600px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.3rem;
  color: var(--app-text-main);
}

.card-title i {
  color: var(--app-primary-alt);
}

.info-message {
  margin-bottom: 1.5rem;
}

.export-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: var(--app-text-main);
}

.date-picker {
  width: 100%;
}

.export-button {
  align-self: flex-start;
}

.export-status {
  margin-top: 1rem;
}
</style>

