import React from 'react';

const Badge = ({ children, color = 'gray', size = 'md', className = '' }) => {
  const colorClasses = {
    gray: 'bg-gray-100 text-gray-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    green: 'bg-green-100 text-green-800',
    blue: 'bg-blue-100 text-blue-800',
    indigo: 'bg-indigo-100 text-indigo-800',
    purple: 'bg-purple-100 text-purple-800',
    pink: 'bg-pink-100 text-pink-800',
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const baseClasses = 'inline-flex items-center font-medium rounded-full';
  const colorClass = colorClasses[color] || colorClasses.gray;
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <span className={`${baseClasses} ${colorClass} ${sizeClass} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;