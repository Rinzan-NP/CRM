// src/pages/Invoices.js
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchInvoices, createInvoice, updateInvoice, deleteInvoice } from '../redux/invoicesSlice';
import { fetchSalesOrders } from '../redux/salesOrdersSlice';

const Invoices = () => {
  const { invoices, loading: loadingInvoices } = useSelector((state) => state.invoices);
  const { salesOrders } = useSelector((state) => state.salesOrders);
  const dispatch = useDispatch();
  const [invoice, setInvoice] = useState({
    sales_order: '',
    invoice_no: '',
    issue_date: '',
    due_date: '',
    amount_due: 0.00,
    paid_amount: 0.00,
    outstanding: 0.00,
    status: 'sent',
  });
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    dispatch(fetchInvoices());
    dispatch(fetchSalesOrders());
  }, [dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInvoice({ ...invoice, [name]: value });
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    await dispatch(createInvoice(invoice));
    setInvoice({
      sales_order: '',
      invoice_no: '',
      issue_date: '',
      due_date: '',
      amount_due: 0.00,
      paid_amount: 0.00,
      outstanding: 0.00,
      status: 'sent',
    });
  };

  const handleUpdateInvoice = async (e) => {
    e.preventDefault();
    await dispatch(updateInvoice({ id: editId, ...invoice }));
    setEditMode(false);
    setInvoice({
      sales_order: '',
      invoice_no: '',
      issue_date: '',
      due_date: '',
      amount_due: 0.00,
      paid_amount: 0.00,
      outstanding: 0.00,
      status: 'sent',
    });
  };

  const handleDeleteInvoice = async (id) => {
    await dispatch(deleteInvoice(id));
  };

  const handleEditInvoice = (invoice) => {
    setEditMode(true);
    setEditId(invoice.id);
    setInvoice(invoice);
  };

  const generateInvoiceNo = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const sequence = (invoices.length + 1).toString().padStart(4, '0');
    return `INV-${year}${month}${day}-${sequence}`;
  };

  useEffect(() => {
    if (!editMode && salesOrders.length > 0) {
      setInvoice((prev) => ({
        ...prev,
        invoice_no: generateInvoiceNo(),
        amount_due: salesOrders[0].grandtotal,
        outstanding: salesOrders[0].grandtotal,
      }));
    }
  }, [salesOrders, editMode]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Manage Invoices
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={editMode ? handleUpdateInvoice : handleCreateInvoice}>
            <div>
              <label htmlFor="sales_order" className="block text-sm font-medium text-gray-700">
                Sales Order
              </label>
              <div className="mt-1">
                <select
                  id="sales_order"
                  name="sales_order"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={invoice.sales_order}
                  onChange={handleInputChange}
                >
                  <option value="">Select Sales Order</option>
                  {salesOrders.map((salesOrder) => (
                    <option key={salesOrder.id} value={salesOrder.id}>
                      {salesOrder.order_date} - {salesOrder.customer.name} - {salesOrder.grand_total}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="invoice_no" className="block text-sm font-medium text-gray-700">
                Invoice Number
              </label>
              <div className="mt-1">
                <input
                  id="invoice_no"
                  name="invoice_no"
                  type="text"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={invoice.invoice_no}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="issue_date" className="block text-sm font-medium text-gray-700">
                Issue Date
              </label>
              <div className="mt-1">
                <input
                  id="issue_date"
                  name="issue_date"
                  type="date"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={invoice.issue_date}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">
                Due Date
              </label>
              <div className="mt-1">
                <input
                  id="due_date"
                  name="due_date"
                  type="date"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={invoice.due_date}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="amount_due" className="block text-sm font-medium text-gray-700">
                Amount Due
              </label>
              <div className="mt-1">
                <input
                  id="amount_due"
                  name="amount_due"
                  type="number"
                  step="0.01"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={invoice.amount_due}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="paid_amount" className="block text-sm font-medium text-gray-700">
                Paid Amount
              </label>
              <div className="mt-1">
                <input
                  id="paid_amount"
                  name="paid_amount"
                  type="number"
                  step="0.01"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={invoice.paid_amount}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <div className="mt-1">
                <select
                  id="status"
                  name="status"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={invoice.status}
                  onChange={handleInputChange}
                >
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {editMode ? 'Update Invoice' : 'Create Invoice'}
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
                  Sales Order
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice Number
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount Due
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{invoice.sales_order}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{invoice.invoice_no}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{invoice.issue_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{invoice.due_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{invoice.amount_due}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{invoice.paid_amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{invoice.status}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleEditInvoice(invoice)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteInvoice(invoice.id)}
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

export default Invoices;