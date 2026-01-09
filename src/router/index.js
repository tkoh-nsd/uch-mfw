import { createRouter, createWebHistory } from 'vue-router';
import AppointmentView from '../components/AppointmentView.vue';
import AdminPage from '../components/AdminPage.vue';
import AdminImportPage from '../components/AdminImportPage.vue';
import AdminAddDaysPage from '../components/AdminAddDaysPage.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: AppointmentView
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminPage
  },
  {
    path: '/admin/import-excel',
    name: 'AdminImportExcel',
    component: AdminImportPage
  },
  {
    path: '/admin/add-days',
    name: 'AdminAddDays',
    component: AdminAddDaysPage
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;

