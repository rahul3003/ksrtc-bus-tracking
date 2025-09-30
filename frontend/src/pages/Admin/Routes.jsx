import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import RouteForm from '../../components/Routes/RouteForm';
import LiveTracking from '../../components/Tracking/LiveTracking';
import StopManagement from '../../components/Admin/StopManagement';
import {
  MapIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  XMarkIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

const AdminRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [showRouteForm, setShowRouteForm] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showStopManagement, setShowStopManagement] = useState(false);

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

  const handleDelete = async (routeId) => {
    if (!window.confirm('Are you sure you want to delete this route?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/routes/${routeId}`);
      toast.success('Route deleted successfully');
      fetchRoutes();
    } catch (error) {
      console.error('Error deleting route:', error);
      toast.error('Failed to delete route');
    }
  };

  const toggleRouteStatus = async (routeId, currentStatus) => {
    try {
      await axios.put(`${API_BASE_URL}/routes/${routeId}`, {
        isActive: !currentStatus
      });
      toast.success('Route status updated successfully');
      fetchRoutes();
    } catch (error) {
      console.error('Error updating route status:', error);
      toast.error('Failed to update route status');
    }
  };

  const handleRouteCreated = (newRoute) => {
    setRoutes(prev => [newRoute, ...prev]);
    setShowRouteForm(false);
  };

  const handleViewRoute = (route) => {
    setSelectedRoute(route);
    setShowMapModal(true);
  };

  const handleManageStops = (route) => {
    setSelectedRoute(route);
    setShowStopManagement(true);
  };

  const handleRouteUpdated = (updatedRoute) => {
    setRoutes(prev => prev.map(route => 
      route.id === updatedRoute.id ? updatedRoute : route
    ));
    setSelectedRoute(updatedRoute);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Route Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage bus routes and destinations
          </p>
        </div>
        <button
          onClick={() => setShowRouteForm(true)}
          className="btn-primary"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Route
        </button>
      </div>

      {/* Routes Grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {routes.map((route) => (
          <div 
            key={route.id} 
            className="card cursor-pointer hover:shadow-lg transition-shadow duration-200"
            onClick={() => handleViewRoute(route)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <MapIcon className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    {route.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {route.startPoint} → {route.endPoint}
                  </p>
                  {(route.startDistrict || route.endDistrict) && (
                    <p className="text-xs text-gray-400">
                      {route.startDistrict && route.endDistrict 
                        ? `${route.startDistrict} → ${route.endDistrict}`
                        : route.startDistrict || route.endDistrict
                      }
                    </p>
                  )}
                  {(route.startTaluk || route.endTaluk) && (
                    <p className="text-xs text-gray-300">
                      {route.startTaluk && route.endTaluk 
                        ? `${route.startTaluk} → ${route.endTaluk}`
                        : route.startTaluk || route.endTaluk
                      }
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleViewRoute(route)}
                  className="p-1 text-blue-400 hover:text-blue-600"
                  title="View on Map"
                >
                  <EyeIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleManageStops(route)}
                  className="p-1 text-green-400 hover:text-green-600"
                  title="Manage Stops"
                >
                  <MapPinIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => toggleRouteStatus(route.id, route.isActive)}
                  className={`p-1 rounded-full ${
                    route.isActive 
                      ? 'text-green-600 hover:bg-green-100' 
                      : 'text-red-600 hover:bg-red-100'
                  }`}
                  title={route.isActive ? 'Deactivate' : 'Activate'}
                >
                  {route.isActive ? (
                    <CheckCircleIcon className="h-5 w-5" />
                  ) : (
                    <XCircleIcon className="h-5 w-5" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setEditingRoute(route);
                    setShowModal(true);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="Edit"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(route.id)}
                  className="p-1 text-red-400 hover:text-red-600"
                  title="Delete"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Distance:</span>
                <span className="font-medium">{route.distance || 'N/A'} km</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Duration:</span>
                <span className="font-medium">{route.duration || 'N/A'} min</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status:</span>
                <span className={`font-medium ${
                  route.isActive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {route.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              {route.trips && route.trips.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Trips:</span>
                  <span className="font-medium">{route.trips.length}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {routes.length === 0 && (
        <div className="text-center py-12">
          <MapIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No routes found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first route.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Route
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Route Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingRoute ? 'Edit Route' : 'Add New Route'}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                toast.success('Route form submission would be implemented here');
                setShowModal(false);
                setEditingRoute(null);
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Route Name
                    </label>
                    <input
                      type="text"
                      defaultValue={editingRoute?.name || ''}
                      className="input-field"
                      placeholder="e.g., Bangalore to Mysore"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Start Point
                    </label>
                    <input
                      type="text"
                      defaultValue={editingRoute?.startPoint || ''}
                      className="input-field"
                      placeholder="e.g., Bangalore City Bus Stand"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      End Point
                    </label>
                    <input
                      type="text"
                      defaultValue={editingRoute?.endPoint || ''}
                      className="input-field"
                      placeholder="e.g., Mysore Bus Stand"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Distance (km)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      defaultValue={editingRoute?.distance || ''}
                      className="input-field"
                      placeholder="e.g., 150.5"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      defaultValue={editingRoute?.duration || ''}
                      className="input-field"
                      placeholder="e.g., 180"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingRoute(null);
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    {editingRoute ? 'Update' : 'Add'} Route
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Route Form Modal */}
      {showRouteForm && (
        <RouteForm
          onRouteCreated={handleRouteCreated}
          onCancel={() => setShowRouteForm(false)}
        />
      )}

      {/* Route Map Modal - Full Screen */}
      {showMapModal && selectedRoute && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  setShowMapModal(false);
                  setSelectedRoute(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {selectedRoute.name} - Live Route Map
                </h1>
                <p className="text-sm text-gray-500">
                  {selectedRoute.startPoint} → {selectedRoute.endPoint}
                </p>
                {(selectedRoute.startDistrict || selectedRoute.endDistrict) && (
                  <p className="text-xs text-gray-400">
                    {selectedRoute.startDistrict && selectedRoute.endDistrict 
                      ? `${selectedRoute.startDistrict} → ${selectedRoute.endDistrict}`
                      : selectedRoute.startDistrict || selectedRoute.endDistrict
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
                  setSelectedRoute(null);
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
                route={selectedRoute}
                tripId={`trip-${selectedRoute.id}`}
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
                        {selectedRoute.distance ? `${selectedRoute.distance.toFixed(1)} km` : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">Duration</span>
                      <span className="text-lg font-bold text-primary-600">
                        {selectedRoute.duration ? `${selectedRoute.duration} min` : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">Status</span>
                      <span className={`text-lg font-bold ${
                        selectedRoute.isActive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {selectedRoute.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Waypoints */}
              {selectedRoute.waypoints && (
                <div className="p-6 border-b border-gray-200 flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Bus Stops</h3>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {(() => {
                      const waypoints = typeof selectedRoute.waypoints === 'string' ? 
                        JSON.parse(selectedRoute.waypoints) : selectedRoute.waypoints;
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

      {/* Stop Management Modal */}
      {showStopManagement && selectedRoute && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-6 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Manage Stops - {selectedRoute.name}
                </h2>
                <p className="text-sm text-gray-500">
                  {selectedRoute.startPoint} → {selectedRoute.endPoint}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowStopManagement(false);
                  setSelectedRoute(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <StopManagement 
              route={selectedRoute}
              onRouteUpdated={handleRouteUpdated}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRoutes;
