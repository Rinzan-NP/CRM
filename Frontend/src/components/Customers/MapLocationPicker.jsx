import React, { useRef, useState } from 'react';
import { FiMapPin, FiTarget, FiXCircle } from 'react-icons/fi';
import { GoogleMapsProvider, GoogleMap, Marker, Autocomplete, defaultMapContainerStyle } from '../Common/GoogleMapWrapper';

const MapLocationPicker = ({ onLocationSelect, onClose, currentLocation }) => {
  const normalizeLatLng = (value) => {
    if (!value) return null;
    if (Array.isArray(value) && value.length === 2) {
      const lat = parseFloat(value[0]);
      const lng = parseFloat(value[1]);
      return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
    }
    if (typeof value === 'object') {
      const lat = parseFloat(value.lat);
      const lng = parseFloat(value.lng ?? value.lon);
      return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
    }
    return null;
  };

  const normalized = normalizeLatLng(currentLocation);
  const initialCenter = normalized || { lat: 25.2048, lng: 55.2708 };
  const [selectedLocation, setSelectedLocation] = useState(normalized);
  const [center, setCenter] = useState(initialCenter);
  const [zoom, setZoom] = useState(12);
  const autocompleteRef = useRef(null);

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      const lat = parseFloat(selectedLocation.lat.toFixed(6));
      const lon = parseFloat(selectedLocation.lng.toFixed(6));
      onLocationSelect(lat, lon);
    }
  };

  const handleSearchLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newCenter = { lat: latitude, lng: longitude };
          setCenter(newCenter);
          setZoom(15);
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
        <div className="h-96 w-full rounded-lg overflow-hidden border mb-4 relative">
          <GoogleMapsProvider>
            <div className="absolute top-3 left-3 z-[1000] w-72">
              <Autocomplete
                onLoad={(ac) => (autocompleteRef.current = ac)}
                onPlaceChanged={() => {
                  const place = autocompleteRef.current?.getPlace();
                  if (!place || !place.geometry || !place.geometry.location) return;
                  const lat = place.geometry.location.lat();
                  const lng = place.geometry.location.lng();
                  const loc = { lat, lng };
                  setCenter(loc);
                  setZoom(15);
                  setSelectedLocation(loc);
                }}
              >
                <input
                  type="text"
                  placeholder="Search places..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none bg-white"
                />
              </Autocomplete>
            </div>
            <GoogleMap
              center={center}
              zoom={zoom}
              mapContainerStyle={defaultMapContainerStyle}
              options={{ streetViewControl: false, mapTypeControl: false }}
              onClick={(e) => {
                const loc = { lat: e.latLng.lat(), lng: e.latLng.lng() };
                setSelectedLocation(loc);
              }}
            >
              {selectedLocation && (
                <Marker position={selectedLocation} />
              )}
            </GoogleMap>
          </GoogleMapsProvider>
        </div>

        {/* Selected Location Display */}
        {/* {selectedLocation && (
          // <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
          //   <div className="flex items-center gap-2 mb-3">
          //     <FiTarget className="h-5 w-5 text-green-600" />
          //     <span className="text-lg font-medium text-green-800">Selected Location</span>
          //   </div>
            
          //   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          //     <div>
          //       <span className="font-medium text-green-700">Latitude:</span>
          //       <span className="ml-2 text-green-600 font-mono">{selectedLocation.lat.toFixed(6)}</span>
          //     </div>
          //     <div>
          //       <span className="font-medium text-green-700">Longitude:</span>
          //       <span className="ml-2 text-green-600 font-mono">{selectedLocation.lng.toFixed(6)}</span>
          //     </div>
          //   </div>
            
          //   <div className="mt-3 p-2 bg-white rounded border border-green-200">
          //     <span className="text-xs text-green-600">
          //       Coordinates will be automatically used to populate address fields
          //     </span>
          //   </div>
          // </div>
        )} */}

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
