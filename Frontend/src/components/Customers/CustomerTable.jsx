// src/components/Customers/CustomerTable.jsx
import React, { useState } from 'react';
import { FiMapPin, FiNavigation, FiTarget, FiCheckCircle, FiXCircle, FiEdit, FiTrash2, FiEye } from 'react-icons/fi';
import DataTable from '../ui/DataTable';
import Badge from '../ui/Badge';

const CustomerTable = ({ customers, onEdit, onDelete, onView, onGeocode, onSetCoordinates }) => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleGeocode = async (customer) => {
    if (!customer.address) {
      alert('This customer has no address to geocode');
      return;
    }

    setActionLoading(true);
    try {
      await onGeocode(customer);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetCoordinates = async (customer) => {
    // This functionality is now handled by the map picker in the customer form
    alert('Please edit the customer and use the "Pick Location on Map" feature for better location selection.');
  };

  const getLocationStatus = (customer) => {
    if (customer.location_verified) {
      return { text: 'Verified', color: 'green', icon: <FiCheckCircle className="h-4 w-4" /> };
    } else if (customer.lat && customer.lon) {
      return { text: 'Coordinates Set', color: 'blue', icon: <FiTarget className="h-4 w-4" /> };
    } else {
      return { text: 'No Location', color: 'gray', icon: <FiXCircle className="h-4 w-4" /> };
    }
  };

  const columns = [
    {
      header: 'Name',
      accessor: 'name',
      cell: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.name}</div>
          <div className="text-sm text-gray-500">{row.email}</div>
        </div>
      ),
    },
    {
      header: 'Contact',
      accessor: 'contact',
      cell: (row) => (
        <div className="text-sm text-gray-600">
          {row.phone && <div>{row.phone}</div>}
          <div className="text-gray-500">{row.email}</div>
        </div>
      ),
    },
    {
      header: 'Location',
      accessor: 'location',
      cell: (row) => {
        const locationStatus = getLocationStatus(row);
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {locationStatus.icon}
              <Badge color={locationStatus.color} size="sm">
                {locationStatus.text}
              </Badge>
            </div>
            
            {row.lat && row.lon ? (
              <div className="text-xs text-gray-600">
                <div>📍 {row.lat}, {row.lon}</div>
                {row.location_display && (
                  <div className="text-gray-500">{row.location_display}</div>
                )}
              </div>
            ) : row.address ? (
              <div className="text-xs text-gray-500 max-w-[200px] truncate" title={row.address}>
                📍 {row.address}
              </div>
            ) : (
              <div className="text-xs text-gray-400">No address</div>
            )}
          </div>
        );
      },
    },
    {
      header: 'Financial',
      accessor: 'financial',
      cell: (row) => (
        <div className="text-sm text-gray-600">
          <div>Credit: ₹{parseFloat(row.credit_limit || 0).toFixed(2)}</div>
          <div>Balance: ₹{parseFloat(row.current_balance || 0).toFixed(2)}</div>
        </div>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          {/* View Button */}
          <button
            onClick={() => onView(row)}
            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
            title="View Customer"
          >
            <FiEye className="h-4 w-4" />
          </button>

          {/* Edit Button */}
          <button
            onClick={() => onEdit(row)}
            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors"
            title="Edit Customer"
          >
            <FiEdit className="h-4 w-4" />
          </button>

          {/* Location Actions */}
          <div className="flex items-center gap-1">
            {/* Geocode Button */}
            {row.address && !row.location_verified && (
              <button
                onClick={() => handleGeocode(row)}
                disabled={actionLoading}
                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
                title="Geocode Address"
              >
                <FiNavigation className="h-4 w-4" />
              </button>
            )}

            {/* Set Coordinates Button */}
            <button
              onClick={() => handleSetCoordinates(row)}
              disabled={actionLoading}
              className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-md transition-colors disabled:opacity-50"
              title="Edit Customer to Set Location"
            >
              <FiTarget className="h-4 w-4" />
            </button>
          </div>

          {/* Delete Button */}
          <button
            onClick={() => onDelete(row)}
            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
            title="Delete Customer"
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Customers</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <FiCheckCircle className="h-4 w-4 text-green-500" />
              {customers.filter(c => c.location_verified).length} Verified
            </span>
            <span className="flex items-center gap-1">
              <FiTarget className="h-4 w-4 text-blue-500" />
              {customers.filter(c => c.lat && c.lon && !c.location_verified).length} Coordinates Set
            </span>
            <span className="flex items-center gap-1">
              <FiXCircle className="h-4 w-4 text-gray-400" />
              {customers.filter(c => !c.lat && !c.lon).length} No Location
            </span>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={customers}
        searchable
        pagination
        className="min-h-[400px]"
      />
    </div>
  );
};

export default CustomerTable;