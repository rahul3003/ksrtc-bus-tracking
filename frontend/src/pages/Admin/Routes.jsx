import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import RouteForm from '../../components/Routes/RouteForm';
import {
  MapIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const AdminRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [showRouteForm, setShowRouteForm] = useState(false);

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
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {routes.map((route) => (
          <div key={route.id} className="card">
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
                </div>
              </div>
              <div className="flex items-center space-x-2">
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
    </div>
  );
};

export default AdminRoutes;
