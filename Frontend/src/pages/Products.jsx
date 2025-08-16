// src/pages/Products.js
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProducts, createProduct, updateProduct, deleteProduct, fetchVatCategories, createVatCategory, updateVatCategory, deleteVatCategory } from '../redux/productsSlice';
import PageHeader from '../components/layout/PageHeader';
import StatsCard from '../components/ui/StatsCard';
import DataTable from '../components/ui/DataTable';
import FormField from '../components/ui/FormField';
import ChartCard from '../components/ui/ChartCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Edit, Trash2, X,DollarSign } from 'lucide-react';
import Button from '../components/ui/Button';
import VatForm from '../components/vat/VatForm';
import VatTable from '../components/vat/VatTable';
import Modal from '../components/Common/Modal';

const Products = () => {
  const { products, vatCategories, loading, error } = useSelector((state) => state.products);
  const dispatch = useDispatch();
  const [product, setProduct] = useState({
    code: '',
    name: '',
    unit_price: '',
    unit_cost: '',
    vat_category: 1,
    is_active: true,
  });
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isVatModalOpen, setIsVatModalOpen] = useState(false);
  const [editingVat, setEditingVat] = useState(null);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchVatCategories());
  }, [dispatch]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct({ ...product, [name]: type === 'checkbox' ? checked : value });
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    await dispatch(createProduct(product));
    setProduct({
      code: '',
      name: '',
      unit_price: '',
      unit_cost: '',
      vat_category: 1,
      is_active: true,
    });
    setIsProductModalOpen(false);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    await dispatch(updateProduct({ id: editId, ...product }));
    setEditMode(false);
    setEditId(null);
    setProduct({
      code: '',
      name: '',
      unit_price: '',
      unit_cost: '',
      vat_category: 1,
      is_active: true,
    });
    setIsProductModalOpen(false);
  };

  const handleDeleteProduct = async (id) => {
    await dispatch(deleteProduct(id));
  };

  const handleEditProduct = (row) => {
    setEditMode(true);
    setEditId(row.id);
    setProduct({
      code: row.code,
      name: row.name,
      unit_price: row.unit_price,
      unit_cost: row.unit_cost,
      vat_category: row.vat_category,
      is_active: row.is_active,
    });
    setIsProductModalOpen(true);
  };

  const formatCurrency = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const chartData = products.slice(-7).map(p => ({
    code: p.code,
    price: parseFloat(p.unit_price) || 0,
  }));

  const columns = [
    {
      header: 'Code',
      accessor: 'code',
    },
    {
      header: 'Name',
      accessor: 'name',
    },
    {
      header: 'Unit Price',
      accessor: 'unit_price',
      cell: (row) => `$${formatCurrency(row.unit_price)}`,
    },
    {
      header: 'Unit Cost',
      accessor: 'unit_cost',
      cell: (row) => `$${formatCurrency(row.unit_cost)}`,
    },
    {
      header: 'VAT Category',
      accessor: 'vat_category',
      cell: (row) => vatCategories.find(v => v.id === row.vat_category)?.category || 'N/A',
    },
    {
      header: 'Status',
      accessor: 'is_active',
      cell: (row) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${row.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEditProduct(row)}
            className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteProduct(row.id)}
            className="p-1 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const totalProducts = products.length;
  const totalValue = products.reduce((s, p) => s + (parseFloat(p.unit_price) || 0), 0);

  const handleVatInputChange = (e) => {
    const { name, value } = e.target;
    setEditingVat({ ...editingVat, [name]: value });
  };

  const handleCreateVatCategory = async (e) => {
    e.preventDefault();
    await dispatch(createVatCategory(editingVat));
    setEditingVat({ category: '', rate: '' });
    setIsVatModalOpen(false);
  };

  const handleUpdateVatCategory = async (e) => {
    e.preventDefault();
    await dispatch(updateVatCategory({ id: editingVat.id, ...editingVat }));
    setEditingVat({ category: '', rate: '' });
    setIsVatModalOpen(false);
  };

  const handleDeleteVatCategory = async (id) => {
    await dispatch(deleteVatCategory(id));
  };

  const handleEditVatCategory = (vat) => {
    setEditingVat(vat);
    setIsVatModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader 
          title="Products" 
          subtitle="Create and manage products"
          actions={[
            <button
              key="add"
              onClick={() => { setEditMode(false); setIsProductModalOpen(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Product
            </button>
          ]}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCard title="Total Products" value={totalProducts} icon={Plus} color="violet" />
          <StatsCard title="Total Value" value={`$${totalValue.toFixed(2)}`} icon={DollarSign} color="emerald" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Product Price Trend (Last 7)" trend={totalValue >= 0 ? 3.1 : -1.4} trendValue={Math.abs(totalValue).toFixed(0)} trendLabel="delta">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="code" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="price" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors">
                Generate Next Product
              </button>
              <button className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors">
                Export Products (CSV)
              </button>
            </div>
          </div> */}
        </div>

        <DataTable
          data={products}
          columns={columns}
          pageSize={10}
          onRowClick={handleEditProduct}
          showPagination={true}
        />

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Manage VAT Categories</h3>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => { setEditingVat({ category: '', rate: '' }); setIsVatModalOpen(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New VAT Category
            </button>
          </div>
          <VatTable
            vatCategories={vatCategories}
            onEdit={handleEditVatCategory}
            onDelete={handleDeleteVatCategory}
          />
        </div>
      </div>

      <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title={editMode ? 'Edit Product' : 'Create New Product'}>
        <form onSubmit={editMode ? handleUpdateProduct : handleCreateProduct} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Product Code" required>
              <input
                type="text"
                name="code"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={product.code}
                onChange={handleInputChange}
              />
            </FormField>

            <FormField label="Product Name" required>
              <input
                type="text"
                name="name"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={product.name}
                onChange={handleInputChange}
              />
            </FormField>

            <FormField label="Unit Price" required>
              <input
                type="number"
                step="0.01"
                name="unit_price"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={product.unit_price}
                onChange={handleInputChange}
              />
            </FormField>

            <FormField label="Unit Cost" required>
              <input
                type="number"
                step="0.01"
                name="unit_cost"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={product.unit_cost}
                onChange={handleInputChange}
              />
            </FormField>

            <FormField label="VAT Category" required>
              <select
                name="vat_category"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={product.vat_category}
                onChange={handleInputChange}
              >
                <option value="">Select VAT Category</option>
                {vatCategories.map((vat) => (
                  <option key={vat.id} value={vat.id}>
                    {vat.category} ({vat.rate}%)
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Active" required>
              <input
                type="checkbox"
                name="is_active"
                checked={product.is_active}
                onChange={handleInputChange}
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsProductModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            >
              {editMode ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isVatModalOpen} onClose={() => setIsVatModalOpen(false)} title={editingVat ? (editingVat.id ? 'Edit VAT Category' : 'Create New VAT Category') : 'Create New VAT Category'}>
        <VatForm
          edit={editingVat}
          onDone={() => { setIsVatModalOpen(false); setEditingVat(null); }}
          onSubmit={editingVat && editingVat.id ? handleUpdateVatCategory : handleCreateVatCategory}
        />
      </Modal>
    </div>
  );
};

export default Products;