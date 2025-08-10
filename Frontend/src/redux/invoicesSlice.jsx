// src/redux/invoicesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchInvoices = createAsyncThunk(
  'invoices/fetchInvoices',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/transactions/invoices/');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createInvoice = createAsyncThunk(
  'invoices/createInvoice',
  async (invoice, { rejectWithValue }) => {
    try {
      const response = await api.post('/transactions/invoices/', invoice);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateInvoice = createAsyncThunk(
  'invoices/updateInvoice',
  async (invoice, { rejectWithValue }) => {
    try {
      const response = await api.put(`/transactions/invoices/${invoice.id}/`, invoice);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteInvoice = createAsyncThunk(
  'invoices/deleteInvoice',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/transactions/invoices/${id}/`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const invoicesSlice = createSlice({
  name: 'invoices',
  initialState: {
    invoices: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.invoices = action.payload;
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createInvoice.fulfilled, (state, action) => {
        state.invoices.push(action.payload);
      })
      .addCase(updateInvoice.fulfilled, (state, action) => {
        const index = state.invoices.findIndex((invoice) => invoice.id === action.payload.id);
        if (index !== -1) {
          state.invoices[index] = action.payload;
        }
      })
      .addCase(deleteInvoice.fulfilled, (state, action) => {
        state.invoices = state.invoices.filter((invoice) => invoice.id !== action.payload);
      });
  },
});

export default invoicesSlice.reducer;