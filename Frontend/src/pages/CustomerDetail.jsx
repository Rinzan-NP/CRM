// src/pages/CustomerDetail.jsx
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchCustomerSummary, 
  clearCurrentCustomer, 
  resetCustomerError 
} from '../redux/customersSlice';
import { 
  FiDollarSign, 
  FiShoppingCart, 
  FiFileText, 
  FiClock, 
  FiCheckCircle, 
  FiXCircle,
  FiAlertCircle,
  FiArrowLeft 
} from 'react-icons/fi';
import PageHeader from '../components/layout/PageHeader';
import StatsCard from '../components/ui/StatsCard';
import DataTable from '../components/ui/DataTable';
import Loader from '../components/Common/Loader';
import EmptyState from '../components/Common/EmptyState';
import CustomerInfoCard from '../components/Customers/CustomerInfoCard';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    currentCustomer,
    orders,
    invoices,
    summary,
    loading,
    error
  } = useSelector((state) => state.customers);

  useEffect(() => {
    // Clear previous data when component mounts
    dispatch(clearCurrentCustomer());
    dispatch(resetCustomerError());
    
    // Fetch customer data using the summary endpoint for better performance
    dispatch(fetchCustomerSummary(id));
    
    // Cleanup when component unmounts
    return () => {
      dispatch(clearCurrentCustomer());
    };
  }, [dispatch, id]);

  // Loading state
  if (loading) return <Loader />;
  
  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white shadow rounded-lg p-6 max-w-md w-full">
          <div className="flex items-center text-red-600 mb-4">
            <FiAlertCircle className="mr-2" />
            <span className="font-medium">Error Loading Customer</span>
          </div>
          <p className="text-gray-600 mb-4">
            {typeof error === 'string' ? error : error?.detail || 'Something went wrong'}
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => dispatch(fetchCustomerSummary(id))}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Try Again
            </button>
            <button 
              onClick={() => navigate('/customers')}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
            >
              Back to Customers
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // No customer found
  if (!currentCustomer && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <EmptyState 
          title="Customer not found" 
          description="The requested customer could not be found." 
          actionText="Back to Customers"
          onAction={() => navigate('/customers')}
        />
      </div>
    );
  }

  // Calculate stats - use summary data if available, otherwise calculate from arrays
  const stats = summary || {
    total_orders: orders?.length || 0,
    pending_orders: orders?.filter(so => so.status === 'confirmed')?.length || 0,
    paid_invoices: invoices?.filter(inv => inv.status === 'paid')?.length || 0,
    overdue_invoices: invoices?.filter(inv => inv.status === 'overdue')?.length || 0,
    outstanding_balance: invoices?.reduce((sum, inv) => sum + parseFloat(inv.outstanding || 0), 0) || 0,
    total_spent: orders?.reduce((sum, order) => sum + parseFloat(order.grand_total || 0), 0) || 0
  };

  // Sales orders columns
  const salesOrderColumns = [
    {
      header: 'Order #',
      accessor: 'order_number',
      cell: (row) => row.order_number || `SO-${row.id?.toString().slice(0, 8) || 'N/A'}`
    },
    {
      header: 'Date',
      accessor: 'order_date',
      cell: (row) => {
        try {
          return new Date(row.order_date).toLocaleDateString();
        } catch {
          return 'Invalid date';
        }
      }
    },
    {
      header: 'Amount',
      accessor: 'grand_total',
      cell: (row) => `$${parseFloat(row.grand_total || 0).toFixed(2)}`
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          row.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
          row.status === 'invoiced' ? 'bg-purple-100 text-purple-800' :
          row.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {row.status || 'Unknown'}
        </span>
      )
    }
  ];

  // Invoices columns
  const invoiceColumns = [
    {
      header: 'Invoice #',
      accessor: 'invoice_no',
      cell: (row) => row.invoice_no || `INV-${row.id?.toString().slice(0, 8) || 'N/A'}`
    },
    {
      header: 'Issue Date',
      accessor: 'issue_date',
      cell: (row) => {
        try {
          return new Date(row.issue_date).toLocaleDateString();
        } catch {
          return 'Invalid date';
        }
      }
    },
    {
      header: 'Due Date',
      accessor: 'due_date',
      cell: (row) => {
        try {
          return new Date(row.due_date).toLocaleDateString();
        } catch {
          return 'Invalid date';
        }
      }
    },
    {
      header: 'Amount',
      accessor: 'amount_due',
      cell: (row) => `$${parseFloat(row.amount_due || 0).toFixed(2)}`
    },
    {
      header: 'Paid',
      accessor: 'paid_amount',
      cell: (row) => `$${parseFloat(row.paid_amount || 0).toFixed(2)}`
    },
    {
      header: 'Outstanding',
      accessor: 'outstanding',
      cell: (row) => {
        const outstanding = parseFloat(row.outstanding || 0);
        return (
          <span className={outstanding > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
            ${outstanding.toFixed(2)}
          </span>
        );
      }
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          row.status === 'paid' ? 'bg-green-100 text-green-800' :
          row.status === 'overdue' ? 'bg-red-100 text-red-800' :
          row.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {row.status || 'Unknown'}
        </span>
      )
    }
  ];

  // Safe array access
  const ordersArray = orders || [];
  const invoicesArray = invoices || [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title={currentCustomer?.name || 'Customer Details'}
          subtitle="Comprehensive customer information, transactions, and analytics"
          breadcrumbs={[
            { name: 'Customers', href: '/customers' },
            { name: currentCustomer?.name || 'Customer', href: `/customers/${id}` }
          ]}
          actions={[
            <button
              key="back"
              onClick={() => navigate('/customers')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              <FiArrowLeft className="h-4 w-4" />
              Back to Customers
            </button>
          ]}
        />

        {/* Customer Info - Hide View More button when on detail page */}
        {currentCustomer && (
          <CustomerInfoCard 
            customer={currentCustomer} 
            showViewMore={false} 
          />
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard 
            title="Total Orders" 
            value={stats.total_orders} 
            icon={FiShoppingCart} 
            color="indigo" 
          />
          <StatsCard 
            title="Pending Orders" 
            value={stats.pending_orders} 
            icon={FiClock} 
            color="yellow" 
          />
          <StatsCard 
            title="Paid Invoices" 
            value={stats.paid_invoices} 
            icon={FiCheckCircle} 
            color="green" 
          />
          <StatsCard 
            title="Outstanding Balance" 
            value={`$${Number(stats.outstanding_balance).toFixed(2)}`} 
            icon={FiDollarSign} 
            color={Number(stats.outstanding_balance) > 0 ? 'red' : 'green'} 
          />
        </div>

        {/* Sales Orders Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Sales Orders</h3>
            <span className="text-sm text-gray-500">{ordersArray.length} records</span>
          </div>
          {ordersArray.length > 0 ? (
            <DataTable 
              data={ordersArray} 
              columns={salesOrderColumns} 
              pageSize={10}
              showPagination={true}
            />
          ) : (
            <EmptyState 
              title="No sales orders found"
              description="This customer hasn't placed any orders yet"
              icon={FiShoppingCart}
            />
          )}
        </div>

        {/* Invoices Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Invoices</h3>
            <span className="text-sm text-gray-500">{invoicesArray.length} records</span>
          </div>
          {invoicesArray.length > 0 ? (
            <DataTable 
              data={invoicesArray} 
              columns={invoiceColumns} 
              pageSize={10}
              showPagination={true}
            />
          ) : (
            <EmptyState 
              title="No invoices found"
              description="This customer doesn't have any invoices yet"
              icon={FiFileText}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;