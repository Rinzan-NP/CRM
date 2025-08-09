// src/pages/DashboardComponents/MenuItem.js
import React from 'react';

const MenuItem = ({ title, path }) => (
  <div>
    <a 
      href={path} 
      className="block text-center text-blue-600 hover:text-blue-700 transition-colors duration-200"
    >
      {title}
    </a>
  </div>
);

export default MenuItem;