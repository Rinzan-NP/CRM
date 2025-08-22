import React from 'react';
import { FiDollarSign } from 'react-icons/fi';

const VATBreakdownDetails = ({ reports }) => {
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

  // VAT breakdown chart data for colors
  const vatChartData = vatSummary ? vatSummary.categories.map((cat, index) => ({
    ...cat,
    color: ['#6366f1', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'][index % 6]
  })) : [];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-gray-100">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-xl">
            <FiDollarSign className="text-indigo-600" size={20} />
          </div>
          VAT Categories Breakdown
        </h3>
        <p className="text-sm text-gray-600 mt-1">Detailed VAT analysis by category</p>
      </div>
      {vatSummary && vatSummary.categories.length > 0 ? (
        <div className="divide-y divide-gray-100">
          {vatSummary.categories.map((category, index) => (
            <div key={category.category} className="p-5 hover:bg-gray-50 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">{category.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: vatChartData[index]?.color || '#6366f1' }}
                    ></div>
                    <span className="text-sm text-gray-500">
                      {((category.sales / vatSummary.totalSales) * 100).toFixed(1)}% of total sales
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Net Sales</p>
                    <p className="font-bold text-gray-800">{formatCurrency(category.sales)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">VAT Amount</p>
                    <p className="font-bold text-indigo-700">{formatCurrency(category.vat)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">VAT Rate</p>
                    <p className="font-bold text-gray-800">
                      {category.sales > 0 ? ((category.vat / category.sales) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 text-center text-gray-400 bg-gray-50">
          No VAT categories data available
        </div>
      )}
    </div>
  );
};

export default VATBreakdownDetails;