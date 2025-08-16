import React from 'react';

const Button = ({ 
  children, 
  type = 'button', 
  variant = 'primary', 
  disabled = false, 
  className = '', 
  onClick,
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500',
  };

  const variantClass = variantClasses[variant] || variantClasses.primary;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseClasses} ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;