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

        <!-- Future admin cards can be added here -->
        <!--
        <Card class="admin-card" @click="goToSomeOtherFunction">
          <template #title>
            <div class="card-title">
              <i class="pi pi-cog"></i>
              Other Admin Function
            </div>
          </template>
          <template #content>
            <p class="card-description">Description of the other admin function.</p>
          </template>
        </Card>
        -->
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

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
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
  color: #2c3e50;
}

.card-title i {
  color: #667eea;
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
