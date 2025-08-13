// Updated RouteVisits.jsx with Sales Orders support

import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchRouteVisits,
  createRouteVisit,
  updateRouteVisit,
  deleteRouteVisit,
} from "../redux/routeVisitsSlice";
import { fetchRoutes } from "../redux/routesSlice";
import { fetchCustomers } from "../redux/customersSlice";
import { fetchSalesOrders } from "../redux/salesOrdersSlice";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { OpenStreetMapProvider } from "leaflet-geosearch";
import "leaflet-geosearch/dist/geosearch.css";
import PageHeader from '../components/layout/PageHeader';
import StatsCard from '../components/ui/StatsCard';
import DataTable from '../components/ui/DataTable';
import FormField from '../components/ui/FormField';
import Modal from '../components/Common/Modal';
import { MapPin, Clock, CheckCircle, XCircle, Plus, Edit, Trash2, ShoppingCart, FileText } from 'lucide-react';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Multi-select component for sales orders
const SalesOrderMultiSelect = ({ 
  selectedCustomer, 
  selectedSalesOrders, 
  onSalesOrdersChange, 
  salesOrders, 
  loading 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Filter sales orders by selected customer
  const availableSalesOrders = salesOrders.filter(so => 
  selectedCustomer && 
  Number(so.customer) === Number(selectedCustomer) && 
  so.status !== 'cancelled'
);

  

  const handleToggle = (salesOrderId) => {
    const newSelection = selectedSalesOrders.includes(salesOrderId)
      ? selectedSalesOrders.filter(id => id !== salesOrderId)
      : [...selectedSalesOrders, salesOrderId];
    onSalesOrdersChange(newSelection);
  };

  const getSelectedOrdersDisplay = () => {
  if (!selectedSalesOrders || selectedSalesOrders.length === 0) return "Select Sales Orders";
  
  const selectedCount = selectedSalesOrders.length;
  if (selectedCount === 1) {
    const order = salesOrders.find(so => so.id === selectedSalesOrders[0]);
    return order ? order.order_number || `SO-${order.id}` : "1 order selected";
  }
  return `${selectedCount} orders selected`;
};
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={!selectedCustomer || loading}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-left flex justify-between items-center disabled:bg-slate-100 disabled:cursor-not-allowed"
      >
        <span className={selectedSalesOrders.length === 0 ? "text-slate-500" : "text-slate-900"}>
          {getSelectedOrdersDisplay()}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
    {!selectedCustomer ? (
      <div className="px-3 py-2 text-slate-500 text-sm">
        Please select a customer first
      </div>
    ) : availableSalesOrders.length === 0 ? (
      <div className="px-3 py-2 text-slate-500 text-sm">
        No sales orders found for this customer
      </div>
    ) : (
      availableSalesOrders.map((salesOrder) => (
        <label
          key={salesOrder.id}
          className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer"
        >
          <input
            type="checkbox"
            checked={selectedSalesOrders.includes(salesOrder.id)}
            onChange={() => handleToggle(salesOrder.id)}
            className="mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-900">
              {salesOrder.order_number || `SO-${salesOrder.id}`}
            </div>
            <div className="text-xs text-slate-500">
              {salesOrder.order_date} • ${parseFloat(salesOrder.grand_total || 0).toFixed(2)} • {salesOrder.status}
            </div>
          </div>
        </label>
      ))
    )}
  </div>
)}
    </div>
  );
};

const LocationPicker = ({ onLocationSelect, position }) => {
  const map = useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    },
  });

  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);

  return position ? (
    <Marker position={position}>
      <Popup>Selected Location</Popup>
    </Marker>
  ) : null;
};

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const provider = new OpenStreetMapProvider();
  const map = useMap();
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  

  const handleInputChange = async (e) => {
    const value = e.target.value;
    setQuery(value);

    if (value.length > 2) {
      const results = await provider.search({ query: value });
      setSuggestions(results.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    const { x: lng, y: lat, label } = suggestion;
    setQuery(label);
    setShowSuggestions(false);
    map.flyTo([lat, lng], 15);
    onSearch({ lat, lng });
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (query.length > 0) {
      const results = await provider.search({ query });
      if (results.length > 0) {
        const { x: lng, y: lat } = results[0];
        map.flyTo([lat, lng], 15);
        onSearch({ lat, lng });
      }
    }
    setShowSuggestions(false);
  };

  return (
    <div className="absolute top-4 left-4 z-[1000] w-72" ref={searchRef}>
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="flex shadow-sm">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search for a location..."
            className="flex-grow px-3 py-2 border border-slate-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Search
          </button>
        </div>
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg">
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion.label}
              </li>
            ))}
          </ul>
        )}
      </form>
    </div>
  );
};

