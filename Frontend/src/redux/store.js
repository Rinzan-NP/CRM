import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import customersReducer from './customersSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    customers: customersReducer,
  },
});