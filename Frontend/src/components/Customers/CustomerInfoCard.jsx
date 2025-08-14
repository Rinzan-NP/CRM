// src/components/Customers/CustomerInfoCard.jsx
import React from 'react';
import { FiMail, FiPhone, FiMapPin, FiCreditCard, FiDollarSign } from 'react-icons/fi';

const CustomerInfoCard = ({ customer }) => {
  if (!customer) return null;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
          
          {customer.email && (
            <div className="flex items-center text-gray-600">
              <FiMail className="mr-3 h-4 w-4" />
              <span>{customer.email}</span>
            </div>
          )}
          
          {customer.phone && (
            <div className="flex items-center text-gray-600">
              <FiPhone className="mr-3 h-4 w-4" />
              <span>{customer.phone}</span>
            </div>
          )}
          
          {customer.address && (
            <div className="flex items-start text-gray-600">
              <FiMapPin className="mr-3 h-4 w-4 mt-0.5 flex-shrink-0" />
              <span className="break-words">{customer.address}</span>
            </div>
          )}
        </div>

        {/* Financial Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Financial Information</h3>
          
          {customer.credit_limit && (
            <div className="flex items-center text-gray-600">
              <FiCreditCard className="mr-3 h-4 w-4" />
              <div>
                <span className="text-sm text-gray-500">Credit Limit: </span>
                <span className="font-medium">${parseFloat(customer.credit_limit).toFixed(2)}</span>
              </div>
            </div>
          )}
          
          {customer.current_balance !== undefined && (
            <div className="flex items-center text-gray-600">
              <FiDollarSign className="mr-3 h-4 w-4" />
              <div>
                <span className="text-sm text-gray-500">Current Balance: </span>
                <span className={`font-medium ${
                  parseFloat(customer.current_balance) > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  ${parseFloat(customer.current_balance).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Statistics</h3>
          
          {customer.order_count !== undefined && (
            <div className="text-gray-600">
              <span className="text-sm text-gray-500">Total Orders: </span>
              <span className="font-medium">{customer.order_count}</span>
            </div>
          )}
          
          {customer.total_spent !== undefined && (
            <div className="text-gray-600">
              <span className="text-sm text-gray-500">Total Spent: </span>
              <span className="font-medium text-green-600">
                ${parseFloat(customer.total_spent).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerInfoCard;