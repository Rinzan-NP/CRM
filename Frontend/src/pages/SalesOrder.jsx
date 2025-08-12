// src/pages/SalesOrders.js
import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    fetchSalesOrders,
    createSalesOrder,
    updateSalesOrder,
    deleteSalesOrder,
} from '../redux/salesOrdersSlice';
import { fetchProducts } from '../redux/productsSlice';
import { fetchCustomers } from '../redux/customersSlice';
import PageHeader from '../components/layout/PageHeader';
import StatsCard from '../components/ui/StatsCard';
import DataTable from '../components/ui/DataTable';
import FormField from '../components/ui/FormField';
import ChartCard from '../components/ui/ChartCard';
import { 
    ShoppingCart, 
    DollarSign, 
    Users, 
    Package,
    Plus,
    Minus,
    Trash2,
    Edit,
    Save,
    X
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SalesOrders = () => {
    const { salesOrders } = useSelector(
        (state) => state.salesOrders
    );
    const { products } = useSelector(
        (state) => state.products
    );
    const { customers } = useSelector(
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
        grand_total: 0.0,
    });
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    
    // Ref for the form section to enable scrolling
    const formRef = useRef(null);

    useEffect(() => {
        dispatch(fetchSalesOrders());
        dispatch(fetchProducts());
        dispatch(fetchCustomers());
    }, [dispatch]);

    // Scroll to form when it's shown
    useEffect(() => {
        if (showForm && formRef.current) {
            setTimeout(() => {
                formRef.current.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            }, 100); // Small delay to ensure form is rendered
        }
    }, [showForm]);

    // Helper function to get customer name by ID
    const getCustomerName = (customerId) => {
        const customer = customers.find(c => c.id === customerId);
        return customer ? customer.name : `Customer ${customerId}`;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
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
            grand_total: 0.0,
        });
        setShowForm(false);
    };

    const handleUpdateSalesOrder = async (e) => {
        e.preventDefault();
        calculateTotals();
        await dispatch(updateSalesOrder({ id: editId, ...salesOrder }));
        setEditMode(false);
        setEditId(null);
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
            grand_total: 0.0,
        });
        setShowForm(false);
    };

    const handleDeleteSalesOrder = async (id) => {
        await dispatch(deleteSalesOrder(id));
    };

    const handleEditSalesOrder = (salesOrder) => {
        setEditMode(true);
        setEditId(salesOrder.id);
        setSalesOrder(salesOrder);
        setShowForm(true);
    };

    const handleShowNewOrderForm = () => {
        setEditMode(false);
        setShowForm(true);
    };

    // Helper function to safely format numbers
    const formatCurrency = (value) => {
        const num = parseFloat(value);
        return isNaN(num) ? '0.00' : num.toFixed(2);
    };

    // Prepare chart data
    const chartData = salesOrders.slice(-7).map(order => ({
        date: new Date(order.order_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount: parseFloat(order.grand_total) || 0,
    }));

    // Table columns configuration
    const columns = [
        {
            header: "Order #",
            accessor: "order_number",
            cell: (row) => (
                <span className="font-medium text-slate-900">
                    {row.order_number || 'N/A'}
                </span>
            ),
        },
        {
            header: "Customer",
            accessor: "customer",
            cell: (row) => getCustomerName(row.customer),
        },
        {
            header: "Order Date",
            accessor: "order_date",
            cell: (row) => new Date(row.order_date).toLocaleDateString(),
        },
        {
            header: "Status",
            accessor: "status",
            cell: (row) => (
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    row.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                    row.status === 'invoiced' ? 'bg-blue-100 text-blue-800' :
                    row.status === 'cancelled' ? 'bg-rose-100 text-rose-800' :
                    'bg-slate-100 text-slate-800'
                }`}>
                    {row.status}
                </span>
            ),
        },
        {
            header: "Subtotal",
            accessor: "subtotal",
            cell: (row) => `$${formatCurrency(row.subtotal)}`,
        },
        {
            header: "VAT",
            accessor: "vat_total",
            cell: (row) => `$${formatCurrency(row.vat_total)}`,
        },
        {
            header: "Grand Total",
            accessor: "grand_total",
            cell: (row) => (
                <span className="font-semibold text-slate-900">
                    ${formatCurrency(row.grand_total)}
                </span>
            ),
        },
        {
            header: "Actions",
            accessor: "actions",
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleEditSalesOrder(row)}
                        className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                    >
                        <Edit className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => handleDeleteSalesOrder(row.id)}
                        className="p-1 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <PageHeader 
                    title="Sales Orders" 
                    subtitle="Create and manage sales orders"
                    actions={[
                        <button
                            key="add"
                            onClick={handleShowNewOrderForm}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            New Order
                        </button>
                    ]}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatsCard title="Total Orders" value={salesOrders.length} icon={ShoppingCart} color="indigo" />
                    <StatsCard title="Total Revenue" value={`$${salesOrders.reduce((s,o)=>s+parseFloat(o.grand_total||0),0).toFixed(2)}`} icon={DollarSign} color="emerald" />
                    <StatsCard title="Active Customers" value={new Set(salesOrders.map(o => o.customer)).size} icon={Users} color="sky" />
                    <StatsCard title="Avg Order Value" value={`$${(salesOrders.reduce((s,o)=>s+parseFloat(o.grand_total||0),0)/(salesOrders.length||1)).toFixed(2)}`} icon={Package} color="violet" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard title="Revenue Trend (Last 7 Orders)" trend={5.2} trendValue="5.2%" trendLabel="vs last week">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                                <YAxis stroke="#64748b" fontSize={12} />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'white', 
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="amount" 
                                    stroke="#3b82f6" 
                                    strokeWidth={2}
                                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                            <button className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-100 rounded-lg">
                                        <Package className="h-5 w-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-slate-900">Create from Template</div>
                                        <div className="text-sm text-slate-500">Use a saved order template</div>
                                    </div>
                                </div>
                            </button>
                            <button className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-100 rounded-lg">
                                        <Users className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-slate-900">Customer Analysis</div>
                                        <div className="text-sm text-slate-500">View customer order history</div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {showForm && (
                    <div ref={formRef} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-slate-900">
                                {editMode ? 'Edit Sales Order' : 'Create New Sales Order'}
                            </h3>
                            <button
                                onClick={() => setShowForm(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={editMode ? handleUpdateSalesOrder : handleCreateSalesOrder} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField label="Customer" required>
                                    <select
                                        name="customer"
                                        required
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        value={salesOrder.customer}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Select Customer</option>
                                        {customers.map((customer) => (
                                            <option key={customer.id} value={customer.id}>
                                                {customer.name}
                                            </option>
                                        ))}
                                    </select>
                                </FormField>

                                <FormField label="Order Date" required>
                                    <input
                                        type="date"
                                        name="order_date"
                                        required
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        value={salesOrder.order_date}
                                        onChange={handleInputChange}
                                    />
                                </FormField>

                                <FormField label="Status" required>
                                    <select
                                        name="status"
                                        required
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        value={salesOrder.status}
                                        onChange={handleInputChange}
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="invoiced">Invoiced</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </FormField>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="prices_include_vat"
                                        checked={salesOrder.prices_include_vat}
                                        onChange={(e) => {
                                            setSalesOrder({ ...salesOrder, prices_include_vat: e.target.checked });
                                            calculateTotals();
                                        }}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                                    />
                                    <label className="ml-2 text-sm text-slate-700">Prices include VAT</label>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-lg font-medium text-slate-900">Line Items</h4>
                                    <button
                                        type="button"
                                        onClick={handleAddLineItem}
                                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add Item
                                    </button>
                                </div>

                                {salesOrder.line_items.map((item, index) => (
                                    <div key={index} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <FormField label="Product" required>
                                                <select
                                                    name="product"
                                                    required
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                    value={item.product_id}
                                                    onChange={(e) => handleLineItemChange(index, "product_id", e.target.value)}
                                                >
                                                    <option value="">Select Product</option>
                                                    {products.map((product) => (
                                                        <option key={product.id} value={product.id}>
                                                            {product.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </FormField>

                                            <FormField label="Quantity" required>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    required
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                    value={item.quantity}
                                                    onChange={(e) => handleLineItemChange(index, "quantity", parseInt(e.target.value, 10) || 0)}
                                                />
                                            </FormField>

                                            <FormField label="Unit Price" required>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    required
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                    value={item.unit_price}
                                                    onChange={(e) => handleLineItemChange(index, "unit_price", parseFloat(e.target.value) || 0)}
                                                />
                                            </FormField>

                                            <FormField label="Discount %">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                    value={item.discount}
                                                    onChange={(e) => handleLineItemChange(index, "discount", parseFloat(e.target.value) || 0)}
                                                />
                                            </FormField>
                                        </div>

                                        <div className="flex items-center justify-between mt-3">
                                            <span className="text-sm text-slate-600">
                                                Line Total: <span className="font-medium">${formatCurrency(item.line_total)}</span>
                                            </span>
                                            {salesOrder.line_items.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveLineItem(index)}
                                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Subtotal</label>
                                    <input
                                        type="text"
                                        readOnly
                                        className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 font-medium"
                                        value={`$${formatCurrency(salesOrder.subtotal)}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">VAT Total</label>
                                    <input
                                        type="text"
                                        readOnly
                                        className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 font-medium"
                                        value={`$${formatCurrency(salesOrder.vat_total)}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Grand Total</label>
                                    <input
                                        type="text"
                                        readOnly
                                        className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 font-semibold text-lg"
                                        value={`$${formatCurrency(salesOrder.grand_total)}`}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                                >
                                    {editMode ? 'Update Order' : 'Create Order'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <DataTable
                    data={salesOrders}
                    columns={columns}
                    pageSize={10}
                    onRowClick={handleEditSalesOrder}
                    showPagination={true}
                />
            </div>
        </div>
    );
};

export default SalesOrders;