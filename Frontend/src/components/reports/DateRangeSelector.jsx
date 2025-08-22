import React from 'react';
import { FiCalendar } from 'react-icons/fi';

const DateRangeSelector = ({ dateRange, handleDateRangeChange }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-xl">
            <FiCalendar className="text-indigo-600" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Date Range Selection</h2>
            <p className="text-sm text-gray-600 mt-1">Configure the reporting period for analytics</p>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Start Date */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-5 border border-indigo-100 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-indigo-100 rounded-xl">
                <FiCalendar className="text-indigo-600" size={20} />
              </div>
              <div className="text-right">
                <div className="text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
                  Start
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-600">From Date</h3>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 text-gray-700 font-medium"
              />
              <p className="text-xs text-gray-500 flex items-center">
                <span className="w-2 h-2 bg-indigo-400 rounded-full mr-2"></span>
                Report start date
              </p>
            </div>
          </div>
          
          {/* End Date */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-100 rounded-xl">
                <FiCalendar className="text-purple-600" size={20} />
              </div>
              <div className="text-right">
                <div className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                  End
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-600">To Date</h3>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 text-gray-700 font-medium"
              />
              <p className="text-xs text-gray-500 flex items-center">
                <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                Report end date
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateRangeSelector;