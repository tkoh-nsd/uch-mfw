<template>
  <div class="admin-page">
    <div class="admin-header">
      <Button
        label="Back to Admin Panel"
        icon="pi pi-arrow-left"
        @click="goBack"
        class="p-button-text"
      />
      <h1>Add Days</h1>
    </div>

    <div class="admin-content">
      <Card class="add-days-card">
        <template #title>
          <div class="card-title">
            <i class="pi pi-calendar-plus"></i>
            Add Days
          </div>
        </template>

        <template #content>
          <Message severity="info" :closable="false" class="info-message">
            Use this form to create new days and empty appointment slots. The selected
            date range must not already exist in the <strong>bookings</strong> collection.
          </Message>

          <div class="form-grid">
            <div class="section">
              <h3>Date Range</h3>
              <div class="date-range">
                <div class="field">
                  <label for="dateFrom">Date from</label>
                  <DatePicker
                    id="dateFrom"
                    v-model="dateFrom"
                    dateFormat="yy-mm-dd"
                    showIcon
                    :manualInput="false"
                    placeholder="YYYY-MM-DD"
                  />
                </div>

                <div class="field">
                  <label for="dateTo">Date to</label>
                  <DatePicker
                    id="dateTo"
                    v-model="dateTo"
                    dateFormat="yy-mm-dd"
                    showIcon
                    :manualInput="false"
                    placeholder="YYYY-MM-DD"
                  />
                </div>
              </div>
            </div>

	            <div class="section">
	              <div class="section-header">
	                <h3>Timeslots</h3>
	                <div class="timeslot-template-actions">
	                  <Button
	                    label="Save as Template"
	                    icon="pi pi-save"
	                    class="p-button-text p-button-sm"
	                    @click="openSaveTemplateDialog"
	                  />
	                  <Button
	                    label="Load Template"
	                    icon="pi pi-folder-open"
	                    class="p-button-text p-button-sm"
	                    @click="openLoadTemplateDialog"
	                  />
	                </div>
	              </div>

              <div class="timeslots">
                <div
                  v-for="(slot, index) in timeslots"
                  :key="index"
                  class="timeslot-row"
                >
                  <div class="field">
                    <label :for="`time-${index}`">Time (HH:mm)</label>
                    <InputText
                      :id="`time-${index}`"
                      v-model="slot.time"
                      placeholder="09:00"
                    />
                  </div>

                  <div class="field">
                    <label :for="`service-${index}`">Service</label>
                    <Select
                      :id="`service-${index}`"
                      v-model="slot.service"
                      :options="serviceOptions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Select service"
                    />
                  </div>

                  <div class="field">
                    <label :for="`quantity-${index}`">Quantity</label>
                    <input
                      :id="`quantity-${index}`"
                      v-model.number="slot.quantity"
                      type="number"
                      min="1"
                      class="p-inputtext p-component quantity-input"
                    />
                  </div>

	                  <div class="timeslot-actions">
	                    <Button
	                      label="Duplicate"
	                      icon="pi pi-copy"
	                      class="p-button-text p-button-sm"
	                      @click="duplicateTimeslot(index)"
	                    />
	                    <Button
	                      label="Remove"
	                      icon="pi pi-trash"
	                      class="p-button-text p-button-sm p-button-danger"
	                      @click="removeTimeslot(index)"
	                    />
	                  </div>
                </div>
              </div>
            </div>

            <div v-if="errorMessage" class="form-message">
              <Message severity="error" :closable="false">
                {{ errorMessage }}
              </Message>
            </div>

            <div v-if="successMessage" class="form-message">
              <Message severity="success" :closable="false">
                {{ successMessage }}
              </Message>
            </div>

	            <div class="form-actions">
	              <Button
	                label="Add timeslot"
	                icon="pi pi-plus"
	                class="p-button-outlined p-button-sm"
	                @click="addTimeslot"
	              />
	              <Button
	                label="Submit"
	                icon="pi pi-check"
	                class="p-button-success"
	                :loading="submitting"
	                @click="submitForm"
	              />
	            </div>
          </div>
        </template>
      </Card>
	    </div>

	    <Dialog
	      v-model:visible="showSaveTemplateDialog"
	      header="Save Timeslot Template"
	      :modal="true"
	      :closable="false"
	      style="width: 400px"
	    >
	      <div class="field">
	        <label for="templateName">Template name</label>
	        <InputText
	          id="templateName"
	          v-model="templateName"
	          placeholder="e.g., Weekday mornings"
	        />
	      </div>
	      <div v-if="saveTemplateError" class="dialog-error">
	        {{ saveTemplateError }}
	      </div>
	      <template #footer>
	        <Button
	          label="Cancel"
	          class="p-button-text"
	          @click="showSaveTemplateDialog = false"
	        />
	        <Button
	          label="Save"
	          icon="pi pi-save"
	          :loading="savingTemplate"
	          @click="saveTemplate"
	        />
	      </template>
	    </Dialog>

	    <Dialog
	      v-model:visible="showLoadTemplateDialog"
	      header="Load Timeslot Template"
	      :modal="true"
	      :closable="false"
	      style="width: 420px"
	    >
	      <div v-if="loadingTemplates" class="dialog-hint">
	        Loading templates...
	      </div>
	      <div v-else>
	        <div v-if="templates.length">
	          <div class="field">
	            <label for="templateSelect">Template</label>
	            <Select
	              id="templateSelect"
	              v-model="selectedTemplateId"
	              :options="templates"
	              optionLabel="name"
	              optionValue="id"
	              placeholder="Select a template"
	            />
	          </div>
	          <div v-if="loadTemplateError" class="dialog-error">
	            {{ loadTemplateError }}
	          </div>
	        </div>
	        <p v-else class="dialog-hint">
	          No templates saved yet.
	        </p>
	      </div>
	      <template #footer>
	        <Button
	          label="Cancel"
	          class="p-button-text"
	          @click="showLoadTemplateDialog = false"
	        />
	        <Button
	          label="Load"
	          icon="pi pi-download"
	          @click="applySelectedTemplate"
	          :disabled="!selectedTemplateId || !templates.length"
	        />
	      </template>
	    </Dialog>
	  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import dayjs from 'dayjs';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Message from 'primevue/message';
