// src/pages/Suppliers.jsx
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchSuppliers, 
  createSupplier, 
  updateSupplier, 
  deleteSupplier 
} from '../redux/suppliersSlice';
import { 
  FiPlus, 
  FiSearch, 
  FiX, 
  FiBriefcase, 
  FiFilter, 
  FiDownload, 
  FiRefreshCw, 
  FiTruck 
} from 'react-icons/fi';
import SupplierForm from '../components/Suppliers/SupplierForm';
import SupplierTable from '../components/Suppliers/SupplierTable';
import Modal from '../components/Common/Modal';
import Loader from '../components/Common/Loader';
import EmptyState from '../components/Common/EmptyState';
import Toast from '../components/Common/Toast';
import ErrorBoundary from '../components/Common/ErrorBoundary';

const Suppliers = () => {
  const { suppliers, loading, error } = useSelector((state) => state.suppliers);
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    address: '', 
    credit_limit: '' 
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentSupplierId, setCurrentSupplierId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    dispatch(fetchSuppliers());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      setToastMessage(error.message || 'An error occurred');
      setShowToast(true);
    }
  }, [error]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await dispatch(updateSupplier({ id: currentSupplierId, ...formData })).unwrap();
        setToastMessage('Supplier updated successfully');
      } else {
        await dispatch(createSupplier(formData)).unwrap();
        setToastMessage('Supplier created successfully');
      }
      setShowToast(true);
      resetForm();
      setShowModal(false);
    } catch (error) {
      setToastMessage(error.message || 'Operation failed');
      setShowToast(true);
    }
  };

  const handleEdit = (supplier) => {
    setFormData(supplier);
    setIsEditing(true);
    setCurrentSupplierId(supplier.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await dispatch(deleteSupplier(id)).unwrap();
        setToastMessage('Supplier deleted successfully');
        setShowToast(true);
      } catch (error) {
        setToastMessage(error.message || 'Delete failed');
        setShowToast(true);
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', address: '', credit_limit: '' });
    setIsEditing(false);
    setCurrentSupplierId(null);
  };

  const suppliersList = suppliers || [];
  const filteredSuppliers = suppliersList.filter(supplier => 
    supplier && (
      supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (loading && suppliersList.length === 0) return <Loader />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-red-500">Error loading suppliers: {error.message}</p>
            <button 
              onClick={() => dispatch(fetchSuppliers())}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
            <p className="text-gray-600">Manage your supplier relationships</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search suppliers..."
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
              Add Supplier
            </button>
          </div>
        </div>

        {/* Supplier Table */}
        {filteredSuppliers.length > 0 ? (
          <ErrorBoundary>
            <SupplierTable 
              suppliers={filteredSuppliers} 
              onEdit={handleEdit} 
              onDelete={handleDelete} 
            />
          </ErrorBoundary>
        ) : (
          <EmptyState 
            title={searchTerm ? "No suppliers found" : "No suppliers yet"}
            description={searchTerm ? 
              "Try adjusting your search query" : 
              "Get started by adding your first supplier"}
            actionText="Add Supplier"
            onAction={() => {
              resetForm();
              setShowModal(true);
            }}
          />
        )}

        {/* Supplier Form Modal */}
        <Modal 
          isOpen={showModal} 
          onClose={() => {
            setShowModal(false);
            resetForm();
          }}
          title={isEditing ? 'Edit Supplier' : 'Add New Supplier'}
        >
          <SupplierForm 
            formData={formData}
            isEditing={isEditing}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowModal(false);
              resetForm();
            }}
            isLoading={loading}
          />
        </Modal>

        {/* Toast Notification */}
        {showToast && (
          <Toast 
            message={toastMessage} 
            onClose={() => setShowToast(false)} 
            type={error ? 'error' : 'success'}
          />
        )}
      </div>
    </div>
  );
};

export default Suppliers;