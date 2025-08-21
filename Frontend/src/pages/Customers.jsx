// src/pages/Customers.jsx - Responsive Header Section
import React, { useState, useEffect } from 'react';
import { FiPlus, FiMap, FiList, FiUsers, FiMapPin } from 'react-icons/fi';
import CustomerForm from '../components/Customers/CustomerForm';
import CustomerTable from '../components/Customers/CustomerTable';
import CustomerLocationMap from '../components/Customers/CustomerLocationMap';
import CustomerInfoCard from '../components/Customers/CustomerInfoCard';
import Modal from '../components/Common/Modal';
import Toast from '../components/Common/Toast';
import api from '../services/api';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/main/customers/');
      setCustomers(response.data);
    } catch (err) {
      setError('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Handle customer creation/update
  const handleSubmit = async (formData) => {
    try {
      if (editingCustomer) {
        await api.put(`/main/customers/${editingCustomer.id}/`, formData);
        setInfo('Customer updated successfully!');
      } else {
        await api.post('/main/customers/', formData);
        setInfo('Customer created successfully!');
      }
      
      setShowForm(false);
      setEditingCustomer(null);
      fetchCustomers();
    } catch (err) {
      throw err;
    }
  };

  // Handle customer deletion
  const handleDelete = async (customer) => {
    if (window.confirm(`Are you sure you want to delete ${customer.name}?`)) {
      try {
        await api.delete(`/main/customers/${customer.id}/`);
        setInfo('Customer deleted successfully!');
        fetchCustomers();
      } catch (err) {
        setError('Failed to delete customer');
      }
    }
  };

  // Handle customer edit
  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  // Handle customer view
  const handleView = (customer) => {
    setSelectedCustomer(customer);
  };

  // Handle geocoding
  const handleGeocode = async (customer) => {
    try {
      const response = await api.post(`/main/customers/${customer.id}/geocode_address/`);
      setInfo('Address geocoded successfully!');
      fetchCustomers();
    } catch (err) {
      setError('Failed to geocode address');
    }
  };

  // Handle setting coordinates
  const handleSetCoordinates = async (customer, lat, lon) => {
    try {
      const response = await api.post(`/main/customers/${customer.id}/set_coordinates/`, {
        lat: lat,
        lon: lon
      });
      setInfo('Coordinates set successfully!');
      fetchCustomers();
    } catch (err) {
      setError('Failed to set coordinates');
    }
  };

  // Handle customer selection from map
  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
  };

  // Close modals
  const closeForm = () => {
    setShowForm(false);
    setEditingCustomer(null);
  };

  const closeView = () => {
    setSelectedCustomer(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header - Redesigned for Better Responsiveness */}
        <div className="mb-6 sm:mb-8">
          {/* Title and Description */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
                Customers
              </h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
                Manage your customer database and locations
              </p>
            </div>
            
            {/* Action Buttons - Mobile Responsive */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              {/* View Toggle - Full width on mobile */}
              <div className="flex bg-white rounded-lg shadow-sm border p-1 w-full sm:w-auto">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1 sm:gap-2 ${
                    viewMode === 'list'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FiList className="h-4 w-4" />
                  <span className="hidden xs:inline">List</span>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1 sm:gap-2 ${
                    viewMode === 'map'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FiMap className="h-4 w-4" />
                  <span className="hidden xs:inline">Map</span>
                </button>
              </div>

              {/* Add Customer Button - Full width on mobile */}
              <button
                onClick={() => setShowForm(true)}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <FiPlus className="h-4 w-4" />
                <span>Add Customer</span>
              </button>
            </div>
          </div>

          {/* Stats Cards - Responsive Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Customers */}
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <FiUsers className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                    Total Customers
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {customers.length}
                  </p>
                </div>
              </div>
            </div>

            {/* With Locations */}
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                  <FiMapPin className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                    With Locations
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {customers.filter(c => c.lat && c.lon).length}
                  </p>
                </div>
              </div>
            </div>

            {/* No Location */}
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                  <FiMapPin className="h-4 w-4 sm:h-6 sm:w-6 text-gray-600" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                    No Location
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {customers.filter(c => !c.lat && !c.lon).length}
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Stats Card - Hidden on mobile, shown on larger screens */}
            <div className="hidden lg:block bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                  <FiUsers className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                    Active
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {customers.filter(c => c.is_active !== false).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {viewMode === 'list' ? (
            <CustomerTable
              customers={customers}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
              onGeocode={handleGeocode}
              onSetCoordinates={handleSetCoordinates}
            />
          ) : (
            <CustomerLocationMap
              onCustomerSelect={handleCustomerSelect}
              selectedCustomerId={selectedCustomer?.id}
            />
          )}
        </div>
      </div>

      {/* Customer Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
        size="4xl"
      >
        <CustomerForm
          customer={editingCustomer}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          mode={editingCustomer ? 'edit' : 'create'}
        />
      </Modal>

      {/* Customer View Modal - Modified to show View More button */}
      <Modal
        isOpen={!!selectedCustomer}
        onClose={closeView}
        title={`${selectedCustomer?.name || 'Customer'} - Quick View`}
        size="4xl"
      >
        <CustomerInfoCard 
          customer={selectedCustomer} 
          showViewMore={true} 
        />
      </Modal>

      {/* Status Messages */}
      {error && (
        <Toast type="error" message={error} onClose={() => setError('')} />
      )}
      {info && (
        <Toast type="success" message={info} onClose={() => setInfo('')} />
      )}
    </div>
  );
};

export default Customers;