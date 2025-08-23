import React, { useState, useEffect } from 'react';
import { FiActivity, FiEye, FiMapPin, FiAlertCircle } from 'react-icons/fi';

const GPSLocationTracker = ({ onLocationUpdate, onError, userRole = '', allowTracking = true }) => {
  const [location, setLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [error, setError] = useState(null);
  const [watchId, setWatchId] = useState(null);

  const isAdmin = userRole === 'admin';
  const canTrack = allowTracking && !isAdmin;

  const startTracking = () => {
    if (!navigator.geolocation) {
      const errorMsg = "Geolocation is not supported by this browser.";
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    if (isAdmin && !canTrack) {
      const errorMsg = "Admin users cannot start GPS tracking. Use monitoring mode instead.";
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setIsTracking(true);
    setError(null);

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp),
          speed: position.coords.speed || null,
          heading: position.coords.heading || null
        };

        setLocation(newLocation);
        onLocationUpdate?.(newLocation);
      },
      (error) => {
        let errorMessage = "Unknown error occurred";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location services.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
          default:
            errorMessage = error.message;
        }

        setError(errorMessage);
        onError?.(errorMessage);
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );

    setWatchId(id);
  };

  const stopTracking = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    
    setIsTracking(false);
    setIsMonitoring(false);
    setLocation(null);
    setError(null);
  };

  const startMonitoring = () => {
    if (!isAdmin) {
      const errorMsg = "Only admin users can use monitoring mode.";
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setIsMonitoring(true);
    setError(null);
    
    // For monitoring, we don't track GPS but can show status
    if (onLocationUpdate) {
      onLocationUpdate({ monitoring: true, timestamp: new Date() });
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      const errorMsg = "Geolocation is not supported by this browser.";
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    if (isAdmin && !canTrack) {
      const errorMsg = "Admin users cannot access GPS directly.";
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp),
          speed: position.coords.speed || null,
          heading: position.coords.heading || null
        };

        setLocation(newLocation);
        onLocationUpdate?.(newLocation);
      },
      (error) => {
        let errorMessage = "Unknown error occurred";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location services.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
          default:
            errorMessage = error.message;
        }

        setError(errorMessage);
        onError?.(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  const isActive = isTracking || isMonitoring;
  const actionLabel = isAdmin ? 'Monitor' : 'Track';
  const statusLabel = isAdmin ? 'Monitoring' : 'Tracking';

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        {isAdmin ? <FiEye className="text-blue-600" /> : <FiActivity className="text-green-600" />}
        GPS {isAdmin ? 'Monitor' : 'Location Tracker'}
        {userRole && (
          <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-2">
            {userRole}
          </span>
        )}
      </h3>
      
      <div className="space-y-4">
        {/* Role-based information */}
        {isAdmin && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-center gap-2">
              <FiAlertCircle className="text-blue-600" />
              <span className="text-blue-800 text-sm font-medium">Admin Mode</span>
            </div>
            <p className="text-blue-700 text-sm mt-1">
              You are in monitoring mode. GPS tracking is handled by salesperson.
            </p>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-2">
          {canTrack && (
            <button
              onClick={getCurrentLocation}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Get Current Location
            </button>
          )}
          
          {!isActive ? (
            <button
              onClick={isAdmin ? startMonitoring : startTracking}
              className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 flex items-center gap-2 ${
                isAdmin 
                  ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' 
                  : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
              }`}
            >
              {isAdmin ? <FiEye /> : <FiActivity />}
              Start {actionLabel}ing
            </button>
          ) : (
            <button
              onClick={stopTracking}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center gap-2"
            >
              <FiActivity />
              Stop {statusLabel}
            </button>
          )}
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            isActive ? (isAdmin ? 'bg-blue-500 animate-pulse' : 'bg-green-500 animate-pulse') : 'bg-gray-300'
          }`}></div>
          <span className="text-sm text-gray-600">
            {isActive 
              ? `${statusLabel} active${isAdmin ? ' (read-only)' : ''}` 
              : `${statusLabel} inactive`
            }
          </span>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Location Display - Only for non-admin or when in monitoring mode with data */}
        {location && !isAdmin && (
          <div className="bg-gray-50 rounded-md p-4">
            <h4 className="font-medium text-gray-900 mb-2">Current Location</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Latitude:</span>
                <span className="font-mono">{location.latitude.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Longitude:</span>
                <span className="font-mono">{location.longitude.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Accuracy:</span>
                <span className="font-mono">{location.accuracy?.toFixed(1)}m</span>
              </div>
              {location.speed && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Speed:</span>
                  <span className="font-mono">{(location.speed * 3.6).toFixed(1)} km/h</span>
                </div>
              )}
              {location.heading && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Heading:</span>
                  <span className="font-mono">{location.heading.toFixed(1)}°</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Timestamp:</span>
                <span className="font-mono">{location.timestamp.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Monitoring Status for Admin */}
        {isAdmin && isMonitoring && (
          <div className="bg-blue-50 rounded-md p-4">
            <h4 className="font-medium text-blue-900 mb-2">Monitoring Status</h4>
            <div className="text-sm text-blue-700">
              <p>✓ Monitoring active - watching for salesperson updates</p>
              <p className="text-xs mt-1">Location data will appear when salesperson starts tracking</p>
            </div>
          </div>
        )}

        {/* Map Link - Only show for actual GPS locations */}
        {location && location.latitude && location.longitude && !isAdmin && (
          <div className="text-center">
            <a
              href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <FiMapPin className="w-4 h-4" />
              View on Map
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default GPSLocationTracker;