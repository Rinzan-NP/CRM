// PurchaseOrderReportSection.jsx
import React from 'react';
import { FiTrendingDown, FiDollarSign, FiPackage } from 'react-icons/fi';

const PurchaseOrderReportSection = ({ report }) => {
  if (!report) return null;
  
  const { total_purchases, order_count } = report;
  
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
      <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-xl">
                <FiTrendingDown className="text-orange-600" size={20} />
              </div>
              Purchase Overview
            </h2>
            <p className="text-sm text-gray-600 mt-1">Comprehensive purchase order analytics</p>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Total Purchases Card */}
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-5 border border-orange-100 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-orange-100 rounded-xl">
                <FiDollarSign className="text-orange-600" size={20} />
              </div>
              <div className="text-right">
                <div className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                  Expenses
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-600">Total Purchases</h3>
              <p className="text-2xl font-bold text-orange-700">{formatCurrency(total_purchases)}</p>
              <p className="text-xs text-gray-500 flex items-center">
                <span className="w-2 h-2 bg-orange-400 rounded-full mr-2"></span>
                Total expenditure
              </p>
            </div>
          </div>
          
          {/* Order Count Card */}
          <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-5 border border-slate-100 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-slate-100 rounded-xl">
                <FiPackage className="text-slate-600" size={20} />
              </div>
              <div className="text-right">
                <div className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-full">
                  Orders
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-600">Order Count</h3>
              <p className="text-2xl font-bold text-slate-700">{order_count}</p>
              <p className="text-xs text-gray-500 flex items-center">
                <span className="w-2 h-2 bg-slate-400 rounded-full mr-2"></span>
                Purchase orders
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderReportSection;