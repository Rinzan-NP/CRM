import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

// Fetch audit logs with filtering and pagination
export const fetchAuditLogs = createAsyncThunk(
  'auditLogs/fetchAuditLogs',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/audit/api/logs/', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch audit log details
export const fetchAuditLogDetail = createAsyncThunk(
  'auditLogs/fetchAuditLogDetail',
  async (logId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/audit/api/logs/${logId}/`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch audit statistics
export const fetchAuditStatistics = createAsyncThunk(
  'auditLogs/fetchAuditStatistics',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/audit/api/statistics/', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch audit dashboard data
export const fetchAuditDashboard = createAsyncThunk(
  'auditLogs/fetchAuditDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/audit/api/dashboard/');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Export audit logs
export const exportAuditLogs = createAsyncThunk(
  'auditLogs/exportAuditLogs',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/audit/api/export/', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const auditLogsSlice = createSlice({
  name: 'auditLogs',
  initialState: {
    auditLogs: [],
    currentLog: null,
    statistics: null,
    dashboard: null,
    loading: false,
    detailLoading: false,
    statsLoading: false,
    dashboardLoading: false,
    exportLoading: false,
    error: null,
    pagination: {
      count: 0,
      totalPages: 0,
      currentPage: 1,
      hasNext: false,
      hasPrevious: false,
    },
    filters: {
      action: '',
      category: '',
      model_name: '',
      search: '',
      date_from: '',
      date_to: '',
      user: '',
    },
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        action: '',
        category: '',
        model_name: '',
        search: '',
        date_from: '',
        date_to: '',
        user: '',
      };
    },
    setCurrentPage: (state, action) => {
      state.pagination.currentPage = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch audit logs
      .addCase(fetchAuditLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAuditLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.auditLogs = action.payload.results || action.payload;
        if (action.payload.count !== undefined) {
          state.pagination = {
            count: action.payload.count,
            totalPages: action.payload.total_pages,
            currentPage: action.payload.current_page,
            hasNext: action.payload.has_next,
            hasPrevious: action.payload.has_previous,
          };
        }
      })
      .addCase(fetchAuditLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch audit log detail
      .addCase(fetchAuditLogDetail.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchAuditLogDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.currentLog = action.payload;
      })
      .addCase(fetchAuditLogDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload;
      })
      // Fetch audit statistics
      .addCase(fetchAuditStatistics.pending, (state) => {
        state.statsLoading = true;
        state.error = null;
      })
      .addCase(fetchAuditStatistics.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.statistics = action.payload;
      })
      .addCase(fetchAuditStatistics.rejected, (state, action) => {
        state.statsLoading = false;
        state.error = action.payload;
      })
      // Fetch audit dashboard
      .addCase(fetchAuditDashboard.pending, (state) => {
        state.dashboardLoading = true;
        state.error = null;
      })
      .addCase(fetchAuditDashboard.fulfilled, (state, action) => {
        state.dashboardLoading = false;
        state.dashboard = action.payload;
      })
      .addCase(fetchAuditDashboard.rejected, (state, action) => {
        state.dashboardLoading = false;
        state.error = action.payload;
      })
      // Export audit logs
      .addCase(exportAuditLogs.pending, (state) => {
        state.exportLoading = true;
        state.error = null;
      })
      .addCase(exportAuditLogs.fulfilled, (state, action) => {
        state.exportLoading = false;
        // Handle export data (could trigger download)
      })
      .addCase(exportAuditLogs.rejected, (state, action) => {
        state.exportLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setFilters, clearFilters, setCurrentPage, clearError } = auditLogsSlice.actions;
export default auditLogsSlice.reducer;