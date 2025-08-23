import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { FiActivity, FiMapPin, FiNavigation, FiTrendingUp, FiClock, FiZap, FiAlertCircle, FiEye } from 'react-icons/fi';
import api from '../services/api';
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
  
  const { user, isAuthenticated } = useAuth();
  const userRole = user?.role || '';
  
  const watchIdRef = useRef(null);
  const websocketRef = useRef(null);
  const lastPingTimeRef = useRef(0);
  const locationHistoryRef = useRef([]); // For GPS smoothing
  const mapRef = useRef(null);

  // Enhanced GPS filtering constants
  const GPS_CONFIG = {
    MAX_ACCURACY: 100,           // Reject readings worse than 100m
    MIN_DISTANCE: 50,            // Minimum 50m movement required
    MIN_TIME_INTERVAL: 30000,    // Minimum 30 seconds between pings
    MAX_SPEED: 120,              // Maximum realistic speed in km/h
    SMOOTHING_WINDOW: 3,         // Number of readings to average
    INDOOR_ACCURACY_THRESHOLD: 65 // Consider readings worse than 65m as potentially indoor
  };

  // Initialize WebSocket connection
  const initWebSocket = useCallback(() => {
    if (!selectedRouteId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/route/${selectedRouteId}/`;
    
    try {
      websocketRef.current = new WebSocket(wsUrl);
      
      websocketRef.current.onopen = () => {
        console.log('WebSocket connected for route tracking');
        setInfo('Real-time connection established');
      };
      
      websocketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };
      
      websocketRef.current.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        if (isTracking || isMonitoring) {
          // Attempt reconnection after 5 seconds if still tracking
          setTimeout(initWebSocket, 5000);
        }
      };
      
      websocketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Real-time connection error - using manual updates');
      };
    } catch (e) {
      console.error('Failed to create WebSocket connection:', e);
      setError('WebSocket not supported - using manual updates');
    }
  }, [selectedRouteId, isTracking, isMonitoring]);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((data) => {
    switch (data.type) {
      case 'gps_ping':
        setPings(prev => {
          // Avoid duplicates based on timestamp
          const exists = prev.some(p => 
            Math.abs(new Date(p.created_at).getTime() - new Date(data.ping.created_at).getTime()) < 1000
          );
          if (exists) return prev;
          return [...prev, data.ping];
        });
        break;
      case 'route_summary':
        setRouteSummary(data.summary);
        setOptimizationMetrics(data.optimization);
        break;
      case 'tracking_status':
        if (data.status === 'stopped') {
          setIsTracking(false);
          setIsMonitoring(false);
        }
        setInfo(data.message);
        break;
      case 'error':
        setError(data.message);
        break;
      case 'initial_data':
        setPings(data.pings || []);
        break;
      case 'connection_status':
        if (data.status === 'connected') {
          setInfo('WebSocket connected successfully');
        }
        break;
      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  }, []);

  // Enhanced GPS coordinate validation
  const isValidGPSReading = useCallback((position) => {
    const { latitude, longitude, accuracy, speed } = position.coords;
    
    // Basic coordinate validation
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      console.log('Invalid GPS coordinates');
      return { valid: false, reason: 'Invalid coordinates' };
    }
    
    // Accuracy validation
    if (accuracy > GPS_CONFIG.MAX_ACCURACY) {
      console.log(`GPS accuracy too poor: ${accuracy}m`);
      return { valid: false, reason: `Poor accuracy: ${accuracy.toFixed(1)}m` };
    }
    
    // Speed validation (reject unrealistic speeds)
    if (speed && speed * 3.6 > GPS_CONFIG.MAX_SPEED) {
      console.log(`Unrealistic speed detected: ${(speed * 3.6).toFixed(1)} km/h`);
      return { valid: false, reason: `Unrealistic speed: ${(speed * 3.6).toFixed(1)} km/h` };
    }
    
    return { valid: true };
  }, []);

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

  // GPS smoothing using moving average
  const smoothGPSReading = useCallback((newReading) => {
    const history = locationHistoryRef.current;
    history.push(newReading);
    
    // Keep only recent readings
    if (history.length > GPS_CONFIG.SMOOTHING_WINDOW) {
      history.shift();
    }
    
    // If we don't have enough readings, return the current one
    if (history.length < 2) {
      return newReading;
    }
    
    // Calculate weighted average (more weight to recent readings)
    let totalLat = 0, totalLon = 0, totalWeight = 0;
    
    history.forEach((reading, index) => {
      const weight = index + 1; // Recent readings get higher weight
      totalLat += reading.lat * weight;
      totalLon += reading.lon * weight;
      totalWeight += weight;
    });
    
    return {
      lat: totalLat / totalWeight,
      lon: totalLon / totalWeight,
      accuracy: Math.min(...history.map(r => r.accuracy)), // Best accuracy
      timestamp: newReading.timestamp
    };
  }, []);

  // Enhanced movement detection with multiple filters
  const hasMovedSignificantly = useCallback((lastLocation, newLocation, accuracy) => {
    if (!lastLocation) return true;
    
    // Time-based filtering - don't ping too frequently
    const now = Date.now();
    if (now - lastPingTimeRef.current < GPS_CONFIG.MIN_TIME_INTERVAL) {
      console.log(`Time filter: ${((now - lastPingTimeRef.current) / 1000).toFixed(1)}s since last ping`);
      return false;
    }
    
    const distance = calculateDistance(
      lastLocation.lat, lastLocation.lon,
      newLocation.lat, newLocation.lon
    );
    
    // Dynamic threshold based on GPS accuracy and environmental factors
    let movementThreshold = GPS_CONFIG.MIN_DISTANCE;
    
    // Increase threshold for poor accuracy readings (likely indoors or poor signal)
    if (accuracy > GPS_CONFIG.INDOOR_ACCURACY_THRESHOLD) {
      movementThreshold = Math.max(movementThreshold, accuracy * 1.5);
    }
    
    // Additional validation for very large jumps
    if (distance > 500) { // More than 500m in 30 seconds is suspicious
      const maxReasonableDistance = GPS_CONFIG.MAX_SPEED * 1000 / 3600 * (GPS_CONFIG.MIN_TIME_INTERVAL / 1000);
      if (distance > maxReasonableDistance) {
        console.log(`Suspicious GPS jump: ${distance.toFixed(1)}m in ${GPS_CONFIG.MIN_TIME_INTERVAL/1000}s`);
        return false;
      }
    }
    
    console.log(`Movement check: ${distance.toFixed(1)}m (threshold: ${movementThreshold.toFixed(1)}m, accuracy: ${accuracy?.toFixed(1)}m)`);
    
    return distance >= movementThreshold;
  }, [calculateDistance]);

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

  // Initialize WebSocket when route is selected
  useEffect(() => {
    if (selectedRouteId) {
      initWebSocket();
      fetchRoutePings();
      fetchRouteSummary();
      // Reset location states
      setLastConfirmedLocation(null);
      setCurrentLocation(null);
      locationHistoryRef.current = [];
      lastPingTimeRef.current = 0;
    } else {
      if (websocketRef.current) {
        websocketRef.current.close();
        websocketRef.current = null;
      }
      setPings([]);
      setRouteSummary(null);
      setOptimizationMetrics(null);
    }

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
        websocketRef.current = null;
      }
    };
  }, [selectedRouteId, initWebSocket]);

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
        
        if (response.data.message) {
          setInfo(response.data.message);
        }
      }
    } catch (e) {
      console.error('Failed to fetch route summary:', e);
      if (e.response?.status === 404) {
        setInfo('No GPS tracking data available for this route yet.');
      }
    } finally {
      setLoadingSummary(false);
    }
  }, [selectedRouteId]);

  // Enhanced GPS tracking with proper filtering
  const startTracking = useCallback(async () => {
    if (!selectedRouteId) {
      setError('Please select a route first');
      return;
    }

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    try {
      const response = await api.post('/transactions/route-location-pings/start_route_tracking/', {
        route_id: selectedRouteId
      });
      
      setInfo('GPS tracking started with enhanced filtering');
      setIsTracking(true);
      
      // Reset tracking state
      locationHistoryRef.current = [];
      lastPingTimeRef.current = 0;
      
    } catch (e) {
      console.error('Failed to start tracking:', e);
      setError('Failed to start tracking: ' + (e.response?.data?.detail || e.message));
      return;
    }

    const id = navigator.geolocation.watchPosition(async (position) => {
      // Validate GPS reading
      const validation = isValidGPSReading(position);
      if (!validation.valid) {
        console.log(`GPS reading rejected: ${validation.reason}`);
        return;
      }

      const rawLocation = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date(position.timestamp)
      };

      // Apply GPS smoothing
      const smoothedLocation = smoothGPSReading(rawLocation);
      
      // Always update current location for display
      setCurrentLocation(smoothedLocation);

      // Check for significant movement
      const hasMoved = hasMovedSignificantly(
        lastConfirmedLocation, 
        smoothedLocation, 
        position.coords.accuracy
      );
      
      if (hasMoved) {
        const payload = {
          route: selectedRouteId,
          lat: smoothedLocation.lat,
          lon: smoothedLocation.lon,
          accuracy_meters: position.coords.accuracy,
          speed_mps: position.coords.speed,
          heading_degrees: position.coords.heading,
        };
        
        try {
          const response = await api.post('/transactions/route-location-pings/', payload);
          
          const distance = lastConfirmedLocation ? 
            calculateDistance(
              lastConfirmedLocation.lat, lastConfirmedLocation.lon, 
              smoothedLocation.lat, smoothedLocation.lon
            ) : 0;
          
          // Update confirmed location and timestamp
          setLastConfirmedLocation(smoothedLocation);
          lastPingTimeRef.current = Date.now();
          
          // Show meaningful movement info
          if (distance > 0) {
            setInfo(`GPS ping sent - moved ${distance.toFixed(0)}m (accuracy: ${position.coords.accuracy?.toFixed(0)}m)`);
          }
          
          // WebSocket will handle real-time updates automatically
          
        } catch (e) {
          console.error('Failed to send location:', e);
          const errorMsg = e?.response?.data?.detail || 'Failed to send GPS ping';
          setError(errorMsg);
        }
      } else {
        // Don't show toast for stationary readings to avoid spam
        console.log(`Stationary - accuracy: ${position.coords.accuracy?.toFixed(1)}m`);
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
          setError(err.message || 'GPS tracking error');
      }
    }, { 
      enableHighAccuracy: true,
      timeout: 20000,               // Increased timeout
      maximumAge: 30000            // Reduced maximum age for fresher readings
    });
    
    watchIdRef.current = id;
  }, [selectedRouteId, lastConfirmedLocation, hasMovedSignificantly, isValidGPSReading, smoothGPSReading, calculateDistance]);

  // Start monitoring for admin users
  const startMonitoring = useCallback(async () => {
    if (!selectedRouteId) {
      setError('Please select a route first');
      return;
    }

    try {
      const response = await api.post('/transactions/route-location-pings/start_route_monitoring/', {
        route_id: selectedRouteId
      });
      
      setInfo('Route monitoring started - watching for real-time GPS updates');
      setIsMonitoring(true);
      
      // WebSocket will handle real-time updates automatically
      
    } catch (e) {
      console.error('Failed to start monitoring:', e);
      setError('Failed to start monitoring: ' + (e.response?.data?.detail || e.message));
    }
  }, [selectedRouteId]);

  // Stop tracking/monitoring
  const stopTracking = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
    
    try {
      const endpoint = userRole === 'admin' ? 'stop_route_monitoring' : 'stop_route_tracking';
      await api.post(`/transactions/route-location-pings/${endpoint}/`, {
        route_id: selectedRouteId
      });
      
      await fetchRouteSummary();
      const action = userRole === 'admin' ? 'monitoring' : 'tracking';
      setInfo(`${action.charAt(0).toUpperCase() + action.slice(1)} stopped`);
    } catch (e) {
      console.error('Failed to stop tracking/monitoring:', e);
    }
    
    setIsTracking(false);
    setIsMonitoring(false);
    
    // Re-initialize WebSocket for continued updates
    if (selectedRouteId) {
      setTimeout(initWebSocket, 1000);
    }
  }, [selectedRouteId, fetchRouteSummary, userRole, initWebSocket]);

  // Unified start function
  const handleStartAction = useCallback(() => {
    if (userRole === 'admin') {
      startMonitoring();
    } else {
      startTracking();
    }
  }, [userRole, startMonitoring, startTracking]);

  // Manual ping with enhanced validation
  const sendManualPing = useCallback(async () => {
    if (!navigator.geolocation || !selectedRouteId || userRole === 'admin') {
      setError('Manual ping not available');
      return;
    }

    // Check time interval
    if (Date.now() - lastPingTimeRef.current < GPS_CONFIG.MIN_TIME_INTERVAL) {
      const waitTime = Math.ceil((GPS_CONFIG.MIN_TIME_INTERVAL - (Date.now() - lastPingTimeRef.current)) / 1000);
      setError(`Please wait ${waitTime} seconds before sending another ping`);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const validation = isValidGPSReading(position);
      if (!validation.valid) {
        setError(`Cannot send manual ping - ${validation.reason}`);
        return;
      }

      const payload = {
        route: selectedRouteId,
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        accuracy_meters: position.coords.accuracy,
        speed_mps: position.coords.speed,
        heading_degrees: position.coords.heading,
      };
      
      try {
        await api.post('/transactions/route-location-pings/', payload);
        setInfo(`Manual GPS ping sent (accuracy: ${position.coords.accuracy?.toFixed(0)}m)`);
        setLastConfirmedLocation({ lat: position.coords.latitude, lon: position.coords.longitude });
        lastPingTimeRef.current = Date.now();
      } catch (e) {
        console.error('Failed to send manual ping:', e);
        setError('Failed to send manual ping');
      }
    }, (err) => {
      setError('Failed to get current location for manual ping');
    }, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000
    });
  }, [selectedRouteId, isValidGPSReading, userRole]);

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
        
        const latDiff = maxLat - minLat;
        const lonDiff = maxLon - minLon;
        const maxDiff = Math.max(latDiff, lonDiff);
        
        if (maxDiff < 0.01) zoom = 15;
        else if (maxDiff < 0.05) zoom = 13;
        else if (maxDiff < 0.1) zoom = 11;
        else zoom = 9;
      }
    }
    
    return { center, zoom };
  }, [selectedRoute, pings]);

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
          subtitle={`Enhanced GPS ${userRole === 'admin' ? 'monitoring' : 'tracking'} with intelligent filtering and real-time WebSocket updates`}
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
                <div className="mt-2 text-sm text-gray-600">
                  <p>Salesperson: {selectedRoute.salesperson_name || 'N/A'}</p>
                  <p className="text-xs text-blue-600">
                    WebSocket: {websocketRef.current?.readyState === 1 ? '🟢 Connected' : '🔴 Disconnected'}
                  </p>
                </div>
              )}
              {userRole && (
                <p className="mt-1 text-xs text-blue-600">
                  Mode: {userRole === 'admin' ? 'Monitor Only' : 'GPS Tracking'}
                </p>
              )}
            </div>

            {/* Enhanced Tracking Controls */}
            <div className="flex flex-col justify-end">
              <div className="flex gap-2">
                {!isActive ? (
                  <button
                    onClick={handleStartAction}
                    disabled={!selectedRouteId}
                    className={`px-6 py-2 text-white rounded-md hover:opacity-90 disabled:opacity-50 flex items-center gap-2 ${
                      userRole === 'admin' 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {userRole === 'admin' ? <FiEye /> : <FiActivity />}
                    Start {actionLabel}ing
                  </button>
                ) : (
                  <>
                    <button
                      onClick={stopTracking}
                      className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
                    >
                      <FiActivity /> Stop {actionLabel}ing
                    </button>
                    {userRole !== 'admin' && (
                      <button
                        onClick={sendManualPing}
                        disabled={Date.now() - lastPingTimeRef.current < GPS_CONFIG.MIN_TIME_INTERVAL}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        title={Date.now() - lastPingTimeRef.current < GPS_CONFIG.MIN_TIME_INTERVAL 
                          ? `Wait ${Math.ceil((GPS_CONFIG.MIN_TIME_INTERVAL - (Date.now() - lastPingTimeRef.current)) / 1000)}s` 
                          : 'Send manual GPS ping'
                        }
                      >
                        📍 Manual Ping
                      </button>
                    )}
                  </>
                )}
              </div>
              {isActive && (
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-600">
                    🟢 {statusLabel} active {userRole === 'admin' && '(monitoring only)'}
                  </p>
                  {userRole !== 'admin' && (
                    <p className="text-xs text-gray-500">
                      Min distance: {GPS_CONFIG.MIN_DISTANCE}m | Min interval: {GPS_CONFIG.MIN_TIME_INTERVAL/1000}s
                    </p>
                  )}
                </div>
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

        {/* Enhanced GPS Status Display */}
        {isActive && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Live {statusLabel}</span>
                </div>
                {currentLocation && userRole !== 'admin' && (
                  <div className="text-sm text-gray-600">
                    Last update: {new Date().toLocaleTimeString()}
                    {currentLocation.accuracy && ` (±${currentLocation.accuracy.toFixed(0)}m)`}
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-600">
                GPS History: {locationHistoryRef.current.length} smoothed readings
              </div>
            </div>
          </div>
        )}

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
                        path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.87-3.13-7-7-7z',
                        fillColor: 'red',
                        fillOpacity: 0.8,
                        strokeWeight: 2,
                        strokeColor: 'darkred',
                        scale: 0.8
                      }}
                    />
                  ) : null
                ))}

                {showRealTime && isActive && currentLocation && userRole !== 'admin' && (
                  <Circle
                    center={{ 
                      lat: currentLocation.lat, 
                      lng: currentLocation.lon 
                    }}
                    radius={currentLocation.accuracy || 50}
                    options={{ 
                      strokeColor: '#10B981', 
                      fillColor: '#10B981', 
                      fillOpacity: 0.2,
                      strokeWeight: 2
                    }}
                  />
                )}
              </GoogleMap>
            </GoogleMapsProvider>
          </div>
        </div>

        {/* Route Summary and Optimization Metrics */}
        {loadingSummary ? (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading route analytics...</span>
            </div>
          </div>
        ) : (routeSummary || optimizationMetrics) ? (
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
                  {routeSummary.max_speed_kmh && (
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {routeSummary.max_speed_kmh} km/h
                      </div>
                      <div className="text-sm text-gray-600">Max Speed</div>
                    </div>
                  )}
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
                    <span className="text-sm font-medium">Distance Deviation</span>
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
                    <span className="text-sm font-medium">Efficiency Rating</span>
                    <span className={`font-bold ${
                      optimizationMetrics.efficiency_rating === 'Excellent' ? 'text-green-600' :
                      optimizationMetrics.efficiency_rating === 'Good' ? 'text-blue-600' :
                      optimizationMetrics.efficiency_rating === 'Fair' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {optimizationMetrics.efficiency_rating}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : selectedRouteId && !loadingSummary && (
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
        )}

        {/* Advanced Route Optimization */}
        {selectedRouteId && (
          <RouteOptimizer selectedRouteId={selectedRouteId} />
        )}

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