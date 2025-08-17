import React, { useState, useEffect, useMemo } from 'react';
import { FiMapPin, FiTrendingUp, FiClock, FiZap, FiDollarSign, FiNavigation, FiAlertCircle } from 'react-icons/fi';
import api from '../../services/api';

const RouteOptimizer = ({ selectedRouteId }) => {
  const [routeData, setRouteData] = useState(null);
  const [optimizationData, setOptimizationData] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null); // Separate route info
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch route optimization data and route info
  useEffect(() => {
    if (selectedRouteId) {
      fetchRouteOptimization();
      fetchRouteInfo();
    } else {
      // Clear data when no route selected
      setRouteData(null);
      setOptimizationData(null);
      setRouteInfo(null);
    }
  }, [selectedRouteId]);

  const fetchRouteOptimization = async () => {
    if (!selectedRouteId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await api.get(`/transactions/route-location-pings/route_summary/?route_id=${selectedRouteId}`);
      
      if (response.data) {
        setRouteData(response.data);
        setOptimizationData(response.data.optimization);
        
        // Handle case where no GPS data exists yet
        if (response.data.message) {
          console.log('Route optimization message:', response.data.message);
        }
      }
    } catch (e) {
      console.error('Route optimization error:', e);
      
      // Handle specific error cases
      if (e.response?.status === 404) {
        setError('No GPS tracking data available for this route yet. Start tracking to see optimization analytics.');
      } else if (e.response?.status === 500) {
        setError('Error calculating route optimization. Please try again.');
      } else {
        setError('Failed to fetch route optimization data');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRouteInfo = async () => {
    if (!selectedRouteId) return;
    
    try {
      // Fetch basic route information separately
      const response = await api.get(`/transactions/routes/${selectedRouteId}/`);
      setRouteInfo(response.data);
    } catch (e) {
      console.error('Failed to fetch route info:', e);
    }
  };

  // Calculate additional optimization metrics
  const enhancedMetrics = useMemo(() => {
    if (!optimizationData || !routeData?.summary) return null;

    const { efficiency_percentage, actual_distance_km, optimal_distance_km, estimated_fuel_cost } = optimizationData;
    const { total_time_hours, average_speed_kmh, ping_count } = routeData.summary;

    // Safely calculate metrics with fallbacks
    const safeActualDistance = actual_distance_km || 0;
    const safeOptimalDistance = optimal_distance_km || 0;
    const safeTotalTime = total_time_hours || 0;
    const safeAverageSpeed = average_speed_kmh || 1; // Avoid division by zero
    const safeFuelCost = estimated_fuel_cost || 0;

    // Calculate time savings (only if we have meaningful data)
    let timeSavings = 0;
    let timeEfficiency = 100;
    if (safeOptimalDistance > 0 && safeAverageSpeed > 0) {
      const optimalTime = safeOptimalDistance / safeAverageSpeed;
      timeSavings = Math.max(0, safeTotalTime - optimalTime);
      timeEfficiency = Math.min(100, (optimalTime / safeTotalTime) * 100);
    }

    // Calculate cost savings
    const potentialSavings = safeFuelCost * (1 - (efficiency_percentage / 100));
    const costPerKm = safeActualDistance > 0 ? safeFuelCost / safeActualDistance : 0;

    // Calculate productivity metrics
    const visitsCount = routeInfo?.visits?.length || 0;
    const visitsPerHour = safeTotalTime > 0 ? visitsCount / safeTotalTime : 0;
    const pingsPerKm = safeActualDistance > 0 ? ping_count / safeActualDistance : 0;

    return {
      timeSavings: timeSavings.toFixed(2),
      timeEfficiency: timeEfficiency.toFixed(1),
      potentialSavings: potentialSavings.toFixed(2),
      costPerKm: costPerKm.toFixed(2),
      visitsPerHour: visitsPerHour.toFixed(2),
      pingsPerKm: pingsPerKm.toFixed(1),
      visitsCount: visitsCount,
      dataQuality: ping_count > 10 ? 'Good' : ping_count > 5 ? 'Fair' : 'Limited'
    };
  }, [optimizationData, routeData, routeInfo]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading route optimization data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="text-center">
          <FiAlertCircle className="mx-auto h-12 w-12 text-orange-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Route Optimization Unavailable</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={fetchRouteOptimization}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
            >
              <FiTrendingUp />
              Retry
            </button>
            {selectedRouteId && (
              <button
                onClick={() => window.location.href = `/transactions/route-live-tracker?route=${selectedRouteId}`}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
              >
                <FiNavigation />
                Start Tracking
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!selectedRouteId) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="text-center text-gray-500">
          <FiMapPin className="mx-auto h-12 w-12 mb-4" />
          <h3 className="text-lg font-medium mb-2">Route Optimization</h3>
          <p>Select a route to view detailed optimization analytics and recommendations.</p>
        </div>
      </div>
    );
  }

  if (!optimizationData || !routeData?.summary) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="text-center">
          <FiNavigation className="mx-auto h-12 w-12 text-blue-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Optimization Data</h3>
          <p className="text-gray-600 mb-4">
            This route doesn't have GPS tracking data yet. Start tracking to generate optimization insights.
          </p>
          <button
            onClick={() => window.location.href = `/transactions/route-live-tracker?route=${selectedRouteId}`}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 mx-auto"
          >
            <FiNavigation />
            Start GPS Tracking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Route Info Header */}
      {routeInfo && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <FiNavigation className="text-blue-600" />
            <h3 className="font-semibold text-blue-800">
              {routeInfo.name} - {routeInfo.date}
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-600 font-medium">Route:</span>
              <span className="ml-1">{routeInfo.route_number}</span>
            </div>
            <div>
              <span className="text-blue-600 font-medium">Salesperson:</span>
              <span className="ml-1">{routeInfo.salesperson_name}</span>
            </div>
            <div>
              <span className="text-blue-600 font-medium">Planned Visits:</span>
              <span className="ml-1">{routeInfo.visits?.length || 0}</span>
            </div>
            <div>
              <span className="text-blue-600 font-medium">GPS Points:</span>
              <span className="ml-1">{routeData.summary.ping_count}</span>
            </div>
          </div>
        </div>
      )}

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
              {optimizationData.efficiency_rating || (
                optimizationData.efficiency_percentage > 80 ? 'Excellent' :
                optimizationData.efficiency_percentage > 60 ? 'Good' : 'Needs Improvement'
              )}
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
              {optimizationData.efficiency_rating || 'Good'}
            </div>
            <div className="text-sm text-purple-700 font-medium">Overall Rating</div>
            <div className="text-xs text-purple-600 mt-1">
              {enhancedMetrics?.dataQuality} data quality
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
                {(optimizationData.fuel_consumption_liters / optimizationData.actual_distance_km).toFixed(2) || 0}L/100km
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Cost per Kilometer</span>
              <span className="font-bold text-blue-600">
                ${enhancedMetrics?.costPerKm || '0.00'}
              </span>
            </div>
            
            {enhancedMetrics && (
              <>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Visits per Hour</span>
                  <span className="font-bold text-purple-600">
                    {enhancedMetrics.visitsPerHour}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">GPS Data Density</span>
                  <span className="font-bold text-indigo-600">
                    {enhancedMetrics.pingsPerKm} points/km
                  </span>
                </div>
              </>
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
                      {optimizationData.deviation_km}km deviation suggests route planning improvements needed.
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
            
            {routeData.summary.ping_count < 10 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <FiClock className="text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      Limited GPS Data
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      More tracking data will improve optimization accuracy.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {optimizationData.efficiency_percentage > 80 && optimizationData.deviation_km < 3 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <FiTrendingUp className="text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Excellent Route Performance
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      Keep up the great work! Route execution is highly efficient.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cost Savings Potential */}
      {enhancedMetrics && parseFloat(enhancedMetrics.potentialSavings) > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
          <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
            <FiDollarSign className="text-green-600" />
            Cost Optimization Potential
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ${enhancedMetrics.potentialSavings}
              </div>
              <div className="text-sm text-green-700">Potential Fuel Savings</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {enhancedMetrics.timeSavings}h
              </div>
              <div className="text-sm text-blue-700">Time Savings Possible</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {enhancedMetrics.timeEfficiency}%
              </div>
              <div className="text-sm text-purple-700">Time Efficiency</div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={fetchRouteOptimization}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FiTrendingUp />
            Refresh Analysis
          </button>
          
          <button
            onClick={() => window.location.href = `/transactions/route-live-tracker?route=${selectedRouteId}`}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <FiNavigation />
            Live Tracking
          </button>
          
          <button
            onClick={() => window.print()}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
          >
            <FiMapPin />
            Print Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default RouteOptimizer;