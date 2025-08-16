import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import api from '../services/api';
import PageHeader from '../components/layout/PageHeader';
import { FiRefreshCw, FiDownload, FiCalendar, FiTrendingUp, FiDollarSign, FiTruck, FiCreditCard } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Reports = () => {
  const [reports, setReports] = useState({
    vat: null,
    salesVsPurchase: null,
    routeEfficiency: null,
    outstandingPayments: null
  });
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [vatResponse, salesVsPurchaseResponse, routeEfficiencyResponse, outstandingPaymentsResponse] = 
        await Promise.all([
          api.get(`/transactions/vat-report/`, { params: { start: dateRange.start, end: dateRange.end } }),
          api.get(`/transactions/reports/sales-vs-purchase/`, { params: { start: dateRange.start, end: dateRange.end } }),
          api.get(`/transactions/reports/route-efficiency/`, { params: { start: dateRange.start, end: dateRange.end } }),
          api.get(`/transactions/reports/outstanding-payments/`)
        ]);

      setReports({
        vat: vatResponse.data,
        salesVsPurchase: salesVsPurchaseResponse.data,
        routeEfficiency: routeEfficiencyResponse.data,
        outstandingPayments: outstandingPaymentsResponse.data
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  // Prepare chart data
  const salesVsPurchaseChartData = reports.salesVsPurchase ? [
    { name: 'Sales', value: reports.salesVsPurchase.sales?.total_sales || 0 },
    { name: 'Purchases', value: reports.salesVsPurchase.purchases?.total_purchases || 0 },
    { name: 'Profit', value: reports.salesVsPurchase.net_profit || 0 }
  ] : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader 
          title="Business Analytics" 
          subtitle="Comprehensive insights and performance metrics"
          actions={[
            <button
              key="refresh"
              onClick={fetchReports}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} />
              Refresh
            </button>,
            <button
              key="export"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiDownload />
              Export
            </button>
          ]}
        />

        {/* Date Range Selector */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FiCalendar className="text-blue-600" />
              Date Range
            </h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => handleDateRangeChange('end', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* VAT Summary */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <FiDollarSign size={20} />
              </div>
              <h3 className="font-medium text-gray-700">VAT Summary</h3>
            </div>
            {reports.vat ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Standard Sales</span>
                  <span className="font-medium">AED {reports.vat.standard_sales}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Zero-Rated</span>
                  <span className="font-medium">AED {reports.vat.zero_sales}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Exempt</span>
                  <span className="font-medium">AED {reports.vat.exempt_sales}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">No VAT data available</p>
            )}
          </div>

          {/* Sales vs Purchases */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg text-green-600">
                <FiTrendingUp size={20} />
              </div>
              <h3 className="font-medium text-gray-700">Sales vs Purchases</h3>
            </div>
            {reports.salesVsPurchase ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Total Sales</span>
                  <span className="font-medium text-green-600">AED {reports.salesVsPurchase.sales?.total_sales || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Total Purchases</span>
                  <span className="font-medium text-red-600">AED {reports.salesVsPurchase.purchases?.total_purchases || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Net Profit</span>
                  <span className="font-medium text-blue-600">AED {reports.salesVsPurchase.net_profit || 0}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">No sales data available</p>
            )}
          </div>

          {/* Route Efficiency */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
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
                <div className="text-sm text-gray-500">
                  {reports.routeEfficiency.length} routes analyzed
                </div>
              </div>
            ) : (
              <p className="text-gray-400">No route data available</p>
            )}
          </div>

          {/* Outstanding Payments */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                <FiCreditCard size={20} />
              </div>
              <h3 className="font-medium text-gray-700">Outstanding Payments</h3>
            </div>
            {reports.outstandingPayments && reports.outstandingPayments.length > 0 ? (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-500">Total Outstanding</span>
                  <span className="font-medium text-amber-600">
                    AED {reports.outstandingPayments.reduce((sum, customer) => sum + customer.total_outstanding, 0)}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {reports.outstandingPayments.length} customers with dues
                </div>
              </div>
            ) : (
              <p className="text-gray-400">No outstanding payments</p>
            )}
          </div>
        </div>

        {/* Charts and Detailed Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Sales vs Purchases Chart */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-medium text-gray-700 mb-4">Sales vs Purchases Trend</h3>
            {salesVsPurchaseChartData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesVsPurchaseChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#3b82f6" name="Amount (AED)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No chart data available
              </div>
            )}
          </div>

          {/* VAT Breakdown */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-medium text-gray-700 mb-4">VAT Breakdown</h3>
            {reports.vat ? (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Standard Rate</span>
                    <span className="text-sm font-medium">AED {reports.vat.standard_vat}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(reports.vat.standard_vat / (reports.vat.standard_vat + reports.vat.zero_vat + reports.vat.exempt_vat)) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Zero Rate</span>
                    <span className="text-sm font-medium">AED {reports.vat.zero_vat}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(reports.vat.zero_vat / (reports.vat.standard_vat + reports.vat.zero_vat + reports.vat.exempt_vat)) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Exempt</span>
                    <span className="text-sm font-medium">AED {reports.vat.exempt_vat}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ width: `${(reports.vat.exempt_vat / (reports.vat.standard_vat + reports.vat.zero_vat + reports.vat.exempt_vat)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">No VAT data available</p>
            )}
          </div>
        </div>

        {/* Detailed Reports */}
        <div className="grid grid-cols-1 gap-4">
          {/* Route Efficiency Details */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b">
              <h3 className="font-medium text-gray-700 flex items-center gap-2">
                <FiTruck className="text-purple-600" />
                Route Efficiency Details
              </h3>
            </div>
            {reports.routeEfficiency && reports.routeEfficiency.length > 0 ? (
              <div className="divide-y">
                {reports.routeEfficiency.map((route, index) => (
                  <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-medium">{route.route_name}</h4>
                        <p className="text-sm text-gray-500">{route.date}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Completed</p>
                          <p className="font-medium">{route.completed}/{route.total_planned}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Rate</p>
                          <p className={`font-medium ${
                            route.completion_rate > 90 ? 'text-green-600' : 
                            route.completion_rate > 70 ? 'text-amber-600' : 'text-red-600'
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
              <div className="p-5 text-center text-gray-400">
                No route efficiency data available
              </div>
            )}
          </div>

          {/* Outstanding Payments Details */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b">
              <h3 className="font-medium text-gray-700 flex items-center gap-2">
                <FiCreditCard className="text-amber-600" />
                Outstanding Payments Details
              </h3>
            </div>
            {reports.outstandingPayments && reports.outstandingPayments.length > 0 ? (
              <div className="divide-y">
                {reports.outstandingPayments.map((customer, index) => (
                  <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-medium">{customer.customer_name}</h4>
                        <p className="text-sm text-gray-500">{customer.customer_email}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Invoices</p>
                          <p className="font-medium">{customer.invoice_count}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Amount Due</p>
                          <p className="font-medium text-amber-600">AED {customer.total_outstanding}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 text-center text-gray-400">
                No outstanding payments data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;