import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import { FiMapPin, FiTarget, FiXCircle } from 'react-icons/fi';
import 'leaflet/dist/leaflet.css';

// Custom marker icon
const createMarkerIcon = () => {
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="12" fill="#EF4444" stroke="white" stroke-width="3"/>
        <circle cx="16" cy="16" r="4" fill="white"/>
      </svg>
    `)}`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

// Map click handler component
const MapClickHandler = ({ onLocationSelect, selectedLocation }) => {
  const map = useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelect([lat, lng]);
    },
  });

  return null;
};

// Map center component
const MapCenter = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center && center.length === 2) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  
  return null;
};

const MapLocationPicker = ({ onLocationSelect, onClose, currentLocation }) => {
  const [selectedLocation, setSelectedLocation] = useState(currentLocation);
  const [mapCenter, setMapCenter] = useState(currentLocation || [25.2048, 55.2708]);
  const [mapZoom, setMapZoom] = useState(12);

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
  };

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      // Round coordinates to 6 decimal places to match database precision
      const lat = parseFloat(selectedLocation[0].toFixed(6));
      const lon = parseFloat(selectedLocation[1].toFixed(6));
      onLocationSelect(lat, lon);
    }
  };

  const handleSearchLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newCenter = [latitude, longitude];
          setMapCenter(newCenter);
          setMapZoom(15);
          setSelectedLocation(newCenter);
        },
        (error) => {
          console.error('Location error:', error);
        }
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-5xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Pick Location on Map</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FiXCircle className="h-6 w-6" />
          </button>
        </div>
        
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            Click anywhere on the map to select a location. The selected coordinates will be used for the customer's address.
          </p>
        </div>

        {/* Map Controls */}
        <div className="mb-4 flex gap-3">
          <button
            onClick={handleSearchLocation}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
          >
            <FiTarget />
            Use My Location
          </button>
          
          <button
            onClick={() => {
              setMapCenter([25.2048, 55.2708]); // Dubai
              setMapZoom(10);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <FiMapPin />
            Center on Dubai
          </button>
        </div>

        {/* Map Container */}
        <div className="h-96 w-full rounded-lg overflow-hidden border mb-4">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            className="h-full w-full"
            style={{ height: '100%', width: '100%' }}
          >
            <MapCenter center={mapCenter} zoom={mapZoom} />
            <MapClickHandler onLocationSelect={handleLocationSelect} selectedLocation={selectedLocation} />
            
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {/* Selected location marker */}
            {selectedLocation && (
              <Marker
                position={selectedLocation}
                icon={createMarkerIcon()}
              />
            )}
          </MapContainer>
        </div>

        {/* Selected Location Display */}
        {selectedLocation && (
          <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-3">
              <FiTarget className="h-5 w-5 text-green-600" />
              <span className="text-lg font-medium text-green-800">Selected Location</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-green-700">Latitude:</span>
                <span className="ml-2 text-green-600 font-mono">{selectedLocation[0].toFixed(6)}</span>
              </div>
              <div>
                <span className="font-medium text-green-700">Longitude:</span>
                <span className="ml-2 text-green-600 font-mono">{selectedLocation[1].toFixed(6)}</span>
              </div>
            </div>
            
            <div className="mt-3 p-2 bg-white rounded border border-green-200">
              <span className="text-xs text-green-600">
                Coordinates will be automatically used to populate address fields
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmLocation}
            disabled={!selectedLocation}
            className={`px-6 py-2 rounded-md flex items-center gap-2 ${
              selectedLocation
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <FiTarget />
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapLocationPicker;
