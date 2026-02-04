<template>
  <div class="admin-page">
    <div class="admin-header">
      <Button 
        label="Back to Appointments" 
        icon="pi pi-arrow-left" 
        @click="goBackToAppointments"
        class="p-button-text"
      />
      <h1>Admin Panel</h1>
    </div>

    <div class="admin-content">
      <div class="cards-grid">
        <Card class="admin-card" @click="goToImport">
          <template #title>
            <div class="card-title">
              <i class="pi pi-upload"></i>
              Import Excel Data
            </div>
          </template>
          <template #content>
            <p class="card-description">
              Import appointment data from an Excel file. This will overwrite existing data.
            </p>
            <div class="card-footer">
              <span class="card-warning">Overwrites existing data</span>
              <Button
                label="Open"
                icon="pi pi-arrow-right"
                class="p-button-text p-button-sm"
                @click.stop="goToImport"
              />
            </div>
          </template>
        </Card>

        <Card class="admin-card" @click="goToAddDays">
          <template #title>
            <div class="card-title">
              <i class="pi pi-calendar-plus"></i>
              Add Days
            </div>
          </template>
          <template #content>
            <p class="card-description">
              Create new days with empty appointment slots over a date range.
            </p>
            <div class="card-footer">
              <span class="card-warning">Fails if dates already have data</span>
              <Button
                label="Open"
                icon="pi pi-arrow-right"
                class="p-button-text p-button-sm"
                @click.stop="goToAddDays"
              />
            </div>
          </template>
        </Card>

        <Card class="admin-card" @click="goToMswList">
          <template #title>
            <div class="card-title">
              <i class="pi pi-users"></i>
              MSW List
            </div>
          </template>
          <template #content>
            <p class="card-description">
              Manage the list of Medical Social Workers for the RMSW dropdown.
            </p>
            <div class="card-footer">
              <span class="card-warning">Used in appointment RMSW field</span>
              <Button
                label="Open"
                icon="pi pi-arrow-right"
                class="p-button-text p-button-sm"
                @click.stop="goToMswList"
              />
            </div>
          </template>
        </Card>

        <Card class="admin-card" @click="goToEaList">
          <template #title>
            <div class="card-title">
              <i class="pi pi-user"></i>
              EA List
            </div>
          </template>
          <template #content>
            <p class="card-description">
              Manage the list of Executive Assistants for the EA dropdown.
            </p>
            <div class="card-footer">
              <span class="card-warning">Used in appointment EA field</span>
              <Button
                label="Open"
                icon="pi pi-arrow-right"
                class="p-button-text p-button-sm"
                @click.stop="goToEaList"
              />
            </div>
          </template>
        </Card>

        <Card class="admin-card" @click="goToPublicHolidays">
          <template #title>
            <div class="card-title">
              <i class="pi pi-calendar-times"></i>
              Public Holidays
            </div>
          </template>
          <template #content>
            <p class="card-description">
              Manage public holidays that will be disabled in the calendar.
            </p>
            <div class="card-footer">
              <span class="card-warning">Disables dates in calendar</span>
              <Button
                label="Open"
                icon="pi pi-arrow-right"
                class="p-button-text p-button-sm"
                @click.stop="goToPublicHolidays"
              />
            </div>
          </template>
        </Card>

        <Card class="admin-card" @click="goToBulkExport">
          <template #title>
            <div class="card-title">
              <i class="pi pi-file-excel"></i>
              Bulk Export
            </div>
          </template>
          <template #content>
            <p class="card-description">
              Export appointments for a date range to an Excel file.
            </p>
            <div class="card-footer">
              <span class="card-warning">Select date range</span>
              <Button
                label="Open"
                icon="pi pi-arrow-right"
                class="p-button-text p-button-sm"
                @click.stop="goToBulkExport"
              />
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import Card from 'primevue/card';

const router = useRouter();

const goBackToAppointments = () => {
  router.push('/');
};

const goToImport = () => {
  router.push('/admin/import-excel');
};

const goToAddDays = () => {
  router.push('/admin/add-days');
};

const goToMswList = () => {
  router.push('/admin/msw-list');
};

const goToEaList = () => {
  router.push('/admin/ea-list');
};

const goToPublicHolidays = () => {
  router.push('/admin/public-holidays');
};

const goToBulkExport = () => {
  router.push('/admin/bulk-export');
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

.cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .cards-grid {
    grid-template-columns: 1fr;
  }
}

.admin-card {
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

.admin-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
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

.card-description {
  margin: 0 0 1rem 0;
  color: #64748b;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-warning {
  font-size: 0.8rem;
  color: #b91c1c;
  font-weight: 500;
}
</style>
