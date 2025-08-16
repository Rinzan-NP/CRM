// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import customersReducer from './customersSlice';
import suppliersReducer from './suppliersSlice';
import productsReducer from './productsSlice';
import salesOrdersReducer from './salesOrdersSlice';
import purchaseOrdersSlice from './purchaseOrdersSlice'
import invoicesReducer from './invoicesSlice';
import paymentsReducer from './paymentsSlice';
import routesReducer from './routesSlice';
import routeVisitsReducer from './routeVisitsSlice';
import auditlogsReducer from './auditLogsSlice';
import salesPersonsReducer from './salesPersonSlice';
export const store = configureStore({
  reducer: {
    auth: authReducer,
    customers: customersReducer,
    suppliers: suppliersReducer,
    products: productsReducer,
    salesOrders: salesOrdersReducer,
    purchaseOrders: purchaseOrdersSlice,
    invoices: invoicesReducer,
    payments: paymentsReducer,
    routes: routesReducer,
    routeVisits: routeVisitsReducer,
    auditLogs: auditlogsReducer,
    salesPersons: salesPersonsReducer,
  },
});