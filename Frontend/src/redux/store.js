// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import customersReducer from './customersSlice';
import suppliersReducer from './suppliersSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    customers: customersReducer,
    suppliers: suppliersReducer,
  },
});