// SalesOrderReportSection.jsx
import React from 'react';
import { FiTrendingUp, FiDollarSign, FiShoppingBag } from 'react-icons/fi';

const SalesOrderReportSection = ({ report }) => {
  if (!report) return null;
  
  const { total_sales, total_profit, order_count } = report;
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-xl">
                <FiTrendingUp className="text-green-600" size={20} />
              </div>
              Sales Overview
            </h2>
            <p className="text-sm text-gray-600 mt-1">Comprehensive sales performance metrics</p>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Sales Card */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-100 rounded-xl">
                <FiDollarSign className="text-green-600" size={20} />
              </div>
              <div className="text-right">
                <div className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  Revenue
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-600">Total Sales</h3>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(total_sales)}</p>
              <p className="text-xs text-gray-500 flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                Gross revenue
              </p>
            </div>
          </div>
          
          {/* Total Profit Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <FiTrendingUp className="text-blue-600" size={20} />
              </div>
              <div className="text-right">
                <div className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                  Profit
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-600">Total Profit</h3>
              <p className="text-2xl font-bold text-blue-700">{formatCurrency(total_profit)}</p>
              <p className="text-xs text-gray-500 flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                Net profit margin
              </p>
            </div>
          </div>
          
          {/* Order Count Card */}
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-5 border border-purple-100 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-100 rounded-xl">
                <FiShoppingBag className="text-purple-600" size={20} />
              </div>
              <div className="text-right">
                <div className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                  Orders
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-600">Order Count</h3>
              <p className="text-2xl font-bold text-purple-700">{order_count}</p>
              <p className="text-xs text-gray-500 flex items-center">
                <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                Total orders
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesOrderReportSection;