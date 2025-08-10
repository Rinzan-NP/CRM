// src/redux/routesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchRoutes = createAsyncThunk(
  'routes/fetchRoutes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/transactions/routes/');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createRoute = createAsyncThunk(
  'routes/createRoute',
  async (route, { rejectWithValue }) => {
    try {
      const response = await api.post('/transactions/routes/', route);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateRoute = createAsyncThunk(
  'routes/updateRoute',
  async (route, { rejectWithValue }) => {
    try {
      const response = await api.put(`/transactions/routes/${route.id}/`, route);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteRoute = createAsyncThunk(
  'routes/deleteRoute',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/transactions/routes/${id}/`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const routesSlice = createSlice({
  name: 'routes',
  initialState: {
    routes: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoutes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoutes.fulfilled, (state, action) => {
        state.loading = false;
        state.routes = action.payload;
      })
      .addCase(fetchRoutes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createRoute.fulfilled, (state, action) => {
        state.routes.push(action.payload);
      })
      .addCase(updateRoute.fulfilled, (state, action) => {
        const index = state.routes.findIndex((route) => route.id === action.payload.id);
        if (index !== -1) {
          state.routes[index] = action.payload;
        }
      })
      .addCase(deleteRoute.fulfilled, (state, action) => {
        state.routes = state.routes.filter((route) => route.id !== action.payload);
      });
  },
});

export default routesSlice.reducer;