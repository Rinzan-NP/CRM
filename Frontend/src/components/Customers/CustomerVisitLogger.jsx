import React, { useState, useEffect, useRef } from 'react';
import { FiMapPin, FiClock, FiFileText, FiShoppingCart, FiCheckCircle, FiXCircle } from 'react-icons/fi';
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

  // Fetch route visits when route changes
  useEffect(() => {
    if (selectedRouteId) {
      fetchRouteVisits();
    }
  }, [selectedRouteId]);

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
    if (!currentLocation) {
      setError('Location not available. Please enable GPS tracking first.');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post(`/transactions/routevisits/${visitId}/check_in/`, {
        lat: currentLocation.lat,
        lon: currentLocation.lon,
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
        payment_amount: checkOutData.payment_amount,
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
                          Order #{order.order_number}: ₹{order.grand_total} ({order.status})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 ml-4">
                {visit.status === 'planned' && isTracking && (
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
                {currentLocation ? (
                  <span className="text-green-600">
                    ✓ Location captured: {currentLocation.lat.toFixed(6)}, {currentLocation.lon.toFixed(6)}
                  </span>
                ) : (
                  <span className="text-red-600">✗ Location not available</span>
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
                disabled={loading || !currentLocation}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Checking In...' : 'Check In'}
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
                    Payment Amount (₹)
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
