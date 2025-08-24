import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { FiActivity, FiMapPin, FiNavigation, FiTrendingUp, FiClock, FiZap, FiAlertCircle, FiEye } from 'react-icons/fi';
import RouteAnalyticsSummary from '../components/Dashboard/RouteAnalyticsSummary';
import api from '../services/api';
import websocketService from '../services/websocket';
import PageHeader from '../components/layout/PageHeader';
import Loader from '../components/Common/Loader';
import Toast from '../components/Common/Toast';
import RouteOptimizer from '../components/Dashboard/RouteOptimizer';
import CustomerVisitLogger from '../components/Customers/CustomerVisitLogger';
import { GoogleMapsProvider, GoogleMap, Marker, Polyline, Circle, InfoWindow, defaultMapContainerStyle } from '../components/Common/GoogleMapWrapper';
import { useAuth } from '../hooks/useAuth';

const RouteLiveTracker = () => {
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [routes, setRoutes] = useState([]);
  const [pings, setPings] = useState([]);
  const [isTracking, setIsTracking] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [routeSummary, setRouteSummary] = useState(null);
  const [optimizationMetrics, setOptimizationMetrics] = useState(null);
  const [showPlannedRoute, setShowPlannedRoute] = useState(true);
  const [showActualRoute, setShowActualRoute] = useState(true);
  const [showRealTime, setShowRealTime] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [lastConfirmedLocation, setLastConfirmedLocation] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [websocketConnected, setWebsocketConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const userRole = user?.role || '';
  const watchIdRef = useRef(null);
  const monitoringIntervalRef = useRef(null);
  const mapRef = useRef(null);

  // Get user role from API or context

  // Improved distance calculation using Haversine formula
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
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
  }, []);

  // Smart movement detection based on GPS accuracy - IMPROVED VERSION
  const hasMovedSignificantly = useCallback((lastLocation, newLocation, accuracy) => {
    if (!lastLocation) return true;
    
    const distance = calculateDistance(
      lastLocation.lat, lastLocation.lon,
      newLocation.lat, newLocation.lon
    );
    
    // IMPROVED: More conservative thresholds to reduce false positives
    const accuracyMeters = accuracy || 30; // Default to 30m if no accuracy provided
    const movementThreshold = Math.max(
      50,                          // Minimum 50 meters to avoid GPS noise (increased from 20m)
      accuracyMeters * 3          // 3x the GPS accuracy for reliable detection (increased from 2x)
    );
    
    // Additional check: if accuracy is poor, require even more movement
    if (accuracyMeters > 30) {
      const poorAccuracyThreshold = Math.max(movementThreshold, 100); // At least 100m for poor accuracy
      console.log(`Poor accuracy detected: ${accuracyMeters}m, requiring ${poorAccuracyThreshold}m movement`);
      return distance > poorAccuracyThreshold;
    }
    
    console.log(`Distance: ${distance.toFixed(2)}m, Threshold: ${movementThreshold.toFixed(2)}m, Accuracy: ${accuracyMeters}m`);
    
    return distance > movementThreshold;
  }, [calculateDistance]);

  // Check if GPS reading is accurate enough - IMPROVED VERSION
  const isAccurateEnough = useCallback((accuracy) => {
    const maxAccuracy = 30; // Reject readings worse than 30m accuracy (reduced from 50m)
    return !accuracy || accuracy <= maxAccuracy;
  }, []);

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
      console.error('Fetch routes error:', e);
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
      console.log(`Fetched ${response.data.length} pings for route ${selectedRouteId}`);
    } catch (e) {
      console.error('Failed to fetch route history:', e);
      setError('Failed to fetch route history');
    }
  }, [selectedRouteId]);

  // Fetch route summary and optimization metrics with improved error handling
  const fetchRouteSummary = useCallback(async () => {
    if (!selectedRouteId) {
      setRouteSummary(null);
      setOptimizationMetrics(null);
      return;
    }
    
    setLoadingSummary(true);
    try {
      const response = await api.get(`/transactions/route-location-pings/route_summary/?route_id=${selectedRouteId}`);
      
      if (response.data) {
        setRouteSummary(response.data.summary || null);
        setOptimizationMetrics(response.data.optimization || null);
        
        // Show message if no data available
        if (response.data.message) {
          setInfo(response.data.message);
        }
        
        console.log('Route summary fetched:', response.data);
      }
    } catch (e) {
      console.error('Failed to fetch route summary:', e);
      
      // Handle specific error cases
      if (e.response?.status === 404) {
        setInfo('No GPS tracking data available for this route yet. Start tracking to see analytics.');
        setRouteSummary(null);
        setOptimizationMetrics(null);
      } else {
        setError('Failed to fetch route analytics');
      }
    } finally {
      setLoadingSummary(false);
    }
  }, [selectedRouteId]);

  // Start monitoring for admin users (no GPS tracking)
  const startMonitoring = useCallback(async () => {
    if (!selectedRouteId) {
      setError('Please select a route first');
      return;
    }

    try {
      // Just start backend monitoring session
      const response = await api.post('/transactions/route-location-pings/start_route_monitoring/', {
        route_id: selectedRouteId
      });
      
      setInfo('Route monitoring started - watching for GPS updates from salesperson');
      setIsMonitoring(true);
      
      // Set up polling for real-time updates
      monitoringIntervalRef.current = setInterval(() => {
        fetchRoutePings();
        fetchRouteSummary();
      }, 120000); // Poll every 2 minutes (increased from 30 seconds)
      
    } catch (e) {
      console.error('Failed to start monitoring:', e);
      setError('Failed to start monitoring: ' + (e.response?.data?.detail || e.message));
    }
  }, [selectedRouteId, fetchRoutePings, fetchRouteSummary]);

  // Start route tracking with improved GPS settings for salesperson
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
        setInfo('Route tracking started - GPS monitoring active');
      }
    } catch (e) {
      console.error('Failed to start tracking:', e);
      setError('Failed to start tracking: ' + (e.response?.data?.detail || e.message));
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
      
      const accuracy = position.coords.accuracy;

      // Filter out inaccurate readings
      if (!isAccurateEnough(accuracy)) {
        setInfo(`Location skipped - poor GPS accuracy: ${accuracy?.toFixed(1)}m`);
        return;
      }

      // Clear any accuracy errors
      if (error.includes('accuracy')) {
        setError('');
      }

      // Always update current location for display
      setCurrentLocation(newLocation);

      // Check for significant movement before sending ping
      const hasMoved = hasMovedSignificantly(lastConfirmedLocation, newLocation, accuracy);
      
      if (hasMoved) {
        const payload = {
          route: selectedRouteId,
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy_meters: accuracy ? Math.round(accuracy * 1000000) / 1000000 : null,
          speed_mps: position.coords.speed ? Math.round(position.coords.speed * 10000) / 10000 : null,
          heading_degrees: position.coords.heading ? Math.round(position.coords.heading * 100) / 100 : null,
        };
        
        // Update confirmed location
        setLastConfirmedLocation(newLocation);
        
        try {
          // Use WebSocket for real-time updates if connected, otherwise fallback to API
          if (websocketConnected) {
            websocketService.sendLocationUpdate(payload);
            const distance = lastConfirmedLocation ? 
              calculateDistance(lastConfirmedLocation.lat, lastConfirmedLocation.lon, newLocation.lat, newLocation.lon) : 0;
            
            // Only show notification for significant movements (more than 50m)
            if (distance > 50) {
              setInfo(`GPS ping sent via WebSocket - moved ${distance.toFixed(1)}m (accuracy: ${accuracy?.toFixed(1)}m)`);
            } else {
              setInfo(`GPS ping sent via WebSocket - accuracy: ${accuracy?.toFixed(1)}m`);
            }
            
            // Update pings state for real-time display
            setPings(prev => [...prev, { ...payload, created_at: new Date().toISOString() }]);
            
            // Fetch updated summary less frequently
            if (distance > 100) { // Only update summary for significant movements
              fetchRouteSummary();
            }
          } else {
            // Fallback to API call if WebSocket is not connected
            const response = await api.post('/transactions/route-location-pings/', payload);
            const distance = lastConfirmedLocation ? 
              calculateDistance(lastConfirmedLocation.lat, lastConfirmedLocation.lon, newLocation.lat, newLocation.lon) : 0;
            
            // Only show notification for significant movements (more than 50m)
            if (distance > 50) {
              setInfo(`GPS ping sent via API - moved ${distance.toFixed(1)}m (accuracy: ${accuracy?.toFixed(1)}m)`);
            } else {
              setInfo(`GPS ping sent via API - accuracy: ${accuracy?.toFixed(1)}m`);
            }
            
            // Update pings state for real-time display
            setPings(prev => [...prev, { ...payload, created_at: new Date().toISOString() }]);
            
            // Fetch updated summary less frequently
            if (distance > 100) { // Only update summary for significant movements
              fetchRouteSummary();
            }
          }
        } catch (e) {
          console.error('Failed to send location:', e);
          const errorMsg = e?.response?.data?.detail || e?.response?.data || 'Failed to send location';
          setError(errorMsg);
        }
      } else {
        // Only show stationary message if accuracy is good
        if (accuracy && accuracy <= 20) {
          setInfo(`Stationary - accuracy: ${accuracy?.toFixed(1)}m`);
        }
      }
    }, (err) => {
      setIsTracking(false);
      console.error('Geolocation error:', err);
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
      enableHighAccuracy: true,     // Use high accuracy for better precision
      timeout: 15000,               // 15 second timeout for responsive updates
      maximumAge: 60000            // 1 minute maximum age for fresher readings
    });
    
    watchIdRef.current = id;
  }, [selectedRouteId, fetchRouteSummary, lastConfirmedLocation, hasMovedSignificantly, isAccurateEnough, calculateDistance, error, websocketConnected]);

  // Stop tracking/monitoring
  const stopTracking = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    if (monitoringIntervalRef.current !== null) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
    
    try {
      const endpoint = userRole === 'admin' ? 'stop_route_monitoring' : 'stop_route_tracking';
      await api.post(`/transactions/route-location-pings/${endpoint}/`, {
        route_id: selectedRouteId
      });
      
      // Fetch final summary
      await fetchRouteSummary();
      const action = userRole === 'admin' ? 'monitoring' : 'tracking';
      setInfo(`${action.charAt(0).toUpperCase() + action.slice(1)} stopped and summary generated`);
    } catch (e) {
      console.error('Failed to stop tracking/monitoring:', e);
      const action = userRole === 'admin' ? 'monitoring' : 'tracking';
      setError(`Failed to stop ${action}: ` + (e.response?.data?.detail || e.message));
    }
    
    setIsTracking(false);
    setIsMonitoring(false);
  }, [selectedRouteId, fetchRouteSummary, userRole]);

  // Unified start function that chooses based on role
  const handleStartAction = useCallback(() => {
    if (userRole === 'admin') {
      startMonitoring();
    } else {
      startTracking();
    }
  }, [userRole, startMonitoring, startTracking]);

  // Fetch data when route changes
  useEffect(() => {
    if (selectedRouteId) {
      fetchRoutePings();
      fetchRouteSummary();
      // Reset location states when switching routes
      setLastConfirmedLocation(null);
      setCurrentLocation(null);
      
      // Connect to WebSocket for real-time updates
      connectWebSocket();
    } else {
      setPings([]);
      setRouteSummary(null);
      setOptimizationMetrics(null);
      // Disconnect WebSocket when no route is selected
      websocketService.disconnect();
      setWebsocketConnected(false);
    }
  }, [selectedRouteId, fetchRoutePings, fetchRouteSummary]);

  // WebSocket connection function
  const connectWebSocket = useCallback(async () => {
    if (!selectedRouteId || !isAuthenticated) {
      console.log('Cannot connect WebSocket: missing routeId or not authenticated');
      console.log('selectedRouteId:', selectedRouteId);
      console.log('isAuthenticated:', isAuthenticated);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token available for WebSocket connection');
        setError('Authentication required for real-time tracking');
        return;
      }

      console.log('Attempting WebSocket connection with routeId:', selectedRouteId);
      
      websocketService.setConnectionDetails(selectedRouteId, token);
      
      websocketService.addListener('location_update', (data) => {
        setPings(prev => [...prev, data]);
        setCurrentLocation(data);
      });

      websocketService.addListener('error', (error) => {
        console.error('WebSocket error received:', error);
        setError(`WebSocket error: ${error}`);
      });
      
      websocketService.addListener('connect', (data) => {
        console.log('WebSocket connect event received:', data);
        setWebsocketConnected(true);
        setInfo('Real-time tracking connected');
      });

      websocketService.addListener('disconnect', (data) => {
        console.log('WebSocket disconnect event received:', data);
        setWebsocketConnected(false);
        setInfo('Real-time tracking disconnected');
      });

      await websocketService.connect(selectedRouteId, token);
      console.log('WebSocket connection successful');
      setWebsocketConnected(true);
      setInfo('Real-time tracking connected');
      
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setError('Failed to connect real-time tracking: ' + error.message);
      setWebsocketConnected(false);
    }
  }, [selectedRouteId, isAuthenticated]);

  // Cleanup WebSocket on component unmount
  useEffect(() => {
    return () => {
      websocketService.disconnect();
    };
  }, []);

  // Set up polling for real-time updates - REDUCED FREQUENCY
  useEffect(() => {
    if ((isTracking || isMonitoring) && selectedRouteId) {
      const interval = setInterval(() => {
        fetchRoutePings();
        fetchRouteSummary();
      }, 600000); // Poll every 10 minutes (increased from 5 minutes)
      
      return () => clearInterval(interval);
    }
  }, [isTracking, isMonitoring, selectedRouteId, fetchRoutePings, fetchRouteSummary]);

  // Get selected route details
  const selectedRoute = useMemo(() => 
    routes.find(r => r.id === selectedRouteId), [routes, selectedRouteId]
  );

  // Prepare map data with improved center calculation
  const mapData = useMemo(() => {
    if (!selectedRoute) return { center: [25.2048, 55.2708], zoom: 10 }; // Default to Dubai
    
    let center = [25.2048, 55.2708];
    let zoom = 10;
    
    if (pings.length > 0) {
      const validPings = pings.filter(p => p.lat && p.lon && !isNaN(p.lat) && !isNaN(p.lon));
      if (validPings.length > 0) {
        const lats = validPings.map(p => parseFloat(p.lat));
        const lons = validPings.map(p => parseFloat(p.lon));
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLon = Math.min(...lons);
        const maxLon = Math.max(...lons);
        
        center = [(minLat + maxLat) / 2, (minLon + maxLon) / 2];
        
        // Calculate zoom based on bounds
        const latDiff = maxLat - minLat;
        const lonDiff = maxLon - minLon;
        const maxDiff = Math.max(latDiff, lonDiff);
        
        if (maxDiff < 0.01) zoom = 15;
        else if (maxDiff < 0.05) zoom = 13;
        else if (maxDiff < 0.1) zoom = 11;
        else zoom = 9;
      }
    } else if (selectedRoute.visits && selectedRoute.visits.length > 0) {
      const visitsWithCoords = selectedRoute.visits.filter(v => v.lat && v.lon && !isNaN(v.lat) && !isNaN(v.lon));
      if (visitsWithCoords.length > 0) {
        const lats = visitsWithCoords.map(v => parseFloat(v.lat));
        const lons = visitsWithCoords.map(v => parseFloat(v.lon));
        center = [
          (Math.min(...lats) + Math.max(...lats)) / 2,
          (Math.min(...lons) + Math.max(...lons)) / 2
        ];
        zoom = 12;
      }
    }
    
    return { center, zoom };
  }, [selectedRoute, pings]);

  // Manual GPS ping function - IMPROVED VERSION
  const sendManualPing = useCallback(() => {
    if (!selectedRouteId || userRole === 'admin') {
      setError('Manual ping not available for admin users');
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const accuracy = position.coords.accuracy;

      // Filter out inaccurate readings
      if (!isAccurateEnough(accuracy)) {
        setError(`Manual ping failed - poor GPS accuracy: ${accuracy?.toFixed(1)}m`);
        return;
      }

      const payload = {
        route: selectedRouteId,
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        accuracy_meters: accuracy ? Math.round(accuracy * 1000000) / 1000000 : null,
        speed_mps: position.coords.speed ? Math.round(position.coords.speed * 10000) / 10000 : null,
        heading_degrees: position.coords.heading ? Math.round(position.coords.heading * 100) / 100 : null,
      };
      
      try {
        // Use WebSocket if connected, otherwise fallback to API
        if (websocketConnected) {
          websocketService.sendLocationUpdate(payload);
          setInfo(`Manual GPS ping sent via WebSocket (accuracy: ${accuracy?.toFixed(1)}m)`);
          setPings(prev => [...prev, { ...payload, created_at: new Date().toISOString() }]);
          setLastConfirmedLocation({ lat: position.coords.latitude, lon: position.coords.longitude });
        } else {
          await api.post('/transactions/route-location-pings/', payload);
          setInfo(`Manual GPS ping sent via API (accuracy: ${accuracy?.toFixed(1)}m)`);
          setPings(prev => [...prev, { ...payload, created_at: new Date().toISOString() }]);
          setLastConfirmedLocation({ lat: position.coords.latitude, lon: position.coords.longitude });
          fetchRouteSummary();
        }
      } catch (e) {
        console.error('Failed to send manual ping:', e);
        setError('Failed to send manual ping: ' + (e.response?.data?.detail || e.message));
      }
    }, (err) => {
      setError('Failed to get current location for manual ping');
    }, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000
    });
  }, [selectedRouteId, isAccurateEnough, fetchRouteSummary, userRole, websocketConnected]);

  if (loadingRoutes && routes.length === 0) {
    return <Loader />;
  }

  const isActive = isTracking || isMonitoring;
  const actionLabel = userRole === 'admin' ? 'Monitor' : 'Track';
  const statusLabel = userRole === 'admin' ? 'Monitoring' : 'Tracking';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Route Live Tracker"
          subtitle={`Advanced GPS ${userRole === 'admin' ? 'monitoring' : 'tracking'} with smart movement detection and real-time optimization analytics`}
        />

        {/* Controls Panel */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Route
                </label>
                <select
                  value={selectedRouteId}
                  onChange={(e) => setSelectedRouteId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a route...</option>
                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.name} - {route.salesperson_name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-end gap-2">
                <button
                  onClick={handleStartAction}
                  disabled={!selectedRouteId || isActive}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <FiActivity className="w-4 h-4" />
                  Start {actionLabel}
                </button>
                
                <button
                  onClick={stopTracking}
                  disabled={!isActive}
                  className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <FiZap className="w-4 h-4" />
                  Stop {statusLabel}
                </button>
                
                {userRole !== 'admin' && isActive && (
                  <button
                    onClick={sendManualPing}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                  >
                    <FiMapPin className="w-4 h-4" />
                    Manual Ping
                  </button>
                )}
              </div>
            </div>
            
            {/* WebSocket Connection Status */}
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${websocketConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {websocketConnected ? 'Real-time Connected' : 'Real-time Disconnected'}
              </span>
            </div>
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
                      .filter(v => v.lat && v.lon && !isNaN(v.lat) && !isNaN(v.lon))
                      .map(v => ({ lat: parseFloat(v.lat), lng: parseFloat(v.lon) }))}
                    options={{ strokeColor: 'blue', strokeOpacity: 0.7, strokeWeight: 3 }}
                  />
                )}

                {showActualRoute && pings.length > 1 && (
                  <Polyline
                    path={pings
                      .filter(p => p.lat && p.lon && !isNaN(p.lat) && !isNaN(p.lon))
                      .map(p => ({ lat: parseFloat(p.lat), lng: parseFloat(p.lon) }))}
                    options={{ strokeColor: 'red', strokeOpacity: 0.8, strokeWeight: 4 }}
                  />
                )}

                {showPlannedRoute && selectedRoute?.visits && selectedRoute.visits.map((visit, index) => (
                  visit.lat && visit.lon && !isNaN(visit.lat) && !isNaN(visit.lon) ? (
                    <Marker 
                      key={`visit-${visit.id}`} 
                      position={{ lat: parseFloat(visit.lat), lng: parseFloat(visit.lon) }}
                      icon={{
                        path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
                        fillColor: 'blue',
                        fillOpacity: 0.8,
                        strokeWeight: 2,
                        strokeColor: 'darkblue',
                        scale: 1
                      }}
                    />
                  ) : null
                ))}

                {showActualRoute && pings.map((ping, index) => (
                  ping.lat && ping.lon && !isNaN(ping.lat) && !isNaN(ping.lon) ? (
                    <Marker 
                      key={`ping-${ping.id || index}`} 
                      position={{ lat: parseFloat(ping.lat), lng: parseFloat(ping.lon) }}
                      icon={{
                        path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
                        fillColor: 'red',
                        fillOpacity: 0.8,
                        strokeWeight: 2,
                        strokeColor: 'darkred',
                        scale: 0.8
                      }}
                    />
                  ) : null
                ))}

                {showRealTime && isActive && pings.length > 0 && (
                  <Circle
                    center={{ 
                      lat: parseFloat(pings[pings.length - 1].lat), 
                      lng: parseFloat(pings[pings.length - 1].lon) 
                    }}
                    radius={50}
                    options={{ strokeColor: '#10B981', fillColor: '#10B981', fillOpacity: 0.3 }}
                  />
                )}
              </GoogleMap>
            </GoogleMapsProvider>
          </div>
        </div>

        {/* Route Summary and Optimization Metrics */}
        <RouteAnalyticsSummary
          loadingSummary={loadingSummary}
          routeSummary={routeSummary}
          optimizationMetrics={optimizationMetrics}
          selectedRouteId={selectedRouteId}
          userRole={userRole}
        />

        {/* Advanced Route Optimization */}
     

        {/* Customer Visit Logging - Only show for salesperson */}
        {selectedRouteId && userRole !== 'admin' && (
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