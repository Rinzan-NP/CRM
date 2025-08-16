// src/redux/customersSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

// Helper function to handle API errors
const handleApiError = (error, rejectWithValue) => {
  if (error.response) {
    return rejectWithValue(error.response.data);
  }
  return rejectWithValue(error.message);
};

// Existing customer operations
export const fetchCustomers = createAsyncThunk(
  'customers/fetchCustomers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/main/customers/');
      return response.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
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
      return handleApiError(error, rejectWithValue);
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
      return handleApiError(error, rejectWithValue);
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
      return handleApiError(error, rejectWithValue);
    }
  }
);

// FIXED: Customer detail operations with correct endpoints
export const fetchCustomerDetails = createAsyncThunk(
  'customers/fetchCustomerDetails',
  async (id, { rejectWithValue }) => {
    try {
      // Fixed: Use correct endpoint based on your URL structure
      const response = await api.get(`/transactions/customers/${id}/`);
      return response.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

export const fetchCustomerOrders = createAsyncThunk(
  'customers/fetchCustomerOrders',
  async (id, { rejectWithValue }) => {
    try {
      // Fixed: Use correct endpoint for customer orders
      const response = await api.get(`/transactions/customers/${id}/orders/`);
      return { customerId: id, orders: response.data };
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

export const fetchCustomerInvoices = createAsyncThunk(
  'customers/fetchCustomerInvoices',
  async (id, { rejectWithValue }) => {
    try {
      // Fixed: Use correct endpoint for customer invoices
      const response = await api.get(`/transactions/customers/${id}/invoices/`);
      return { customerId: id, invoices: response.data };
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

// NEW: Single API call to get all customer data
export const fetchCustomerSummary = createAsyncThunk(
  'customers/fetchCustomerSummary',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/transactions/customers/${id}/summary/`);
      return response.data;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

const initialState = {
  customers: [],
  currentCustomer: null,
  orders: [],
  invoices: [],
  summary: null,
  loading: false,
  error: null,
  stats: {
    totalCustomers: 0,
    activeCustomers: 0,
    newCustomers: 0,
  }
};

const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    clearCurrentCustomer: (state) => {
      state.currentCustomer = null;
      state.orders = [];
      state.invoices = [];
      state.summary = null;
    },
    resetCustomerError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Customers
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = action.payload;
        state.stats.totalCustomers = action.payload.length;
        // Calculate stats if the data includes the necessary fields
        if (action.payload.length > 0 && action.payload[0].hasOwnProperty('is_active')) {
          state.stats.activeCustomers = action.payload.filter(c => c.is_active).length;
        }
        if (action.payload.length > 0 && action.payload[0].hasOwnProperty('created_at')) {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          state.stats.newCustomers = action.payload.filter(c => 
            new Date(c.created_at) > thirtyDaysAgo
          ).length;
        }
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create Customer
      .addCase(createCustomer.pending, (state) => {
        state.loading = true;
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.customers.push(action.payload);
        state.stats.totalCustomers += 1;
        state.stats.newCustomers += 1;
      })
      .addCase(createCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Customer
      .addCase(updateCustomer.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.customers.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.customers[index] = action.payload;
        }
        if (state.currentCustomer?.id === action.payload.id) {
          state.currentCustomer = action.payload;
        }
      })
      .addCase(updateCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete Customer
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.customers = state.customers.filter(c => c.id !== action.payload);
        state.stats.totalCustomers -= 1;
        if (state.currentCustomer?.id === action.payload) {
          state.currentCustomer = null;
        }
      })

      // Fetch Customer Details
      .addCase(fetchCustomerDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomerDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCustomer = action.payload;
      })
      .addCase(fetchCustomerDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Customer Orders
      .addCase(fetchCustomerOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCustomerOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.orders;
      })
      .addCase(fetchCustomerOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Customer Invoices
      .addCase(fetchCustomerInvoices.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCustomerInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.invoices = action.payload.invoices;
      })
      .addCase(fetchCustomerInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // NEW: Fetch Customer Summary (single API call)
      .addCase(fetchCustomerSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomerSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCustomer = action.payload.customer;
        state.orders = action.payload.orders;
        state.invoices = action.payload.invoices;
        state.summary = action.payload.summary;
      })
      .addCase(fetchCustomerSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentCustomer, resetCustomerError } = customersSlice.actions;
export default customersSlice.reducer;