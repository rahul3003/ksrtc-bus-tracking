import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import LiveTracking from '../../components/Tracking/LiveTracking';
import {
  MapIcon,
  ClockIcon,
  TruckIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const PassengerRoutes = () => {
  // Component for passenger route management
  const [routes, setRoutes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [availableTrips, setAvailableTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapRoute, setMapRoute] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/routes`);
      setRoutes(response.data.routes);
    } catch (error) {
      console.error('Error fetching routes:', error);
      toast.error('Failed to load routes');
    } finally {
      setLoading(false);
    }
  };

  const searchRoutes = async () => {
    if (!searchQuery.trim()) {
      fetchRoutes();
      return;
    }

    try {
      setSearchLoading(true);
      const response = await axios.get(`${API_BASE_URL}/routes/search/${searchQuery}`);
      setRoutes(response.data.routes);
    } catch (error) {
      console.error('Error searching routes:', error);
      toast.error('Failed to search routes');
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchAvailableTrips = async (routeId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/trips`, {
        params: {
          routeId,
          status: 'SCHEDULED'
        }
      });
      
      // Filter future trips
      const now = new Date();
      const futureTrips = response.data.trips.filter(trip => 
        new Date(trip.scheduledAt) > now
      );
      
      setAvailableTrips(futureTrips);
    } catch (error) {
      console.error('Error fetching trips:', error);
      toast.error('Failed to load available trips');
    }
  };

  const handleRouteSelect = (route) => {
    setSelectedRoute(route);
    fetchAvailableTrips(route.id);
  };

  const handleViewRoute = (route) => {
    setMapRoute(route);
    setShowMapModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAvailableSeats = (trip) => {
    const totalSeats = trip.bus?.capacity || 0;
    const bookedSeats = trip._count?.bookings || 0;
    return totalSeats - bookedSeats;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Find Routes</h1>
        <p className="mt-1 text-sm text-gray-500">
          Search and book bus routes
        </p>
      </div>

      {/* Search */}
      <div className="card">
        <div className="flex space-x-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Search Routes
            </label>
            <div className="mt-1 relative">
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
                placeholder="Search by route name, start point, or destination..."
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={searchRoutes}
              disabled={searchLoading}
              className="btn-primary"
            >
              {searchLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
      </div>

      {/* Routes List */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {routes.map((route) => (
          <div
            key={route.id}
            className={`card cursor-pointer transition-all duration-200 ${
              selectedRoute?.id === route.id 
                ? 'ring-2 ring-primary-500 bg-primary-50' 
                : 'hover:bg-gray-50 hover:shadow-md'
            }`}
            onClick={() => handleRouteSelect(route)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">
                  {route.name}
                </h3>
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <MapIcon className="h-4 w-4 mr-1" />
                  <span>{route.startPoint} → {route.endPoint}</span>
                </div>
                {(route.startDistrict || route.endDistrict) && (
                  <div className="mt-1 flex items-center text-xs text-gray-400">
                    <span>
                      {route.startDistrict && route.endDistrict 
                        ? `${route.startDistrict} → ${route.endDistrict}`
                        : route.startDistrict || route.endDistrict
                      }
                    </span>
                  </div>
                )}
                {(route.startTaluk || route.endTaluk) && (
                  <div className="mt-1 flex items-center text-xs text-gray-300">
                    <span>
                      {route.startTaluk && route.endTaluk 
                        ? `${route.startTaluk} → ${route.endTaluk}`
                        : route.startTaluk || route.endTaluk
                      }
                    </span>
                  </div>
                )}
                {route.distance && (
                  <div className="mt-1 flex items-center text-sm text-gray-500">
                    <span>{route.distance} km</span>
                    {route.duration && (
                      <>
                        <span className="mx-2">•</span>
                        <ClockIcon className="h-4 w-4 mr-1" />
                        <span>{route.duration} min</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="ml-4 flex flex-col items-end space-y-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {route.isActive ? 'Active' : 'Inactive'}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewRoute(route);
                  }}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                  title="View Route on Map"
                >
                  <EyeIcon className="h-3 w-3 mr-1" />
                  View Map
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Available Trips */}
      {selectedRoute && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              Available Trips - {selectedRoute.name}
            </h2>
            <button
              onClick={() => setSelectedRoute(null)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
          
          {availableTrips.length > 0 ? (
            <div className="space-y-4">
              {availableTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <TruckIcon className="h-5 w-5 text-primary-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900">
                            {trip.bus?.busNumber}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Driver: {trip.driver?.name}
                          </p>
                          <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                            <span>Capacity: {trip.bus?.capacity}</span>
                            <span>Available: {getAvailableSeats(trip)}</span>
                            <span>Model: {trip.bus?.model || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {formatTime(trip.scheduledAt)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(trip.scheduledAt)}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {getAvailableSeats(trip)} seats left
                        </span>
                        
                        <button
                          onClick={() => {
                            // Navigate to booking page or open booking modal
                            toast.success('Booking functionality would be implemented here');
                          }}
                          className="btn-primary text-xs py-1 px-2"
                          disabled={getAvailableSeats(trip) === 0}
                        >
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No trips available</h3>
              <p className="mt-1 text-sm text-gray-500">
                There are no scheduled trips for this route.
              </p>
            </div>
          )}
        </div>
      )}

      {routes.length === 0 && (
        <div className="text-center py-12">
          <MapIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No routes found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search criteria.
          </p>
        </div>
      )}

      {/* Route Map Modal - Full Screen */}
      {showMapModal && mapRoute && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  setShowMapModal(false);
                  setMapRoute(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {mapRoute.name} - Live Route Map
                </h1>
                <p className="text-sm text-gray-500">
                  {mapRoute.startPoint} → {mapRoute.endPoint}
                </p>
                {(mapRoute.startDistrict || mapRoute.endDistrict) && (
                  <p className="text-xs text-gray-400">
                    {mapRoute.startDistrict && mapRoute.endDistrict 
                      ? `${mapRoute.startDistrict} → ${mapRoute.endDistrict}`
                      : mapRoute.startDistrict || mapRoute.endDistrict
                    }
                  </p>
                )}
              </div>
            </div>
            
            {/* Live Tracking Indicator */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">LIVE TRACKING</span>
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.5 19.5L19.5 4.5" />
                </svg>
              </button>
              <button
                onClick={() => {
                  setShowMapModal(false);
                  setMapRoute(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex">
            {/* Map Section */}
            <div className="flex-1 relative">
              <LiveTracking 
                route={mapRoute}
                tripId={`trip-${mapRoute.id}`}
              />
            </div>

            {/* Sidebar */}
            <div className="w-80 bg-gray-50 border-l border-gray-200 flex flex-col overflow-y-auto">
              {/* Route Info */}
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Information</h3>
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">Distance</span>
                      <span className="text-lg font-bold text-primary-600">
                        {mapRoute.distance ? `${mapRoute.distance.toFixed(1)} km` : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">Duration</span>
                      <span className="text-lg font-bold text-primary-600">
                        {mapRoute.duration ? `${mapRoute.duration} min` : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">Status</span>
                      <span className={`text-lg font-bold ${
                        mapRoute.isActive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {mapRoute.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Waypoints */}
              {mapRoute.waypoints && (
                <div className="p-6 border-b border-gray-200 flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Bus Stops</h3>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {(() => {
                      const waypoints = typeof mapRoute.waypoints === 'string' ? 
                        JSON.parse(mapRoute.waypoints) : mapRoute.waypoints;
                      return waypoints.map((waypoint, index) => (
                        <div key={index} className="bg-white p-3 rounded-lg shadow-sm">
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{waypoint.name}</p>
                              {(waypoint.district || waypoint.taluk) && (
                                <p className="text-xs text-gray-500">
                                  {waypoint.district && waypoint.taluk 
                                    ? `${waypoint.taluk}, ${waypoint.district}`
                                    : waypoint.district || waypoint.taluk
                                  }
                                </p>
                              )}
                              <p className="text-xs text-gray-400">
                                📍 {waypoint.latitude?.toFixed(4)}, {waypoint.longitude?.toFixed(4)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* Search */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Stops</h3>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search Karnataka stops..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PassengerRoutes;
