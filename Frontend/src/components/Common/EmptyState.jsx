// src/components/Common/EmptyState.jsx
import React from 'react';
import { FiUsers } from 'react-icons/fi';

const EmptyState = ({ title, description, actionText, onAction }) => (
  <div className="text-center py-16 rounded-xl border border-dashed border-slate-300 bg-white">
    <div className="mx-auto h-20 w-20 text-indigo-400/60">
      <FiUsers size={80} className="mx-auto" />
    </div>
    <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
    <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">{description}</p>
    {onAction && (
      <div className="mt-6">
        <button
          onClick={onAction}
          className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {actionText}
        </button>
      </div>
    )}
  </div>
);

export default EmptyState;