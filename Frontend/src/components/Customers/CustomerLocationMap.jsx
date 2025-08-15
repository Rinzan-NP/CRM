import React, { useState, useEffect } from 'react';
import { FiMapPin, FiNavigation, FiTarget, FiUsers, FiSearch } from 'react-icons/fi';
import api from '../../services/api';
import { GoogleMapsProvider, GoogleMap, Marker, Circle, InfoWindow, Autocomplete, defaultMapContainerStyle } from '../Common/GoogleMapWrapper';

// Map controls component
const MapControls = ({ onFindNearby, onShowAll, currentLocation }) => {
  const [searchRadius, setSearchRadius] = useState(10);
  const [searching, setSearching] = useState(false);

  const handleFindNearby = async () => {
    if (!currentLocation) {
      alert('Please set your current location first');
      return;
    }

    setSearching(true);
    try {
      await onFindNearby(currentLocation.lat, currentLocation.lon, searchRadius);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="absolute top-4 left-4 z-10 bg-white p-4 rounded-lg shadow-lg border">
      <h3 className="text-lg font-semibold mb-3">Location Tools</h3>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Radius (km)
          </label>
          <input
            type="number"
            value={searchRadius}
            onChange={(e) => setSearchRadius(parseFloat(e.target.value))}
            min="1"
            max="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={handleFindNearby}
          disabled={!currentLocation || searching}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <FiSearch />
          {searching ? 'Searching...' : 'Find Nearby Customers'}
        </button>

        <button
          onClick={onShowAll}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center gap-2"
        >
          <FiUsers />
          Show All Customers
        </button>
      </div>

      {currentLocation && (
        <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
          <div className="font-medium text-blue-800">Current Location:</div>
          <div className="text-blue-600">
            {currentLocation.lat.toFixed(6)}, {currentLocation.lon.toFixed(6)}
          </div>
        </div>
      )}
    </div>
  );
};

const CustomerLocationMap = ({ onCustomerSelect, selectedCustomerId }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([25.2048, 55.2708]); // Default to Dubai
  const [mapZoom, setMapZoom] = useState(10);
  const [showNearbyOnly, setShowNearbyOnly] = useState(false);
  const [activeCustomer, setActiveCustomer] = useState(null);

  // Fetch customers with coordinates
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/main/customers/with_coordinates/');
      setCustomers(response.data.customers);
      
      // Center map on customers if available
      if (response.data.customers.length > 0) {
        const lats = response.data.customers.map(c => parseFloat(c.lat));
        const lons = response.data.customers.map(c => parseFloat(c.lon));
        const center = [
          (Math.min(...lats) + Math.max(...lats)) / 2,
          (Math.min(...lons) + Math.max(...lons)) / 2
        ];
        setMapCenter(center);
        setMapZoom(11);
      }
    } catch (err) {
      setError('Failed to fetch customers with coordinates');
    } finally {
      setLoading(false);
    }
  };

  // Find nearby customers
  const findNearbyCustomers = async (lat, lon, radius) => {
    try {
      const response = await api.get(`/main/customers/nearby/?lat=${lat}&lon=${lon}&radius=${radius}`);
      setCustomers(response.data.customers);
      setShowNearbyOnly(true);
      setMapCenter([lat, lon]);
      setMapZoom(12);
    } catch (err) {
      setError('Failed to find nearby customers');
    }
  };

  // Show all customers
  const showAllCustomers = () => {
    fetchCustomers();
    setShowNearbyOnly(false);
  };

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lon: longitude });
          setMapCenter([latitude, longitude]);
          setMapZoom(12);
        },
        (error) => {
          console.error('Location error:', error);
          setError('Failed to get current location');
        }
      );
    } else {
      setError('Geolocation is not supported by this browser');
    }
  };

  useEffect(() => {
    fetchCustomers();
    getCurrentLocation();
  }, []);

  if (loading) {
    return (
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading customer locations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-96 bg-red-50 rounded-lg flex items-center justify-center">
        <div className="text-center text-red-600">
          <FiMapPin className="h-12 w-12 mx-auto mb-4" />
          <p className="text-lg font-medium">Error Loading Map</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchCustomers}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="h-96 w-full rounded-lg overflow-hidden border">
        <GoogleMapsProvider>
          <div className="absolute top-3 left-3 z-[1000] w-72">
            <Autocomplete
              onLoad={(ac) => { window.__customerMapAC = ac; }}
              onPlaceChanged={() => {
                const place = window.__customerMapAC?.getPlace();
                if (!place || !place.geometry || !place.geometry.location) return;
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                setMapCenter([lat, lng]);
                setMapZoom(13);
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
            center={{
              lat: Number.isFinite(parseFloat(mapCenter[0])) ? parseFloat(mapCenter[0]) : 25.2048,
              lng: Number.isFinite(parseFloat(mapCenter[1])) ? parseFloat(mapCenter[1]) : 55.2708,
            }}
            zoom={mapZoom}
            mapContainerStyle={defaultMapContainerStyle}
            options={{ streetViewControl: false }}
          >
            {currentLocation && Number.isFinite(parseFloat(currentLocation.lat)) && Number.isFinite(parseFloat(currentLocation.lon)) && (
              <Circle
                center={{ lat: parseFloat(currentLocation.lat), lng: parseFloat(currentLocation.lon) }}
                radius={100}
                options={{ strokeColor: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3 }}
              />
            )}

            {customers.map((customer) => (
              <Marker
                key={customer.id}
                position={{ lat: parseFloat(customer.lat), lng: parseFloat(customer.lon) }}
                onClick={() => setActiveCustomer(customer)}
              />
            ))}

            {activeCustomer && (
              <InfoWindow
                position={{ lat: parseFloat(activeCustomer.lat), lng: parseFloat(activeCustomer.lon) }}
                onCloseClick={() => setActiveCustomer(null)}
              >
                <div className="text-center min-w-[200px]">
                  <h3 className="font-semibold text-gray-900 mb-2">{activeCustomer.name}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>{activeCustomer.email}</p>
                    {activeCustomer.phone && <p>{activeCustomer.phone}</p>}
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="font-medium text-gray-700">Location:</p>
                      <p>{activeCustomer.location_display}</p>
                      {activeCustomer.distance_km && (
                        <p className="text-blue-600 font-medium">{activeCustomer.distance_km} km away</p>
                      )}
                    </div>
                  </div>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </GoogleMapsProvider>
      </div>

      {/* Map Controls */}
      <MapControls
        onFindNearby={findNearbyCustomers}
        onShowAll={showAllCustomers}
        currentLocation={currentLocation}
      />

      {/* Status Bar */}
      <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <FiUsers />
            {customers.length} customers with locations
          </span>
          {showNearbyOnly && (
            <span className="text-blue-600 font-medium">
              Showing nearby customers only
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            Verified
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            Coordinates Set
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            Your Location
          </span>
        </div>
      </div>
    </div>
  );
};

export default CustomerLocationMap;
