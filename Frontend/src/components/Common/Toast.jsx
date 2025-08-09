// src/components/Common/Toast.jsx
import React, { useEffect } from 'react';
import { FiCheckCircle, FiXCircle, FiX } from 'react-icons/fi';

const Toast = ({ message, onClose, type = 'success' }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`rounded-md p-4 ${type === 'success' ? 'bg-green-50' : 'bg-red-50'} shadow-lg`}>
        <div className="flex">
          <div className="flex-shrink-0">
            {type === 'success' ? (
              <FiCheckCircle className="h-5 w-5 text-green-400" />
            ) : (
              <FiXCircle className="h-5 w-5 text-red-400" />
            )}
          </div>
          <div className="ml-3">
            <p className={`text-sm font-medium ${type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
              {message}
            </p>
          </div>
          <div className="ml-auto pl-3">
            <button
              onClick={onClose}
              className={`inline-flex rounded-md focus:outline-none ${type === 'success' ? 'text-green-400 hover:text-green-500' : 'text-red-400 hover:text-red-500'}`}
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toast;