import React from 'react';
import { FiDollarSign, FiTrendingUp, FiTruck, FiCreditCard } from 'react-icons/fi';

const SummaryCards = ({ reports, shouldShow }) => {
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Helper function to process VAT data
  const getVATSummary = () => {
    if (!reports.vat) return null;
    
    const vatCategories = Object.keys(reports.vat).filter(key => 
      !['period_start', 'period_end'].includes(key)
    );
    
    const totalSales = vatCategories.reduce((sum, category) => 
      sum + (reports.vat[category]?.sales || 0), 0
    );
    
    const totalVAT = vatCategories.reduce((sum, category) => 
      sum + (reports.vat[category]?.vat || 0), 0
    );
    
    return {
      categories: vatCategories.map(category => ({
        name: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        category: category,
        sales: reports.vat[category]?.sales || 0,
        vat: reports.vat[category]?.vat || 0
      })),
      totalSales,
      totalVAT
    };
  };

  const vatSummary = getVATSummary();

  const showCards = shouldShow('vat') || shouldShow('sales') || shouldShow('purchases') || shouldShow('routes') || shouldShow('payments');

  if (!showCards) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* VAT Summary */}
      {shouldShow('vat') && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
          <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-indigo-100 rounded-xl">
                <FiDollarSign className="text-indigo-600" size={20} />
              </div>
              <div className="text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
                VAT
              </div>
            </div>
          </div>
          <div className="p-5">
            <h3 className="text-sm font-medium text-gray-600 mb-3">VAT Summary</h3>
            {vatSummary ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Total Sales</span>
                  <span className="text-sm font-bold text-indigo-700">{formatCurrency(vatSummary.totalSales)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Total VAT</span>
                  <span className="text-sm font-bold text-indigo-600">{formatCurrency(vatSummary.totalVAT)}</span>
                </div>
                <div className="text-xs text-gray-500 flex items-center">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full mr-2"></span>
                  {vatSummary.categories.length} categories
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400">No VAT data available</p>
            )}
          </div>
        </div>
      )}

      {/* Sales vs Purchases */}
      {(shouldShow('sales') || shouldShow('purchases')) && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-green-100 rounded-xl">
                <FiTrendingUp className="text-green-600" size={20} />
              </div>
              <div className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                Summary
              </div>
            </div>
          </div>
          <div className="p-5">
            <h3 className="text-sm font-medium text-gray-600 mb-3">Sales vs Purchases</h3>
            {reports.salesVsPurchase ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Total Sales</span>
                  <span className="text-sm font-bold text-green-700">
                    {formatCurrency(reports.salesVsPurchase.sales?.total_sales || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Total Purchases</span>
                  <span className="text-sm font-bold text-orange-700">
                    {formatCurrency(reports.salesVsPurchase.purchases?.total_purchases || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Net Profit</span>
                  <span className="text-sm font-bold text-indigo-700">
                    {formatCurrency(reports.salesVsPurchase.net_profit || 0)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400">No sales data available</p>
            )}
          </div>
        </div>
      )}

      {/* Route Efficiency */}
      {shouldShow('routes') && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
          <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-purple-100 rounded-xl">
                <FiTruck className="text-purple-600" size={20} />
              </div>
              <div className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                Routes
              </div>
            </div>
          </div>
          <div className="p-5">
            <h3 className="text-sm font-medium text-gray-600 mb-3">Route Efficiency</h3>
            {reports.routeEfficiency && reports.routeEfficiency.length > 0 ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Avg. Completion</span>
                  <span className="text-sm font-bold text-purple-700">
                    {(
                      reports.routeEfficiency.reduce((sum, route) => sum + route.completion_rate, 0) / 
                      reports.routeEfficiency.length
                    ).toFixed(1)}%
                  </span>
                </div>
                <div className="text-xs text-gray-500 flex items-center">
                  <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                  {reports.routeEfficiency.length} routes analyzed
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400">No route data available</p>
            )}
          </div>
        </div>
      )}

      {/* Outstanding Payments */}
      {shouldShow('payments') && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-amber-100 rounded-xl">
                <FiCreditCard className="text-amber-600" size={20} />
              </div>
              <div className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                Payments
              </div>
            </div>
          </div>
          <div className="p-5">
            <h3 className="text-sm font-medium text-gray-600 mb-3">Outstanding Payments</h3>
            {reports.outstandingPayments && reports.outstandingPayments.length > 0 ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Total Outstanding</span>
                  <span className="text-sm font-bold text-amber-700">
                    {formatCurrency(reports.outstandingPayments.reduce((sum, customer) => sum + customer.total_outstanding, 0))}
                  </span>
                </div>
                <div className="text-xs text-gray-500 flex items-center">
                  <span className="w-2 h-2 bg-amber-400 rounded-full mr-2"></span>
                  {reports.outstandingPayments.length} customers with dues
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400">No outstanding payments</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryCards;