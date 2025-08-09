// src/pages/SalesOrders.js
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchSalesOrders, createSalesOrder, updateSalesOrder, deleteSalesOrder } from '../redux/salesOrdersSlice';
import { fetchProducts } from '../redux/productsSlice';
import { fetchCustomers } from '../redux/customersSlice';

const SalesOrders = () => {
  const { salesOrders, loading: loadingOrders } = useSelector((state) => state.salesOrders);
  const { products, loading: loadingProducts } = useSelector((state) => state.products);
  const { customers, loading: loadingCustomers } = useSelector((state) => state.customers);
  const dispatch = useDispatch();
  const [salesOrder, setSalesOrder] = useState({
    customer: '',
    order_date: '',
    status: 'draft',
    line_items: [
      { product: '', quantity: 1, unit_price: 0.00, discount: 0.00, line_total: 0.00 }
    ],
    subtotal: 0.00,
    grandtotal: 0.00
  });
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    dispatch(fetchSalesOrders());
    dispatch(fetchProducts());
    dispatch(fetchCustomers());
  }, [dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSalesOrder({ ...salesOrder, [name]: value });
  };

  const handleLineItemChange = (index, field, value) => {
    const updatedLineItems = salesOrder.line_items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setSalesOrder({ ...salesOrder, line_items: updatedLineItems });
  };

  const calculateTotals = () => {
    let subtotal = 0.00;
    salesOrder.line_items.forEach(item => {
      const lineTotal = (item.unit_price * item.quantity) * (1 - item.discount / 100);
      subtotal += lineTotal;
      item.line_total = lineTotal;
    });
    const vatTotal = subtotal * 0.05; // Assuming a 5% VAT rate for simplicity
    const grandTotal = subtotal + vatTotal;
    setSalesOrder({ ...salesOrder, subtotal, grandtotal: grandTotal });
  };

  const handleAddLineItem = () => {
    setSalesOrder({
      ...salesOrder,
      line_items: [
        ...salesOrder.line_items,
        { product: '', quantity: 1, unit_price: 0.00, discount: 0.00, line_total: 0.00 }
      ]
    });
  };

  const handleRemoveLineItem = (index) => {
    const updatedLineItems = salesOrder.line_items.filter((_, i) => i !== index);
    setSalesOrder({ ...salesOrder, line_items: updatedLineItems });
  };

  const handleCreateSalesOrder = async (e) => {
    e.preventDefault();
    calculateTotals();
    console.log('Sales Order Data:', salesOrder);
    await dispatch(createSalesOrder(salesOrder));
    setSalesOrder({
      customer: '',
      order_date: '',
      status: 'draft',
      line_items: [
        { product: '', quantity: 1, unit_price: 0.00, discount: 0.00, line_total: 0.00 }
      ],
      subtotal: 0.00,
      grandtotal: 0.00
    });
  };

  const handleUpdateSalesOrder = async (e) => {
    e.preventDefault();
    calculateTotals();
    await dispatch(updateSalesOrder({ id: editId, ...salesOrder }));
    setEditMode(false);
    setSalesOrder({
      customer: '',
      order_date: '',
      status: 'draft',
      line_items: [
        { product: '', quantity: 1, unit_price: 0.00, discount: 0.00, line_total: 0.00 }
      ],
      subtotal: 0.00,
      grandtotal: 0.00
    });
  };

  const handleDeleteSalesOrder = async (id) => {
    await dispatch(deleteSalesOrder(id));
  };

  const handleEditSalesOrder = (salesOrder) => {
    setEditMode(true);
    setEditId(salesOrder.id);
    setSalesOrder(salesOrder);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Manage Sales Orders
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={editMode ? handleUpdateSalesOrder : handleCreateSalesOrder}>
            <div>
              <label htmlFor="customer" className="block text-sm font-medium text-gray-700">
                Customer
              </label>
              <div className="mt-1">
                <select
                  id="customer"
                  name="customer"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={salesOrder.customer}
                  onChange={handleInputChange}
                >
                  <option value="">Select Customer</option>
                  {loadingCustomers ? (
                    <option value="">Loading...</option>
                  ) : (
                    customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="order_date" className="block text-sm font-medium text-gray-700">
                Order Date
              </label>
              <div className="mt-1">
                <input
                  id="order_date"
                  name="order_date"
                  type="date"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={salesOrder.order_date}
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
                  value={salesOrder.status}
                  onChange={handleInputChange}
                >
                  <option value="draft">Draft</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="invoiced">Invoiced</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {salesOrder.line_items.map((item, index) => (
              <div key={index} className="mt-4">
                <div>
                  <label htmlFor={`product-${index}`} className="block text-sm font-medium text-gray-700">
                    Product
                  </label>
                  <div className="mt-1">
                    <select
                      id={`product-${index}`}
                      name="product"
                      required
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={item.product}
                      onChange={(e) => handleLineItemChange(index, 'product', e.target.value)}
                    >
                      <option value="">Select Product</option>
                      {loadingProducts ? (
                        <option value="">Loading...</option>
                      ) : (
                        products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor={`quantity-${index}`} className="block text-sm font-medium text-gray-700">
                    Quantity
                  </label>
                  <div className="mt-1">
                    <input
                      id={`quantity-${index}`}
                      name="quantity"
                      type="number"
                      min="1"
                      required
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={item.quantity}
                      onChange={(e) => handleLineItemChange(index, 'quantity', parseInt(e.target.value, 10))}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor={`unit_price-${index}`} className="block text-sm font-medium text-gray-700">
                    Unit Price
                  </label>
                  <div className="mt-1">
                    <input
                      id={`unit_price-${index}`}
                      name="unit_price"
                      type="number"
                      step="0.01"
                      required
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={item.unit_price}
                      onChange={(e) => handleLineItemChange(index, 'unit_price', parseFloat(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor={`discount-${index}`} className="block text-sm font-medium text-gray-700">
                    Discount (%)
                  </label>
                  <div className="mt-1">
                    <input
                      id={`discount-${index}`}
                      name="discount"
                      type="number"
                      step="0.01"
                      required
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={item.discount}
                      onChange={(e) => handleLineItemChange(index, 'discount', parseFloat(e.target.value))}
                    />
                  </div>
                </div>

                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => handleRemoveLineItem(index)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Remove Line Item
                  </button>
                </div>
              </div>
            ))}

            <div className="mt-4">
              <button
                type="button"
                onClick={handleAddLineItem}
                className="text-green-600 hover:text-green-900"
              >
                Add Line Item
              </button>
            </div>

            <div className="mt-4">
              <label htmlFor="subtotal" className="block text-sm font-medium text-gray-700">
                Subtotal
              </label>
              <div className="mt-1">
                <input
                  id="subtotal"
                  name="subtotal"
                  type="number"
                  step="0.01"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={salesOrder.subtotal}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="grandtotal" className="block text-sm font-medium text-gray-700">
                Grand Total
              </label>
              <div className="mt-1">
                <input
                  id="grandtotal"
                  name="grandtotal"
                  type="number"
                  step="0.01"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={salesOrder.grandtotal}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {editMode ? 'Update Sales Order' : 'Create Sales Order'}
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
                  Customer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subtotal
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grand Total
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {salesOrders.map((salesOrder) => (
                <tr key={salesOrder.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{salesOrder.customer}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{salesOrder.order_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{salesOrder.status}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{salesOrder.subtotal.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{salesOrder.grandtotal.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleEditSalesOrder(salesOrder)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteSalesOrder(salesOrder.id)}
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

export default SalesOrders;