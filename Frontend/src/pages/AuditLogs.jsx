import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAuditLogs } from '../redux/auditLogsSlice';
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
  FiFilter
} from 'react-icons/fi';

const AuditLogs = () => {
  const { auditLogs, loading: loadingAuditLogs } = useSelector((state) => state.auditLogs);
  const dispatch = useDispatch();
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'

  useEffect(() => {
    dispatch(fetchAuditLogs());
  }, [dispatch]);

  const toggleRowExpansion = (logId) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(logId)) {
      newExpandedRows.delete(logId);
    } else {
      newExpandedRows.add(logId);
    }
    setExpandedRows(newExpandedRows);
  };

  const getActionBadgeClasses = (action) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DELETE':
        return 'bg-red-100 text-red-800 border-red-200';
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
                  <span className="font-medium">{log.user_email || 'System'}</span>
                </div>
                {log.user_role && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {log.user_role}
                  </span>
                )}
              </div>
              
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <FiHash className="h-3 w-3" />
                  <span>ID: {log.object_id}</span>
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
                <div className="text-xs text-gray-600 mb-2 font-medium">Changes:</div>
                <pre className="text-xs bg-white p-3 rounded border border-gray-200 overflow-auto max-h-40">
                  {JSON.stringify(log.changes, null, 2)}
                </pre>
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
                  <span>Model</span>
                </div>
              </th>
              <th scope="col" className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center space-x-1">
                  <FiHash className="h-3 w-3" />
                  <span>Object ID</span>
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
                        {log.user_email || 'System'}
                      </div>
                      {log.user_role && (
                        <div className="text-xs text-gray-500 truncate">
                          {log.user_role}
                        </div>
                      )}
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
                    <span className="font-mono text-xs">{log.object_id}</span>
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
                        <pre className="text-xs bg-gray-50 p-2 rounded max-w-xs lg:max-w-sm overflow-auto max-h-32 border">
                          {JSON.stringify(log.changes, null, 2)}
                        </pre>
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

  if (loadingAuditLogs) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading audit logs...</p>
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

          {/* Stats Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FiActivity className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Logs</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">{auditLogs.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FiActivity className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Creates</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">
                    {auditLogs.filter(log => log.action === 'CREATE').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FiActivity className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Updates</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">
                    {auditLogs.filter(log => log.action === 'UPDATE').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <FiActivity className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                </div>
                <div className="ml-3">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Deletes</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">
                    {auditLogs.filter(log => log.action === 'DELETE').length}
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
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;