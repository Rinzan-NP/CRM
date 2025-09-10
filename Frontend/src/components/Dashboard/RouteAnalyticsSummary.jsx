import React from "react";
import { FiNavigation, FiAlertCircle } from "react-icons/fi";

const RouteAnalyticsSummary = ({
  loadingSummary,
  routeSummary,
  optimizationMetrics,
  selectedRouteId,
  userRole
}) => {
  if (loadingSummary) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading route analytics...</span>
        </div>
      </div>
    );
  }

  if (routeSummary || optimizationMetrics) {
    return (
      <div className="grid grid-cols-1  gap-6">
        {/* Route Summary */}
        {routeSummary && (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FiNavigation className="text-blue-600" />
              Route Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {routeSummary.total_distance_km} km
                </div>
                <div className="text-sm text-gray-600">Total Distance</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {routeSummary.moving_time_hours || routeSummary.total_time_hours}h
                </div>
                <div className="text-sm text-gray-600">
                  {routeSummary.moving_time_hours ? 'Moving Time' : 'Total Time'}
                </div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {routeSummary.average_speed_kmh} km/h
                </div>
                <div className="text-sm text-gray-600">Average Speed</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {routeSummary.ping_count}
                </div>
                <div className="text-sm text-gray-600">GPS Points</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {routeSummary.max_speed_kmh} km/h
                </div>
                <div className="text-sm text-gray-600">Max Speed</div>
              </div>
              {routeSummary.movement_efficiency_percent !== undefined && (
                <div className="text-center p-3 bg-indigo-50 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">
                    {routeSummary.movement_efficiency_percent}%
                  </div>
                  <div className="text-sm text-gray-600">Movement Efficiency</div>
                </div>
              )}
            </div>
          </div>
        )}
        {/* You can add optimizationMetrics display here if needed */}
      </div>
    );
  }

  if (selectedRouteId && !loadingSummary) {
    return (
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2">
          <FiAlertCircle className="text-blue-600" />
          <h3 className="text-lg font-medium text-blue-800">No GPS Data Available</h3>
        </div>
        <p className="text-blue-700 mt-2">
          No GPS tracking data found for this route. 
          {userRole === 'admin' 
            ? ' Wait for the salesperson to start tracking to see route analytics.' 
            : ' Start tracking to see route analytics and optimization metrics.'
          }
        </p>
      </div>
    );
  }

  return null;
};

export default RouteAnalyticsSummary;
