import React, { useState, useEffect } from 'react';
import { FiMapPin, FiNavigation, FiTarget, FiUsers, FiSearch, FiSettings, FiX, FiMenu, FiEye, FiFilter } from 'react-icons/fi';
import api from '../../services/api';
import { GoogleMapsProvider, GoogleMap, Marker, Circle, InfoWindow, Autocomplete, defaultMapContainerStyle } from '../Common/GoogleMapWrapper';

// Mobile-optimized map controls component
const MapControls = ({ onFindNearby, onShowAll, currentLocation, isOpen, onToggle }) => {
  const [searchRadius, setSearchRadius] = useState(10);
  const [searching, setSearching] = useState(false);

  const handleFindNearby = async () => {
    if (!currentLocation) {
      alert('Please enable location first');
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
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={onToggle}
        className="fixed top-20 right-4 z-50 md:hidden bg-white shadow-lg rounded-full p-3 border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        {isOpen ? <FiX className="h-5 w-5 text-gray-700" /> : <FiSettings className="h-5 w-5 text-gray-700" />}
      </button>

      {/* Controls Panel */}
      <div className={`
        fixed md:absolute top-4 left-4 z-40 
        w-full md:w-80 max-w-sm
        transform transition-all duration-300 ease-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl p-6 m-4 md:m-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <FiMapPin className="h-5 w-5 text-white" />
              </div>
              Location Tools
            </h3>
          </div>
          
          {/* Current Location Status */}
          {/* {currentLocation && (
            <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <FiTarget className="h-4 w-4 text-emerald-600" />
                <span className="font-semibold text-emerald-800">Your Location</span>
              </div>
              <div className="text-sm text-emerald-700 font-mono">
                {currentLocation.lat.toFixed(4)}, {currentLocation.lon.toFixed(4)}
              </div>
            </div>
          )} */}

          {/* Search Controls */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search Radius
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(parseFloat(e.target.value))}
                  min="1"
                  max="100"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                />
                <span className="absolute right-4 top-3.5 text-sm text-gray-500">km</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleFindNearby}
                disabled={!currentLocation || searching}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <FiSearch className="h-5 w-5" />
                {searching ? 'Searching...' : 'Find Nearby'}
              </button>

              <button
                onClick={onShowAll}
                className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 flex items-center justify-center gap-3 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <FiEye className="h-5 w-5" />
                Show All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden" 
          onClick={onToggle}
        />
      )}
    </>
  );
};

const CustomerLocationMap = ({ onCustomerSelect, selectedCustomerId }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([25.2048, 55.2708]);
  const [mapZoom, setMapZoom] = useState(10);
  const [showNearbyOnly, setShowNearbyOnly] = useState(false);
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [controlsOpen, setControlsOpen] = useState(false);

  // Fetch customers with coordinates
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/main/customers/with_coordinates/');
      setCustomers(response.data.customers);
      
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

  const findNearbyCustomers = async (lat, lon, radius) => {
    try {
      const response = await api.get(`/main/customers/nearby/?lat=${lat}&lon=${lon}&radius=${radius}`);
      setCustomers(response.data.customers);
      setShowNearbyOnly(true);
      setMapCenter([lat, lon]);
      setMapZoom(12);
      setControlsOpen(false); // Close controls on mobile after search
    } catch (err) {
      setError('Failed to find nearby customers');
    }
  };

  const showAllCustomers = () => {
    fetchCustomers();
    setShowNearbyOnly(false);
    setControlsOpen(false); // Close controls on mobile
  };

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
      <div className="h-[50vh] md:h-96 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl flex items-center justify-center border border-blue-200">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <FiMapPin className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-gray-700 font-medium text-lg">Loading locations...</p>
          <p className="text-gray-500 text-sm mt-1">Please wait while we fetch customer data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[50vh] md:h-96 bg-gradient-to-br from-red-50 to-rose-100 rounded-2xl flex items-center justify-center border border-red-200">
        <div className="text-center p-6">
          <div className="p-4 bg-red-100 rounded-full w-fit mx-auto mb-4">
            <FiMapPin className="h-8 w-8 text-red-600" />
          </div>
          <p className="text-xl font-semibold text-red-800 mb-2">Unable to Load Map</p>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchCustomers}
            className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold transition-colors shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar - Outside Map */}
      <div className="w-full">
        <GoogleMapsProvider>
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
              className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm md:text-base"
            />
          </Autocomplete>
        </GoogleMapsProvider>
      </div>

      {/* Map Container */}
      <div className="relative">
        <div className="h-[50vh] md:h-96 w-full rounded-2xl overflow-hidden border border-gray-200 shadow-xl relative">
          <GoogleMapsProvider>

          <GoogleMap
            center={{
              lat: Number.isFinite(parseFloat(mapCenter[0])) ? parseFloat(mapCenter[0]) : 25.2048,
              lng: Number.isFinite(parseFloat(mapCenter[1])) ? parseFloat(mapCenter[1]) : 55.2708,
            }}
            zoom={mapZoom}
            mapContainerStyle={defaultMapContainerStyle}
            options={{ 
              streetViewControl: false,
              fullscreenControl: false,
              mapTypeControl: false,
              styles: [
                {
                  featureType: 'poi',
                  elementType: 'labels',
                  stylers: [{ visibility: 'off' }]
                }
              ]
            }}
          >
            {/* Current Location Circle */}
            {currentLocation && Number.isFinite(parseFloat(currentLocation.lat)) && Number.isFinite(parseFloat(currentLocation.lon)) && (
              <>
                <Circle
                  center={{ lat: parseFloat(currentLocation.lat), lng: parseFloat(currentLocation.lon) }}
                  radius={100}
                  options={{ 
                    strokeColor: '#3B82F6', 
                    fillColor: '#3B82F6', 
                    fillOpacity: 0.2,
                    strokeWeight: 2
                  }}
                />
                <Marker
                  position={{ lat: parseFloat(currentLocation.lat), lng: parseFloat(currentLocation.lon) }}
                  icon={{
                    path: window.google?.maps?.SymbolPath?.CIRCLE,
                    fillColor: '#3B82F6',
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 3,
                    scale: 8
                  }}
                />
              </>
            )}

            {/* Customer Markers */}
            {customers.map((customer) => (
              <Marker
                key={customer.id}
                position={{ lat: parseFloat(customer.lat), lng: parseFloat(customer.lon) }}
                onClick={() => setActiveCustomer(customer)}
                icon={{
                  path: window.google?.maps?.SymbolPath?.CIRCLE,
                  fillColor: selectedCustomerId === customer.id ? '#10B981' : '#EF4444',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 2,
                  scale: 6
                }}
              />
            ))}

            {/* Info Window */}
            {activeCustomer && (
              <InfoWindow
                position={{ lat: parseFloat(activeCustomer.lat), lng: parseFloat(activeCustomer.lon) }}
                onCloseClick={() => setActiveCustomer(null)}
              >
                <div className="p-2 min-w-[250px] max-w-[300px]">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-gray-900 text-lg leading-tight pr-2">{activeCustomer.name}</h3>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    {activeCustomer.email && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Email:</span>
                        <span className="text-gray-700">{activeCustomer.email}</span>
                      </div>
                    )}
                    {activeCustomer.phone && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Phone:</span>
                        <span className="text-gray-700">{activeCustomer.phone}</span>
                      </div>
                    )}
                  </div>

                  {activeCustomer.location_display && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-start gap-2">
                        <FiMapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{activeCustomer.location_display}</span>
                      </div>
                      {activeCustomer.distance_km && (
                        <div className="mt-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-semibold text-center">
                          {activeCustomer.distance_km} km away
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
          </GoogleMapsProvider>

          {/* Map Controls */}
          <MapControls
            onFindNearby={findNearbyCustomers}
            onShowAll={showAllCustomers}
            currentLocation={currentLocation}
            isOpen={controlsOpen}
            onToggle={() => setControlsOpen(!controlsOpen)}
          />
        </div>

      {/* Status Bar - Mobile Optimized */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            {/* <div className="flex items-center gap-2 text-gray-700">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <FiUsers className="h-4 w-4 text-blue-600" />
              </div>
              <span className="font-semibold">{customers.length}</span>
              <span className="text-gray-600">customers with locations</span>
            </div> */}
            
            {showNearbyOnly && (
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 rounded-lg">
                  <FiFilter className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="text-emerald-700 font-medium text-sm">Showing nearby only</span>
              </div>
            )}
          </div>

          {currentLocation && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="p-1.5 bg-green-100 rounded-lg">
                <FiTarget className="h-3 w-3 text-green-600" />
              </div>
              <span>Location enabled</span>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
};

export default CustomerLocationMap;