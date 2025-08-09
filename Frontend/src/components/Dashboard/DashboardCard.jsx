// src/components/Dashboard/DashboardCard.js
import React from 'react';

const DashboardCard = ({ title, description, path, icon, color }) => (
  <a 
    href={path}
    className="group block bg-white rounded-xl shadow border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
  >
    <div className="p-6">
      <div className="flex items-start gap-4">
        <div className={`${color} p-3 rounded-lg text-white`}>
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
            {title}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {description}
          </p>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <span className="text-sm font-medium text-indigo-600 group-hover:text-indigo-800 transition-colors flex items-center">
          Access <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
        </span>
      </div>
    </div>
  </a>
);

export default DashboardCard;