const RouteVisits = () => {
  const { routeVisits, loading: loadingRouteVisits } = useSelector(
    (state) => state.routeVisits
  );
  const { routes, loading: loadingRoutes } = useSelector((state) => state.routes);
  const { customers, loading: loadingCustomers } = useSelector((state) => state.customers);
  const { salesOrders, loading: loadingSalesOrders } = useSelector((state) => state.salesOrders);
  const dispatch = useDispatch();
  
  const [routeVisit, setRouteVisit] = useState({
    route: "",
    customer: "",
    check_in: "",
    check_out: "",
    lat: "",
    lon: "",
    status: "planned",
    sales_orders: [],
    notes: "",
  });
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [mapCenter, setMapCenter] = useState([51.505, -0.09]);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    dispatch(fetchRouteVisits());
    dispatch(fetchRoutes());
    dispatch(fetchCustomers());
    dispatch(fetchSalesOrders());

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
          setSelectedPosition([latitude, longitude]);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, [dispatch]);

  useEffect(() => {
  if (routeVisit.customer) {
    const customerId = Number(routeVisit.customer);
    const validSalesOrders = salesOrders
      .filter(so => Number(so.customer) === customerId && so.status !== 'cancelled')
      .map(so => so.id);
    
    setRouteVisit(prev => ({ 
      ...prev, 
      sales_orders: validSalesOrders 
    }));
  } else {
    setRouteVisit(prev => ({ ...prev, sales_orders: [] }));
  }
}, [routeVisit.customer, salesOrders]);

  const formatCoordinate = (value) => {
    if (value === null || value === undefined || value === "") return "";

    const str = value.toString().replace(/[^0-9.-]/g, "");
    const parts = str.split(".");

    if (parts.length === 1) {
      return `${str}.000000`;
    }

    const integerPart = parts[0];
    const decimalPart = parts[1].slice(0, 6).padEnd(6, "0");

    return `${integerPart}.${decimalPart}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "lat" || name === "lon") {
      const formattedValue = formatCoordinate(value);
      setRouteVisit({ ...routeVisit, [name]: formattedValue });
    } else {
      setRouteVisit({ ...routeVisit, [name]: value });
    }
  };

  const handleSalesOrdersChange = (selectedSalesOrders) => {
    setRouteVisit({ ...routeVisit, sales_orders: selectedSalesOrders });
  };

  const handleLocationSelect = (latlng) => {
    setSelectedPosition([latlng.lat, latlng.lng]);
    setRouteVisit({
      ...routeVisit,
      lat: formatCoordinate(latlng.lat.toString()),
      lon: formatCoordinate(latlng.lng.toString()),
    });
  };

  const handleSearchResult = ({ lat, lng }) => {
    setSelectedPosition([lat, lng]);
    setRouteVisit({
      ...routeVisit,
      lat: formatCoordinate(lat.toString()),
      lon: formatCoordinate(lng.toString()),
    });
  };

  const handleCreateRouteVisit = async (e) => {
    e.preventDefault();
    const formattedRouteVisit = {
      ...routeVisit,
      lat: formatCoordinate(routeVisit.lat),
      lon: formatCoordinate(routeVisit.lon),
    };

    if (!formattedRouteVisit.lat || !formattedRouteVisit.lon) {
      alert("Please select a valid location on the map");
      return;
    }

    await dispatch(createRouteVisit(formattedRouteVisit));
    resetForm();
    setShowModal(false);
  };

  const handleUpdateRouteVisit = async (e) => {
    e.preventDefault();
    const formattedRouteVisit = {
      ...routeVisit,
      lat: formatCoordinate(routeVisit.lat),
      lon: formatCoordinate(routeVisit.lon),
    };

    if (!formattedRouteVisit.lat || !formattedRouteVisit.lon) {
      alert("Please select a valid location on the map");
      return;
    }

    await dispatch(updateRouteVisit({ id: editId, ...formattedRouteVisit }));
    setEditMode(false);
    resetForm();
    setShowModal(false);
  };

  const handleDeleteRouteVisit = async (id) => {
    if (window.confirm('Are you sure you want to delete this route visit?')) {
      await dispatch(deleteRouteVisit(id));
    }
  };

  const handleEditRouteVisit = (routeVisit) => {
    setEditMode(true);
    setEditId(routeVisit.id);
    setRouteVisit({
      ...routeVisit,
      lat: formatCoordinate(routeVisit.lat),
      lon: formatCoordinate(routeVisit.lon),
      sales_orders: routeVisit.sales_orders || [],
      notes: routeVisit.notes || "",
    });
    setShowModal(true);

    if (routeVisit.lat && routeVisit.lon) {
      const position = [
        parseFloat(routeVisit.lat),
        parseFloat(routeVisit.lon),
      ];
      setSelectedPosition(position);
      setMapCenter(position);
    }
  };

  const resetForm = () => {
    setRouteVisit({
      route: "",
      customer: "",
      check_in: "",
      check_out: "",
      lat: "",
      lon: "",
      status: "planned",
      sales_orders: [],
      notes: "",
    });
    setSelectedPosition(null);
    setEditMode(false);
    setEditId(null);
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    const date = new Date(dateTime);
    return date.toLocaleString();
  };

  const getRouteName = (routeId) => {
    const route = routes.find(r => r.id === routeId);
    return route ? `${route.name} (${route.date})` : `Route ${routeId}`;
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : `Customer ${customerId}`;
  };

  const getSalesOrdersDisplay = (salesOrderIds) => {
    if (!salesOrderIds || salesOrderIds.length === 0) return 'None';
    
    const orders = salesOrderIds.map(id => {
      const so = salesOrders.find(s => s.id === id);
      return so ? (so.order_number || `SO-${so.id}`) : `SO-${id}`;
    });
    
    if (orders.length <= 2) {
      return orders.join(', ');
    }
    
    return `${orders.slice(0, 2).join(', ')} +${orders.length - 2} more`;
  };

  const plannedVisits = routeVisits.filter(v => v.status === 'planned').length;
  const visitedVisits = routeVisits.filter(v => v.status === 'visited').length;
  const missedVisits = routeVisits.filter(v => v.status === 'missed').length;

  const columns = [
    {
      header: 'Route',
      accessor: 'route',
      cell: (row) => (
        <span className="font-medium text-slate-900">{getRouteName(row.route)}</span>
      ),
    },
    {
      header: 'Customer',
      accessor: 'customer',
      cell: (row) => getCustomerName(row.customer),
    },
    {
      header: 'Sales Orders',
      accessor: 'sales_orders',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <ShoppingCart className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-600">
            {getSalesOrdersDisplay(row.sales_orders)}
          </span>
        </div>
      ),
    },
    {
      header: 'Check-In',
      accessor: 'check_in',
      cell: (row) => formatDateTime(row.check_in),
    },
    {
      header: 'Check-Out',
      accessor: 'check_out',
      cell: (row) => formatDateTime(row.check_out),
    },
    {
      header: 'Location',
      accessor: 'location',
      cell: (row) => row.lat && row.lon ? (
        <a
          href={`https://www.openstreetmap.org/?mlat=${row.lat}&mlon=${row.lon}#map=16/${row.lat}/${row.lon}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
        >
          <MapPin className="h-4 w-4" />
          View Map
        </a>
      ) : 'N/A',
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
          row.status === 'visited' ? 'bg-emerald-100 text-emerald-800' :
          row.status === 'missed' ? 'bg-rose-100 text-rose-800' :
          'bg-amber-100 text-amber-800'
        }`}>
          {row.status === 'visited' ? <CheckCircle className="h-3 w-3" /> : 
           row.status === 'missed' ? <XCircle className="h-3 w-3" /> : 
           <Clock className="h-3 w-3" />}
          {row.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEditRouteVisit(row)}
            className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteRouteVisit(row.id)}
            className="p-1 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader 
          title="Route Visits" 
          subtitle="Manage and track your field visits with sales orders"
          actions={[
            <button
              key="add"
              onClick={() => { resetForm(); setShowModal(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Visit
            </button>
          ]}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCard title="Planned Visits" value={plannedVisits} icon={Clock} color="amber" />
          <StatsCard title="Completed Visits" value={visitedVisits} icon={CheckCircle} color="emerald" />
          <StatsCard title="Missed Visits" value={missedVisits} icon={XCircle} color="rose" />
        </div>

        <Modal 
          isOpen={showModal} 
          onClose={() => setShowModal(false)}
          title={editMode ? 'Edit Route Visit' : 'Create New Route Visit'}
          size="xl"
        >
          <form onSubmit={editMode ? handleUpdateRouteVisit : handleCreateRouteVisit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Route" required>
                <select
                  name="route"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={routeVisit.route}
                  onChange={handleInputChange}
                >
                  <option value="">Select Route</option>
                  {loadingRoutes ? (
                    <option value="">Loading...</option>
                  ) : (
                    routes.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.name} ({route.date})
                      </option>
                    ))
                  )}
                </select>
              </FormField>

              <FormField label="Customer" required>
                <select
                  name="customer"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={routeVisit.customer}
                  onChange={handleInputChange}
                >
                  <option value="">Select Customer</option>
                  {loadingCustomers ? (
                    <option value="">Loading...</option>
                  ) : (
                    customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))
                  )}
                </select>
              </FormField>

              <FormField label="Sales Orders" className="md:col-span-2">
                <SalesOrderMultiSelect
                  selectedCustomer={routeVisit.customer}
                  selectedSalesOrders={routeVisit.sales_orders}
                  onSalesOrdersChange={handleSalesOrdersChange}
                  salesOrders={salesOrders}
                  loading={loadingSalesOrders}
                />
                <div className="text-xs text-slate-500 mt-1">
                  Optional: Select sales orders to associate with this visit
                </div>
              </FormField>

              <FormField label="Check-In">
                <input
                  type="datetime-local"
                  name="check_in"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={routeVisit.check_in}
                  onChange={handleInputChange}
                />
              </FormField>

              <FormField label="Check-Out">
                <input
                  type="datetime-local"
                  name="check_out"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={routeVisit.check_out}
                  onChange={handleInputChange}
                />
              </FormField>

              <FormField label="Status" required>
                <select
                  name="status"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={routeVisit.status}
                  onChange={handleInputChange}
                >
                  <option value="planned">Planned</option>
                  <option value="visited">Visited</option>
                  <option value="missed">Missed</option>
                </select>
              </FormField>

              <FormField label="Notes">
                <textarea
                  name="notes"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={routeVisit.notes}
                  onChange={handleInputChange}
                  placeholder="Optional visit notes..."
                />
              </FormField>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-medium text-slate-700">Location</label>
                <div className="h-48 relative rounded-lg overflow-hidden border border-slate-300">
                  <MapContainer
                    center={mapCenter}
                    zoom={13}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <LocationPicker
                      onLocationSelect={handleLocationSelect}
                      position={selectedPosition}
                    />
                  </MapContainer>
                </div>
                <div className="text-xs text-slate-500">
                  {routeVisit.lat && routeVisit.lon ? (
                    <span>Selected: {parseFloat(routeVisit.lat).toFixed(6)}, {parseFloat(routeVisit.lon).toFixed(6)}</span>
                  ) : (
                    <span>Click on the map to select location</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              >
                {editMode ? 'Update Visit' : 'Create Visit'}
              </button>
            </div>
          </form>
        </Modal>

        <DataTable
          data={routeVisits}
          columns={columns}
          pageSize={10}
          loading={loadingRouteVisits}
          showPagination={true}
        />
      </div>
    </div>
  );
};

export default RouteVisits;