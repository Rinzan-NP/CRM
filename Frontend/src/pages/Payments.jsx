// src/pages/Payments.jsx
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchPayments, createPayment, updatePayment, deletePayment } from '../redux/paymentsSlice';
import { fetchInvoices } from '../redux/invoicesSlice';
import { FiPlus, FiSearch, FiX, FiEdit, FiTrash2, FiDollarSign, FiCalendar, FiCreditCard } from 'react-icons/fi';
import Modal from '../components/Common/Modal';
import Loader from '../components/Common/Loader';
import EmptyState from '../components/Common/EmptyState';
import Toast from '../components/Common/Toast';

const Payments = () => {
  const { payments, loading: loadingPayments, error: paymentsError } = useSelector((state) => state.payments);
  const { invoices, loading: loadingInvoices } = useSelector((state) => state.invoices);
  const dispatch = useDispatch();
  
  const [formData, setFormData] = useState({
    invoice: '',
    amount: '',
    paid_on: new Date().toISOString().split('T')[0],
    mode: 'cash',
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentPaymentId, setCurrentPaymentId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  useEffect(() => {
    dispatch(fetchPayments());
    dispatch(fetchInvoices());
  }, [dispatch]);

  useEffect(() => {
    if (paymentsError) {
      setToastMessage(paymentsError.message || 'An error occurred');
      setToastType('error');
      setShowToast(true);
    }
  }, [paymentsError]);

  // Auto-fill amount when invoice is selected
  useEffect(() => {
    if (formData.invoice && invoices.length > 0) {
      const selectedInvoice = invoices.find((invoice) => invoice.id === formData.invoice);
      if (selectedInvoice) {
        const outstandingAmount = parseFloat(selectedInvoice.outstanding || selectedInvoice.amount_due);
        setFormData(prev => ({
          ...prev,
          amount: outstandingAmount > 0 ? outstandingAmount.toString() : ''
        }));
      }
    }
  }, [formData.invoice, invoices]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.invoice) {
      setToastMessage('Please select an invoice');
      setToastType('error');
      setShowToast(true);
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setToastMessage('Please enter a valid amount');
      setToastType('error');
      setShowToast(true);
      return;
    }

    if (!formData.paid_on) {
      setToastMessage('Please select a payment date');
      setToastType('error');
      setShowToast(true);
      return;
    }

    try {
      const paymentData = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      if (isEditing) {
        await dispatch(updatePayment({ id: currentPaymentId, ...paymentData })).unwrap();
        setToastMessage('Payment updated successfully');
      } else {
        await dispatch(createPayment(paymentData)).unwrap();
        setToastMessage('Payment created successfully');
      }
      
      setToastType('success');
      setShowToast(true);
      resetForm();
      setShowModal(false);
    } catch (error) {
      setToastMessage(error.message || 'Operation failed');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleEdit = (payment) => {
    setFormData({
      invoice: payment.invoice,
      amount: payment.amount.toString(),
      paid_on: payment.paid_on,
      mode: payment.mode
    });
    setIsEditing(true);
    setCurrentPaymentId(payment.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      try {
        await dispatch(deletePayment(id)).unwrap();
        setToastMessage('Payment deleted successfully');
        setToastType('success');
        setShowToast(true);
      } catch (error) {
        setToastMessage(error.message || 'Delete failed');
        setToastType('error');
        setShowToast(true);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      invoice: '',
      amount: '',
      paid_on: new Date().toISOString().split('T')[0],
      mode: 'cash',
    });
    setIsEditing(false);
    setCurrentPaymentId(null);
  };

  const getCustomerName = (invoice) => {
    if (!invoice || !invoice.sales_order || !invoice.sales_order.customer) return 'N/A';
    const customer = invoice.sales_order.customer;
    return customer.name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'N/A';
  };

  const getInvoiceDisplayName = (invoice) => {
    return `${invoice.invoice_no || `Invoice ${invoice.id}`} - ${getCustomerName(invoice)}`;
  };

  const formatCurrency = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getPaymentModeIcon = (mode) => {
    return mode === 'cash' ? <FiDollarSign className="w-4 h-4" /> : <FiCreditCard className="w-4 h-4" />;
  };

  const getPaymentModeLabel = (mode) => {
    return mode === 'cash' ? 'Cash' : 'Bank Transfer';
  };

  const filteredPayments = payments.filter(payment => {
    const invoice = invoices.find(inv => inv.id === payment.invoice);
    const customerName = getCustomerName(invoice);
    const invoiceNumber = invoice?.invoice_no || '';
    
    return (
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.amount.toString().includes(searchTerm) ||
      payment.mode.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Filter invoices that have outstanding amounts
  const availableInvoices = invoices.filter(invoice => {
    const outstanding = parseFloat(invoice.outstanding || invoice.amount_due);
    return outstanding > 0;
  });

  if (loadingPayments && payments.length === 0) return <Loader />;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
            <p className="text-gray-600">Track and manage customer payments</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search payments..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <FiX className="text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <FiPlus className="mr-2" />
              Add Payment
            </button>
          </div>
        </div>

        {/* Payments Table */}
        {filteredPayments.length > 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((payment) => {
                    const invoice = invoices.find(inv => inv.id === payment.invoice);
                    return (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {invoice?.invoice_no || `Invoice ${payment.invoice}`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {getCustomerName(invoice)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-green-600">
                            ${formatCurrency(payment.amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <FiCalendar className="mr-1 text-gray-400" />
                            {formatDate(payment.paid_on)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            {getPaymentModeIcon(payment.mode)}
                            <span className="ml-1">{getPaymentModeLabel(payment.mode)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEdit(payment)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            <FiEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(payment.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState 
            title={searchTerm ? "No payments found" : "No payments yet"}
            description={searchTerm ? 
              "Try adjusting your search query" : 
              "Get started by recording your first payment"}
            actionText="Add Payment"
            onAction={() => {
              resetForm();
              setShowModal(true);
            }}
          />
        )}

        {/* Payment Form Modal */}
        <Modal 
          isOpen={showModal} 
          onClose={() => {
            setShowModal(false);
            resetForm();
          }}
          title={isEditing ? 'Edit Payment' : 'Add New Payment'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice *
              </label>
              <select
                name="invoice"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.invoice}
                onChange={handleInputChange}
              >
                <option value="">Select Invoice</option>
                {loadingInvoices ? (
                  <option value="">Loading invoices...</option>
                ) : availableInvoices.length > 0 ? (
                  availableInvoices.map((invoice) => (
                    <option key={invoice.id} value={invoice.id}>
                      {getInvoiceDisplayName(invoice)} - Outstanding: ${formatCurrency(invoice.outstanding || invoice.amount_due)}
                    </option>
                  ))
                ) : (
                  <option value="">No invoices with outstanding amounts</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiDollarSign className="text-gray-400" />
                </div>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  min="0.01"
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Date *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiCalendar className="text-gray-400" />
                </div>
                <input
                  type="date"
                  name="paid_on"
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.paid_on}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Mode *
              </label>
              <select
                name="mode"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.mode}
                onChange={handleInputChange}
              >
                <option value="cash">Cash</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loadingPayments}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingPayments ? 'Processing...' : (isEditing ? 'Update Payment' : 'Create Payment')}
              </button>
            </div>
          </form>
        </Modal>

        {/* Toast Notification */}
        {showToast && (
          <Toast 
            message={toastMessage} 
            onClose={() => setShowToast(false)} 
            type={toastType}
          />
        )}
      </div>
    </div>
  );
};

export default Payments;