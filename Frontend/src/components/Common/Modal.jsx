// src/components/Common/Modal.jsx
import React, { useEffect } from 'react';
import { FiX } from 'react-icons/fi';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'lg', // sm, md, lg, xl, 2xl
  maxHeight = 'max-h-[90vh]' // Customizable max height
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Size classes mapping
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    full: 'max-w-full mx-4'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Container */}
      <div 
        className={`relative w-full ${sizeClasses[size]} ${maxHeight} flex flex-col`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Modal Content */}
        <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl max-h-full">
          {/* Header - Fixed */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 flex-shrink-0">
            <h3 
              id="modal-title" 
              className="text-lg font-semibold text-slate-900 truncate pr-4"
            >
              {title}
            </h3>
            <button 
              onClick={onClose} 
              className="flex-shrink-0 rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              aria-label="Close modal"
            >
              <FiX size={20} />
            </button>
          </div>
          
          {/* Body - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;