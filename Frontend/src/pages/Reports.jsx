import React, { useState, useEffect } from 'react';
import SalesOrderReportSection from '../components/reports/SalesOrderReportSection';
import PurchaseOrderReportSection from '../components/reports/PurchaseOrderReportSection';
import NavigationTabs from '../components/reports/NavigationTabs';
import DateRangeSelector from '../components/reports/DateRangeSelector';
import SummaryCards from '../components/reports/SummaryCards';
import ChartsSection from '../components/reports/ChartsSection';
import VATBreakdownDetails from '../components/reports/VATBreakdownDetails';
import RouteEfficiencyDetails from '../components/reports/RouteEfficiencyDetails';
import OutstandingPaymentsDetails from '../components/reports/OutstandingPaymentsDetails';
import { useSelector, useDispatch } from 'react-redux';
import api from '../services/api';
import PageHeader from '../components/layout/PageHeader';
import { FiRefreshCw, FiDownload } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

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
    start: new Date().toISOString().split('T')[0],
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
  const navigate = useNavigate();
  const {user} = useAuth();
  useEffect(() => {
    
    fetchReports();
  }, [dateRange, activeTab]);
  // useEffect(() => {
  //   if (user.role == 'salesperson') {
  //     navigate('/sales');
  //   }
  // }, []);
  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
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

        <NavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        <DateRangeSelector 
          dateRange={dateRange} 
          handleDateRangeChange={handleDateRangeChange} 
        />

        {/* Sales Order Report */}
        {shouldShow('sales') && <SalesOrderReportSection report={reports.salesOrder} />}

        {/* Purchase Order Report */}
        {shouldShow('purchases') && <PurchaseOrderReportSection report={reports.purchaseOrder} />}

        <SummaryCards 
          reports={reports}
          shouldShow={shouldShow}
        />

        <ChartsSection 
          reports={reports}
          shouldShow={shouldShow}
        />

        {shouldShow('vat') && <VATBreakdownDetails reports={reports} />}

        {shouldShow('routes') && <RouteEfficiencyDetails reports={reports} />}

        {shouldShow('payments') && <OutstandingPaymentsDetails reports={reports} />}
      </div>
    </div>
  );
};

export default Reports;