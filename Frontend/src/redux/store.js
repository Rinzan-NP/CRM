import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import salesSlice from './salesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    sales: salesSlice,
  },
});