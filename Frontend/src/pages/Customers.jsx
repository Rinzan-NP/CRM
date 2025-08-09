// src/pages/Customers.jsx
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchCustomers, 
  createCustomer, 
  updateCustomer, 
  deleteCustomer 
} from '../redux/customersSlice';
import { FiPlus, FiSearch, FiX } from 'react-icons/fi';
import CustomerForm from '../components/Customers/CustomerForm';
import CustomerTable from '../components/Customers/CustomerTable';
import Modal from '../components/Common/Modal';
import Loader from '../components/Common/Loader';
import EmptyState from '../components/Common/EmptyState';
import Toast from '../components/Common/Toast';

const Customers = () => {
  const { customers, loading, error } = useSelector((state) => state.customers);
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    address: '', 
    credit_limit: '' 
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentCustomerId, setCurrentCustomerId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    dispatch(fetchCustomers());
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
        await dispatch(updateCustomer({ id: currentCustomerId, ...formData })).unwrap();
        setToastMessage('Customer updated successfully');
      } else {
        await dispatch(createCustomer(formData)).unwrap();
        setToastMessage('Customer created successfully');
      }
      setShowToast(true);
      resetForm();
      setShowModal(false);
    } catch (error) {
      setToastMessage(error.message || 'Operation failed');
      setShowToast(true);
    }
  };

  const handleEdit = (customer) => {
    setFormData(customer);
    setIsEditing(true);
    setCurrentCustomerId(customer.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await dispatch(deleteCustomer(id)).unwrap();
        setToastMessage('Customer deleted successfully');
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
    setCurrentCustomerId(null);
  };
  const customersList = customers || [];

  const filteredCustomers = customersList.filter(customer => 
    customer && ( // Add null check for customer
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (loading && customers.length === 0) return <Loader />;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-600">Manage your customer relationships</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search customers..."
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
              Add Customer
            </button>
          </div>
        </div>

        {/* Customer Table */}
        {filteredCustomers.length > 0 ? (
          <CustomerTable 
            customers={filteredCustomers} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
          />
        ) : (
          <EmptyState 
            title={searchTerm ? "No customers found" : "No customers yet"}
            description={searchTerm ? 
              "Try adjusting your search query" : 
              "Get started by adding your first customer"}
            actionText="Add Customer"
            onAction={() => {
              resetForm();
              setShowModal(true);
            }}
          />
        )}

        {/* Customer Form Modal */}
        <Modal 
          isOpen={showModal} 
          onClose={() => {
            setShowModal(false);
            resetForm();
          }}
          title={isEditing ? 'Edit Customer' : 'Add New Customer'}
        >
          <CustomerForm 
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

export default Customers;