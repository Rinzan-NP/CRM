import React, { useState, useEffect, useRef } from 'react';
import { FiMapPin, FiEdit3, FiCheckCircle } from 'react-icons/fi';
import FormField from '../ui/FormField';
import Button from '../ui/Button';
import Toast from '../Common/Toast';
import MapLocationPicker from './MapLocationPicker';
import { GoogleMapsProvider, Autocomplete } from '../Common/GoogleMapWrapper';

const CustomerForm = ({ customer, onSubmit, onCancel, mode = 'create' }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    credit_expire_days: '30',
    lat: '',
    lon: '',
    city: '',
    state: '',
    country: '',
    postal_code: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [addressInputMode, setAddressInputMode] = useState('form'); // 'form' or 'map'
  const [addressMethod, setAddressMethod] = useState(''); // tracks which method was used to set address
  const addressAutocompleteRef = useRef(null);

  useEffect(() => {
    if (customer) {
      console.log('Edit mode: Populating form with existing customer data:', customer);
      const initialFormData = {
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        credit_expire_days: customer.credit_expire_days || '30',
        lat: customer.lat || '',
        lon: customer.lon || '',
        city: customer.city || '',
        state: customer.state || '',
        country: customer.country || '',
        postal_code: customer.postal_code || ''
      };
      console.log('Edit mode: Setting initial form data:', initialFormData);
      setFormData(initialFormData);
    }
  }, [customer]);

  // Debug address input mode changes
  useEffect(() => {
    console.log('Address input mode changed to:', addressInputMode);
  }, [addressInputMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Edit mode: Form field changed - ${name}: ${value}`);
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      console.log('Edit mode: Updated form data:', newData);
      return newData;
    });
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
    setAddressMethod('form');
    setInfo('Address selected! Coordinates and details filled from Google Places.');
  };

  const handleMapLocationSelect = async (lat, lon) => {
    console.log('handleMapLocationSelect called with:', { lat, lon });
    console.log('Current form data before update:', formData);
    console.log('Current address input mode:', addressInputMode);
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    console.log('Google Maps API Key available:', !!apiKey);

    try {
      // Try Google Maps Geocoding API first
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${apiKey}`
      );
      console.log('Google Maps API response status:', response.status);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      console.log('Google Maps API response data:', data);
      if (data.results && data.results.length > 0) {
        const address = data.results[0].formatted_address;
        const addressComponents = data.results[0].address_components;
        const city = addressComponents.find(c => c.types.includes('locality'))?.long_name || '';
        const state = addressComponents.find(c => c.types.includes('administrative_area_level_1'))?.long_name || '';
        const country = addressComponents.find(c => c.types.includes('country'))?.long_name || '';
        const postalCode = addressComponents.find(c => c.types.includes('postal_code'))?.long_name || '';

        const newFormData = {
          address,
          city,
          state,
          country,
          postal_code: postalCode,
          lat: parseFloat(lat.toFixed(6)),
          lon: parseFloat(lon.toFixed(6))
        };
        console.log('Updating form data with Google Maps data:', newFormData);
        setFormData(prev => ({
          ...prev,
          ...newFormData
        }));
        setAddressMethod('map');
        setAddressInputMode('form');
        console.log('Switching to form mode after Google Maps selection');
        setInfo('Location selected from map! Address details automatically filled.');
        return;
      }
    } catch (error) {
      console.error('Google Maps API fetch error:', error);
    }

    // Fallback to Nominatim if Google Maps API fails
    console.log('Trying Nominatim API as fallback...');
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`
      );
      console.log('Nominatim API response status:', response.status);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      console.log('Nominatim API response data:', data);
      if (data.display_name) {
        const address = data.display_name;
        const city = data.address.city || '';
        const state = data.address.state || '';
        const country = data.address.country || '';
        const postalCode = data.address.postcode || '';

        const newFormData = {
          address,
          city,
          state,
          country,
          postal_code: postalCode,
          lat: parseFloat(lat.toFixed(6)),
          lon: parseFloat(lon.toFixed(6))
        };
        console.log('Updating form data with Nominatim data:', newFormData);
        setFormData(prev => ({
          ...prev,
          ...newFormData
        }));
        setAddressMethod('map');
        setAddressInputMode('form');
        console.log('Switching to form mode after Nominatim selection');
        setInfo('Location selected from map! Address details automatically filled.');
      } else {
        throw new Error('No address found for the given coordinates');
      }
    } catch (error) {
      console.error('Nominatim API fetch error:', error);
      const fallbackData = {
        lat: parseFloat(lat.toFixed(6)),
        lon: parseFloat(lon.toFixed(6))
      };
      console.log('Setting fallback form data (coordinates only):', fallbackData);
      setFormData(prev => ({
        ...prev,
        ...fallbackData
      }));
      setAddressMethod('map');
      setAddressInputMode('form');
      console.log('Switching to form mode after fallback selection');
      setInfo('Location selected from map! You may need to manually enter address details.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log(`${mode} mode: Submitting form with data:`, formData);
      const submitData = { ...formData };

      // Convert numeric fields
      if (submitData.credit_expire_days) {
        submitData.credit_expire_days = parseInt(submitData.credit_expire_days);
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

      console.log(`${mode} mode: Final processed data being submitted:`, submitData);
      await onSubmit(submitData);
    } catch (err) {
      setError(err?.message || err?.response?.data?.detail || 'Failed to save customer');
    } finally {
      setLoading(false);
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

          <FormField label="Credit Expire Days">
            <input
              type="number"
              name="credit_expire_days"
              value={formData.credit_expire_days}
              onChange={handleInputChange}
              step="1"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </FormField>
        </div>
      </div>

      {/* Location Information */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        {/* Toggle Buttons */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Location Information</h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAddressInputMode('form')}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                addressInputMode === 'form'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FiEdit3 className="h-4 w-4" />
              Enter Manually
            </button>
            <button
              type="button"
              onClick={() => setAddressInputMode('map')}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                addressInputMode === 'map'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FiMapPin className="h-4 w-4" />
              Pick from Map
            </button>
          </div>
        </div>

        {/* Form Mode */}
        {addressInputMode === 'form' && (
          <div className="space-y-4">
            {/* Status Badge */}
            {addressMethod && formData.lat && formData.lon && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-md">
                <FiCheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {addressMethod === 'form' ? 'Address set via form' : 'Address set via map'}
                </span>
              </div>
            )}

            {/* Address Field with Google Places Autocomplete */}
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
                    placeholder="Start typing address (Google Places will suggest)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </Autocomplete>
              </GoogleMapsProvider>
            </FormField>

            {/* Address Components Grid */}
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

            {/* Display coordinates if set */}
            {formData.lat && formData.lon && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-sm space-y-1">
                  <div className="font-medium text-gray-700">GPS Coordinates:</div>
                  <div className="text-gray-600">
                    <span className="font-mono">Lat: {formData.lat}</span>
                    {', '}
                    <span className="font-mono">Lon: {formData.lon}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Map Mode */}
        {addressInputMode === 'map' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Click on the map below to select a precise location. The address details will be automatically filled.
            </p>
            
            <MapLocationPicker
              onLocationSelect={handleMapLocationSelect}
              onClose={() => setAddressInputMode('form')}
              currentLocation={formData.lat && formData.lon ? [formData.lat, formData.lon] : null}
              inline={true}
            />
          </div>
        )}
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