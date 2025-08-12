import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import api from '../services/api';
import PageHeader from '../components/layout/PageHeader';

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
      // Fetch VAT Report
      const vatResponse = await api.get(
        `/transactions/vat-report/`,
        { params: { start: dateRange.start, end: dateRange.end } }
      );

      // Fetch Sales vs Purchase Report
      const salesVsPurchaseResponse = await api.get(
        `/transactions/reports/sales-vs-purchase/`,
        { params: { start: dateRange.start, end: dateRange.end } }
      );

      // Fetch Route Efficiency Report
      const routeEfficiencyResponse = await api.get(
        `/transactions/reports/route-efficiency/`,
        { params: { start: dateRange.start, end: dateRange.end } }
      );

      // Fetch Outstanding Payments Report
      const outstandingPaymentsResponse = await api.get(
        `/transactions/reports/outstanding-payments/`
      );

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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader title="Reports & Analytics" subtitle="Comprehensive business insights and performance metrics" />

        {/* Date Range Selector */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Date Range</h2>
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchReports}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Refresh Reports
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* VAT Report */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">VAT Report</h2>
            {reports.vat && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-900">Standard Sales</h3>
                    <p className="text-2xl font-bold text-blue-600">AED {reports.vat.standard_sales}</p>
                    <p className="text-sm text-blue-700">VAT: AED {reports.vat.standard_vat}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-medium text-green-900">Zero-Rated Sales</h3>
                    <p className="text-2xl font-bold text-green-600">AED {reports.vat.zero_sales}</p>
                    <p className="text-sm text-green-700">VAT: AED {reports.vat.zero_vat}</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900">Exempt Sales</h3>
                  <p className="text-2xl font-bold text-gray-600">AED {reports.vat.exempt_sales}</p>
                  <p className="text-sm text-gray-700">VAT: AED {reports.vat.exempt_vat}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sales vs Purchase Report */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Sales vs Purchase</h2>
            {reports.salesVsPurchase && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-medium text-green-900">Total Sales</h3>
                    <p className="text-2xl font-bold text-green-600">AED {reports.salesVsPurchase?.sales?.total_sales ?? 0}</p>
                    <p className="text-sm text-green-700">{reports.salesVsPurchase?.sales?.order_count ?? 0} orders</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h3 className="font-medium text-red-900">Total Purchases</h3>
                    <p className="text-2xl font-bold text-red-600">AED {reports.salesVsPurchase?.purchases?.total_purchases ?? 0}</p>
                    <p className="text-sm text-red-700">{reports.salesVsPurchase?.purchases?.order_count ?? 0} orders</p>
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900">Net Profit</h3>
                  <p className="text-2xl font-bold text-blue-600">AED {reports.salesVsPurchase?.net_profit ?? 0}</p>
                </div>
              </div>
            )}
          </div>

          {/* Route Efficiency Report */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Route Efficiency</h2>
            {reports.routeEfficiency && reports.routeEfficiency.length > 0 ? (
              <div className="space-y-3">
                {reports.routeEfficiency.map((route, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">{route.route_name}</h3>
                      <span className="text-sm text-gray-500">{route.date}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Completed:</span>
                        <span className="font-medium ml-1">{route.completed}/{route.total_planned}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Rate:</span>
                        <span className="font-medium ml-1">{route.completion_rate.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Missed:</span>
                        <span className="font-medium ml-1">{route.missed}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No route data available for the selected period.</p>
            )}
          </div>

          {/* Outstanding Payments Report */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Outstanding Payments</h2>
            {reports.outstandingPayments && reports.outstandingPayments.length > 0 ? (
              <div className="space-y-3">
                {reports.outstandingPayments.map((customer, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">{customer.customer_name}</h3>
                      <span className="text-sm text-gray-500">{customer.invoice_count} invoices</span>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-red-600">AED {customer.total_outstanding}</p>
                      <p className="text-sm text-gray-500">{customer.customer_email}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No outstanding payments found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
