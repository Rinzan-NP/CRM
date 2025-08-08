import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Utility function to load token from localStorage
const loadToken = () => {
  const token = localStorage.getItem('token');
  return token ? { token, user: JSON.parse(localStorage.getItem('user')) } : { token: null, user: null };
};

// Utility function to save token and user to localStorage
const saveAuth = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await api.post('/accounts/login/', { email, password });
      saveAuth(response.data.access, response.data.user);
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
      localStorage.removeItem('user');
      return { token: null, user: null };
    },
  },
  extraReducers: (builder) => {
    builder.addCase(login.fulfilled, (state, action) => {
      state.token = action.payload.access;
      state.user = action.payload.user;
    });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;