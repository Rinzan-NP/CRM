// src/pages/PurchaseOrders.js
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    fetchPurchaseOrders,
    createPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
} from '../redux/purchaseOrdersSlice';
import { fetchProducts } from '../redux/productsSlice';
import { fetchSuppliers } from '../redux/suppliersSlice';

const PurchaseOrders = () => {
    // Add defensive checks for Redux state
    const purchaseOrdersState = useSelector((state) => state.purchaseOrders || {});
    const productsState = useSelector((state) => state.products || {});
    const suppliersState = useSelector((state) => state.suppliers || {});

    const { 
        purchaseOrders = [], 
        loading: loadingOrders = false 
    } = purchaseOrdersState;
    
    const { 
        products = [], 
        loading: loadingProducts = false 
    } = productsState;
    
    const { 
        suppliers = [], 
        loading: loadingSuppliers = false 
    } = suppliersState;

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

    useEffect(() => {
        // Add error handling for dispatch calls
        try {
            if (fetchPurchaseOrders) {
                dispatch(fetchPurchaseOrders());
            }
            if (fetchProducts) {
                dispatch(fetchProducts());
            }
            if (fetchSuppliers) {
                dispatch(fetchSuppliers());
            }
        } catch (error) {
            console.error('Error dispatching actions:', error);
        }
    }, [dispatch]);

    // Helper function to get supplier name by ID
    const getSupplierName = (supplierId) => {
        if (!suppliers || !Array.isArray(suppliers)) {
            return `Supplier ${supplierId}`;
        }
        const supplier = suppliers.find(s => s && s.id === supplierId);
        return supplier ? supplier.name : `Supplier ${supplierId}`;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'subtotal' || name === 'grand_total') {
            setPurchaseOrder(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
        } else {
            setPurchaseOrder(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleLineItemChange = (index, field, value) => {
        const updatedLineItems = purchaseOrder.line_items.map((item, i) =>
            i === index ? { ...item, [field]: value } : item
        );
        setPurchaseOrder(prev => ({ ...prev, line_items: updatedLineItems }));
        calculateTotalsForLineItems(updatedLineItems);
    };

    const calculateTotalsForLineItems = (lineItems = purchaseOrder.line_items) => {
        if (!Array.isArray(lineItems)) return;
        
        let netSubtotal = 0.0;
        let vatTotal = 0.0;
        const updatedLineItems = lineItems.map((item) => {
            const unitCost = parseFloat(item.unit_cost) || 0;
            const quantity = parseFloat(item.quantity) || 0;
            const discount = parseFloat(item.discount) || 0;
            
            const lineGross = unitCost * quantity * (1 - discount / 100);
            const product = products.find(p => p && p.id === item.product_id);
            const vatRate = product && product.vat_rate !== undefined ? parseFloat(product.vat_rate) : 0;
            if (purchaseOrder.prices_include_vat && vatRate > 0) {
                const net = lineGross / (1 + vatRate / 100);
                const vat = lineGross - net;
                netSubtotal += net;
                vatTotal += vat;
            } else {
                const vat = lineGross * vatRate / 100;
                netSubtotal += lineGross;
                vatTotal += vat;
            }
            return { ...item, line_total: lineGross };
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

    const handleAddLineItem = () => {
        setPurchaseOrder(prev => ({
            ...prev,
            line_items: [
                ...prev.line_items,
                {
                    product_id: "",
                    quantity: 1,
                    unit_cost: 0.0,
                    discount: 0.0,
                    line_total: 0.0,
                },
            ],
        }));
    };

    const handleRemoveLineItem = (index) => {
        const updatedLineItems = purchaseOrder.line_items.filter(
            (_, i) => i !== index
        );
        setPurchaseOrder(prev => ({ ...prev, line_items: updatedLineItems }));
        calculateTotalsForLineItems(updatedLineItems);
    };

    const handleCreatePurchaseOrder = async (e) => {
        e.preventDefault();
        try {
            calculateTotalsForLineItems();
            if (createPurchaseOrder) {
                await dispatch(createPurchaseOrder(purchaseOrder));
                // Reset form after successful creation
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
            }
        } catch (error) {
            console.error('Error creating purchase order:', error);
        }
    };

    const handleUpdatePurchaseOrder = async (e) => {
        e.preventDefault();
        try {
            calculateTotalsForLineItems();
            if (updatePurchaseOrder && editId) {
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
            }
        } catch (error) {
            console.error('Error updating purchase order:', error);
        }
    };

    const handleDeletePurchaseOrder = async (id) => {
        try {
            if (deletePurchaseOrder) {
                await dispatch(deletePurchaseOrder(id));
            }
        } catch (error) {
            console.error('Error deleting purchase order:', error);
        }
    };

    const handleEditPurchaseOrder = (po) => {
        setEditMode(true);
        setEditId(po.id);
        
        // Transform the API data structure to match the form structure
        const transformedLineItems = Array.isArray(po.line_items) ? 
            po.line_items.map(item => ({
                product_id: item.product ? item.product.id : (item.product_id || ""),
                quantity: item.quantity || 1,
                unit_cost: parseFloat(item.unit_cost) || 0.0,
                discount: parseFloat(item.discount) || 0.0,
                line_total: parseFloat(item.line_total) || 0.0,
            })) : [
                {
                    product_id: "",
                    quantity: 1,
                    unit_cost: 0.0,
                    discount: 0.0,
                    line_total: 0.0,
                }
            ];

        setPurchaseOrder({
            supplier: po.supplier || "",
            order_date: po.order_date || "",
            status: po.status || "draft",
            prices_include_vat: po.prices_include_vat || false,
            line_items: transformedLineItems,
            subtotal: parseFloat(po.subtotal) || 0.0,
            vat_total: parseFloat(po.vat_total) || 0.0,
            grand_total: parseFloat(po.grand_total) || 0.0,
        });
    };

    // Helper function to get product name from line item
    const getProductName = (lineItem) => {
        if (lineItem.product && lineItem.product.name) {
            return `${lineItem.product.code} - ${lineItem.product.name}`;
        }
        if (lineItem.product_id) {
            const product = products.find(p => p && p.id === lineItem.product_id);
            return product ? `${product.code || product.id} - ${product.name}` : `Product ${lineItem.product_id}`;
        }
        return 'No Product';
    };
    const formatCurrency = (value) => {
        const num = parseFloat(value);
        return isNaN(num) ? '0.00' : num.toFixed(2);
    };

    // Loading state
    if (loadingOrders || loadingProducts || loadingSuppliers) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Manage Purchase Orders
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form
                        onSubmit={
                            editMode
                                ? handleUpdatePurchaseOrder
                                : handleCreatePurchaseOrder
                        }
                    >
                        <div className="mb-4">
                            <label
                                htmlFor="supplier"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Supplier
                            </label>
                            <div className="mt-1">
                                <select
                                    id="supplier"
                                    name="supplier"
                                    required
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    value={purchaseOrder.supplier}
                                    onChange={handleInputChange}
                                >
                                    <option value="">Select Supplier</option>
                                    {Array.isArray(suppliers) && suppliers.map((supplier) => (
                                        supplier && supplier.id ? (
                                            <option
                                                key={supplier.id}
                                                value={supplier.id}
                                            >
                                                {supplier.id} - {supplier.name || `Supplier ${supplier.id}`}
                                            </option>
                                        ) : null
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mb-4">
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
                                    value={purchaseOrder.order_date}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        <div className="mb-4">
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
                                    value={purchaseOrder.status}
                                    onChange={handleInputChange}
                                >
                                    <option value="draft">Draft</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="received">Received</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>

                        {Array.isArray(purchaseOrder.line_items) && purchaseOrder.line_items.map((item, index) => (
                            <div key={index} className="mt-4 p-4 border border-gray-200 rounded-md">
                                <h4 className="text-sm font-medium text-gray-900 mb-3">
                                    Line Item {index + 1}
                                </h4>
                                
                                <div className="mb-3">
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
                                            value={item.product_id || ""}
                                            onChange={(e) =>
                                                handleLineItemChange(
                                                    index,
                                                    "product_id",
                                                    e.target.value
                                                )
                                            }
                                        >
                                            <option value="">Select Product</option>
                                            {Array.isArray(products) && products.map((product) => (
                                                product && product.id ? (
                                                    <option
                                                        key={product.id}
                                                        value={product.id}
                                                    >
                                                        {product.code || product.id} - {product.name || `Product ${product.id}`}
                                                    </option>
                                                ) : null
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
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
                                                value={item.quantity || 1}
                                                onChange={(e) =>
                                                    handleLineItemChange(
                                                        index,
                                                        "quantity",
                                                        parseInt(e.target.value, 10) || 1
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor={`unit_cost-${index}`}
                                            className="block text-sm font-medium text-gray-700"
                                        >
                                            Unit Cost
                                        </label>
                                        <div className="mt-1">
                                            <input
                                                id={`unit_cost-${index}`}
                                                name="unit_cost"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                required
                                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                value={item.unit_cost || 0}
                                                onChange={(e) =>
                                                    handleLineItemChange(
                                                        index,
                                                        "unit_cost",
                                                        parseFloat(e.target.value) || 0
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3">
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
                                            min="0"
                                            max="100"
                                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            value={item.discount || 0}
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

                                <div className="mt-3 flex justify-between items-center">
                                    <span className="text-sm text-gray-600">
                                        Line Total: ${formatCurrency(item.line_total || 0)}
                                    </span>
                                    {purchaseOrder.line_items.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveLineItem(index)}
                                            className="text-red-600 hover:text-red-900 text-sm"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        <div className="mt-4">
                            <label className="inline-flex items-center">
                                <input
                                    type="checkbox"
                                    className="form-checkbox"
                                    checked={purchaseOrder.prices_include_vat}
                                    onChange={(e) => {
                                        const next = { ...purchaseOrder, prices_include_vat: e.target.checked };
                                        setPurchaseOrder(next);
                                        calculateTotalsForLineItems(next.line_items);
                                    }}
                                />
                                <span className="ml-2 text-sm text-gray-700">Costs include VAT</span>
                            </label>
                        </div>

                        <div className="mt-4">
                            <button
                                type="button"
                                onClick={handleAddLineItem}
                                className="text-green-600 hover:text-green-900 text-sm font-medium"
                            >
                                + Add Line Item
                            </button>
                        </div>

                        <div className="mt-6 space-y-4">
                            <div>
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
                                        type="text"
                                        readOnly
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-100"
                                        value={`${formatCurrency(purchaseOrder.subtotal || 0)}`}
                                    />
                                </div>
                            </div>

                            <div>
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
                                        type="text"
                                        readOnly
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-100"
                                        value={`${formatCurrency(purchaseOrder.vat_total || 0)}`}
                                    />
                                </div>
                            </div>

                            <div>
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
                                        type="text"
                                        readOnly
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-100 font-semibold"
                                        value={`${formatCurrency(purchaseOrder.grand_total || 0)}`}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                type="submit"
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                {editMode ? "Update Purchase Order" : "Create Purchase Order"}
                            </button>
                            {editMode && (
                                <button
                                    type="button"
                                    onClick={() => {
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
                                    }}
                                    className="w-full mt-2 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            <div className="mt-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Purchase Orders
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
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
                                        Supplier
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
                                        Items
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
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {Array.isArray(purchaseOrders) && purchaseOrders.length > 0 ? (
                                    purchaseOrders.map((po) => (
                                        <tr key={po.id || Math.random()}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {po.order_number || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {getSupplierName(po.supplier)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {po.order_date || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    po.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                    po.status === 'received' ? 'bg-blue-100 text-blue-800' :
                                                    po.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {po.status || 'draft'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {Array.isArray(po.line_items) && po.line_items.length > 0 ? (
                                                    <div className="space-y-1">
                                                        {po.line_items.map((item, idx) => (
                                                            <div key={idx} className="text-xs">
                                                                <div className="font-medium">{getProductName(item)}</div>
                                                                <div className="text-gray-400">
                                                                    Qty: {item.quantity} × ${formatCurrency(item.unit_cost)}
                                                                    {item.discount > 0 && ` (-${item.discount}%)`}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    'No items'
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                ${formatCurrency(po.subtotal)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                ${formatCurrency(po.vat_total)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                ${formatCurrency(po.grand_total)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => handleEditPurchaseOrder(po)}
                                                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePurchaseOrder(po.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="px-6 py-4 text-center text-sm text-gray-500">
                                            No purchase orders found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PurchaseOrders;