import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../services/api';

export const fetchCustomers = createAsyncThunk(
  'customers/fetch',
  async (_, { dispatch }) => {
    try {
      const response = await api.get('/customers/');
      dispatch({ type: 'customers/fetch', payload: response.data });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
);

export const deleteCustomer = createAsyncThunk(
  'customers/delete',
  async (customerId, { dispatch }) => {
    try {
      await api.delete(`/customers/${customerId}/`);
      dispatch(fetchCustomers());
    } catch (error) {
      throw error;
    }
  }
);

const customersSlice = createSlice({
  name: 'customers',
  initialState: { data: [] },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchCustomers.fulfilled, (state, action) => {
      state.data = action.payload;
    });
    builder.addCase(deleteCustomer.fulfilled, (state, action) => {
      state.data = state.data.filter(customer => customer.id !== action.payload);
    });
  },
});

export const { fetchCustomers, deleteCustomer } = customersSlice.actions;
export default customersSlice.reducer;