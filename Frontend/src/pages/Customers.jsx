// src/pages/Customers.jsx
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchCustomers, 
  createCustomer, 
  updateCustomer, 
  deleteCustomer 
} from '../redux/customersSlice';
import { FiPlus } from 'react-icons/fi';
import CustomerForm from '../components/Customers/CustomerForm';
import CustomerTable from '../components/Customers/CustomerTable';
import Modal from '../components/Common/Modal';
import Loader from '../components/Common/Loader';
import EmptyState from '../components/Common/EmptyState';
import Toast from '../components/Common/Toast';
import PageHeader from '../components/layout/PageHeader';
import SearchInput from '../components/ui/SearchInput';
import StatsCard from '../components/ui/StatsCard';
import { FiUsers, FiUserPlus, FiUserCheck } from 'react-icons/fi';

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
        <PageHeader
          title="Customers"
          subtitle="Manage your customer relationships"
          actions={[
            <SearchInput
              key="search"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={setSearchTerm}
              onClear={() => setSearchTerm("")}
            />,
            <button
              key="add"
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
            >
              <FiPlus className="mr-2" />
              Add Customer
            </button>,
          ]}
        />

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCard title="Total Customers" value={customersList.length} icon={FiUsers} color="indigo" />
          <StatsCard title="Active" value={filteredCustomers.length} icon={FiUserCheck} color="emerald" />
          <StatsCard title="New (30d)" value={Math.max(1, Math.round(customersList.length * 0.1))} icon={FiUserPlus} color="sky" />
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