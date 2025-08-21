import React, { useState, useEffect } from 'react';
import SalesOrderReportSection from '../components/reports/SalesOrderReportSection';
import PurchaseOrderReportSection from '../components/reports/PurchaseOrderReportSection';
import { useSelector, useDispatch } from 'react-redux';
import api from '../services/api';
import PageHeader from '../components/layout/PageHeader';
import { FiRefreshCw, FiDownload, FiCalendar, FiTrendingUp, FiDollarSign, FiTruck, FiCreditCard, FiPieChart, FiBarChart2 } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Reports = () => {
  const [reports, setReports] = useState({
    vat: null,
    salesVsPurchase: null,
    routeEfficiency: null,
    outstandingPayments: null,
    salesOrder: null,
    purchaseOrder: null
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const fetchReports = async () => {
    setLoading(true);
    try {
      // Only fetch reports needed for the active tab
      const requests = [];
      
      if (activeTab === 'overview' || activeTab === 'vat') {
        requests.push(api.get(`/transactions/vat-report/`, { params: { start: dateRange.start, end: dateRange.end } }));
      }
      
      if (activeTab === 'overview' || activeTab === 'sales' || activeTab === 'purchases') {
        requests.push(api.get(`/transactions/reports/sales-vs-purchase/`, { params: { start: dateRange.start, end: dateRange.end } }));
      }
      
      if (activeTab === 'overview' || activeTab === 'routes') {
        requests.push(api.get(`/transactions/reports/route-efficiency/`, { params: { start: dateRange.start, end: dateRange.end } }));
      }
      
      if (activeTab === 'overview' || activeTab === 'payments') {
        requests.push(api.get(`/transactions/reports/outstanding-payments/`));
      }
      
      if (activeTab === 'overview' || activeTab === 'sales') {
        requests.push(api.get(`/transactions/sales-order-report/`, { params: { start: dateRange.start, end: dateRange.end } }));
      }
      
      if (activeTab === 'overview' || activeTab === 'purchases') {
        requests.push(api.get(`/transactions/purchase-order-report/`, { params: { start: dateRange.start, end: dateRange.end } }));
      }

      const responses = await Promise.all(requests);
      
      // Update state with fetched reports
      const updatedReports = { ...reports };
      let responseIndex = 0;
      
      if (activeTab === 'overview' || activeTab === 'vat') {
        updatedReports.vat = responses[responseIndex++]?.data || null;
      }
      
      if (activeTab === 'overview' || activeTab === 'sales' || activeTab === 'purchases') {
        updatedReports.salesVsPurchase = responses[responseIndex++]?.data || null;
      }
      
      if (activeTab === 'overview' || activeTab === 'routes') {
        updatedReports.routeEfficiency = responses[responseIndex++]?.data || null;
      }
      
      if (activeTab === 'overview' || activeTab === 'payments') {
        updatedReports.outstandingPayments = responses[responseIndex++]?.data || null;
      }
      
      if (activeTab === 'overview' || activeTab === 'sales') {
        updatedReports.salesOrder = responses[responseIndex++]?.data || null;
      }
      
      if (activeTab === 'overview' || activeTab === 'purchases') {
        updatedReports.purchaseOrder = responses[responseIndex++]?.data || null;
      }
      
      setReports(updatedReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [dateRange, activeTab]); // Added activeTab as dependency

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
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

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Check if a tab should be displayed
  const shouldShow = (tabType) => {
    return activeTab === 'overview' || activeTab === tabType;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader 
          title="Business Analytics Dashboard" 
          subtitle="Comprehensive insights and performance metrics"
          actions={[
            <button
              key="refresh"
              onClick={fetchReports}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} />
              Refresh Data
            </button>,
            <button
              key="export"
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <FiDownload />
              Export Report
            </button>
          ]}
        />

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-sm p-1">
          <div className="flex flex-wrap">
            {['overview', 'sales', 'purchases', 'vat', 'routes', 'payments'].map((tab) => (
              <button
                key={tab}
                className={`flex-1 min-w-[120px] px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${activeTab === tab ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="bg-white rounded-2xl shadow-sm p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
              <FiCalendar className="text-indigo-600" />
              Select Date Range
            </h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => handleDateRangeChange('end', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sales Order Report */}
        {shouldShow('sales') && <SalesOrderReportSection report={reports.salesOrder} />}

        {/* Purchase Order Report */}
        {shouldShow('purchases') && <PurchaseOrderReportSection report={reports.purchaseOrder} />}

        {/* Summary Cards - Only show in overview or relevant tab */}
        {(shouldShow('vat') || shouldShow('sales') || shouldShow('purchases') || shouldShow('routes') || shouldShow('payments')) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* VAT Summary */}
            {shouldShow('vat') && (
              <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                    <FiDollarSign size={20} />
                  </div>
                  <h3 className="font-medium text-gray-700">VAT Summary</h3>
                </div>
                {vatSummary ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Total Sales</span>
                      <span className="font-medium">{formatCurrency(vatSummary.totalSales)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Total VAT</span>
                      <span className="font-medium text-indigo-600">{formatCurrency(vatSummary.totalVAT)}</span>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center">
                      <FiPieChart className="mr-1" />
                      {vatSummary.categories.length} categories
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400">No VAT data available</p>
                )}
              </div>
            )}

            {/* Sales vs Purchases */}
            {(shouldShow('sales') || shouldShow('purchases')) && (
              <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-xl text-green-600">
                    <FiTrendingUp size={20} />
                  </div>
                  <h3 className="font-medium text-gray-700">Sales vs Purchases</h3>
                </div>
                {reports.salesVsPurchase ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Total Sales</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(reports.salesVsPurchase.sales?.total_sales || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Total Purchases</span>
                      <span className="font-medium text-rose-600">
                        {formatCurrency(reports.salesVsPurchase.purchases?.total_purchases || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Net Profit</span>
                      <span className="font-medium text-indigo-600">
                        {formatCurrency(reports.salesVsPurchase.net_profit || 0)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400">No sales data available</p>
                )}
              </div>
            )}

            {/* Route Efficiency */}
            {shouldShow('routes') && (
              <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-xl text-purple-600">
                    <FiTruck size={20} />
                  </div>
                  <h3 className="font-medium text-gray-700">Route Efficiency</h3>
                </div>
                {reports.routeEfficiency && reports.routeEfficiency.length > 0 ? (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-500">Avg. Completion</span>
                      <span className="font-medium">
                        {(
                          reports.routeEfficiency.reduce((sum, route) => sum + route.completion_rate, 0) / 
                          reports.routeEfficiency.length
                        ).toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <FiTruck className="mr-1" />
                      {reports.routeEfficiency.length} routes analyzed
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400">No route data available</p>
                )}
              </div>
            )}

            {/* Outstanding Payments */}
            {shouldShow('payments') && (
              <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-amber-100 rounded-xl text-amber-600">
                    <FiCreditCard size={20} />
                  </div>
                  <h3 className="font-medium text-gray-700">Outstanding Payments</h3>
                </div>
                {reports.outstandingPayments && reports.outstandingPayments.length > 0 ? (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-500">Total Outstanding</span>
                      <span className="font-medium text-amber-600">
                        {formatCurrency(reports.outstandingPayments.reduce((sum, customer) => sum + customer.total_outstanding, 0))}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <FiCreditCard className="mr-1" />
                      {reports.outstandingPayments.length} customers with dues
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400">No outstanding payments</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Charts and Detailed Reports */}
        {(shouldShow('sales') || shouldShow('purchases') || shouldShow('vat')) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Sales vs Purchases Chart */}
            {(shouldShow('sales') || shouldShow('purchases')) && (
              <div className="bg-white rounded-2xl shadow-sm p-5 md:p-6">
                <h3 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
                  <FiBarChart2 className="text-indigo-600" />
                  Sales vs Purchases Trend
                </h3>
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
            )}

            {/* VAT Breakdown Chart */}
            {shouldShow('vat') && (
              <div className="bg-white rounded-2xl shadow-sm p-5 md:p-6">
                <h3 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
                  <FiPieChart className="text-indigo-600" />
                  VAT Categories Distribution
                </h3>
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
            )}
          </div>
        )}

        {/* Detailed VAT Breakdown */}
        {shouldShow('vat') && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 md:p-6 border-b bg-gradient-to-r from-indigo-50 to-gray-50">
              <h3 className="font-medium text-gray-700 flex items-center gap-2">
                <FiDollarSign className="text-indigo-600" />
                VAT Categories Breakdown
              </h3>
            </div>
            {vatSummary && vatSummary.categories.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {vatSummary.categories.map((category, index) => (
                  <div key={category.category} className="p-4 md:p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{category.name}</h4>
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
                          <p className="font-medium">{formatCurrency(category.sales)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">VAT Amount</p>
                          <p className="font-medium text-indigo-600">{formatCurrency(category.vat)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">VAT Rate</p>
                          <p className="font-medium">
                            {category.sales > 0 ? ((category.vat / category.sales) * 100).toFixed(1) : 0}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 md:p-6 text-center text-gray-400 bg-gray-50">
                No VAT categories data available
              </div>
            )}
          </div>
        )}

        {/* Route Efficiency Details */}
        {shouldShow('routes') && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 md:p-6 border-b bg-gradient-to-r from-purple-50 to-gray-50">
              <h3 className="font-medium text-gray-700 flex items-center gap-2">
                <FiTruck className="text-purple-600" />
                Route Efficiency Details
              </h3>
            </div>
            {reports.routeEfficiency && reports.routeEfficiency.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {reports.routeEfficiency.map((route, index) => (
                  <div key={index} className="p-4 md:p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{route.route_name}</h4>
                        <p className="text-sm text-gray-500">{route.date}</p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Completed</p>
                          <p className="font-medium">{route.completed}/{route.total_planned}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Rate</p>
                          <p className={`font-medium ${
                            route.completion_rate > 90 ? 'text-green-600' : 
                            route.completion_rate > 70 ? 'text-amber-600' : 'text-rose-600'
                          }`}>
                            {route.completion_rate.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 md:p-6 text-center text-gray-400 bg-gray-50">
                No route efficiency data available
              </div>
            )}
          </div>
        )}

        {/* Outstanding Payments Details */}
        {shouldShow('payments') && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 md:p-6 border-b bg-gradient-to-r from-amber-50 to-gray-50">
              <h3 className="font-medium text-gray-700 flex items-center gap-2">
                <FiCreditCard className="text-amber-600" />
                Outstanding Payments Details
              </h3>
            </div>
            {reports.outstandingPayments && reports.outstandingPayments.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {reports.outstandingPayments.map((customer, index) => (
                  <div key={index} className="p-4 md:p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{customer.customer_name}</h4>
                        <p className="text-sm text-gray-500">{customer.customer_email}</p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Invoices</p>
                          <p className="font-medium">{customer.invoice_count}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Amount Due</p>
                          <p className="font-medium text-amber-600">
                            {formatCurrency(customer.total_outstanding)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 md:p-6 text-center text-gray-400 bg-gray-50">
                No outstanding payments data available
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;