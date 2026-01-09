import { createRouter, createWebHistory } from 'vue-router';
import AppointmentView from '../components/AppointmentView.vue';
import AdminPage from '../components/AdminPage.vue';
import AdminImportPage from '../components/AdminImportPage.vue';
import AdminAddDaysPage from '../components/AdminAddDaysPage.vue';
import AdminMswListPage from '../components/AdminMswListPage.vue';
import AdminEaListPage from '../components/AdminEaListPage.vue';
import AdminPublicHolidaysPage from '../components/AdminPublicHolidaysPage.vue';

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
  },
  {
    path: '/admin/msw-list',
    name: 'AdminMswList',
    component: AdminMswListPage
  },
  {
    path: '/admin/ea-list',
    name: 'AdminEaList',
    component: AdminEaListPage
  },
  {
    path: '/admin/public-holidays',
    name: 'AdminPublicHolidays',
    component: AdminPublicHolidaysPage
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;

