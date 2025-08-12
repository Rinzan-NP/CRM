// src/pages/PurchaseOrders.js
import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    fetchPurchaseOrders,
    createPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
} from '../redux/purchaseOrdersSlice';
import { fetchProducts } from '../redux/productsSlice';
import { fetchSuppliers } from '../redux/suppliersSlice';
import PageHeader from '../components/layout/PageHeader';
import StatsCard from '../components/ui/StatsCard';
import DataTable from '../components/ui/DataTable';
import FormField from '../components/ui/FormField';
import ChartCard from '../components/ui/ChartCard';
import { 
    FileText, 
    DollarSign, 
    Building2, 
    Package,
    Plus,
    Minus,
    Trash2,
    Edit,
    Save,
    X,
    TrendingUp
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PurchaseOrders = () => {
    const { purchaseOrders } = useSelector(
        (state) => state.purchaseOrders
    );
    const { products } = useSelector(
        (state) => state.products
    );
    const { suppliers } = useSelector(
        (state) => state.suppliers
    );
    const dispatch = useDispatch();
    const [purchaseOrder, setPurchaseOrder] = useState({
        supplier: "",
        order_date: "",
        status: "draft",
        prices_include_vat: false,
        line_items: [
            {
                product_id: "",
                quantity: 1,
                unit_cost: 0.0,
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
        dispatch(fetchPurchaseOrders());
        dispatch(fetchProducts());
        dispatch(fetchSuppliers());
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

    // Helper function to get supplier name by ID
    const getSupplierName = (supplierId) => {
        const supplier = suppliers.find(s => s.id === supplierId);
        return supplier ? supplier.name : `Supplier ${supplierId}`;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'subtotal' || name === 'grand_total') {
            setPurchaseOrder({ ...purchaseOrder, [name]: parseFloat(value) || 0 });
        } else {
            setPurchaseOrder({ ...purchaseOrder, [name]: value });
        }
    };

    const handleLineItemChange = (index, field, value) => {
        const updatedLineItems = purchaseOrder.line_items.map((item, i) =>
            i === index ? { ...item, [field]: value } : item
        );
        setPurchaseOrder({ ...purchaseOrder, line_items: updatedLineItems });
        calculateTotalsForLineItems(updatedLineItems);
    };

    const calculateTotalsForLineItems = (lineItems = purchaseOrder.line_items) => {
        let netSubtotal = 0.0;
        let vatTotal = 0.0;
        const updatedLineItems = lineItems.map((item) => {
            const base = (parseFloat(item.unit_cost) || 0) * (parseFloat(item.quantity) || 0) * (1 - (parseFloat(item.discount) || 0) / 100);
            const product = products.find(p => p.id === item.product_id);
            const vatRate = product && product.vat_rate !== undefined ? parseFloat(product.vat_rate) : 0;
            if (purchaseOrder.prices_include_vat && vatRate > 0) {
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
        setPurchaseOrder(prev => ({
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
        setPurchaseOrder({
            ...purchaseOrder,
            line_items: [
                ...purchaseOrder.line_items,
                {
                    product_id: "",
                    quantity: 1,
                    unit_cost: 0.0,
                    discount: 0.0,
                    line_total: 0.0,
                },
            ],
        });
    };

    const handleRemoveLineItem = (index) => {
        const updatedLineItems = purchaseOrder.line_items.filter(
            (_, i) => i !== index
        );
        setPurchaseOrder({ ...purchaseOrder, line_items: updatedLineItems });
        calculateTotalsForLineItems(updatedLineItems);
    };

    const handleCreatePurchaseOrder = async (e) => {
        e.preventDefault();
        calculateTotals();
        await dispatch(createPurchaseOrder(purchaseOrder));
        setPurchaseOrder({
            supplier: "",
            order_date: "",
            status: "draft",
            prices_include_vat: false,
            line_items: [
                {
                    product_id: "",
                    quantity: 1,
                    unit_cost: 0.0,
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

    const handleUpdatePurchaseOrder = async (e) => {
        e.preventDefault();
        calculateTotals();
        await dispatch(updatePurchaseOrder({ id: editId, ...purchaseOrder }));
        setEditMode(false);
        setEditId(null);
        setPurchaseOrder({
            supplier: "",
            order_date: "",
            status: "draft",
            prices_include_vat: false,
            line_items: [
                {
                    product_id: "",
                    quantity: 1,
                    unit_cost: 0.0,
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

    const handleDeletePurchaseOrder = async (id) => {
        await dispatch(deletePurchaseOrder(id));
    };

    const handleEditPurchaseOrder = (purchaseOrder) => {
        setEditMode(true);
        setEditId(purchaseOrder.id);
        setPurchaseOrder(purchaseOrder);
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

    // Prepare chart data for supplier spending
    const supplierSpending = suppliers.map(supplier => {
        const orders = purchaseOrders.filter(order => order.supplier === supplier.id);
        const totalSpent = orders.reduce((sum, order) => sum + parseFloat(order.grand_total || 0), 0);
        return {
            supplier: supplier.name,
            amount: totalSpent,
        };
    }).filter(item => item.amount > 0).slice(0, 5);

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
            header: "Supplier",
            accessor: "supplier",
            cell: (row) => getSupplierName(row.supplier),
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
                    row.status === 'received' ? 'bg-blue-100 text-blue-800' :
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
                        onClick={() => handleEditPurchaseOrder(row)}
                        className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                    >
                        <Edit className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => handleDeletePurchaseOrder(row.id)}
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
                    title="Purchase Orders" 
                    subtitle="Create and manage purchase orders"
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
                    <StatsCard title="Total Orders" value={purchaseOrders.length} icon={FileText} color="indigo" />
                    <StatsCard title="Total Spent" value={`$${purchaseOrders.reduce((s,o)=>s+parseFloat(o.grand_total||0),0).toFixed(2)}`} icon={DollarSign} color="rose" />
                    <StatsCard title="Active Suppliers" value={new Set(purchaseOrders.map(o => o.supplier)).size} icon={Building2} color="sky" />
                    <StatsCard title="Avg Order Value" value={`$${(purchaseOrders.reduce((s,o)=>s+parseFloat(o.grand_total||0),0)/(purchaseOrders.length||1)).toFixed(2)}`} icon={Package} color="violet" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard title="Supplier Spending Analysis" trend={-2.1} trendValue="2.1%" trendLabel="vs last month">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={supplierSpending}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="supplier" stroke="#64748b" fontSize={12} />
                                <YAxis stroke="#64748b" fontSize={12} />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'white', 
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                            <button className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-100 rounded-lg">
                                        <FileText className="h-5 w-5 text-indigo-600" />
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
                                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-slate-900">Cost Analysis</div>
                                        <div className="text-sm text-slate-500">Analyze spending patterns</div>
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
                                {editMode ? 'Edit Purchase Order' : 'Create New Purchase Order'}
                            </h3>
                            <button
                                onClick={() => setShowForm(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={editMode ? handleUpdatePurchaseOrder : handleCreatePurchaseOrder} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField label="Supplier" required>
                                    <select
                                        name="supplier"
                                        required
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        value={purchaseOrder.supplier}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Select Supplier</option>
                                        {suppliers.map((supplier) => (
                                            <option key={supplier.id} value={supplier.id}>
                                                {supplier.name}
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
                                        value={purchaseOrder.order_date}
                                        onChange={handleInputChange}
                                    />
                                </FormField>

                                <FormField label="Status" required>
                                    <select
                                        name="status"
                                        required
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        value={purchaseOrder.status}
                                        onChange={handleInputChange}
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="received">Received</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </FormField>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="prices_include_vat"
                                        checked={purchaseOrder.prices_include_vat}
                                        onChange={(e) => {
                                            setPurchaseOrder({ ...purchaseOrder, prices_include_vat: e.target.checked });
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

                                {purchaseOrder.line_items.map((item, index) => (
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

                                            <FormField label="Unit Cost" required>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    required
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                    value={item.unit_cost}
                                                    onChange={(e) => handleLineItemChange(index, "unit_cost", parseFloat(e.target.value) || 0)}
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
                                            {purchaseOrder.line_items.length > 1 && (
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
                                        value={`$${formatCurrency(purchaseOrder.subtotal)}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">VAT Total</label>
                                    <input
                                        type="text"
                                        readOnly
                                        className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 font-medium"
                                        value={`$${formatCurrency(purchaseOrder.vat_total)}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Grand Total</label>
                                    <input
                                        type="text"
                                        readOnly
                                        className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 font-semibold text-lg"
                                        value={`$${formatCurrency(purchaseOrder.grand_total)}`}
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
                    data={purchaseOrders}
                    columns={columns}
                    pageSize={10}
                    onRowClick={handleEditPurchaseOrder}
                    showPagination={true}
                />
            </div>
        </div>
    );
};

export default PurchaseOrders;