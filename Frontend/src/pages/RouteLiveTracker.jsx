// src/pages/RouteLiveTracker.jsx
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { FiActivity, FiMapPin, FiNavigation, FiTrendingUp, FiClock, FiZap } from 'react-icons/fi';
import api from '../services/api';
import PageHeader from '../components/layout/PageHeader';
import Loader from '../components/Common/Loader';
import Toast from '../components/Common/Toast';
import RouteOptimizer from '../components/Dashboard/RouteOptimizer';
import CustomerVisitLogger from '../components/Customers/CustomerVisitLogger';
import { GoogleMapsProvider, GoogleMap, Marker, Polyline, Circle, InfoWindow, defaultMapContainerStyle } from '../components/Common/GoogleMapWrapper';


const RouteLiveTracker = () => {
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [routes, setRoutes] = useState([]);
  const [pings, setPings] = useState([]);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [routeSummary, setRouteSummary] = useState(null);
  const [optimizationMetrics, setOptimizationMetrics] = useState(null);
  const [showPlannedRoute, setShowPlannedRoute] = useState(true);
  const [showActualRoute, setShowActualRoute] = useState(true);
  const [showRealTime, setShowRealTime] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [lastPingLocation, setLastPingLocation] = useState(null);
  
  const watchIdRef = useRef(null);
  const mapRef = useRef(null);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // Fetch routes on component mount
  useEffect(() => {
    fetchRoutes();
    
    // Check for route parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const routeParam = urlParams.get('route');
    if (routeParam) {
      setSelectedRouteId(routeParam);
    }
  }, []);

  // Fetch routes from API
  const fetchRoutes = async () => {
    try {
      const response = await api.get('/transactions/routes/');
      setRoutes(response.data);
    } catch (e) {
      setError('Failed to fetch routes');
    } finally {
      setLoadingRoutes(false);
    }
  };

  // Fetch historical pings for selected route
  const fetchRoutePings = useCallback(async () => {
    if (!selectedRouteId) return;
    
    try {
      const response = await api.get(`/transactions/route-location-pings/?route=${selectedRouteId}`);
      setPings(response.data);
    } catch (e) {
      setError('Failed to fetch route history');
    }
  }, [selectedRouteId]);

  // Fetch route summary and optimization metrics
  const fetchRouteSummary = useCallback(async () => {
    if (!selectedRouteId) return;
    
    try {
      const response = await api.get(`/transactions/route-location-pings/route_summary/?route_id=${selectedRouteId}`);
      setRouteSummary(response.data.summary);
      setOptimizationMetrics(response.data.optimization);
    } catch (e) {
      console.error('Failed to fetch route summary:', e);
    }
  }, [selectedRouteId]);

  // Start route tracking
  const startTracking = useCallback(async () => {
    if (!selectedRouteId) {
      setError('Please select a route first');
      return;
    }

    try {
      // Start tracking on backend
      const response = await api.post('/transactions/route-location-pings/start_route_tracking/', {
        route_id: selectedRouteId
      });
      
      if (response.data.status === 'active') {
        setInfo('Route tracking already active - continuing existing session');
      } else {
        setInfo('Route tracking started');
      }
    } catch (e) {
      setError('Failed to start tracking');
      return;
    }

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    setIsTracking(true);
    const id = navigator.geolocation.watchPosition(async (position) => {
      const newLocation = {
        lat: position.coords.latitude,
        lon: position.coords.longitude
      };
      
      // Check if we've actually moved significantly (more than 10 meters)
      const hasMoved = !lastPingLocation || calculateDistance(
        lastPingLocation.lat, lastPingLocation.lon,
        newLocation.lat, newLocation.lon
      ) > 10; // 10 meters threshold
      
      if (hasMoved) {
        const payload = {
          route: selectedRouteId,
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy_meters: position.coords.accuracy ? Math.round(position.coords.accuracy * 1000000) / 1000000 : null,
          speed_mps: position.coords.speed ? Math.round(position.coords.speed * 10000) / 10000 : null,
          heading_degrees: position.coords.heading ? Math.round(position.coords.heading * 100) / 100 : null,
        };
        
        // Update current location for visit logging
        setCurrentLocation(newLocation);
        setLastPingLocation(newLocation);
        
        try {
          const response = await api.post('/transactions/route-location-pings/', payload);
          setInfo('Location updated - movement detected');
          
          // Update pings state for real-time display
          setPings(prev => [...prev, { ...payload, created_at: new Date().toISOString() }]);
          
          // Fetch updated summary
          fetchRouteSummary();
        } catch (e) {
          setError(e?.response?.data?.detail || e?.response?.data || 'Failed to send location');
        }
      } else {
        // Just update current location without sending ping
        setCurrentLocation(newLocation);
        setInfo('Location updated - no significant movement');
      }
    }, (err) => {
      setIsTracking(false);
      switch (err.code) {
        case err.PERMISSION_DENIED:
          setError('Location access denied. Please enable location services.');
          break;
        case err.POSITION_UNAVAILABLE:
          setError('Location information unavailable.');
          break;
        case err.TIMEOUT:
          setError('Location request timed out.');
          break;
        default:
          setError(err.message || 'Unknown location error');
      }
    }, { 
      enableHighAccuracy: false, // Use standard accuracy to reduce GPS drift
      timeout: 30000, // 30 second timeout
      maximumAge: 300000 // 5 minute maximum age - reduces unnecessary GPS requests when stationary
    });
    
    watchIdRef.current = id;
  }, [selectedRouteId, fetchRouteSummary, lastPingLocation]);

  // Stop route tracking
  const stopTracking = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    try {
      // Stop tracking on backend
      await api.post('/transactions/route-location-pings/stop_route_tracking/', {
        route_id: selectedRouteId
      });
      
      // Fetch final summary
      await fetchRouteSummary();
      setInfo('Tracking stopped and summary generated');
    } catch (e) {
      setError('Failed to stop tracking');
    }
    
    setIsTracking(false);
  }, [selectedRouteId, fetchRouteSummary]);

  // Fetch data when route changes
  useEffect(() => {
    if (selectedRouteId) {
      fetchRoutePings();
      fetchRouteSummary();
    }
  }, [selectedRouteId, fetchRoutePings, fetchRouteSummary]);

  // Set up polling for real-time updates - changed to 5 minutes to reduce unnecessary API calls
  useEffect(() => {
    if (isTracking && selectedRouteId) {
      const interval = setInterval(() => {
        fetchRoutePings();
        fetchRouteSummary();
      }, 300000); // Poll every 5 minutes (300 seconds) - reduces API calls when stationary
      
      return () => clearInterval(interval);
    }
  }, [isTracking, selectedRouteId, fetchRoutePings, fetchRouteSummary]);

  // Get selected route details
  const selectedRoute = useMemo(() => 
    routes.find(r => r.id === selectedRouteId), [routes, selectedRouteId]
  );

  // Prepare map data
  const mapData = useMemo(() => {
    if (!selectedRoute) return { center: [0, 0], zoom: 2 };
    
    // Calculate map center from route visits or pings
    let center = [0, 0];
    let zoom = 2;
    
    if (pings.length > 0) {
      const lats = pings.map(p => p.lat);
      const lons = pings.map(p => p.lon);
      center = [
        (Math.min(...lats) + Math.max(...lats)) / 2,
        (Math.min(...lons) + Math.max(...lons)) / 2
      ];
      zoom = 13;
    } else if (selectedRoute.visits && selectedRoute.visits.length > 0) {
      const visitsWithCoords = selectedRoute.visits.filter(v => v.lat && v.lon);
      if (visitsWithCoords.length > 0) {
        const lats = visitsWithCoords.map(v => v.lat);
        const lons = visitsWithCoords.map(v => v.lon);
        center = [
          (Math.min(...lats) + Math.max(...lats)) / 2,
          (Math.min(...lons) + Math.max(...lons)) / 2
        ];
        zoom = 12;
      }
    }
    
    return { center, zoom };
  }, [selectedRoute, pings]);

  if (loadingRoutes && routes.length === 0) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Route Live Tracker"
          subtitle="Advanced GPS tracking with route optimization and real-time visualization (movement-based updates)"
        />

        {/* Controls Panel */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Route Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Route</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedRouteId}
                onChange={(e) => setSelectedRouteId(e.target.value)}
              >
                <option value="">Choose a route...</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.route_number || r.name} — {r.name} — {r.date}
                  </option>
                ))}
              </select>
              {selectedRoute && (
                <p className="mt-2 text-sm text-gray-600">
                  Salesperson: {selectedRoute.salesperson_name || 'N/A'}
                </p>
              )}
            </div>

            {/* Tracking Controls */}
            <div className="flex flex-col justify-end">
              <div className="flex gap-2">
                {!isTracking ? (
                  <button
                    onClick={startTracking}
                    disabled={!selectedRouteId}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <FiActivity /> Start Tracking
                  </button>
                ) : (
                  <>
                    <button
                      onClick={stopTracking}
                      className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
                    >
                      <FiActivity /> Stop Tracking
                    </button>
                    <button
                      onClick={async () => {
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition(async (position) => {
                            const payload = {
                              route: selectedRouteId,
                              lat: position.coords.latitude,
                              lon: position.coords.longitude,
                              accuracy_meters: position.coords.accuracy ? Math.round(position.coords.accuracy * 1000000) / 1000000 : null,
                              speed_mps: position.coords.speed ? Math.round(position.coords.speed * 10000) / 10000 : null,
                              heading_degrees: position.coords.heading ? Math.round(position.coords.heading * 100) / 100 : null,
                            };
                            
                            try {
                              const response = await api.post('/transactions/route-location-pings/', payload);
                              setInfo('Manual location ping sent');
                              setPings(prev => [...prev, { ...payload, created_at: new Date().toISOString() }]);
                              fetchRouteSummary();
                            } catch (e) {
                              setError('Failed to send manual ping');
                            }
                          });
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                    >
                      📍 Manual Ping
                    </button>
                  </>
                )}
              </div>
              {isTracking && (
                <p className="mt-2 text-sm text-gray-600">
                  📍 GPS tracking active (updates when movement detected)
                </p>
              )}
            </div>

            {/* Display Options */}
            <div className="flex flex-col justify-end">
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showPlannedRoute}
                    onChange={(e) => setShowPlannedRoute(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Planned Route</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showActualRoute}
                    onChange={(e) => setShowActualRoute(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Actual Route</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showRealTime}
                    onChange={(e) => setShowRealTime(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Real-time</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="h-96 w-full">
            <GoogleMapsProvider>
              <GoogleMap
                center={{
                  lat: Number.isFinite(parseFloat(mapData.center[0])) ? parseFloat(mapData.center[0]) : 25.2048,
                  lng: Number.isFinite(parseFloat(mapData.center[1])) ? parseFloat(mapData.center[1]) : 55.2708,
                }}
                zoom={mapData.zoom}
                mapContainerStyle={defaultMapContainerStyle}
              >
                {showPlannedRoute && selectedRoute?.visits && selectedRoute.visits.length > 1 && (
                  <Polyline
                    path={selectedRoute.visits
                      .filter(v => v.lat && v.lon)
                      .map(v => ({ lat: parseFloat(v.lat), lng: parseFloat(v.lon) }))}
                    options={{ strokeColor: 'blue', strokeOpacity: 0.7, strokeWeight: 3 }}
                  />
                )}

                {showActualRoute && pings.length > 1 && (
                  <Polyline
                    path={pings.map(p => ({ lat: parseFloat(p.lat), lng: parseFloat(p.lon) }))}
                    options={{ strokeColor: 'red', strokeOpacity: 0.8, strokeWeight: 4 }}
                  />
                )}

                {showPlannedRoute && selectedRoute?.visits && selectedRoute.visits.map((visit, index) => (
                  visit.lat && visit.lon ? (
                    <Marker key={`visit-${visit.id}`} position={{ lat: parseFloat(visit.lat), lng: parseFloat(visit.lon) }} />
                  ) : null
                ))}

                {showActualRoute && pings.map((ping, index) => (
                  <Marker key={`ping-${ping.id || index}`} position={{ lat: parseFloat(ping.lat), lng: parseFloat(ping.lon) }} />
                ))}

                {showRealTime && isTracking && pings.length > 0 && (
                  <Circle
                    center={{ lat: parseFloat(pings[pings.length - 1].lat), lng: parseFloat(pings[pings.length - 1].lon) }}
                    radius={50}
                    options={{ strokeColor: '#10B981', fillColor: '#10B981', fillOpacity: 0.3 }}
                  />
                )}
              </GoogleMap>
            </GoogleMapsProvider>
          </div>
        </div>

        {/* Route Summary and Optimization Metrics */}
        {(routeSummary || optimizationMetrics) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      {routeSummary.total_distance_km}
                    </div>
                    <div className="text-sm text-gray-600">Total Distance (km)</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {routeSummary.total_time_hours}
                    </div>
                    <div className="text-sm text-gray-600">Total Time (hours)</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {routeSummary.average_speed_kmh}
                    </div>
                    <div className="text-sm text-gray-600">Avg Speed (km/h)</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {routeSummary.ping_count}
                    </div>
                    <div className="text-sm text-gray-600">GPS Pings</div>
                  </div>
                </div>
              </div>
            )}

            {/* Optimization Metrics */}
            {optimizationMetrics && (
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FiTrendingUp className="text-green-600" />
                  Route Optimization
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Route Efficiency</span>
                    <span className={`font-bold ${
                      optimizationMetrics.efficiency_percentage > 80 ? 'text-green-600' :
                      optimizationMetrics.efficiency_percentage > 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {optimizationMetrics.efficiency_percentage}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Deviation</span>
                    <span className="font-bold text-red-600">
                      +{optimizationMetrics.deviation_km} km
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Fuel Cost</span>
                    <span className="font-bold text-orange-600">
                      ${optimizationMetrics.estimated_fuel_cost}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Time Efficiency</span>
                    <span className={`font-bold ${
                      optimizationMetrics.time_efficiency === 'High' ? 'text-green-600' :
                      optimizationMetrics.time_efficiency === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {optimizationMetrics.time_efficiency}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Advanced Route Optimization */}
        {selectedRouteId && (
          <RouteOptimizer selectedRouteId={selectedRouteId} />
        )}

        {/* Customer Visit Logging */}
        {selectedRouteId && (
          <CustomerVisitLogger
            selectedRouteId={selectedRouteId}
            onVisitLogged={(visitData) => {
              // Refresh route data when a visit is logged
              fetchRoutePings();
              fetchRouteSummary();
            }}
            isTracking={isTracking}
            currentLocation={currentLocation}
          />
        )}

        {/* Status Messages */}
        {error && (
          <Toast type="error" message={error} onClose={() => setError('')} />
        )}
        {info && (
          <Toast type="success" message={info} onClose={() => setInfo('')} />
        )}
      </div>
    </div>
  );
};

export default RouteLiveTracker;