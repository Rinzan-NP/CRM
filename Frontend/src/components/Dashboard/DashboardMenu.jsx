// src/pages/DashboardComponents/DashboardMenu.js
import React from 'react';
import MenuItem from './MenuItem';

const DashboardMenu = ({ menuItems }) => (
  <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      <div className="space-y-6">
        {menuItems.map((item, index) => (
          <MenuItem 
            key={index} 
            title={item.title} 
            path={item.path} 
          />
        ))}
      </div>
    </div>
  </div>
);

export default DashboardMenu;