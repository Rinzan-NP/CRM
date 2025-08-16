// src/redux/paymentsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchSalesPersons = createAsyncThunk(
  'salesPersons/fetchSalesPersons',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/accounts/salespersons/');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createSalesPerson = createAsyncThunk(
  'salesPersons/createSalesPerson',
  async (salesPerson, { rejectWithValue }) => {
    try {
      const response = await api.post('/accounts/salespersons/', salesPerson);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);



const salesPersonsSlice = createSlice({
  name: 'salesPersons',
  initialState: {
    salesPersons: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSalesPersons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSalesPersons.fulfilled, (state, action) => {
        state.loading = false;
        state.salesPersons = action.payload;
      })
      .addCase(fetchSalesPersons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
      
  },
});

export default salesPersonsSlice.reducer;