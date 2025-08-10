// src/pages/Payments.js
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchPayments, createPayment, updatePayment, deletePayment } from '../redux/paymentsSlice';
import { fetchInvoices } from '../redux/invoicesSlice';

const Payments = () => {
  const { payments, loading: loadingPayments } = useSelector((state) => state.payments);
  const { invoices } = useSelector((state) => state.invoices);
  const dispatch = useDispatch();
  const [payment, setPayment] = useState({
    invoice: '',
    amount: 0.00,
    paid_on: '',
    mode: 'cash',
  });
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    dispatch(fetchPayments());
    dispatch(fetchInvoices());
  }, [dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPayment({ ...payment, [name]: value });
  };

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    await dispatch(createPayment(payment));
    setPayment({
      invoice: '',
      amount: 0.00,
      paid_on: '',
      mode: 'cash',
    });
  };

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    await dispatch(updatePayment({ id: editId, ...payment }));
    setEditMode(false);
    setPayment({
      invoice: '',
      amount: 0.00,
      paid_on: '',
      mode: 'cash',
    });
  };

  const handleDeletePayment = async (id) => {
    await dispatch(deletePayment(id));
  };

  const handleEditPayment = (payment) => {
    setEditMode(true);
    setEditId(payment.id);
    setPayment(payment);
  };

  useEffect(() => {
    if (payment.invoice && invoices.length > 0) {
      const selectedInvoice = invoices.find((invoice) => invoice.id === payment.invoice);
      if (selectedInvoice) {
        setPayment((prev) => ({
          ...prev,
          amount: selectedInvoice.amount_due,
          paid_on: new Date().toISOString().split('T')[0], // Set to current date
        }));
      }
    }
  }, [payment.invoice, invoices]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Manage Payments
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={editMode ? handleUpdatePayment : handleCreatePayment}>
            <div>
              <label htmlFor="invoice" className="block text-sm font-medium text-gray-700">
                Invoice
              </label>
              <div className="mt-1">
                <select
                  id="invoice"
                  name="invoice"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={payment.invoice}
                  onChange={handleInputChange}
                >
                  <option value="">Select Invoice</option>
                  {invoices.map((invoice) => (
                    <option key={invoice.id} value={invoice.id}>
                      {invoice.invoice_no}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Amount
              </label>
              <div className="mt-1">
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={payment.amount}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="paid_on" className="block text-sm font-medium text-gray-700">
                Paid On
              </label>
              <div className="mt-1">
                <input
                  id="paid_on"
                  name="paid_on"
                  type="date"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={payment.paid_on}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="mode" className="block text-sm font-medium text-gray-700">
                Payment Mode
              </label>
              <div className="mt-1">
                <select
                  id="mode"
                  name="mode"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={payment.mode}
                  onChange={handleInputChange}
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {editMode ? 'Update Payment' : 'Create Payment'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid On
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mode
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{payment.invoice}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{payment.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{payment.paid_on}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{payment.mode}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleEditPayment(payment)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePayment(payment.id)}
                      className="ml-4 text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Payments;