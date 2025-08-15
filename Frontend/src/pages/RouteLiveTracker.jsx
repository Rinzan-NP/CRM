// src/pages/RouteLiveTracker.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';
import PageHeader from '../components/layout/PageHeader';
import Toast from '../components/Common/Toast';
import Loader from '../components/Common/Loader';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix default marker icon paths for Leaflet in bundlers
const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

const formatTime = (isoString) => {
  try {
    return new Date(isoString).toLocaleTimeString();
  } catch {
    return '';
  }
};

const RouteLiveTracker = () => {
  const user = useSelector((state) => state.auth.user);
  const [routes, setRoutes] = useState([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [pings, setPings] = useState([]);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const watchIdRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const todayISO = useMemo(() => new Date().toISOString().split('T')[0], []);

  const centerPosition = useMemo(() => {
    if (pings.length > 0) {
      const last = pings[pings.length - 1];
      return [parseFloat(last.lat), parseFloat(last.lon)];
    }
    // Default center if no pings: approximate center (0,0)
    return [0, 0];
  }, [pings]);

  const polylinePositions = useMemo(() => (
    pings.map((p) => [parseFloat(p.lat), parseFloat(p.lon)])
  ), [pings]);

  const fetchRoutes = useCallback(async () => {
    try {
      setLoadingRoutes(true);
      const res = await api.get('/transactions/routes/');
      const allRoutes = res.data || [];
      // Prefer today's routes on top for convenience
      const sorted = [...allRoutes].sort((a, b) => {
        if (a.date === todayISO && b.date !== todayISO) return -1;
        if (a.date !== todayISO && b.date === todayISO) return 1;
        return (a.date || '').localeCompare(b.date || '');
      });
      setRoutes(sorted);
      // Auto-select first today's route for salespersons
      if (!selectedRouteId) {
        const firstToday = sorted.find(r => r.date === todayISO);
        if (firstToday) setSelectedRouteId(firstToday.id);
      }
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to load routes');
    } finally {
      setLoadingRoutes(false);
    }
  }, [selectedRouteId, todayISO]);

  const fetchPings = useCallback(async (routeId) => {
    if (!routeId) return;
    try {
      const res = await api.get(`/transactions/route-location-pings/?route=${routeId}`);
      const items = Array.isArray(res.data) ? res.data : [];
      // API returns newest first; display oldest->newest
      setPings(items.slice().reverse());
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to load live pings');
    }
  }, []);

  // Start polling when a route is selected
  useEffect(() => {
    if (!selectedRouteId) return;
    fetchPings(selectedRouteId);
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = setInterval(() => fetchPings(selectedRouteId), 5000);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [selectedRouteId, fetchPings]);

  useEffect(() => {
    // Initialize from query param if provided
    try {
      const params = new URLSearchParams(window.location.search);
      const routeParam = params.get('route');
      if (routeParam) setSelectedRouteId(routeParam);
    } catch {}

    fetchRoutes();
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [fetchRoutes]);

  const startTracking = useCallback(() => {
    setError('');
    setInfo('');
    if (!selectedRouteId) {
      setError('Select a route first.');
      return;
    }
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }
    setIsTracking(true);
    const id = navigator.geolocation.watchPosition(async (position) => {
      const payload = {
        route: selectedRouteId,
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        accuracy_meters: position.coords.accuracy ?? null,
        speed_mps: position.coords.speed ?? null,
        heading_degrees: position.coords.heading ?? null,
      };
      
      console.log('Sending GPS ping payload:', payload);
      console.log('Route ID type:', typeof selectedRouteId, 'Value:', selectedRouteId);
      
      try {
        const response = await api.post('/transactions/route-location-pings/', payload);
        console.log('GPS ping response:', response.data);
        setInfo('Location sent');
        // Optimistically append to path for instant feedback
        setPings((prev) => ([...prev, { ...payload, created_at: new Date().toISOString() }]));
      } catch (e) {
        console.error('GPS ping error:', e);
        console.error('Error response:', e.response?.data);
        setError(e?.response?.data?.detail || e?.response?.data || 'Failed to send location');
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
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 });
    watchIdRef.current = id;
  }, [selectedRouteId]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    setInfo('Tracking stopped');
  }, []);

  const selectedRoute = useMemo(() => (
    routes.find(r => r.id === selectedRouteId)
  ), [routes, selectedRouteId]);

  if (loadingRoutes && routes.length === 0) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Route Live Tracker"
          subtitle="Track and visualize live GPS positions along a route"
        />

        {/* Controls */}
        <div className="bg-white p-4 rounded-md shadow flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="w-full md:w-1/2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Route</label>
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
              <p className="mt-1 text-xs text-gray-500">Salesperson: {selectedRoute.salesperson_name || 'N/A'}</p>
            )}
          </div>

          <div className="flex gap-2">
            {!isTracking ? (
              <button
                onClick={startTracking}
                disabled={!selectedRouteId}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                Start Tracking
              </button>
            ) : (
              <button
                onClick={stopTracking}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Stop Tracking
              </button>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="bg-white rounded-md shadow overflow-hidden">
          <div style={{ height: '70vh', width: '100%' }}>
            <MapContainer center={centerPosition} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {polylinePositions.length > 1 && (
                <Polyline positions={polylinePositions} color="#2563eb" weight={4} opacity={0.8} />
              )}
              {pings.length > 0 && (
                <Marker position={centerPosition}>
                  <Popup>
                    <div className="text-sm">
                      <div><strong>Lat:</strong> {parseFloat(pings[pings.length-1].lat).toFixed(6)}</div>
                      <div><strong>Lon:</strong> {parseFloat(pings[pings.length-1].lon).toFixed(6)}</div>
                      {pings[pings.length-1].created_at && (
                        <div><strong>Time:</strong> {formatTime(pings[pings.length-1].created_at)}</div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </div>
          <div className="p-3 flex items-center gap-2 border-t">
            <div className={`w-2.5 h-2.5 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
            <span className="text-sm text-gray-700">{isTracking ? 'Tracking active' : 'Tracking inactive'}</span>
            {info && <span className="ml-4 text-xs text-gray-500">{info}</span>}
          </div>
        </div>

        {/* Errors */}
        {error && (
          <Toast
            message={error}
            onClose={() => setError('')}
            type="error"
          />
        )}
      </div>
    </div>
  );
};

export default RouteLiveTracker;


