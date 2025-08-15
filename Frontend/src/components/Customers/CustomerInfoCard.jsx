// src/components/Customers/CustomerInfoCard.jsx
import React from 'react';
import { FiMapPin, FiMail, FiPhone, FiDollarSign, FiCalendar, FiCheckCircle, FiTarget } from 'react-icons/fi';

const CustomerInfoCard = ({ customer }) => {
  if (!customer) return null;

  const getLocationStatus = () => {
    if (customer.location_verified) {
      return { text: 'Verified', color: 'green', icon: <FiCheckCircle className="h-4 w-4" /> };
    } else if (customer.lat && customer.lon) {
      return { text: 'Coordinates Set', color: 'blue', icon: <FiTarget className="h-4 w-4" /> };
    } else {
      return { text: 'No Location', color: 'gray', icon: <FiMapPin className="h-4 w-4" /> };
    }
  };

  const locationStatus = getLocationStatus();

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">Name</label>
            <p className="mt-1 text-sm text-gray-900">{customer.name}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600">Email</label>
            <p className="mt-1 text-sm text-gray-900">{customer.email}</p>
          </div>
          
          {customer.phone && (
            <div>
              <label className="block text-sm font-medium text-gray-600">Phone</label>
              <p className="mt-1 text-sm text-gray-900">{customer.phone}</p>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-600">Credit Limit</label>
            <p className="mt-1 text-sm text-gray-900">₹{parseFloat(customer.credit_limit || 0).toFixed(2)}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600">Current Balance</label>
            <p className="mt-1 text-sm text-gray-900">₹{parseFloat(customer.current_balance || 0).toFixed(2)}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600">Member Since</label>
            <p className="mt-1 text-sm text-gray-900">
              {new Date(customer.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Location Information */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Location Information</h3>
          <div className="flex items-center gap-2">
            {locationStatus.icon}
            <span className={`text-sm font-medium ${
              locationStatus.color === 'green' ? 'text-green-600' :
              locationStatus.color === 'blue' ? 'text-blue-600' : 'text-gray-500'
            }`}>
              {locationStatus.text}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {customer.address && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600">Address</label>
              <p className="mt-1 text-sm text-gray-900">{customer.address}</p>
            </div>
          )}

          {customer.lat && customer.lon && (
            <div>
              <label className="block text-sm font-medium text-gray-600">GPS Coordinates</label>
              <p className="mt-1 text-sm text-gray-900">
                {customer.lat}, {customer.lon}
              </p>
            </div>
          )}

          {customer.city && (
            <div>
              <label className="block text-sm font-medium text-gray-600">City</label>
              <p className="mt-1 text-sm text-gray-900">{customer.city}</p>
            </div>
          )}

          {customer.state && (
            <div>
              <label className="block text-sm font-medium text-gray-600">State/Province</label>
              <p className="mt-1 text-sm text-gray-900">{customer.state}</p>
            </div>
          )}

          {customer.country && (
            <div>
              <label className="block text-sm font-medium text-gray-600">Country</label>
              <p className="mt-1 text-sm text-gray-900">{customer.country}</p>
            </div>
          )}

          {customer.postal_code && (
            <div>
              <label className="block text-sm font-medium text-gray-600">Postal Code</label>
              <p className="mt-1 text-sm text-gray-900">{customer.postal_code}</p>
            </div>
          )}
        </div>

        {customer.location_display && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <label className="block text-sm font-medium text-blue-800">Formatted Location</label>
            <p className="mt-1 text-sm text-blue-700">{customer.location_display}</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2">
            <FiMail className="h-4 w-4" />
            Send Email
          </button>
          
          {customer.phone && (
            <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2">
              <FiPhone className="h-4 w-4" />
              Call Customer
            </button>
          )}
          
          <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center gap-2">
            <FiDollarSign className="h-4 w-4" />
            View Orders
          </button>
          
          {customer.lat && customer.lon && (
            <button className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors flex items-center gap-2">
              <FiMapPin className="h-4 w-4" />
              View on Map
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerInfoCard;