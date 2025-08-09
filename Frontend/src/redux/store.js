// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import customersReducer from './customersSlice';
import suppliersReducer from './suppliersSlice';
import productsReducer from './productsSlice';
import salesOrdersReducer from './salesOrdersSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    customers: customersReducer,
    suppliers: suppliersReducer,
    products: productsReducer,
    salesOrders: salesOrdersReducer,
  },
});