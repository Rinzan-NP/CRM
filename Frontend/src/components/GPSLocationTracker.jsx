import React, { useState, useEffect } from 'react';

const GPSLocationTracker = ({ onLocationUpdate, onError }) => {
  const [location, setLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState(null);

  const startTracking = () => {
    if (!navigator.geolocation) {
      const errorMsg = "Geolocation is not supported by this browser.";
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setIsTracking(true);
    setError(null);

    const watchId = navigator.geolocation.watchPosition(
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

    // Store watchId for cleanup
    return watchId;
  };

  const stopTracking = () => {
    setIsTracking(false);
    setLocation(null);
    setError(null);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      const errorMsg = "Geolocation is not supported by this browser.";
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

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">GPS Location Tracker</h3>
      
      <div className="space-y-4">
        {/* Control Buttons */}
        <div className="flex gap-2">
          <button
            onClick={getCurrentLocation}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Get Current Location
          </button>
          
          {!isTracking ? (
            <button
              onClick={startTracking}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Start Tracking
            </button>
          ) : (
            <button
              onClick={stopTracking}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Stop Tracking
            </button>
          )}
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
          <span className="text-sm text-gray-600">
            {isTracking ? 'Tracking active' : 'Tracking inactive'}
          </span>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Location Display */}
        {location && (
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

        {/* Map Link */}
        {location && (
          <div className="text-center">
            <a
              href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View on Map
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default GPSLocationTracker;
