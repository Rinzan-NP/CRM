import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Utility function to load token from localStorage
const loadToken = () => {
  const token = localStorage.getItem('token');
  return token ? { token, user: JSON.parse(localStorage.getItem('user')) } : { token: null, user: null };
};

// Utility function to save token and user to localStorage
const saveAuth = (token, role, refresh) => {
  localStorage.setItem('token', token);
  localStorage.setItem('role', role);
  localStorage.setItem('refresh', refresh);
};

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await api.post('/accounts/login/', { email, password });
      saveAuth(response.data.access, response.data.role, response.data.refresh);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: loadToken(),
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('refresh');
      return { token: null, role: null, refresh: null };
    },
  },
  extraReducers: (builder) => {
    builder.addCase(login.fulfilled, (state, action) => {
      state.token = action.payload.access;
      state.role = action.payload.role;
      state.refresh = action.payload.refresh;
    });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;