import DatePicker from 'primevue/datepicker';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
	import Dialog from 'primevue/dialog';
import { useToast } from 'primevue/usetoast';
	import { collection, getDocs, writeBatch, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const router = useRouter();
const toast = useToast();

const dateFrom = ref(null);
const dateTo = ref(null);

const timeslots = ref([
  { time: '', service: 'OALA', quantity: 1 }
]);

const serviceOptions = [
  { label: 'OALA', value: 'OALA' },
  { label: 'Full', value: 'Full' }
];

const submitting = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
	const showSaveTemplateDialog = ref(false);
	const showLoadTemplateDialog = ref(false);
	const templateName = ref('');
	const savingTemplate = ref(false);
	const saveTemplateError = ref('');
	const templates = ref([]);
	const loadingTemplates = ref(false);
	const loadTemplateError = ref('');
	const selectedTemplateId = ref(null);

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const weekdayLabels = ['(日)', '(一)', '(二)', '(三)', '(四)', '(五)', '(六)'];

const goBack = () => {
  router.push('/admin');
};

const addTimeslot = () => {
  timeslots.value.push({ time: '', service: 'OALA', quantity: 1 });
};

const duplicateTimeslot = (index) => {
  const slot = timeslots.value[index];
  if (!slot) return;

  timeslots.value.splice(index + 1, 0, {
    time: slot.time,
    service: slot.service,
    quantity: slot.quantity
  });
};

const removeTimeslot = (index) => {
  timeslots.value.splice(index, 1);
};

	const sanitizeTemplateId = (name) => {
	  const trimmed = name.trim();
	  if (!trimmed) return 'template';
	  return trimmed.replace(/[\/\?#]/g, '_');
	};

	const openSaveTemplateDialog = () => {
	  templateName.value = '';
	  saveTemplateError.value = '';
	  showSaveTemplateDialog.value = true;
	};

	const saveTemplate = async () => {
	  saveTemplateError.value = '';

	  if (!timeslots.value.length) {
	    saveTemplateError.value = 'No timeslots to save.';
	    return;
	  }

	  if (!templateName.value || !templateName.value.trim()) {
	    saveTemplateError.value = 'Please enter a template name.';
	    return;
	  }

	  const templateId = sanitizeTemplateId(templateName.value);
	  const templateTimeslots = timeslots.value.map((slot) => ({
	    time: (slot.time || '').trim(),
	    service: slot.service || 'OALA',
	    quantity: Number(slot.quantity) || 1
	  }));

	  savingTemplate.value = true;
	  try {
	    const templatesCol = collection(db, 'timeslot_templates');
	    const templateRef = doc(templatesCol, templateId);
	    await setDoc(templateRef, {
	      name: templateName.value.trim(),
	      timeslots: templateTimeslots,
	      updatedAt: serverTimestamp()
	    });

	    toast.add({
	      severity: 'success',
	      summary: 'Template saved',
	      detail: `Template "${templateName.value.trim()}" has been saved.`,
	      life: 4000
	    });

	    showSaveTemplateDialog.value = false;
	    // Refresh templates list so the new one appears when loading
	    await fetchTemplates();
	  } catch (error) {
	    console.error('Error saving template:', error);
	    saveTemplateError.value = error.message || 'Failed to save template.';
	  } finally {
	    savingTemplate.value = false;
	  }
	};

	const fetchTemplates = async () => {
	  loadingTemplates.value = true;
	  loadTemplateError.value = '';
	  try {
	    const snapshot = await getDocs(collection(db, 'timeslot_templates'));
	    templates.value = snapshot.docs.map((docSnap) => ({
	      id: docSnap.id,
	      ...docSnap.data()
	    }));
	  } catch (error) {
	    console.error('Error loading templates:', error);
	    loadTemplateError.value = error.message || 'Failed to load templates.';
	  } finally {
	    loadingTemplates.value = false;
	  }
	};

	const openLoadTemplateDialog = async () => {
	  selectedTemplateId.value = null;
	  loadTemplateError.value = '';
	  showLoadTemplateDialog.value = true;
	  await fetchTemplates();
	};

	const applySelectedTemplate = () => {
	  loadTemplateError.value = '';
	  const template = templates.value.find((t) => t.id === selectedTemplateId.value);
	  if (!template) {
	    loadTemplateError.value = 'Please select a template.';
	    return;
	  }

	  if (!Array.isArray(template.timeslots) || !template.timeslots.length) {
	    loadTemplateError.value = 'Selected template has no timeslots.';
	    return;
	  }

	  timeslots.value = template.timeslots.map((slot) => ({
	    time: slot.time || '',
	    service: slot.service || 'OALA',
	    quantity: slot.quantity ?? 1
	  }));

	  toast.add({
	    severity: 'success',
	    summary: 'Template loaded',
	    detail: `Template "${template.name}" has been loaded.`,
	    life: 4000
	  });

	  showLoadTemplateDialog.value = false;
	};

const generateDateRange = (start, end) => {
  const dates = [];
  let current = start.startOf('day');
  const last = end.startOf('day');

  while (current.isSame(last) || current.isBefore(last)) {
    dates.push(current.format('YYYY-MM-DD'));
    current = current.add(1, 'day');
  }

  return dates;
};

const getWeekdayLabel = (dateStr) => {
  const d = dayjs(dateStr);
  const idx = d.day();
  return weekdayLabels[idx] || '';
};

const validateForm = () => {
  errorMessage.value = '';

  if (!dateFrom.value || !dateTo.value) {
    errorMessage.value = 'Please select both "Date from" and "Date to".';
    return false;
  }

  const start = dayjs(dateFrom.value);
  const end = dayjs(dateTo.value);

  if (!start.isValid() || !end.isValid()) {
    errorMessage.value = 'Invalid date range.';
    return false;
  }

  if (end.isBefore(start)) {
    errorMessage.value = '"Date to" must be on or after "Date from".';
    return false;
  }

  if (!timeslots.value.length) {
    errorMessage.value = 'Please add at least one timeslot.';
    return false;
  }

  for (const slot of timeslots.value) {
    const qty = Number(slot.quantity);

    if (!slot.time || !timePattern.test(slot.time.trim())) {
      errorMessage.value = 'Please enter time in HH:mm format for all timeslots (e.g., 09:00).';
      return false;
    }

    if (!['OALA', 'Full'].includes(slot.service)) {
      errorMessage.value = 'Service must be either "OALA" or "Full".';
      return false;
    }

    if (!qty || qty < 1) {
      errorMessage.value = 'Quantity must be at least 1 for all timeslots.';
      return false;
    }
  }

  return true;
};

const submitForm = async () => {
  successMessage.value = '';
  errorMessage.value = '';

  if (!validateForm()) {
    if (errorMessage.value) {
      toast.add({
        severity: 'error',
        summary: 'Validation error',
        detail: errorMessage.value,
        life: 4000
      });
    }
    return;
  }

  const start = dayjs(dateFrom.value);
  const end = dayjs(dateTo.value);
  const dateStrings = generateDateRange(start, end);

  submitting.value = true;

  try {
    // 1) Check for existing data in the range
    const conflictingDates = [];

    for (const dateStr of dateStrings) {
      const appointmentsRef = collection(db, 'bookings', dateStr, 'appointments');
      const snapshot = await getDocs(appointmentsRef);

      if (!snapshot.empty) {
        conflictingDates.push(dateStr);
      }
    }

    if (conflictingDates.length > 0) {
      errorMessage.value = `These dates already have bookings: ${conflictingDates.join(', ')}. Please clear them first or choose another range.`;
      toast.add({
        severity: 'error',
        summary: 'Existing data found',
        detail: errorMessage.value,
        life: 6000
      });
      return;
    }

    // 2) Prepare appointment documents to create
    const appointmentsToCreate = [];

    for (const dateStr of dateStrings) {
      const weekday = getWeekdayLabel(dateStr);

      for (const slot of timeslots.value) {
        const qty = Number(slot.quantity);

        for (let i = 0; i < qty; i++) {
          appointmentsToCreate.push({
            date: dateStr,
            weekday,
            time: slot.time.trim(),
            service: slot.service,
            id_1: '',
            phone_1: '',
            pt_name_1: '',
            id_2: '',
            phone_2: '',
            pt_name_2: '',
            remarks: ''
          });
        }
      }
    }

    if (!appointmentsToCreate.length) {
      errorMessage.value = 'Nothing to create. Please check your timeslots and quantities.';
      toast.add({
        severity: 'error',
        summary: 'No appointments',
        detail: errorMessage.value,
        life: 4000
      });
      return;
    }

    // 3) Write to Firestore in batches
    const BATCH_SIZE = 400;
    let createdCount = 0;

    for (let i = 0; i < appointmentsToCreate.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const batchItems = appointmentsToCreate.slice(i, i + BATCH_SIZE);

      for (const appointment of batchItems) {
        const appointmentsRef = collection(db, 'bookings', appointment.date, 'appointments');
        const docRef = doc(appointmentsRef);
        batch.set(docRef, appointment);
      }

      await batch.commit();
      createdCount += batchItems.length;
    }

    successMessage.value = `Successfully created ${createdCount} appointment(s) for ${dateStrings.length} day(s).`;
    toast.add({
      severity: 'success',
      summary: 'Appointments created',
      detail: successMessage.value,
      life: 6000
    });

    // Reset form
    dateFrom.value = null;
    dateTo.value = null;
    timeslots.value = [{ time: '', service: 'OALA', quantity: 1 }];
  } catch (error) {
    console.error('Error creating appointments:', error);
    errorMessage.value = error.message || 'Failed to create appointments.';
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage.value,
      life: 6000
    });
  } finally {
    submitting.value = false;
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

.add-days-card {
  width: 100%;
  max-width: 900px;
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

.info-message {
  margin-bottom: 1.5rem;
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section h3 {
  margin: 0 0 0.75rem 0;
  color: #1f2933;
}

.date-range {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 180px;
  flex: 1;
}

.field label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #4b5563;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

	.timeslot-template-actions {
	  display: flex;
	  gap: 0.5rem;
	}

.timeslots {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.timeslot-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: 8px;
  background: #f9fafb;
}

.timeslot-actions {
	  display: flex;
	  align-items: flex-end;
	  gap: 0.5rem;
	  margin-left: auto;
	}

.quantity-input {
  max-width: 120px;
}

.form-message {
  margin-top: 0.5rem;
}

.form-actions {
  display: flex;
	  justify-content: space-between;
  margin-top: 0.5rem;
	  gap: 0.75rem;
}

	.dialog-error {
	  margin-top: 0.75rem;
	  color: #b91c1c;
	  font-size: 0.85rem;
	}

	.dialog-hint {
	  font-size: 0.9rem;
	  color: #4b5563;
	}
</style>
