// src/redux/routeVisitsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchRouteVisits = createAsyncThunk(
  'routeVisits/fetchRouteVisits',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/transactions/routevisits/');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createRouteVisit = createAsyncThunk(
  'routeVisits/createRouteVisit',
  async (routeVisit, { rejectWithValue }) => {
    try {
      const response = await api.post('/transactions/routevisits/', routeVisit);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateRouteVisit = createAsyncThunk(
  'routeVisits/updateRouteVisit',
  async (routeVisit, { rejectWithValue }) => {
    try {
      const response = await api.put(`/transactions/routevisits/${routeVisit.id}/`, routeVisit);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
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
      return rejectWithValue(error.response.data);
    }
  }
);

const routeVisitsSlice = createSlice({
  name: 'routeVisits',
  initialState: {
    routeVisits: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
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
      .addCase(createRouteVisit.fulfilled, (state, action) => {
        state.routeVisits.push(action.payload);
      })
      .addCase(updateRouteVisit.fulfilled, (state, action) => {
        const index = state.routeVisits.findIndex((routeVisit) => routeVisit.id === action.payload.id);
        if (index !== -1) {
          state.routeVisits[index] = action.payload;
        }
      })
      .addCase(deleteRouteVisit.fulfilled, (state, action) => {
        state.routeVisits = state.routeVisits.filter((routeVisit) => routeVisit.id !== action.payload);
      });
  },
});

export default routeVisitsSlice.reducer;