// src/pages/DashboardComponents/DashboardHeader.js
import React from 'react';

const DashboardHeader = ({ title, role }) => (
  <div className="sm:mx-auto sm:w-full sm:max-w-md">
    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
      {title}
    </h2>
    <p className="mt-2 text-center text-sm text-gray-600">
      You are logged in as {role}.
    </p>
  </div>
);

export default DashboardHeader;