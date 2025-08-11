// src/redux/paymentsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchPayments = createAsyncThunk(
  'payments/fetchPayments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/transactions/payments/');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createPayment = createAsyncThunk(
  'payments/createPayment',
  async (payment, { rejectWithValue }) => {
    try {
      console.log(payment);
      const response = await api.post('/transactions/payments/', payment);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updatePayment = createAsyncThunk(
  'payments/updatePayment',
  async (payment, { rejectWithValue }) => {
    try {
      const response = await api.put(`/transactions/payments/${payment.id}/`, payment);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deletePayment = createAsyncThunk(
  'payments/deletePayment',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/transactions/payments/${id}/`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const paymentsSlice = createSlice({
  name: 'payments',
  initialState: {
    payments: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload;
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createPayment.fulfilled, (state, action) => {
        state.payments.push(action.payload);
      })
      .addCase(updatePayment.fulfilled, (state, action) => {
        const index = state.payments.findIndex((payment) => payment.id === action.payload.id);
        if (index !== -1) {
          state.payments[index] = action.payload;
        }
      })
      .addCase(deletePayment.fulfilled, (state, action) => {
        state.payments = state.payments.filter((payment) => payment.id !== action.payload);
      });
  },
});

export default paymentsSlice.reducer;