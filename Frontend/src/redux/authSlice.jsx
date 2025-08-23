import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api";

// Utility function to load token from localStorage with error handling
const loadToken = () => {
    try {
        const token = localStorage.getItem("token");
        if (token) {
            const userString = localStorage.getItem("user");
            const refresh = localStorage.getItem("refresh");
            const user = userString ? JSON.parse(userString) : null;
            return {
                token,
                user,
                refresh,
                isLoading: false,
                error: null,
            };
        }
        return {
            token: null,
            user: null,
            refresh: null,
            isLoading: false,
            error: null,
        };
    } catch (error) {
        console.error("Error loading auth data from localStorage:", error);
        // Clear corrupted data
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("refresh");
        return {
            token: null,
            user: null,
            refresh: null,
            isLoading: false,
            error: null,
        };
    }
};

// Utility function to save token and user to localStorage
const saveAuth = (token, user, refresh) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("refresh", refresh);
};

// Utility function to clear auth data from localStorage
const clearAuth = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("refresh");
};

// Async thunk for login
export const login = createAsyncThunk(
    "auth/login",
    async ({ email, password }, { rejectWithValue }) => {
        try {
            const response = await api.post("/accounts/login/", {
                email,
                password,
            });
            const { access, user, refresh } = response.data;
            saveAuth(access, user, refresh);
            return { access, user, refresh };
        } catch (error) {
            const errorMessage =
                error.response?.data?.message ||
                error.response?.data?.detail ||
                error.response?.data ||
                "Login failed";
            return rejectWithValue(errorMessage);
        }
    }
);

// Async thunk for registration
export const register = createAsyncThunk(
    "auth/register",
    async (userData, { rejectWithValue }) => {
        try {
            const response = await api.post("/accounts/register/", userData);
            return response.data;
        } catch (error) {
            const errorMessage =
                error.response?.data?.message ||
                error.response?.data?.detail ||
                error.response?.data ||
                "Registration failed";
            return rejectWithValue(errorMessage);
        }
    }
);

// Async thunk for token refresh
export const refreshToken = createAsyncThunk(
    "auth/refresh",
    async (_, { getState, rejectWithValue }) => {
        try {
            const { auth } = getState();
            if (!auth.refresh) {
                throw new Error("No refresh token available");
            }
            const response = await api.post("/accounts/refresh/", {
                refresh: auth.refresh,
            });
            const { access } = response.data;
            saveAuth(access, auth.user, auth.refresh);
            return { access, user: auth.user, refresh: auth.refresh };
        } catch (error) {
            const errorMessage =
                error.response?.data?.message ||
                error.response?.data?.detail ||
                error.response?.data ||
                "Token refresh failed";
            return rejectWithValue(errorMessage);
        }
    }
);

// Async thunk for logout (if you need to call backend)
export const logoutUser = createAsyncThunk(
    "auth/logout",
    async (_, { getState, rejectWithValue }) => {
        try {
            const { auth } = getState();
            if (auth.refresh) {
                await api.post("/accounts/logout/", { refresh: auth.refresh });
            }
            clearAuth();
            return null;
        } catch (error) {
            // Even if logout fails on backend, clear local storage
            clearAuth();
            return null;
        }
    }
);

const authSlice = createSlice({
    name: "auth",
    initialState: loadToken(),
    reducers: {
        // Synchronous logout (doesn't call backend)
        logout: (state) => {
            clearAuth();
            return {
                token: null,
                user: null,
                refresh: null,
                isLoading: false,
                error: null,
            };
        },
        // Clear error state
        clearError: (state) => {
            state.error = null;
        },
        // Clear loading state
        clearLoading: (state) => {
            state.isLoading = false;
        },
        // Update user profile
        updateUser: (state, action) => {
            state.user = { ...state.user, ...action.payload };
            if (state.user) {
                localStorage.setItem("user", JSON.stringify(state.user));
            }
        },
    },
    extraReducers: (builder) => {
        builder
            // Login cases
            .addCase(login.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.token = action.payload.access;
                state.user = action.payload.user;
                state.refresh = action.payload.refresh;
                state.isLoading = false;
                state.error = null;
            })
            .addCase(login.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
                state.token = null;
                state.user = null;
                state.refresh = null;
            })
            // Registration cases
            .addCase(register.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state, action) => {
                state.isLoading = false;
                state.error = null;
                // Optionally auto-login after registration
                // If your backend returns tokens after registration, uncomment below:
                // state.token = action.payload.access;
                // state.user = action.payload.user;
                // state.refresh = action.payload.refresh;
                // saveAuth(action.payload.access, action.payload.user, action.payload.refresh);
            })
            .addCase(register.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            // Token refresh cases
            .addCase(refreshToken.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(refreshToken.fulfilled, (state, action) => {
                state.token = action.payload.access;
                state.isLoading = false;
                state.error = null;
            })
            .addCase(refreshToken.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
                // If refresh fails, logout user
                clearAuth();
                state.token = null;
                state.user = null;
                state.refresh = null;
            })
            // Logout cases
            .addCase(logoutUser.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(logoutUser.fulfilled, (state) => {
                state.token = null;
                state.user = null;
                state.refresh = null;
                state.isLoading = false;
                state.error = null;
            })
            .addCase(logoutUser.rejected, (state) => {
                // Even if logout fails, clear the state
                state.token = null;
                state.user = null;
                state.refresh = null;
                state.isLoading = false;
            });
    },
});

// Export actions
export const { logout, clearError, clearLoading, updateUser } =
    authSlice.actions;

// Selectors
export const selectIsAuthenticated = (state) => !!state.auth.token;
export const selectUser = (state) => state.auth.user;
export const selectToken = (state) => state.auth.token;
export const selectRefreshToken = (state) => state.auth.refresh;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;

// Export reducer
export default authSlice.reducer;
