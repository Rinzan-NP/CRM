// src/pages/RouteVisits.js
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

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

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
            if (
                searchRef.current &&
                !searchRef.current.contains(event.target)
            ) {
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
                        className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        Search
                    </button>
                </div>
                {showSuggestions && suggestions.length > 0 && (
                    <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                        {suggestions.map((suggestion, index) => (
                            <li
                                key={index}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() =>
                                    handleSuggestionClick(suggestion)
                                }
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
    const dispatch = useDispatch();
    const [routeVisit, setRouteVisit] = useState({
        route: "",
        customer: "",
        check_in: "",
        check_out: "",
        lat: "",
        lon: "",
        status: "planned",
    });
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [mapCenter, setMapCenter] = useState([51.505, -0.09]);
    const [selectedPosition, setSelectedPosition] = useState(null);
    const formRef = useRef();

    useEffect(() => {
        dispatch(fetchRouteVisits());
        dispatch(fetchRoutes());
        dispatch(fetchCustomers());

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

    const formatCoordinate = (value) => {
        if (value === null || value === undefined || value === "") return "";

        const str = value.toString().replace(/[^0-9.-]/g, "");
        const parts = str.split(".");
        const isNegative = str.startsWith("-");

        // Handle integer part (max 3 digits including minus sign)
        const integerPart = isNegative ? parts[0].substring(1) : parts[0];
        const limitedInteger = integerPart.slice(0, isNegative ? 2 : 3);

        // Handle decimal part (exactly 6 digits)
        const decimalPart = parts.length > 1 ? parts[1].slice(0, 6) : "000000";
        const paddedDecimal = decimalPart.padEnd(6, "0");

        const formatted = `${
            isNegative ? "-" : ""
        }${limitedInteger}.${paddedDecimal}`;
        const numericValue = parseFloat(formatted);

        return Math.abs(numericValue) <= 90 ? formatted : "";
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

        console.log(formattedRouteVisit, "--------------");
        await dispatch(createRouteVisit(formattedRouteVisit));
        resetForm();
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

        await dispatch(
            updateRouteVisit({ id: editId, ...formattedRouteVisit })
        );
        setEditMode(false);
        resetForm();
    };

    const handleDeleteRouteVisit = async (id) => {
        await dispatch(deleteRouteVisit(id));
    };

    const handleEditRouteVisit = (routeVisit) => {
        setEditMode(true);
        setEditId(routeVisit.id);
        setRouteVisit({
            ...routeVisit,
            lat: formatCoordinate(routeVisit.lat),
            lon: formatCoordinate(routeVisit.lon),
        });

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
        });
        setSelectedPosition(null);
        formRef.current?.reset();
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-6xl">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Manage Route Visits
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form
                        ref={formRef}
                        onSubmit={
                            editMode
                                ? handleUpdateRouteVisit
                                : handleCreateRouteVisit
                        }
                    >
                        <div>
                            <label
                                htmlFor="route"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Route
                            </label>
                            <div className="mt-1">
                                <select
                                    id="route"
                                    name="route"
                                    required
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    value={routeVisit.route}
                                    onChange={handleInputChange}
                                >
                                    <option value="">Select Route</option>
                                    {loadingRoutes ? (
                                        <option value="">Loading...</option>
                                    ) : (
                                        routes.map((route) => (
                                            <option
                                                key={route.id}
                                                value={route.id}
                                            >
                                                {route.id} - {route.name} ({route.date})
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>
                        </div>

                        <div className="mt-4">
                            <label
                                htmlFor="customer"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Customer
                            </label>
                            <div className="mt-1">
                                <select
                                    id="customer"
                                    name="customer"
                                    required
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    value={routeVisit.customer}
                                    onChange={handleInputChange}
                                >
                                    <option value="">Select Customer</option>
                                    {loadingCustomers ? (
                                        <option value="">Loading...</option>
                                    ) : (
                                        customers.map((customer) => (
                                            <option
                                                key={customer.id}
                                                value={customer.id}
                                            >
                                                {customer.id} - {customer.name}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>
                        </div>

                        <div className="mt-4">
                            <label
                                htmlFor="check_in"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Check-In
                            </label>
                            <div className="mt-1">
                                <input
                                    id="check_in"
                                    name="check_in"
                                    type="datetime-local"
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    value={routeVisit.check_in}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        <div className="mt-4">
                            <label
                                htmlFor="check_out"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Check-Out
                            </label>
                            <div className="mt-1">
                                <input
                                    id="check_out"
                                    name="check_out"
                                    type="datetime-local"
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    value={routeVisit.check_out}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        <div className="mt-4">
                            <label
                                htmlFor="status"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Status
                            </label>
                            <div className="mt-1">
                                <select
                                    id="status"
                                    name="status"
                                    required
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    value={routeVisit.status}
                                    onChange={handleInputChange}
                                >
                                    <option value="planned">Planned</option>
                                    <option value="visited">Visited</option>
                                    <option value="missed">Missed</option>
                                </select>
                            </div>
                        </div>

                        <input
                            type="hidden"
                            name="lat"
                            value={routeVisit.lat}
                        />
                        <input
                            type="hidden"
                            name="lon"
                            value={routeVisit.lon}
                        />

                        <div className="mt-6">
                            <button
                                type="submit"
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                {editMode
                                    ? "Update Route Visit"
                                    : "Create Route Visit"}
                            </button>
                            {editMode && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditMode(false);
                                        resetForm();
                                    }}
                                    className="mt-2 w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div className="bg-white p-4 shadow sm:rounded-lg relative">
                    <div className="h-96">
                        <MapContainer
                            center={mapCenter}
                            zoom={13}
                            style={{ height: "100%", width: "100%" }}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            <SearchBar onSearch={handleSearchResult} />
                            <LocationPicker
                                onLocationSelect={handleLocationSelect}
                                position={selectedPosition}
                            />
                        </MapContainer>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                        Search for a location or click on the map to select.
                        Coordinates will be saved automatically.
                    </div>
                    {routeVisit.lat && routeVisit.lon && (
                        <div className="mt-2 text-xs text-gray-500">
                            Selected: {parseFloat(routeVisit.lat).toFixed(6)},{" "}
                            {parseFloat(routeVisit.lon).toFixed(6)}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-6xl">
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Route
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Customer
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Check-In
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Check-Out
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Location
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Status
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {routeVisits.map((routeVisit) => (
                                <tr key={routeVisit.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {routeVisit.route?.name || "N/A"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {routeVisit.customer?.name || "N/A"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {routeVisit.check_in || "N/A"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {routeVisit.check_out || "N/A"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {routeVisit.lat && routeVisit.lon ? (
                                            <a
                                                href={`https://www.openstreetmap.org/?mlat=${routeVisit.lat}&mlon=${routeVisit.lon}#map=16/${routeVisit.lat}/${routeVisit.lon}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                View on Map
                                            </a>
                                        ) : (
                                            "N/A"
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${
                          routeVisit.status === "visited"
                              ? "bg-green-100 text-green-800"
                              : routeVisit.status === "missed"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                      }`}
                                        >
                                            {routeVisit.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() =>
                                                handleEditRouteVisit(routeVisit)
                                            }
                                            className="text-indigo-600 hover:text-indigo-900"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleDeleteRouteVisit(
                                                    routeVisit.id
                                                )
                                            }
                                            className="ml-4 text-red-600 hover:text-red-900"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RouteVisits;
