import React from 'react';
import { useJsApiLoader, GoogleMap, Marker, Polyline, Circle, InfoWindow, Autocomplete, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';

const defaultMapContainerStyle = { width: '100%', height: '100%' };

export function GoogleMapsProvider({ children, libraries = ['places'] }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  if (loadError) {
    return <div className="p-3 text-red-600">Failed to load Google Maps</div>;
  }

  if (!isLoaded) {
    return <div className="p-3">Loading map…</div>;
  }

  return children;
}

export { GoogleMap, Marker, Polyline, Circle, InfoWindow, Autocomplete, DirectionsService, DirectionsRenderer, defaultMapContainerStyle };


