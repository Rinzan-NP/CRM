import React, { useCallback, useState } from 'react';
import GPSLocationTracker from '../components/GPSLocationTracker';
import api from '../services/api';

const RouteLiveTracker = () => {
  const [routeId, setRouteId] = useState('');
  const [visitId, setVisitId] = useState('');
  const [lastPing, setLastPing] = useState(null);
  const [error, setError] = useState(null);

  const sendPing = useCallback(async (loc) => {
    if (!routeId) return;
    try {
      const payload = {
        route: routeId,
        visit: visitId || null,
        lat: loc.latitude,
        lon: loc.longitude,
        accuracy_meters: loc.accuracy || null,
        speed_mps: loc.speed || null,
        heading_degrees: loc.heading || null,
      };
      const res = await api.post('/transactions/route-location-pings/', payload);
      setLastPing(res.data);
    } catch (e) {
      setError(e.message || 'Failed to send ping');
    }
  }, [routeId, visitId]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">Route Live Tracker</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Route ID</label>
              <input
                type="text"
                value={routeId}
                onChange={(e) => setRouteId(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter route UUID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Visit ID (optional)</label>
              <input
                type="text"
                value={visitId}
                onChange={(e) => setVisitId(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter visit UUID"
              />
            </div>
          </div>
        </div>

        <GPSLocationTracker
          onLocationUpdate={sendPing}
          onError={(msg) => setError(msg)}
        />

        {lastPing && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-green-800 text-sm">Last ping saved at {new Date(lastPing.created_at).toLocaleTimeString()}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteLiveTracker;
