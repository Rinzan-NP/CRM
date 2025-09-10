import React, { useState, useEffect } from 'react';
import { DirectionsService, DirectionsRenderer, Polyline } from '@react-google-maps/api';

const RoadRoutePolyline = ({ waypoints, strokeColor = 'blue', strokeOpacity = 0.7, strokeWeight = 3 }) => {
  const [directions, setDirections] = useState(null);
  const [directionsOptions, setDirectionsOptions] = useState(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    if (waypoints && waypoints.length >= 2) {
      // Create directions request
      const origin = waypoints[0];
      const destination = waypoints[waypoints.length - 1];
      const waypointsForDirections = waypoints.slice(1, -1).map(point => ({
        location: new window.google.maps.LatLng(point.lat, point.lng),
        stopover: true
      }));

      setDirectionsOptions({
        origin: new window.google.maps.LatLng(origin.lat, origin.lng),
        destination: new window.google.maps.LatLng(destination.lat, destination.lng),
        waypoints: waypointsForDirections,
        optimizeWaypoints: false,
        travelMode: window.google.maps.TravelMode.DRIVING,
      });
      setUseFallback(false);
    } else {
      setDirections(null);
      setDirectionsOptions(null);
      setUseFallback(false);
    }
  }, [waypoints]);

  const directionsCallback = (response, status) => {
    if (status === 'OK') {
      setDirections(response);
      setUseFallback(false);
    } else {
      console.error('Directions request failed due to ' + status);
      setDirections(null);
      setUseFallback(true);
    }
  };

  // Fallback to straight line polyline
  if (useFallback && waypoints && waypoints.length >= 2) {
    return (
      <Polyline
        path={waypoints}
        options={{ 
          strokeColor: strokeColor, 
          strokeOpacity: strokeOpacity, 
          strokeWeight: strokeWeight 
        }}
      />
    );
  }

  if (!directionsOptions) {
    return null;
  }

  return (
    <>
      <DirectionsService
        options={directionsOptions}
        callback={directionsCallback}
      />
      {directions && (
        <DirectionsRenderer
          options={{
            directions: directions,
            polylineOptions: {
              strokeColor: strokeColor,
              strokeOpacity: strokeOpacity,
              strokeWeight: strokeWeight,
            },
            suppressMarkers: true, // We'll handle markers separately
          }}
        />
      )}
    </>
  );
};

export default RoadRoutePolyline;
