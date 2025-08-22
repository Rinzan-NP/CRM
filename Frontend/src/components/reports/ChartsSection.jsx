import React from 'react';
import { FiBarChart2, FiPieChart } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const ChartsSection = ({ reports, shouldShow }) => {
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

  // Prepare chart data
  const salesVsPurchaseChartData = reports.salesVsPurchase ? [
    { name: 'Sales', value: reports.salesVsPurchase.sales?.total_sales || 0 },
    { name: 'Purchases', value: reports.salesVsPurchase.purchases?.total_purchases || 0 },
    { name: 'Profit', value: reports.salesVsPurchase.net_profit || 0 }
  ] : [];

  // VAT breakdown chart data
  const vatChartData = vatSummary ? vatSummary.categories.map((cat, index) => ({
    ...cat,
    color: ['#6366f1', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'][index % 6]
  })) : [];

  const showCharts = shouldShow('sales') || shouldShow('purchases') || shouldShow('vat');

  if (!showCharts) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Sales vs Purchases Chart */}
      {(shouldShow('sales') || shouldShow('purchases')) && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <FiBarChart2 className="text-blue-600" size={20} />
              </div>
              Sales vs Purchases Trend
            </h3>
            <p className="text-sm text-gray-600 mt-1">Performance comparison analytics</p>
          </div>
          <div className="p-6">
            {salesVsPurchaseChartData.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesVsPurchaseChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), "Amount"]}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend />
                    <Bar dataKey="value" fill="#6366f1" name="Amount (AED)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-xl">
                <FiBarChart2 size={48} className="mb-3 opacity-50" />
                <p>No chart data available</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VAT Breakdown Chart */}
      {shouldShow('vat') && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-100">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-xl">
                <FiPieChart className="text-purple-600" size={20} />
              </div>
              VAT Categories Distribution
            </h3>
            <p className="text-sm text-gray-600 mt-1">Tax breakdown by category</p>
          </div>
          <div className="p-6">
            {vatChartData.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={vatChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="sales"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {vatChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), "Sales"]}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-xl">
                <FiPieChart size={48} className="mb-3 opacity-50" />
                <p>No VAT data available</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartsSection;