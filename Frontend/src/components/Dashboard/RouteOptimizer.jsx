import React, { useState, useEffect, useMemo } from 'react';
import { FiMapPin, FiTrendingUp, FiClock, FiZap, FiDollarSign, FiNavigation } from 'react-icons/fi';
import api from '../../services/api';

const RouteOptimizer = ({ selectedRouteId }) => {
  const [routeData, setRouteData] = useState(null);
  const [optimizationData, setOptimizationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch route optimization data
  useEffect(() => {
    if (selectedRouteId) {
      fetchRouteOptimization();
    }
  }, [selectedRouteId]);

  const fetchRouteOptimization = async () => {
    if (!selectedRouteId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await api.get(`/transactions/route-location-pings/route-summary/?route_id=${selectedRouteId}`);
      setRouteData(response.data);
      setOptimizationData(response.data.optimization);
    } catch (e) {
      setError('Failed to fetch route optimization data');
      console.error('Route optimization error:', e);
    } finally {
      setLoading(false);
    }
  };

  // Calculate additional optimization metrics
  const enhancedMetrics = useMemo(() => {
    if (!optimizationData || !routeData?.summary) return null;

    const { efficiency_percentage, actual_distance_km, optimal_distance_km, estimated_fuel_cost } = optimizationData;
    const { total_time_hours, average_speed_kmh } = routeData.summary;

    // Calculate time savings
    const optimalTime = optimal_distance_km / average_speed_kmh;
    const timeSavings = total_time_hours - optimalTime;
    const timeEfficiency = (optimalTime / total_time_hours) * 100;

    // Calculate cost savings
    const fuelSavings = (estimated_fuel_cost * (efficiency_percentage / 100));
    const totalSavings = fuelSavings;

    // Calculate productivity metrics
    const visitsPerHour = routeData.route?.visits?.length / total_time_hours || 0;
    const revenuePerKm = 0; // This would come from sales data

    return {
      timeSavings: Math.max(0, timeSavings),
      timeEfficiency: Math.min(100, timeEfficiency),
      fuelSavings: Math.max(0, fuelSavings),
      totalSavings: Math.max(0, totalSavings),
      visitsPerHour: visitsPerHour.toFixed(2),
      revenuePerKm: revenuePerKm.toFixed(2)
    };
  }, [optimizationData, routeData]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="text-center text-red-600">
          <FiNavigation className="mx-auto h-8 w-8 mb-2" />
          <p>{error}</p>
          <button
            onClick={fetchRouteOptimization}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!optimizationData) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="text-center text-gray-500">
          <FiMapPin className="mx-auto h-8 w-8 mb-2" />
          <p>Select a route to view optimization data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Optimization Metrics */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FiTrendingUp className="text-green-600" />
          Route Optimization Overview
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">
              {optimizationData.efficiency_percentage}%
            </div>
            <div className="text-sm text-green-700 font-medium">Route Efficiency</div>
            <div className="text-xs text-green-600 mt-1">
              {optimizationData.efficiency_percentage > 80 ? 'Excellent' :
               optimizationData.efficiency_percentage > 60 ? 'Good' : 'Needs Improvement'}
            </div>
          </div>

          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">
              {optimizationData.actual_distance_km} km
            </div>
            <div className="text-sm text-blue-700 font-medium">Actual Distance</div>
            <div className="text-xs text-blue-600 mt-1">
              vs {optimizationData.optimal_distance_km} km optimal
            </div>
          </div>

          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="text-2xl font-bold text-orange-600">
              ${optimizationData.estimated_fuel_cost}
            </div>
            <div className="text-sm text-orange-700 font-medium">Fuel Cost</div>
            <div className="text-xs text-orange-600 mt-1">
              {optimizationData.fuel_consumption_liters}L consumed
            </div>
          </div>

          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-600">
              {optimizationData.time_efficiency}
            </div>
            <div className="text-sm text-purple-700 font-medium">Time Efficiency</div>
            <div className="text-xs text-purple-600 mt-1">
              Based on route adherence
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Metrics */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
            <FiZap className="text-yellow-600" />
            Performance Analysis
          </h4>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Route Deviation</span>
              <span className="font-bold text-red-600">
                +{optimizationData.deviation_km} km
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Fuel Efficiency</span>
              <span className="font-bold text-green-600">
                {optimizationData.fuel_consumption_liters}L / {optimizationData.actual_distance_km}km
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Cost per Kilometer</span>
              <span className="font-bold text-blue-600">
                ${(optimizationData.estimated_fuel_cost / optimizationData.actual_distance_km).toFixed(2)}
              </span>
            </div>
            
            {enhancedMetrics && (
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Visits per Hour</span>
                <span className="font-bold text-purple-600">
                  {enhancedMetrics.visitsPerHour}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Optimization Recommendations */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
            <FiNavigation className="text-blue-600" />
            Optimization Recommendations
          </h4>
          
          <div className="space-y-3">
            {optimizationData.efficiency_percentage < 80 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <FiTrendingUp className="text-yellow-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      Route Efficiency Below Target
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Consider route planning optimization and real-time navigation assistance.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {optimizationData.deviation_km > 5 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <FiMapPin className="text-red-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      High Route Deviation Detected
                    </p>
                    <p className="text-xs text-red-700 mt-1">
                      {optimizationData.deviation_km}km deviation suggests route planning issues.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {optimizationData.fuel_consumption_liters > 20 && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <FiZap className="text-orange-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-orange-800">
                      High Fuel Consumption
                    </p>
                    <p className="text-xs text-orange-700 mt-1">
                      Consider vehicle maintenance and driving behavior optimization.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {optimizationData.efficiency_percentage > 80 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <FiTrendingUp className="text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Excellent Route Efficiency
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      Keep up the great work! Route planning is optimal.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={fetchRouteOptimization}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FiTrendingUp />
            Refresh Data
          </button>
          
          <button
            onClick={() => window.print()}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
          >
            <FiNavigation />
            Print Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default RouteOptimizer;
