// src/redux/purchaseOrdersSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchPurchaseOrders = createAsyncThunk(
  'purchaseOrders/fetchPurchaseOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/transactions/purchase-orders/');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createPurchaseOrder = createAsyncThunk(
  'purchaseOrders/createPurchaseOrder',
  async (purchaseOrder, { rejectWithValue }) => {
    try {
      console.log(purchaseOrder);
      
      const response = await api.post('/transactions/purchase-orders/', purchaseOrder);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updatePurchaseOrder = createAsyncThunk(
  'purchaseOrders/updatePurchaseOrder',
  async (purchaseOrder, { rejectWithValue }) => {
    try {
      const response = await api.put(`/transactions/purchase-orders/${purchaseOrder.id}/`, purchaseOrder);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deletePurchaseOrder = createAsyncThunk(
  'purchaseOrders/deletePurchaseOrder',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/transactions/purchase-orders/${id}/`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const purchaseOrdersSlice = createSlice({
  name: 'purchaseOrders',
  initialState: {
    purchaseOrders: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPurchaseOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchaseOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.purchaseOrders = action.payload;
      })
      .addCase(fetchPurchaseOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createPurchaseOrder.fulfilled, (state, action) => {
        state.purchaseOrders.push(action.payload);
      })
      .addCase(updatePurchaseOrder.fulfilled, (state, action) => {
        const index = state.purchaseOrders.findIndex((purchaseOrder) => purchaseOrder.id === action.payload.id);
        if (index !== -1) {
          state.purchaseOrders[index] = action.payload;
        }
      })
      .addCase(deletePurchaseOrder.fulfilled, (state, action) => {
        state.purchaseOrders = state.purchaseOrders.filter((purchaseOrder) => purchaseOrder.id !== action.payload);
      });
  },
});

export default purchaseOrdersSlice.reducer;