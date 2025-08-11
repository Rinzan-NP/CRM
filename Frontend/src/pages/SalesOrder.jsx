// src/pages/SalesOrders.js
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    fetchSalesOrders,
    createSalesOrder,
    updateSalesOrder,
    deleteSalesOrder,
} from '../redux/salesOrdersSlice';
import { fetchProducts } from '../redux/productsSlice';
import { fetchCustomers } from '../redux/customersSlice';

const SalesOrders = () => {
    const { salesOrders, loading: loadingOrders } = useSelector(
        (state) => state.salesOrders
    );
    const { products, loading: loadingProducts } = useSelector(
        (state) => state.products
    );
    const { customers, loading: loadingCustomers } = useSelector(
        (state) => state.customers
    );
    const dispatch = useDispatch();
    const [salesOrder, setSalesOrder] = useState({
        customer: "",
        order_date: "",
        status: "draft",
        prices_include_vat: false,
        line_items: [
            {
                product_id: "",
                quantity: 1,
                unit_price: 0.0,
                discount: 0.0,
                line_total: 0.0,
            },
        ],
        subtotal: 0.0,
        vat_total: 0.0,
        grand_total: 0.0, // Changed from grandtotal to grand_total
    });
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);

    useEffect(() => {
        dispatch(fetchSalesOrders());
        dispatch(fetchProducts());
        dispatch(fetchCustomers());
    }, [dispatch]);

    // Helper function to get customer name by ID
    const getCustomerName = (customerId) => {
        const customer = customers.find(c => c.id === customerId);
        return customer ? customer.name : `Customer ${customerId}`;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        // Fix: Only parse float for numeric fields
        if (name === 'subtotal' || name === 'grand_total') {
            setSalesOrder({ ...salesOrder, [name]: parseFloat(value) || 0 });
        } else {
            setSalesOrder({ ...salesOrder, [name]: value });
        }
    };

    const handleLineItemChange = (index, field, value) => {
        const updatedLineItems = salesOrder.line_items.map((item, i) =>
            i === index ? { ...item, [field]: value } : item
        );
        setSalesOrder({ ...salesOrder, line_items: updatedLineItems });
        // Auto-calculate totals when line items change
        calculateTotalsForLineItems(updatedLineItems);
    };

    const calculateTotalsForLineItems = (lineItems = salesOrder.line_items) => {
        let netSubtotal = 0.0;
        let vatTotal = 0.0;
        const updatedLineItems = lineItems.map((item) => {
            const base = (parseFloat(item.unit_price) || 0) * (parseFloat(item.quantity) || 0) * (1 - (parseFloat(item.discount) || 0) / 100);
            const product = products.find(p => p.id === item.product_id);
            const vatRate = product && product.vat_rate !== undefined ? parseFloat(product.vat_rate) : 0;
            if (salesOrder.prices_include_vat && vatRate > 0) {
                const net = base / (1 + vatRate / 100);
                const vat = base - net;
                netSubtotal += net;
                vatTotal += vat;
                return { ...item, line_total: base };
            } else {
                const vat = base * vatRate / 100;
                netSubtotal += base;
                vatTotal += vat;
                return { ...item, line_total: base };
            }
        });
        const grandTotal = netSubtotal + vatTotal;
        setSalesOrder(prev => ({
            ...prev,
            line_items: updatedLineItems,
            subtotal: parseFloat(netSubtotal.toFixed(2)),
            vat_total: parseFloat(vatTotal.toFixed(2)),
            grand_total: parseFloat(grandTotal.toFixed(2)),
        }));
    };

    const calculateTotals = () => {
        calculateTotalsForLineItems();
    };

    const handleAddLineItem = () => {
        setSalesOrder({
            ...salesOrder,
            line_items: [
                ...salesOrder.line_items,
                {
                    product_id: "",
                    quantity: 1,
                    unit_price: 0.0,
                    discount: 0.0,
                    line_total: 0.0,
                },
            ],
        });
    };

    const handleRemoveLineItem = (index) => {
        const updatedLineItems = salesOrder.line_items.filter(
            (_, i) => i !== index
        );
        setSalesOrder({ ...salesOrder, line_items: updatedLineItems });
        calculateTotalsForLineItems(updatedLineItems);
    };

    const handleCreateSalesOrder = async (e) => {
        e.preventDefault();
        calculateTotals();
        await dispatch(createSalesOrder(salesOrder));
        setSalesOrder({
            customer: "",
            order_date: "",
            status: "draft",
            prices_include_vat: false,
            line_items: [
                {
                    product_id: "",
                    quantity: 1,
                    unit_price: 0.0,
                    discount: 0.0,
                    line_total: 0.0,
                },
            ],
            subtotal: 0.0,
            vat_total: 0.0,
            grand_total: 0.0, // Changed from grandtotal to grand_total
        });
    };

    const handleUpdateSalesOrder = async (e) => {
        e.preventDefault();
        calculateTotals();
        await dispatch(updateSalesOrder({ id: editId, ...salesOrder }));
        setEditMode(false);
        setSalesOrder({
            customer: "",
            order_date: "",
            status: "draft",
            prices_include_vat: false,
            line_items: [
                {
                    product_id: "",
                    quantity: 1,
                    unit_price: 0.0,
                    discount: 0.0,
                    line_total: 0.0,
                },
            ],
            subtotal: 0.0,
            vat_total: 0.0,
            grand_total: 0.0, // Changed from grandtotal to grand_total
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

    // Helper function to safely format numbers
    const formatCurrency = (value) => {
        const num = parseFloat(value);
        return isNaN(num) ? '0.00' : num.toFixed(2);
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
                    <form
                        onSubmit={
                            editMode
                                ? handleUpdateSalesOrder
                                : handleCreateSalesOrder
                        }
                    >
                        <div>
                            <label
                                htmlFor="customer"
                                className="block text-sm font-medium text-gray-700"
                            >
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
                                            <option
                                                key={customer.id}
                                                value={customer.id}
                                            >
                                                {customer.id} - {customer.name}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="order_date"
                                className="block text-sm font-medium text-gray-700"
                            >
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
                            <label
                                htmlFor="status"
                                className="block text-sm font-medium text-gray-700"
                            >
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
                                    <label
                                        htmlFor={`product-${index}`}
                                        className="block text-sm font-medium text-gray-700"
                                    >
                                        Product
                                    </label>
                                    <div className="mt-1">
                                        <select
                                            id={`product-${index}`}
                                            name="product"
                                            required
                                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            value={item.product_id}
                                            onChange={(e) =>
                                                handleLineItemChange(
                                                    index,
                                                    "product_id",
                                                    e.target.value
                                                )
                                            }
                                        >
                                            <option value="">
                                                Select Product
                                            </option>
                                            {loadingProducts ? (
                                                <option value="">
                                                    Loading...
                                                </option>
                                            ) : (
                                                products.map((product) => (
                                                    <option
                                                        key={product.id}
                                                        value={product.id}
                                                    >
                                                        {product.code || product.id} - {product.name}
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label
                                        htmlFor={`quantity-${index}`}
                                        className="block text-sm font-medium text-gray-700"
                                    >
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
                                            onChange={(e) =>
                                                handleLineItemChange(
                                                    index,
                                                    "quantity",
                                                    parseInt(e.target.value, 10) || 0
                                                )
                                            }
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label
                                        htmlFor={`unit_price-${index}`}
                                        className="block text-sm font-medium text-gray-700"
                                    >
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
                                            onChange={(e) =>
                                                handleLineItemChange(
                                                    index,
                                                    "unit_price",
                                                    parseFloat(e.target.value) || 0
                                                )
                                            }
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label
                                        htmlFor={`discount-${index}`}
                                        className="block text-sm font-medium text-gray-700"
                                    >
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
                                            onChange={(e) =>
                                                handleLineItemChange(
                                                    index,
                                                    "discount",
                                                    parseFloat(e.target.value) || 0
                                                )
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="mt-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleRemoveLineItem(index)
                                        }
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        Remove Line Item
                                    </button>
                                </div>
                            </div>
                        ))}

                        <div className="mt-4">
                            <label className="inline-flex items-center">
                                <input
                                    type="checkbox"
                                    className="form-checkbox"
                                    checked={salesOrder.prices_include_vat}
                                    onChange={(e) => {
                                        const next = { ...salesOrder, prices_include_vat: e.target.checked };
                                        setSalesOrder(next);
                                        calculateTotalsForLineItems(next.line_items);
                                    }}
                                />
                                <span className="ml-2 text-sm text-gray-700">Prices include VAT</span>
                            </label>
                        </div>

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
                            <label
                                htmlFor="subtotal"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Subtotal
                            </label>
                            <div className="mt-1">
                                <input
                                    id="subtotal"
                                    name="subtotal"
                                    type="number"
                                    step="0.01"
                                    readOnly
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-100"
                                    value={salesOrder.subtotal || 0.0}
                                />
                            </div>
                        </div>

                        <div className="mt-4">
                            <label
                                htmlFor="vat_total"
                                className="block text-sm font-medium text-gray-700"
                            >
                                VAT Total
                            </label>
                            <div className="mt-1">
                                <input
                                    id="vat_total"
                                    name="vat_total"
                                    type="number"
                                    step="0.01"
                                    readOnly
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-100"
                                    value={salesOrder.vat_total || 0.0}
                                />
                            </div>
                        </div>

                        <div className="mt-4">
                            <label
                                htmlFor="grand_total"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Grand Total
                            </label>
                            <div className="mt-1">
                                <input
                                    id="grand_total"
                                    name="grand_total"
                                    type="number"
                                    step="0.01"
                                    readOnly
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-100"
                                    value={salesOrder.grand_total || 0.0}
                                />
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                type="submit"
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                {editMode
                                    ? "Update Sales Order"
                                    : "Create Sales Order"}
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
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Order #
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Customer
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Order Date
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Status
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Subtotal
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    VAT
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Grand Total
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Profit
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {salesOrders.map((salesOrder) => (
                                <tr key={salesOrder.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {salesOrder.order_number || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getCustomerName(salesOrder.customer)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {salesOrder.order_date}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {salesOrder.status}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {formatCurrency(salesOrder.subtotal)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {formatCurrency(salesOrder.vat_total)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {formatCurrency(salesOrder.grand_total)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {formatCurrency(salesOrder.profit)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() =>
                                                handleEditSalesOrder(salesOrder)
                                            }
                                            className="text-indigo-600 hover:text-indigo-900"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleDeleteSalesOrder(
                                                    salesOrder.id
                                                )
                                            }
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