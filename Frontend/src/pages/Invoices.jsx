// src/pages/Invoices.js
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchInvoices, 
  createInvoice, 
  deleteInvoice,
  fetchAvailableSalesOrders 
} from '../redux/invoicesSlice';
import PageHeader from '../components/layout/PageHeader';
import StatsCard from '../components/ui/StatsCard';
import DataTable from '../components/ui/DataTable';
import FormField from '../components/ui/FormField';
import ChartCard from '../components/ui/ChartCard';
import Modal from '../components/Common/Modal';
import EditInvoiceModal from '../components/Invoices/EditInvoiceModal';
import { FileText, DollarSign, Plus, Edit, Trash2, Loader2, Printer } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Loader from '../components/Common/Loader';

const Invoices = () => {
  const { invoices, availableSalesOrders, loading: stateLoading } = useSelector((state) => state.invoices);
  const dispatch = useDispatch();
  const [invoice, setInvoice] = useState({
    sales_order: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0], // 30 days from now
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      dispatch(fetchInvoices()),
      dispatch(fetchAvailableSalesOrders())
    ]).finally(() => setLoading(false));
  }, [dispatch]);

  // Refresh available sales orders when create modal is opened
  useEffect(() => {
    if (showCreateModal) {
      dispatch(fetchAvailableSalesOrders());
    }
  }, [showCreateModal, dispatch]);
  if(loading){
    return <Loader />
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInvoice({ ...invoice, [name]: value });
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    setLoading(true);
    await dispatch(createInvoice(invoice));
    setLoading(false);
    resetForm();
    setShowCreateModal(false);
  };

  const handleDeleteInvoice = async (id) => {
    await dispatch(deleteInvoice(id));
  };

  const handleEditInvoice = (row) => {
    setSelectedInvoice(row);
    setShowEditModal(true);
  };

  const handlePrintInvoice = (row) => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    // Get the selected sales order details
    const selectedOrder = availableSalesOrders.find(order => order.id === row.sales_order);
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${row?.invoice_no || 'N/A'}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background: white;
            }
            .invoice-header {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .invoice-title {
              font-size: 28px;
              font-weight: bold;
              color: #333;
              margin-bottom: 10px;
            }
            .invoice-number {
              font-size: 18px;
              color: #666;
            }
            .invoice-details {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
            }
            .invoice-section {
              flex: 1;
              margin-right: 20px;
            }
            .invoice-section h3 {
              margin: 0 0 10px 0;
              color: #333;
              font-size: 16px;
            }
            .invoice-section p {
              margin: 5px 0;
              color: #666;
            }
            .order-details {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .order-details h4 {
              margin: 0 0 10px 0;
              color: #333;
            }
            .amount-section {
              text-align: right;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
            }
            .amount-row {
              display: flex;
              justify-content: space-between;
              margin: 10px 0;
            }
            .total-amount {
              font-size: 18px;
              font-weight: bold;
              color: #333;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-header">
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-number">Invoice #: ${row?.invoice_no || 'N/A'}</div>
          </div>
          
          <div class="invoice-details">
            <div class="invoice-section">
              <h3>Invoice Details</h3>
              <p><strong>Issue Date:</strong> ${row.issue_date ? new Date(row.issue_date).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Due Date:</strong> ${row.due_date ? new Date(row.due_date).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Status:</strong> ${row?.status || 'Pending'}</p>
            </div>
            
            ${selectedOrder ? `
            <div class="invoice-section">
              <h3>Order Details</h3>
              <p><strong>Order Number:</strong> ${selectedOrder.order_number}</p>
              <p><strong>Order Date:</strong> ${new Date(selectedOrder.order_date).toLocaleDateString()}</p>
              <p><strong>Customer:</strong> ${selectedOrder.customer_name || 'N/A'}</p>
            </div>
            ` : ''}
          </div>
          
          ${selectedOrder ? `
          <div class="order-details">
            <h4>Order Summary</h4>
            <p><strong>Subtotal:</strong> AED ${parseFloat(selectedOrder.subtotal || 0).toFixed(2)}</p>
            <p><strong>Tax:</strong> AED ${parseFloat(selectedOrder.tax_amount || 0).toFixed(2)}</p>
            <p><strong>Total:</strong> AED ${parseFloat(selectedOrder.grand_total || 0).toFixed(2)}</p>
          </div>
          ` : ''}
          
          <div class="amount-section">
            <div class="amount-row">
              <span>Amount Due:</span>
              <span>AED ${parseFloat(row?.outstanding || 0).toFixed(2)}</span>
            </div>
            <div class="amount-row">
              <span>Amount Paid:</span>
              <span>AED ${parseFloat(row?.paid_amount || 0).toFixed(2)}</span>
            </div>
            <div class="amount-row total-amount">
              <span>Total Amount:</span>
              <span>AED ${(parseFloat(row?.outstanding || 0) + parseFloat(row?.paid_amount || 0)).toFixed(2)}</span>
            </div>
          </div>
          
          <div class="no-print" style="margin-top: 30px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Invoice</button>
            <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">Close</button>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
  };

  const resetForm = () => {
    setInvoice({
      sales_order: '',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
    });
  };

  const getOrderDisplay = (orderId) => {
    const so = availableSalesOrders.find(o => o.id === orderId);
    if (!so) return `Order ${orderId}`;
    return `${so.order_number} - ${formatCurrency(so.grand_total)}`;
  };

  const formatCurrency = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  // Chart data: invoices by issue date (amount due)
  const chartData = invoices.slice(-7).map(inv => ({
    date: inv.issue_date ? new Date(inv.issue_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A',
    due: parseFloat(inv.amount_due) || 0,
    paid: parseFloat(inv.paid_amount) || 0,
  }));

  const columns = [
    {
      header: 'Sales Order',
      accessor: 'sales_order',
      cell: (row) => (
        <span className="font-medium text-slate-900">{getOrderDisplay(row.sales_order)}</span>
      ),
    },
    {
      header: 'Invoice #',
      accessor: 'invoice_no',
    },
    {
      header: 'Issue Date',
      accessor: 'issue_date',
      cell: (row) => row.issue_date ? new Date(row.issue_date).toLocaleDateString() : 'N/A',
    },
    {
      header: 'Due Date',
      accessor: 'due_date',
      cell: (row) => row.due_date ? new Date(row.due_date).toLocaleDateString() : 'N/A',
    },
      {
        header: 'Amount Due',
        accessor: 'outstanding',
        cell: (row) => `AED ${formatCurrency(row.outstanding)}`,
      },
    {
      header: 'Paid',
      accessor: 'paid_amount',
      cell: (row) => `AED ${formatCurrency(row.paid_amount)}`,
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          row.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
          row.status === 'overdue' ? 'bg-rose-100 text-rose-800' :
          'bg-slate-100 text-slate-800'
        }`}>
          {row.status || 'pending'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEditInvoice(row)}
            className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded"
            title="Edit Invoice"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handlePrintInvoice(row)}
            className="p-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded"
            title="Print Invoice"
          >
            <Printer className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteInvoice(row.id)}
            className="p-1 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded"
            title="Delete Invoice"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const totalDue = invoices.reduce((s, i) => s + (parseFloat(i.outstanding) || 0), 0);
  const totalPaid = invoices.reduce((s, i) => s + (parseFloat(i.paid_amount) || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader 
          title="Invoices" 
          subtitle="Create and manage customer invoices"
          actions={[
            <button
              key="add"
              onClick={() => { resetForm(); setShowCreateModal(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Invoice
            </button>
          ]}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCard title="Total Invoices" value={invoices.length} icon={FileText} color="violet" />
          <StatsCard title="Outstanding Amount" value={`AED ${totalDue.toFixed(2)}`} icon={DollarSign} color="rose" />
          <StatsCard title="Paid" value={`AED ${totalPaid.toFixed(2)}`} icon={DollarSign} color="emerald" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Invoice Trend (Last 7)" trend={totalPaid - totalDue >= 0 ? 3.1 : -1.4} trendValue={Math.abs(totalPaid - totalDue).toFixed(0)} trendLabel="delta">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="due" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 3 }} />
                <Line type="monotone" dataKey="paid" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

       
        </div>

        {/* Create Invoice Modal */}
        <Modal 
          isOpen={showCreateModal} 
          onClose={() => setShowCreateModal(false)}
          title="Create New Invoice"
        >
          <form onSubmit={handleCreateInvoice} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <FormField label="Sales Order" required>
                <select
                  name="sales_order"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={invoice.sales_order}
                  onChange={handleInputChange}
                >
                  <option value="">Select Sales Order</option>
                  {stateLoading ? (
                    <option value="">Loading...</option>
                  ) : (
                    availableSalesOrders.map((order) => (
                      <option key={order.id} value={order.id}>
                        {`${order.order_number} -  ${formatCurrency(order.grand_total)} AED`}
                      </option>
                    ))
                  )}
                </select>
              </FormField>
              
              {invoice.sales_order && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900">Order Details</h4>
                  {availableSalesOrders
                    .filter(order => order.id === invoice.sales_order)
                    .map(order => (
                      <div key={order.id} className="mt-2 space-y-2 text-sm text-gray-600">
                        <p><span className="font-medium">Order Number:</span> {order.order_number}</p>
                        <p><span className="font-medium">Order Date:</span> {new Date(order.order_date).toLocaleDateString()}</p>
                        <p><span className="font-medium">Amount:</span> {formatCurrency(order.grand_total)} AED</p>
                      </div>
                    ))}
                </div>
              )}

              <FormField label="Issue Date" required>
                <input
                  type="date"
                  name="issue_date"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={invoice.issue_date}
                  onChange={handleInputChange}
                />
              </FormField>

              <FormField label="Due Date" required>
                <input
                  type="date"
                  name="due_date"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={invoice.due_date}
                  onChange={handleInputChange}
                />
              </FormField>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              >
                Create Invoice
              </button>
            </div>
          </form>
        </Modal>

        {/* Edit Invoice Modal */}
        <EditInvoiceModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          invoice={selectedInvoice}
          onUpdate={() => {
            // Refresh the invoices list after update
            dispatch(fetchInvoices());
          }}
        />

        <DataTable
          data={invoices}
          columns={columns}
          pageSize={10}
          onRowClick={handleEditInvoice}
          showPagination={true}
        />
      </div>
    </div>
  );
};

export default Invoices;