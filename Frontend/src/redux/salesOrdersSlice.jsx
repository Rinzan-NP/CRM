// src/redux/salesOrdersSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchSalesOrders = createAsyncThunk(
  'salesOrders/fetchSalesOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/transactions/sales-orders/');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createSalesOrder = createAsyncThunk(
  'salesOrders/createSalesOrder',
  async (salesOrder, { rejectWithValue }) => {
    try {
      const response = await api.post('/transactions/sales-orders/', salesOrder);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateSalesOrder = createAsyncThunk(
  'salesOrders/updateSalesOrder',
  async (salesOrder, { rejectWithValue }) => {
    try {
      const response = await api.put(`/transactions/sales-orders/${salesOrder.id}/`, salesOrder);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteSalesOrder = createAsyncThunk(
  'salesOrders/deleteSalesOrder',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/transactions/sales-orders/${id}/`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const salesOrdersSlice = createSlice({
  name: 'salesOrders',
  initialState: {
    salesOrders: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSalesOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSalesOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.salesOrders = action.payload;
      })
      .addCase(fetchSalesOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createSalesOrder.fulfilled, (state, action) => {
        state.salesOrders.push(action.payload);
      })
      .addCase(updateSalesOrder.fulfilled, (state, action) => {
        const index = state.salesOrders.findIndex((salesOrder) => salesOrder.id === action.payload.id);
        if (index !== -1) {
          state.salesOrders[index] = action.payload;
        }
      })
      .addCase(deleteSalesOrder.fulfilled, (state, action) => {
        state.salesOrders = state.salesOrders.filter((salesOrder) => salesOrder.id !== action.payload);
      });
  },
});

export default salesOrdersSlice.reducer;