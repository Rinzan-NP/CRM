import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchAuditLogs, 
  fetchAuditStatistics, 
  fetchAuditDashboard,
  setFilters, 
  clearFilters, 
  setCurrentPage
} from '../redux/auditLogsSlice';
import PageHeader from '../components/layout/PageHeader';
import { 
  FiUser, 
  FiActivity, 
  FiDatabase, 
  FiHash, 
  FiClock, 
  FiFileText,
  FiChevronDown,
  FiChevronUp,
  FiFilter,
  FiSearch,
  FiDownload,
  FiRefreshCw,
  FiCalendar,
  FiX
} from 'react-icons/fi';

const AuditLogs = () => {
  const { 
    auditLogs, 
    loading, 
    statistics, 
    dashboard, 
    pagination, 
    filters, 
    error 
  } = useSelector((state) => state.auditLogs);
  const dispatch = useDispatch();
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    dispatch(fetchAuditLogs({ ...filters, page: pagination.currentPage }));
    dispatch(fetchAuditStatistics({ days: 30 }));
    dispatch(fetchAuditDashboard());
  }, [dispatch, filters, pagination.currentPage]);

  const toggleRowExpansion = (logId) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(logId)) {
      newExpandedRows.delete(logId);
    } else {
      newExpandedRows.add(logId);
    }
    setExpandedRows(newExpandedRows);
  };

  const handleFilterChange = (key, value) => {
    dispatch(setFilters({ [key]: value }));
    dispatch(setCurrentPage(1)); // Reset to first page when filtering
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
    dispatch(setCurrentPage(1)); // Reset to first page when clearing filters
  };

  const handlePageChange = (page) => {
    dispatch(setCurrentPage(page));
  };

  const handleRefresh = () => {
    dispatch(fetchAuditLogs({ ...filters, page: pagination.currentPage }));
    dispatch(fetchAuditStatistics({ days: 30 }));
    dispatch(fetchAuditDashboard());
  };

  const getActionBadgeClasses = (action) => {
    switch (action) {
      case 'create':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'update':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delete':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'block':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'unblock':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'read':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  // Card view for mobile devices
  const renderCardView = () => (
    <div className="space-y-4">
      {auditLogs.map((log) => {
        const isExpanded = expandedRows.has(log.id);
        const { date, time } = formatTimestamp(log.timestamp);
        
        return (
          <div key={log.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Card Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full border ${getActionBadgeClasses(log.action)}`}>
                    {log.action}
                  </span>
                  <span className="text-sm font-medium text-gray-600">{log.model_name}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">{date}</div>
                  <div className="text-xs text-gray-400">{time}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1 text-gray-600">
                  <FiUser className="h-3 w-3" />
                  <span className="font-medium">{log.performed_by_username || log.performed_by_email || 'System'}</span>
                </div>
              </div>
              
              {/* Description field removed as it's not in the new audit model */}
              
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <FiHash className="h-3 w-3" />
                  <span>{log.model_name} #{log.record_number || log.id}</span>
                </div>
                
                <button
                  onClick={() => toggleRowExpansion(log.id)}
                  className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <FiFileText className="h-3 w-3" />
                  <span>Changes</span>
                  {isExpanded ? (
                    <FiChevronUp className="h-3 w-3" />
                  ) : (
                    <FiChevronDown className="h-3 w-3" />
                  )}
                </button>
              </div>
            </div>
            
            {/* Expandable Changes Section */}
            {isExpanded && (
              <div className="p-4 bg-gray-50">
                <div className="text-xs text-gray-600 mb-2 font-medium">Detailed Changes:</div>
                <div className="space-y-2">
                  {log.before_data && Object.keys(log.before_data).length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-red-600 mb-1">Before Data:</div>
                      <pre className="text-xs bg-red-50 p-2 rounded border border-red-200 overflow-auto max-h-32">
                        {JSON.stringify(log.before_data, null, 2)}
                      </pre>
                    </div>
                  )}
                  {log.after_data && Object.keys(log.after_data).length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-green-600 mb-1">After Data:</div>
                      <pre className="text-xs bg-green-50 p-2 rounded border border-green-200 overflow-auto max-h-32">
                        {JSON.stringify(log.after_data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // Table view for larger screens
  const renderTableView = () => (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center space-x-1">
                  <FiUser className="h-3 w-3" />
                  <span>User</span>
                </div>
              </th>
              <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center space-x-1">
                  <FiActivity className="h-3 w-3" />
                  <span>Action</span>
                </div>
              </th>
              <th scope="col" className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center space-x-1">
                  <FiDatabase className="h-3 w-3" />
                  <span>Category</span>
                </div>
              </th>
              <th scope="col" className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center space-x-1">
                  <FiHash className="h-3 w-3" />
                  <span>Object</span>
                </div>
              </th>
              <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center space-x-1">
                  <FiClock className="h-3 w-3" />
                  <span>Time</span>
                </div>
              </th>
              <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center space-x-1">
                  <FiFileText className="h-3 w-3" />
                  <span>Changes</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {auditLogs.map((log) => {
              const { date, time } = formatTimestamp(log.timestamp);
              return (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 truncate max-w-32">
                        {log.performed_by_username || log.performed_by_email || 'System'}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getActionBadgeClasses(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="hidden md:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="truncate max-w-24">{log.model_name}</span>
                  </td>
                  <td className="hidden lg:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="space-y-1">
                      <div className="font-mono text-xs">{log.model_name}</div>
                      {log.record_number && (
                        <div className="text-xs text-blue-600">#{log.record_number}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="space-y-1">
                      <div className="text-xs">{date}</div>
                      <div className="text-xs text-gray-400">{time}</div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 text-sm text-gray-500">
                    <details className="cursor-pointer">
                      <summary className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm">
                        View Changes
                      </summary>
                      <div className="mt-2 relative">
                        <div className="space-y-2">
                          {log.before_data && Object.keys(log.before_data).length > 0 && (
                            <div>
                              <div className="text-xs font-medium text-red-600 mb-1">Before Data:</div>
                              <pre className="text-xs bg-red-50 p-2 rounded border border-red-200 overflow-auto max-h-32">
                                {JSON.stringify(log.before_data, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.after_data && Object.keys(log.after_data).length > 0 && (
                            <div>
                              <div className="text-xs font-medium text-green-600 mb-1">After Data:</div>
                              <pre className="text-xs bg-green-50 p-2 rounded border border-green-200 overflow-auto max-h-32">
                                {JSON.stringify(log.after_data, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </details>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Filter component
  const renderFilters = () => (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            <FiRefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleClearFilters}
            className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <FiX className="h-4 w-4" />
            <span>Clear</span>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
          <select
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="block">Block</option>
            <option value="unblock">Unblock</option>
            <option value="read">Read</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
          <select
            value={filters.model_name}
            onChange={(e) => handleFilterChange('model_name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Models</option>
            <option value="User">User</option>
            <option value="Customer">Customer</option>
            <option value="Supplier">Supplier</option>
            <option value="Product">Product</option>
            <option value="VAT">VAT</option>
            <option value="Route">Route</option>
            <option value="RouteVisit">Route Visit</option>
            <option value="SalesOrder">Sales Order</option>
            <option value="Invoice">Invoice</option>
            <option value="Payment">Payment</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search logs..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
          <div className="flex space-x-2">
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Pagination component
  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;
    
    const pages = [];
    const startPage = Math.max(1, pagination.currentPage - 2);
    const endPage = Math.min(pagination.totalPages, pagination.currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return (
      <div className="flex items-center justify-between bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevious}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNext}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing page <span className="font-medium">{pagination.currentPage}</span> of{' '}
              <span className="font-medium">{pagination.totalPages}</span> ({pagination.count} total logs)
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevious}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {pages.map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    page === pagination.currentPage
                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <FiX className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Audit Logs</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <FiRefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header with responsive controls */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <PageHeader title="Audit Logs" subtitle="System activity and change history" />
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded-md transition-colors"
                >
                  <FiFilter className="h-4 w-4" />
                  <span>Filters</span>
                </button>
              
              {/* View Toggle - Hidden on larger screens since table works well there */}
              <div className="flex sm:hidden bg-white rounded-lg shadow-sm border p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'table'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Table
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'cards'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Cards
                </button>
              </div>
            </div>
          </div>
          </div>

          {/* Filters */}
          {showFilters && renderFilters()}

          {/* Stats Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FiActivity className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Logs</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">{pagination.count}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FiActivity className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Today</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">
                    {dashboard?.today_logs || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FiUser className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                </div>
                <div className="ml-3">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Users</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">
                    {statistics?.user_stats?.length || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FiDatabase className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                </div>
                <div className="ml-3">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Models</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">
                    {statistics?.model_stats?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Content - Responsive based on screen size and user preference */}
          <div className="mt-6">
            {/* Show cards on mobile (unless table specifically requested), table on larger screens */}
            {(viewMode === 'cards' && window.innerWidth < 640) || (window.innerWidth < 640 && viewMode !== 'table') 
              ? renderCardView() 
              : renderTableView()}
          </div>

          {/* Pagination */}
          {renderPagination()}
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;