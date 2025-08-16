// src/pages/Customers.jsx
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
              <p className="mt-2 text-gray-600">
                Manage your customer database and locations
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex bg-white rounded-lg shadow-sm border p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FiList className="inline mr-2" />
                  List View
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'map'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FiMap className="inline mr-2" />
                  Map View
                </button>
              </div>

              {/* Add Customer Button */}
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <FiPlus className="h-4 w-4" />
                Add Customer
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FiUsers className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Customers</p>
                  <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FiMapPin className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">With Locations</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {customers.filter(c => c.lat && c.lon).length}
                  </p>
                </div>
              </div>
            </div>

            {/* <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <FiMapPin className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Verified Locations</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {customers.filter(c => c.location_verified).length}
                  </p>
                </div>
              </div>
            </div> */}

            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <FiMapPin className="h-6 w-6 text-gray-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">No Location</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {customers.filter(c => !c.lat && !c.lon).length}
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

      {/* Customer View Modal */}
      <Modal
        isOpen={!!selectedCustomer}
        onClose={closeView}
        title="Customer Details"
        size="4xl"
      >
        <CustomerInfoCard customer={selectedCustomer} />
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