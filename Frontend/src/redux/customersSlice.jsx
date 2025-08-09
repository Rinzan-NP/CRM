// src/redux/customersSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchCustomers = createAsyncThunk(
  'customers/fetchCustomers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/main/customers/');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createCustomer = createAsyncThunk(
  'customers/createCustomer',
  async (customer, { rejectWithValue }) => {
    try {
      const response = await api.post('/main/customers/', customer);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateCustomer = createAsyncThunk(
  'customers/updateCustomer',
  async (customer, { rejectWithValue }) => {
    try {
      const response = await api.put(`/main/customers/${customer.id}/`, customer);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteCustomer = createAsyncThunk(
  'customers/deleteCustomer',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/main/customers/${id}/`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const customersSlice = createSlice({
  name: 'customers',
  initialState: {
    customers: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.customers.push(action.payload);
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        const index = state.customers.findIndex((customer) => customer.id === action.payload.id);
        if (index !== -1) {
          state.customers[index] = action.payload;
        }
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.customers = state.customers.filter((customer) => customer.id !== action.payload);
      });
  },
});

export default customersSlice.reducer;