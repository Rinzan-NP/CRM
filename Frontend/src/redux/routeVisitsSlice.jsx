// Frontend/src/redux/routeVisitsSlice.js - Updated to handle sales orders

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchRouteVisits = createAsyncThunk(
  'routeVisits/fetchRouteVisits',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/transactions/routevisits/');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createRouteVisit = createAsyncThunk(
  'routeVisits/createRouteVisit',
  async (routeVisitData, { rejectWithValue }) => {
    try {
      const response = await api.post('/transactions/routevisits/', routeVisitData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateRouteVisit = createAsyncThunk(
  'routeVisits/updateRouteVisit',
  async ({ id, ...routeVisitData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/transactions/routevisits/${id}/`, routeVisitData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteRouteVisit = createAsyncThunk(
  'routeVisits/deleteRouteVisit',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/transactions/routevisits/${id}/`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch route visits by route
export const fetchRouteVisitsByRoute = createAsyncThunk(
  'routeVisits/fetchRouteVisitsByRoute',
  async (routeId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/transactions/routevisits/?route=${routeId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch route visits by customer
export const fetchRouteVisitsByCustomer = createAsyncThunk(
  'routeVisits/fetchRouteVisitsByCustomer',
  async (customerId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/transactions/routevisits/?customer=${customerId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const routeVisitsSlice = createSlice({
  name: 'routeVisits',
  initialState: {
    routeVisits: [],
    loading: false,
    error: null,
    selectedRouteVisit: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedRouteVisit: (state, action) => {
      state.selectedRouteVisit = action.payload;
    },
    clearSelectedRouteVisit: (state) => {
      state.selectedRouteVisit = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch route visits
      .addCase(fetchRouteVisits.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRouteVisits.fulfilled, (state, action) => {
        state.loading = false;
        state.routeVisits = action.payload;
      })
      .addCase(fetchRouteVisits.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create route visit
      .addCase(createRouteVisit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRouteVisit.fulfilled, (state, action) => {
        state.loading = false;
        state.routeVisits.push(action.payload);
      })
      .addCase(createRouteVisit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update route visit
      .addCase(updateRouteVisit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRouteVisit.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.routeVisits.findIndex(
          (routeVisit) => routeVisit.id === action.payload.id
        );
        if (index !== -1) {
          state.routeVisits[index] = action.payload;
        }
      })
      .addCase(updateRouteVisit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete route visit
      .addCase(deleteRouteVisit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteRouteVisit.fulfilled, (state, action) => {
        state.loading = false;
        state.routeVisits = state.routeVisits.filter(
          (routeVisit) => routeVisit.id !== action.payload
        );
      })
      .addCase(deleteRouteVisit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch by route
      .addCase(fetchRouteVisitsByRoute.fulfilled, (state, action) => {
        state.loading = false;
        state.routeVisits = action.payload;
      })
      
      // Fetch by customer
      .addCase(fetchRouteVisitsByCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.routeVisits = action.payload;
      });
  },
});

export const { clearError, setSelectedRouteVisit, clearSelectedRouteVisit } = routeVisitsSlice.actions;
export default routeVisitsSlice.reducer;