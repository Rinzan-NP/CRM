// src/components/Customers/CustomerTable.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FiEdit2, FiTrash2, FiUser, FiDollarSign, FiShoppingCart } from 'react-icons/fi';

const CustomerTable = ({ customers = [], onEdit, onDelete }) => {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Credit/Balance
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stats
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {customers.map((customer) => (
              customer && (
                <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <FiUser size={18} />
                      </div>
                      <div className="ml-4">
                        <Link 
                          to={`/customers/${customer.id}`}
                          className="font-medium text-gray-900 hover:text-indigo-600 transition-colors"
                        >
                          {customer.name}
                        </Link>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {customer.address}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <a href={`mailto:${customer.email}`} className="hover:text-indigo-600">
                        {customer.email}
                      </a>
                    </div>
                    <div className="text-sm text-gray-500">
                      {customer.phone ? (
                        <a href={`tel:${customer.phone}`} className="hover:text-indigo-600">
                          {customer.phone}
                        </a>
                      ) : (
                        'Not provided'
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <FiDollarSign className="mr-1" size={12} />
                        Limit: ${parseFloat(customer.credit_limit || 0).toFixed(2)}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        customer.current_balance > 0 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        Balance: ${parseFloat(customer.current_balance || 0).toFixed(2)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        <FiShoppingCart className="mr-1" size={12} />
                        {customer.order_count || 0} orders
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        <FiDollarSign className="mr-1" size={12} />
                        ${parseFloat(customer.total_spent || 0).toFixed(2)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end items-center space-x-2">
                      <button
                        onClick={() => onEdit(customer)}
                        className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                        title="Edit"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        onClick={() => onDelete(customer.id)}
                        className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>
      {customers.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No customers found
        </div>
      )}
    </div>
  );
};

export default CustomerTable;