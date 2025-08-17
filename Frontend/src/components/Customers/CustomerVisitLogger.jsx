import React, { useState, useEffect, useRef } from 'react';
import { FiMapPin, FiClock, FiFileText, FiShoppingCart, FiCheckCircle, FiXCircle, FiPlus, FiX, FiNavigation } from 'react-icons/fi';
import api from '../../services/api';
import Toast from '../Common/Toast';

const CustomerVisitLogger = ({ 
  selectedRouteId, 
  onVisitLogged, 
  isTracking,
  currentLocation 
}) => {
  const [routeVisits, setRouteVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [checkInData, setCheckInData] = useState({
    notes: '',
    sales_orders: []
  });
  const [checkOutData, setCheckOutData] = useState({
    notes: '',
    payment_collected: false,
    payment_amount: '',
    issues_reported: ''
  });

  // Local location state as fallback
  const [localLocation, setLocalLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);

  // Sales order creation state
  const [showSalesOrderModal, setShowSalesOrderModal] = useState(false);
  const [salesOrderData, setSalesOrderData] = useState({
    customer: '',
    order_date: new Date().toISOString().split('T')[0],
    status: 'draft',
    prices_include_vat: false,
    line_items: [
      {
        product_id: '',
        quantity: 1,
        unit_price: 0.0,
        discount: 0.0,
        line_total: 0.0,
      },
    ],
    subtotal: 0.0,
    vat_total: 0.0,
    grand_total: 0.0,
  });
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Get current location (fallback if not provided by parent)
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return null;
    }

    setGettingLocation(true);
    setLocationError('');

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          setLocalLocation(location);
          setGettingLocation(false);
          resolve(location);
        },
        (error) => {
          setGettingLocation(false);
          let errorMessage = 'Failed to get location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location services.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
            default:
              errorMessage = error.message || 'Unknown location error';
          }
          setLocationError(errorMessage);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  };

  // Get best available location
  const getBestLocation = () => {
    // Priority: currentLocation from parent > localLocation > null
    return currentLocation || localLocation;
  };

  // Fetch route visits when route changes
  useEffect(() => {
    if (selectedRouteId) {
      fetchRouteVisits();
    }
  }, [selectedRouteId]);

  // Fetch products for sales order creation
  useEffect(() => {
    fetchProducts();
  }, []);

  // Try to get location when component mounts
  useEffect(() => {
    if (!currentLocation && !localLocation) {
      getCurrentLocation().catch(console.error);
    }
  }, [currentLocation, localLocation]);

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await api.get('/main/products/');
      setProducts(response.data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleCreateSalesOrder = async (customerId) => {
    try {
      setLoading(true);
      const response = await api.post('/transactions/sales-orders/create_from_route/', {
        ...salesOrderData,
        route_id: selectedRouteId,
        customer_id: customerId
      });
      
      setInfo('Sales order created successfully!');
      setShowSalesOrderModal(false);
      resetSalesOrderData();
      
      // Refresh visits
      await fetchRouteVisits();
      if (onVisitLogged) onVisitLogged(response.data);
      
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to create sales order');
    } finally {
      setLoading(false);
    }
  };

  const resetSalesOrderData = () => {
    setSalesOrderData({
      customer: '',
      order_date: new Date().toISOString().split('T')[0],
      status: 'draft',
      prices_include_vat: false,
      line_items: [
        {
          product_id: '',
          quantity: 1,
          unit_price: 0.0,
          discount: 0.0,
          line_total: 0.0,
        },
      ],
      subtotal: 0.0,
      vat_total: 0.0,
      grand_total: 0.0,
    });
  };

  const fetchRouteVisits = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/transactions/routevisits/?route=${selectedRouteId}`);
      setRouteVisits(response.data);
    } catch (err) {
      setError('Failed to fetch route visits');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (visitId) => {
    const location = getBestLocation();
    
    if (!location) {
      // Try to get location first
      try {
        const newLocation = await getCurrentLocation();
        if (!newLocation) {
          setError('Could not get current location. Please try again or enable GPS.');
          return;
        }
      } catch (err) {
        setError('Location access required for check-in. Please enable GPS and try again.');
        return;
      }
    }

    const finalLocation = getBestLocation();

    try {
      setLoading(true);
      const response = await api.post(`/transactions/routevisits/${visitId}/check_in/`, {
        lat: finalLocation.lat,
        lon: finalLocation.lon,
        notes: checkInData.notes
      });

      setInfo('Successfully checked in!');
      setShowCheckInModal(false);
      setCheckInData({ notes: '', sales_orders: [] });
      
      // Refresh visits and notify parent
      await fetchRouteVisits();
      if (onVisitLogged) onVisitLogged(response.data);
      
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to check in');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async (visitId) => {
    try {
      setLoading(true);
      const response = await api.post(`/transactions/routevisits/${visitId}/check_out/`, {
        notes: checkOutData.notes,
        payment_collected: checkOutData.payment_collected,
        payment_amount: checkOutData.payment_amount ? parseFloat(checkOutData.payment_amount) : null,
        issues_reported: checkOutData.issues_reported
      });

      setInfo('Successfully checked out!');
      setShowCheckOutModal(false);
      setCheckOutData({
        notes: '',
        payment_collected: false,
        payment_amount: '',
        issues_reported: ''
      });
      
      // Refresh visits and notify parent
      await fetchRouteVisits();
      if (onVisitLogged) onVisitLogged(response.data);
      
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to check out');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'visited':
        return <FiCheckCircle className="h-5 w-5 text-green-500" />;
      case 'missed':
        return <FiXCircle className="h-5 w-5 text-red-500" />;
      default:
        return <FiClock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'visited':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'missed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateLineTotal = (item) => {
    const subtotal = (item.unit_price || 0) * (item.quantity || 1);
    const discount = (item.discount || 0) / 100;
    return subtotal * (1 - discount);
  };

  const updateLineItem = (index, field, value) => {
    const newLineItems = [...salesOrderData.line_items];
    newLineItems[index] = { ...newLineItems[index], [field]: value };
    
    // Recalculate line total
    if (field === 'unit_price' || field === 'quantity' || field === 'discount') {
      newLineItems[index].line_total = calculateLineTotal(newLineItems[index]);
    }
    
    setSalesOrderData(prev => ({ ...prev, line_items: newLineItems }));
  };

  if (loading && routeVisits.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!selectedRouteId) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="text-center text-gray-500">
          <FiMapPin className="mx-auto h-12 w-12 mb-4" />
          <h3 className="text-lg font-medium mb-2">Customer Visit Logging</h3>
          <p>Select a route to view and manage customer visits.</p>
        </div>
      </div>
    );
  }

  if (routeVisits.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="text-center text-gray-500">
          <FiMapPin className="mx-auto h-12 w-12 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Route Visits</h3>
          <p>This route doesn't have any planned customer visits yet.</p>
        </div>
      </div>
    );
  }

  const bestLocation = getBestLocation();

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FiMapPin className="text-blue-600" />
          Customer Visit Logging
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Check in/out and log customer visits with GPS location and notes
        </p>
        
        {/* Location Status */}
        <div className="mt-3 p-3 rounded-lg border">
          <div className="flex items-center gap-2">
            <FiNavigation className={`h-4 w-4 ${bestLocation ? 'text-green-500' : 'text-red-500'}`} />
            <span className="text-sm font-medium">GPS Status:</span>
            {gettingLocation ? (
              <span className="text-blue-600">Getting location...</span>
            ) : bestLocation ? (
              <span className="text-green-600">
                ✓ Location available ({bestLocation.lat.toFixed(6)}, {bestLocation.lon.toFixed(6)})
                {bestLocation.accuracy && ` • Accuracy: ${bestLocation.accuracy.toFixed(1)}m`}
              </span>
            ) : (
              <span className="text-red-600">
                ✗ Location not available
                {locationError && ` • ${locationError}`}
              </span>
            )}
          </div>
          
          {!bestLocation && (
            <button
              onClick={getCurrentLocation}
              disabled={gettingLocation}
              className="mt-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {gettingLocation ? 'Getting Location...' : 'Get Location'}
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {routeVisits.map((visit) => (
          <div key={visit.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {getStatusIcon(visit.status)}
                  <h4 className="text-lg font-medium text-gray-900">
                    {visit.customer_name || 'Customer'}
                  </h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(visit.status)}`}>
                    {visit.status.charAt(0).toUpperCase() + visit.status.slice(1)}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Check-in:</span> {formatTime(visit.check_in)}
                  </div>
                  <div>
                    <span className="font-medium">Check-out:</span> {formatTime(visit.check_out)}
                  </div>
                  <div>
                    <span className="font-medium">Location:</span> 
                    {visit.lat && visit.lon ? (
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${visit.lat}&mlon=${visit.lon}#map=16/${visit.lat}/${visit.lon}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 ml-1"
                      >
                        View Map
                      </a>
                    ) : (
                      <span className="text-gray-400 ml-1">Not recorded</span>
                    )}
                  </div>
                </div>

                {visit.notes && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FiFileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Visit Notes</span>
                    </div>
                    <p className="text-sm text-gray-600">{visit.notes}</p>
                  </div>
                )}

                {visit.sales_orders_details && visit.sales_orders_details.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FiShoppingCart className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium text-blue-700">Sales Orders</span>
                    </div>
                    <div className="space-y-1">
                      {visit.sales_orders_details.map((order) => (
                        <div key={order.id} className="text-sm text-blue-600">
                          Order #{order.order_number}: ${order.grand_total} ({order.status})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 ml-4">
                {visit.status === 'planned' && (
                  <button
                    onClick={() => {
                      setSelectedVisit(visit);
                      setShowCheckInModal(true);
                    }}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 flex items-center gap-2"
                    disabled={loading}
                  >
                    <FiCheckCircle /> Check In
                  </button>
                )}
                
                {visit.status === 'visited' && !visit.check_out && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedVisit(visit);
                        setShowCheckOutModal(true);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center gap-2"
                      disabled={loading}
                    >
                      <FiClock /> Check Out
                    </button>
                    <button
                      onClick={() => {
                        setSelectedVisit(visit);
                        setSalesOrderData(prev => ({ ...prev, customer: visit.customer }));
                        setShowSalesOrderModal(true);
                      }}
                      className="px-4 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 flex items-center gap-2"
                      disabled={loading}
                    >
                      <FiShoppingCart /> Create Order
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Check-in Modal */}
      {showCheckInModal && selectedVisit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Check In - {selectedVisit.customer_name}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visit Notes (Optional)
                </label>
                <textarea
                  value={checkInData.notes}
                  onChange={(e) => setCheckInData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Enter visit notes, orders taken, etc."
                />
              </div>

              <div className="text-sm text-gray-600 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <FiMapPin className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">GPS Location</span>
                </div>
                {bestLocation ? (
                  <span className="text-green-600">
                    ✓ Location captured: {bestLocation.lat.toFixed(6)}, {bestLocation.lon.toFixed(6)}
                    {bestLocation.accuracy && ` (±${bestLocation.accuracy.toFixed(1)}m)`}
                  </span>
                ) : (
                  <div>
                    <span className="text-red-600">✗ Location not available</span>
                    <button
                      onClick={getCurrentLocation}
                      disabled={gettingLocation}
                      className="block mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {gettingLocation ? 'Getting Location...' : 'Get Location'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCheckInModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCheckIn(selectedVisit.id)}
                disabled={loading || (!bestLocation && !gettingLocation)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Checking In...' : gettingLocation ? 'Getting Location...' : 'Check In'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Check-out Modal */}
      {showCheckOutModal && selectedVisit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Check Out - {selectedVisit.customer_name}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check-out Notes
                </label>
                <textarea
                  value={checkOutData.notes}
                  onChange={(e) => setCheckOutData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Enter check-out notes, summary of visit, etc."
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={checkOutData.payment_collected}
                    onChange={(e) => setCheckOutData(prev => ({ ...prev, payment_collected: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Payment Collected</span>
                </label>
              </div>

              {checkOutData.payment_collected && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Amount ($)
                  </label>
                  <input
                    type="number"
                    value={checkOutData.payment_amount}
                    onChange={(e) => setCheckOutData(prev => ({ ...prev, payment_amount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issues Reported (Optional)
                </label>
                <textarea
                  value={checkOutData.issues_reported}
                  onChange={(e) => setCheckOutData(prev => ({ ...prev, issues_reported: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  placeholder="Any issues, complaints, or follow-up needed"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCheckOutModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCheckOut(selectedVisit.id)}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Checking Out...' : 'Check Out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sales Order Creation Modal */}
      {showSalesOrderModal && selectedVisit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Create Sales Order - {selectedVisit.customer_name}</h3>
              <button
                onClick={() => setShowSalesOrderModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleCreateSalesOrder(selectedVisit.customer); }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Order Date</label>
                  <input
                    type="date"
                    value={salesOrderData.order_date}
                    onChange={(e) => setSalesOrderData(prev => ({ ...prev, order_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={salesOrderData.status}
                    onChange={(e) => setSalesOrderData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="confirmed">Confirmed</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={salesOrderData.prices_include_vat}
                  onChange={(e) => setSalesOrderData(prev => ({ ...prev, prices_include_vat: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">Prices include VAT</label>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium text-gray-900">Line Items</h4>
                  <button
                    type="button"
                    onClick={() => setSalesOrderData(prev => ({
                      ...prev,
                      line_items: [...prev.line_items, {
                        product_id: '',
                        quantity: 1,
                        unit_price: 0.0,
                        discount: 0.0,
                        line_total: 0.0,
                      }]
                    }))}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                  >
                    <FiPlus className="h-4 w-4" />
                    Add Item
                  </button>
                </div>

                {salesOrderData.line_items.map((item, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                        <select
                          value={item.product_id}
                          onChange={(e) => {
                            updateLineItem(index, 'product_id', e.target.value);
                            // Auto-fill unit price when product is selected
                            const selectedProduct = products.find(p => p.id === e.target.value);
                            if (selectedProduct) {
                              updateLineItem(index, 'unit_price', parseFloat(selectedProduct.unit_price));
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Select Product</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} - ${product.unit_price}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="1"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          step="0.01"
                          min="0"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Discount %</label>
                        <input
                          type="number"
                          value={item.discount}
                          onChange={(e) => updateLineItem(index, 'discount', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          step="0.01"
                          min="0"
                          max="100"
                        />
                      </div>

                      <div className="flex items-end">
                        {salesOrderData.line_items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newLineItems = salesOrderData.line_items.filter((_, i) => i !== index);
                              setSalesOrderData(prev => ({ ...prev, line_items: newLineItems }));
                            }}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                          >
                            <FiX className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-3 text-right">
                      <span className="text-sm text-gray-600">
                        Line Total: <span className="font-medium">${calculateLineTotal(item).toFixed(2)}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSalesOrderModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || salesOrderData.line_items.some(item => !item.product_id)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Sales Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <Toast type="error" message={error} onClose={() => setError('')} />
      )}
      {info && (
        <Toast type="success" message={info} onClose={() => setInfo('')} />
      )}
    </div>
  );
};

export default CustomerVisitLogger;