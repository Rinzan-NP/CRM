// src/pages/Routes.jsx
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchRoutes, createRoute, updateRoute, deleteRoute } from '../redux/routesSlice';
import { FiPlus, FiSearch, FiX, FiEdit, FiTrash2, FiMapPin, FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import Modal from '../components/Common/Modal';
import Loader from '../components/Common/Loader';
import EmptyState from '../components/Common/EmptyState';
import Toast from '../components/Common/Toast';

const Routes = () => {
  const { routes, loading: loadingRoutes, error: routesError } = useSelector((state) => state.routes);
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  
  const [formData, setFormData] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentRouteId, setCurrentRouteId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  useEffect(() => {
    dispatch(fetchRoutes());
  }, [dispatch]);

  useEffect(() => {
    if (routesError) {
      setToastMessage(routesError.message || 'An error occurred');
      setToastType('error');
      setShowToast(true);
    }
  }, [routesError]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      setToastMessage('Please enter a route name');
      setToastType('error');
      setShowToast(true);
      return;
    }

    if (!formData.date) {
      setToastMessage('Please select a date');
      setToastType('error');
      setShowToast(true);
      return;
    }

    try {
      if (isEditing) {
        await dispatch(updateRoute({ id: currentRouteId, ...formData })).unwrap();
        setToastMessage('Route updated successfully');
      } else {
        await dispatch(createRoute(formData)).unwrap();
        setToastMessage('Route created successfully');
      }
      
      setToastType('success');
      setShowToast(true);
      resetForm();
      setShowModal(false);
    } catch (error) {
      setToastMessage(error.message || 'Operation failed');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleEdit = (route) => {
    setFormData({
      name: route.name,
      date: route.date,
      start_time: route.start_time || '',
      end_time: route.end_time || '',
    });
    setIsEditing(true);
    setCurrentRouteId(route.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this route?')) {
      try {
        await dispatch(deleteRoute(id)).unwrap();
        setToastMessage('Route deleted successfully');
        setToastType('success');
        setShowToast(true);
      } catch (error) {
        setToastMessage(error.message || 'Delete failed');
        setToastType('error');
        setShowToast(true);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      date: new Date().toISOString().split('T')[0],
      start_time: '',
      end_time: '',
    });
    setIsEditing(false);
    setCurrentRouteId(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  const getSalespersonName = (route) => {
    if (!route.salesperson) return 'N/A';
    return route.salesperson.email || route.salesperson.name || 'Unknown';
  };

  const filteredRoutes = routes.filter(route => {
    const searchLower = searchTerm.toLowerCase();
    return (
      route.name?.toLowerCase().includes(searchLower) ||
      route.route_number?.toLowerCase().includes(searchLower) ||
      route.date?.includes(searchTerm) ||
      getSalespersonName(route).toLowerCase().includes(searchLower)
    );
  });

  if (loadingRoutes && routes.length === 0) return <Loader />;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Routes</h1>
            <p className="text-gray-600">Manage and track sales routes</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search routes..."
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
              Add Route
            </button>
          </div>
        </div>

        {/* Routes Table */}
        {filteredRoutes.length > 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Route Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Route Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Salesperson
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Visits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRoutes.map((route) => (
                    <tr key={route.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-blue-600">
                          {route.route_number || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiMapPin className="mr-2 text-gray-400" />
                          <div className="text-sm font-medium text-gray-900">
                            {route.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <FiUser className="mr-1 text-gray-400" />
                          {getSalespersonName(route)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <FiCalendar className="mr-1 text-gray-400" />
                          {formatDate(route.date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <FiClock className="mr-1 text-gray-400" />
                          {formatTime(route.start_time)} - {formatTime(route.end_time)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {route.visits?.length || 0} visits
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(route)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(route.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState 
            title={searchTerm ? "No routes found" : "No routes yet"}
            description={searchTerm ? 
              "Try adjusting your search query" : 
              "Get started by creating your first route"}
            actionText="Add Route"
            onAction={() => {
              resetForm();
              setShowModal(true);
            }}
          />
        )}

        {/* Route Form Modal */}
        <Modal 
          isOpen={showModal} 
          onClose={() => {
            setShowModal(false);
            resetForm();
          }}
          title={isEditing ? 'Edit Route' : 'Add New Route'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Route Name *
              </label>
              <input
                type="text"
                name="name"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Downtown Route"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                name="date"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.date}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  name="start_time"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.start_time}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  name="end_time"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.end_time}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loadingRoutes}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingRoutes ? 'Processing...' : (isEditing ? 'Update Route' : 'Create Route')}
              </button>
            </div>
          </form>
        </Modal>

        {/* Toast Notification */}
        {showToast && (
          <Toast 
            message={toastMessage} 
            onClose={() => setShowToast(false)} 
            type={toastType}
          />
        )}
      </div>
    </div>
  );
};

export default Routes;