// src/pages/Invoices.js
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchInvoices, createInvoice, updateInvoice, deleteInvoice } from '../redux/invoicesSlice';
import { fetchSalesOrders } from '../redux/salesOrdersSlice';
import PageHeader from '../components/layout/PageHeader';
import StatsCard from '../components/ui/StatsCard';
import DataTable from '../components/ui/DataTable';
import FormField from '../components/ui/FormField';
import ChartCard from '../components/ui/ChartCard';
import Modal from '../components/Common/Modal';
import { FileText, DollarSign, Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Loader from '../components/Common/Loader';

const Invoices = () => {
  const { invoices } = useSelector((state) => state.invoices);
  const { salesOrders, loading: loadingSalesOrders } = useSelector((state) => state.salesOrders);
  const dispatch = useDispatch();
  const [invoice, setInvoice] = useState({
    sales_order: '',
    issue_date: '',
    due_date: '',
  });
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    dispatch(fetchInvoices()).finally(() => setLoading(false));
    dispatch(fetchSalesOrders()).finally(() => setLoading(false));
  }, [dispatch]);
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
    setShowModal(false);
  };

  const handleUpdateInvoice = async (e) => {
    e.preventDefault();
    
    await dispatch(updateInvoice({ id: editId, ...invoice }));
    resetForm();
    setShowModal(false);
  };

  const handleDeleteInvoice = async (id) => {
    await dispatch(deleteInvoice(id));
  };

  const handleEditInvoice = (row) => {
    setEditMode(true);
    setEditId(row.id);
    setInvoice({
      sales_order: row.sales_order,
      issue_date: row.issue_date,
      due_date: row.due_date,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditMode(false);
    setEditId(null);
    setInvoice({
      sales_order: '',
      issue_date: '',
      due_date: '',
    });
  };

  const getOrderDisplay = (orderId) => {
    const so = salesOrders.find(o => o.id === orderId);
    if (!so) return `Order ${orderId}`;
    return `${so.order_number || so.id}`;
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
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteInvoice(row.id)}
            className="p-1 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded"
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
              onClick={() => { resetForm(); setShowModal(true); }}
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

        <Modal 
          isOpen={showModal} 
          onClose={() => setShowModal(false)}
          title={editMode ? 'Edit Invoice' : 'Create New Invoice'}
        >
          <form onSubmit={editMode ? handleUpdateInvoice : handleCreateInvoice} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Sales Order" required>
                <select
                  name="sales_order"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={invoice.sales_order}
                  onChange={handleInputChange}
                >
                  <option value="">Select Sales Order</option>
                  {loadingSalesOrders ? (
                    <option value="">Loading...</option>
                  ) : (
                    salesOrders.map((salesOrder) => (
                      <option key={salesOrder.id} value={salesOrder.id}>
                        {salesOrder.order_number || salesOrder.id}
                      </option>
                    ))
                  )}
                </select>
              </FormField>

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
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              >
                {editMode ? 'Update Invoice' : 'Create Invoice'}
              </button>
            </div>
          </form>
        </Modal>

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