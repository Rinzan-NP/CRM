// src/redux/usersSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

// Async thunks for API calls
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/accounts/users/');
   
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch users');
    }
  }
);

export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/accounts/register/', userData);
  
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to create user');
    }
  }
);

export const blockUnblockUser = createAsyncThunk(
  'users/blockUnblockUser',
  async ({ user_id, action }, { rejectWithValue }) => {
    try {
      const response = await api.post('/accounts/users/block-unblock/', {
        user_id,
        action
      });
      return { user_id, action, message: response.data.detail };
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to update user status');
    }
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    users: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create User
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users.push(action.payload);
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Block/Unblock User
      .addCase(blockUnblockUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(blockUnblockUser.fulfilled, (state, action) => {
        state.loading = false;
        const { user_id, action: userAction } = action.payload;
        const userIndex = state.users.findIndex(user => user.id === user_id);
        if (userIndex !== -1) {
          state.users[userIndex].blocked = userAction === 'block';
        }
      })
      .addCase(blockUnblockUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = usersSlice.actions;
export default usersSlice.reducer;