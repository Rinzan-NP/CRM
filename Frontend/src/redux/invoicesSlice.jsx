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

export const fetchAvailableSalesOrders = createAsyncThunk(
  'invoices/fetchAvailableSalesOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/transactions/invoices/available_sales_orders/');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchSalesOrderDetails = createAsyncThunk(
  'invoices/fetchSalesOrderDetails',
  async (salesOrderId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/transactions/sales-orders/${salesOrderId}/`);
      console.table(response.data);
      
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
    availableSalesOrders: [],
    salesOrderDetails: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Handle fetchInvoices
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
      // Handle fetchAvailableSalesOrders
      .addCase(fetchAvailableSalesOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAvailableSalesOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.availableSalesOrders = action.payload;
      })
      .addCase(fetchAvailableSalesOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Handle fetchSalesOrderDetails
      .addCase(fetchSalesOrderDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSalesOrderDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.salesOrderDetails = action.payload;
      })
      .addCase(fetchSalesOrderDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Handle createInvoice
      .addCase(createInvoice.fulfilled, (state, action) => {
        state.invoices.push(action.payload);
        // Remove the sales order from available orders after creating invoice
        state.availableSalesOrders = state.availableSalesOrders.filter(
          order => order.id !== action.payload.sales_order
        );
      })
      // Handle updateInvoice
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