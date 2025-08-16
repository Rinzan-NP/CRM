import React, { useState, useEffect, useRef } from 'react';
import { FiMapPin, FiNavigation, FiGlobe, FiTarget, FiCheckCircle, FiSearch, FiXCircle } from 'react-icons/fi';
import FormField from '../ui/FormField';
import Button from '../ui/Button';
import Toast from '../Common/Toast';
import MapLocationPicker from './MapLocationPicker';
import api from '../../services/api';
import { GoogleMapsProvider, Autocomplete } from '../Common/GoogleMapWrapper';

const CustomerForm = ({ customer, onSubmit, onCancel, mode = 'create' }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    credit_limit: '0.00',
    lat: '',
    lon: '',
    city: '',
    state: '',
    country: '',
    postal_code: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [locationStatus, setLocationStatus] = useState('none'); // none, coordinates, verified
  const [showMapPicker, setShowMapPicker] = useState(false);
  const addressAutocompleteRef = useRef(null);

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        credit_limit: customer.credit_limit || '0.00',
        lat: customer.lat || '',
        lon: customer.lon || '',
        city: customer.city || '',
        state: customer.state || '',
        country: customer.country || '',
        postal_code: customer.postal_code || ''
      });
      
      // Set location status
      if (customer.location_verified) {
        setLocationStatus('verified');
      } else if (customer.lat && customer.lon) {
        setLocationStatus('coordinates');
      } else {
        setLocationStatus('none');
      }
    }
  }, [customer]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const fillAddressFromPlace = (place) => {
    if (!place || !place.geometry || !place.geometry.location) return;
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const components = place.address_components || [];
    const get = (type) => components.find(c => c.types.includes(type))?.long_name || '';
    const city = get('locality') || get('sublocality') || get('administrative_area_level_2');
    const state = get('administrative_area_level_1');
    const country = get('country');
    const postal_code = get('postal_code');
    setFormData(prev => ({
      ...prev,
      address: place.formatted_address || prev.address,
      lat: parseFloat(lat.toFixed(6)),
      lon: parseFloat(lng.toFixed(6)),
      city,
      state,
      country,
      postal_code
    }));
    setLocationStatus('coordinates');
    setInfo('Address selected! Coordinates and details filled from Google Places.');
  };

  const handleGeocodeAddress = async () => {
    if (!formData.address) {
      setError('Please enter an address first');
      return;
    }

    setGeocoding(true);
    setError('');

    try {
      if (mode === 'edit' && customer?.id) {
        // Use the geocoding API endpoint
        const response = await api.post(`/main/customers/${customer.id}/geocode_address/`);
        const updatedCustomer = response.data.customer;

        // Round coordinates to 6 decimal places to match database precision
        const roundedLat = updatedCustomer.lat ? parseFloat(parseFloat(updatedCustomer.lat).toFixed(6)) : '';
        const roundedLon = updatedCustomer.lon ? parseFloat(parseFloat(updatedCustomer.lon).toFixed(6)) : '';

        setFormData(prev => ({
          ...prev,
          lat: roundedLat,
          lon: roundedLon,
          city: updatedCustomer.city || '',
          state: updatedCustomer.state || '',
          country: updatedCustomer.country || '',
          postal_code: updatedCustomer.postal_code || ''
        }));

        setLocationStatus('verified');
        setInfo('Address geocoded successfully! GPS coordinates and address details updated.');
      } else {
        // For new customers, use the address suggestions
        if (formData.lat && formData.lon) {
          setLocationStatus('coordinates');
          setInfo('Address coordinates set! You can now save the customer.');
        } else {
          setError('Please select an address from the suggestions above');
        }
      }
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to geocode address. Please check the address format.');
    } finally {
      setGeocoding(false);
    }
  };

  const handleMapLocationSelect = async (lat, lon) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  try {
    // Try Google Maps Geocoding API first
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${apiKey}`
    );
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const address = data.results[0].formatted_address;
      const addressComponents = data.results[0].address_components;
      const city = addressComponents.find(c => c.types.includes('locality'))?.long_name || '';
      const state = addressComponents.find(c => c.types.includes('administrative_area_level_1'))?.long_name || '';
      const country = addressComponents.find(c => c.types.includes('country'))?.long_name || '';
      const postalCode = addressComponents.find(c => c.types.includes('postal_code'))?.long_name || '';

      setFormData(prev => ({
        ...prev,
        address,
        city,
        state,
        country,
        postal_code: postalCode,
        lat: parseFloat(lat.toFixed(6)),
        lon: parseFloat(lon.toFixed(6))
      }));
      setLocationStatus('coordinates');
      setShowMapPicker(false);
      setInfo('Location selected from map! Address details automatically filled.');
      return;
    }
  } catch (error) {
    console.error('Google Maps API fetch error:', error);
  }

  // Fallback to Nominatim if Google Maps API fails
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`
    );
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    if (data.display_name) {
      const address = data.display_name;
      const city = data.address.city || '';
      const state = data.address.state || '';
      const country = data.address.country || '';
      const postalCode = data.address.postalcode || '';

      setFormData(prev => ({
        ...prev,
        address,
        city,
        state,
        country,
        postal_code: postalCode,
        lat: parseFloat(lat.toFixed(6)),
        lon: parseFloat(lon.toFixed(6))
      }));
      setLocationStatus('coordinates');
      setShowMapPicker(false);
      setInfo('Location selected from map! Address details automatically filled.');
    } else {
      throw new Error('No address found for the given coordinates');
    }
  } catch (error) {
    console.error('Nominatim API fetch error:', error);
    setInfo('Location selected from map! You may need to manually enter address details.');
  }
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submitData = { ...formData };

      // Convert numeric fields
      if (submitData.credit_limit) {
        submitData.credit_limit = parseFloat(submitData.credit_limit);
      }

      // Handle coordinates - ensure they are valid numbers or null
      if (submitData.lat && submitData.lon) {
        const lat = parseFloat(submitData.lat);
        const lon = parseFloat(submitData.lon);

        // Validate coordinate ranges
        if (isNaN(lat) || isNaN(lon)) {
          throw new Error('Invalid coordinates provided');
        }

        if (lat < -90 || lat > 90) {
          throw new Error('Latitude must be between -90 and 90');
        }

        if (lon < -180 || lon > 180) {
          throw new Error('Longitude must be between -180 and 180');
        }

        // Round coordinates to 6 decimal places to match database precision
        submitData.lat = parseFloat(lat.toFixed(6));
        submitData.lon = parseFloat(lon.toFixed(6));
      } else {
        // If no coordinates, set them to null
        submitData.lat = null;
        submitData.lon = null;
      }

      // Remove empty string fields that might cause validation issues
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '') {
          submitData[key] = null;
        }
      });

      await onSubmit(submitData);
    } catch (err) {
      setError(err?.message || err?.response?.data?.detail || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  const getLocationStatusIcon = () => {
    switch (locationStatus) {
      case 'verified':
        return <FiCheckCircle className="h-5 w-5 text-green-500" />;
      case 'coordinates':
        return <FiTarget className="h-5 w-5 text-blue-500" />;
      default:
        return <FiMapPin className="h-5 w-5 text-gray-400" />;
    }
  };

  const getLocationStatusText = () => {
    switch (locationStatus) {
      case 'verified':
        return 'Location Verified';
      case 'coordinates':
        return 'Coordinates Set';
      default:
        return 'No Location Data';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Name" required>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </FormField>

          <FormField label="Email" required>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </FormField>

          <FormField label="Phone">
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </FormField>

          <FormField label="Credit Limit">
            <input
              type="number"
              name="credit_limit"
              value={formData.credit_limit}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </FormField>
        </div>
      </div>

      {/* Location Information */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Location Information</h3>
          <div className="flex items-center gap-2">
            {getLocationStatusIcon()}
            <span className={`text-sm font-medium ${
              locationStatus === 'verified' ? 'text-green-600' :
              locationStatus === 'coordinates' ? 'text-blue-600' : 'text-gray-500'
            }`}>
              {getLocationStatusText()}
            </span>
          </div>
        </div>

        {/* Address Field with Google Places Autocomplete */}
        <div className="mb-4">
          <FormField label="Address">
            <GoogleMapsProvider>
              <Autocomplete
                onLoad={(ac) => (addressAutocompleteRef.current = ac)}
                onPlaceChanged={() => fillAddressFromPlace(addressAutocompleteRef.current?.getPlace())}
              >
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Start typing address (Google Places)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </Autocomplete>
            </GoogleMapsProvider>
          </FormField>
        </div>

        {/* Location Selection Buttons */}
        {/* <div className="mb-4 flex gap-3">
          <Button
            type="button"
            onClick={() => setShowMapPicker(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2"
          >
            <FiMapPin />
            Pick Location on Map
          </Button>

          <Button
            type="button"
            onClick={handleGeocodeAddress}
            disabled={geocoding || !formData.address}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <FiNavigation />
            {geocoding ? 'Processing...' : '📍 Get Coordinates'}
          </Button>
        </div> */}

        {/* GPS Coordinates Display (Read-only) */}
        {(formData.lat && formData.lon) && (
          <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <FiTarget className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">GPS Coordinates Set</span>
            </div>
            <div className="text-sm text-green-700">
              {formData.lat && <div>Latitude: {formData.lat}</div>}
              {formData.lon && <div>Longitude: {formData.lon}</div>}
              {formData.city && <div>City: {formData.city}</div>}
              {formData.state && <div>State: {formData.state}</div>}
              {formData.country && <div>Country: {formData.country}</div>}
              {formData.postal_code && <div>Postal Code: {formData.postal_code}</div>}
            </div>
          </div>
        )}

        {/* Address Components (Auto-filled from selection) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="City">
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              placeholder="City"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </FormField>

          <FormField label="State/Province">
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleInputChange}
              placeholder="State or Province"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </FormField>

          <FormField label="Country">
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              placeholder="Country"
              maxLength="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </FormField>

          <FormField label="Postal Code">
            <input
              type="text"
              name="postal_code"
              value={formData.postal_code}
              onChange={handleInputChange}
              placeholder="Postal Code"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </FormField>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          onClick={onCancel}
          variant="secondary"
          className="px-6 py-2"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : mode === 'create' ? 'Create Customer' : 'Update Customer'}
        </Button>
      </div>

      {/* Map Picker Modal */}
      {showMapPicker && (
        <MapLocationPicker
          onLocationSelect={handleMapLocationSelect}
          onClose={() => setShowMapPicker(false)}
          currentLocation={formData.lat && formData.lon ? [formData.lat, formData.lon] : null}
        />
      )}

      {/* Status Messages */}
      {error && (
        <Toast type="error" message={error} onClose={() => setError('')} />
      )}
      {info && (
        <Toast type="success" message={info} onClose={() => setInfo('')} />
      )}
    </form>
  );
};

export default CustomerForm;