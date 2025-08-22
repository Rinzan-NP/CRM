import React from 'react';
import { FiTruck } from 'react-icons/fi';

const RouteEfficiencyDetails = ({ reports }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-purple-50 to-violet-50 border-b border-gray-100">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-xl">
            <FiTruck className="text-purple-600" size={20} />
          </div>
          Route Efficiency Details
        </h3>
        <p className="text-sm text-gray-600 mt-1">Comprehensive route performance analysis</p>
      </div>
      {reports.routeEfficiency && reports.routeEfficiency.length > 0 ? (
        <div className="divide-y divide-gray-100">
          {reports.routeEfficiency.map((route, index) => (
            <div key={index} className="p-5 hover:bg-gray-50 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">{route.route_name}</h4>
                  <p className="text-sm text-gray-500">{route.date}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Completed</p>
                    <p className="font-bold text-gray-800">{route.completed}/{route.total_planned}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Rate</p>
                    <p className={`font-bold ${
                      route.completion_rate > 90 ? 'text-green-700' : 
                      route.completion_rate > 70 ? 'text-amber-700' : 'text-red-700'
                    }`}>
                      {route.completion_rate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 text-center text-gray-400 bg-gray-50">
          No route efficiency data available
        </div>
      )}
    </div>
  );
};

export default RouteEfficiencyDetails;