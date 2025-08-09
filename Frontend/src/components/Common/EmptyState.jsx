// src/components/Common/EmptyState.jsx
import React from 'react';
import { FiUsers } from 'react-icons/fi';

const EmptyState = ({ title, description, actionText, onAction }) => (
  <div className="text-center py-12">
    <div className="mx-auto h-24 w-24 text-gray-400">
      <FiUsers size={96} className="mx-auto" />
    </div>
    <h3 className="mt-2 text-lg font-medium text-gray-900">{title}</h3>
    <p className="mt-1 text-sm text-gray-500">{description}</p>
    {onAction && (
      <div className="mt-6">
        <button
          onClick={onAction}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {actionText}
        </button>
      </div>
    )}
  </div>
);

export default EmptyState;