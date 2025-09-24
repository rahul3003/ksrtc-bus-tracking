import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  MapPinIcon,
  PlusIcon,
  XMarkIcon,
  MapIcon
} from '@heroicons/react/24/outline';

const RouteForm = ({ onRouteCreated, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    startPoint: '',
    endPoint: '',
    startLatitude: '',
    startLongitude: '',
    endLatitude: '',
    endLongitude: '',
    description: '',
    waypoints: []
  });
  const [loading, setLoading] = useState(false);
  const [showCoordinates, setShowCoordinates] = useState(false);
  const [newWaypoint, setNewWaypoint] = useState({ name: '', latitude: '', longitude: '' });

  const { user } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addWaypoint = () => {
    if (newWaypoint.name && newWaypoint.latitude && newWaypoint.longitude) {
      setFormData(prev => ({
        ...prev,
        waypoints: [...prev.waypoints, {
          name: newWaypoint.name,
          latitude: parseFloat(newWaypoint.latitude),
          longitude: parseFloat(newWaypoint.longitude),
          stopTime: 30000 // 30 seconds default
        }]
      }));
      setNewWaypoint({ name: '', latitude: '', longitude: '' });
    }
  };

  const removeWaypoint = (index) => {
    setFormData(prev => ({
      ...prev,
      waypoints: prev.waypoints.filter((_, i) => i !== index)
    }));
  };

  const getCurrentLocation = (type) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (type === 'start') {
            setFormData(prev => ({
              ...prev,
              startLatitude: latitude.toFixed(6),
              startLongitude: longitude.toFixed(6)
            }));
          } else {
            setFormData(prev => ({
              ...prev,
              endLatitude: latitude.toFixed(6),
              endLongitude: longitude.toFixed(6)
            }));
          }
          toast.success(`${type === 'start' ? 'Start' : 'End'} location set!`);
        },
        (error) => {
          toast.error('Failed to get current location');
        }
      );
    } else {
      toast.error('Geolocation is not supported');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.startPoint || !formData.endPoint) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      const routeData = {
        ...formData,
        startLatitude: formData.startLatitude ? parseFloat(formData.startLatitude) : null,
        startLongitude: formData.startLongitude ? parseFloat(formData.startLongitude) : null,
        endLatitude: formData.endLatitude ? parseFloat(formData.endLatitude) : null,
        endLongitude: formData.endLongitude ? parseFloat(formData.endLongitude) : null,
        waypoints: formData.waypoints.length > 0 ? formData.waypoints : null
      };

      const response = await axios.post(`${API_BASE_URL}/routes`, routeData);
      
      toast.success('Route created successfully!');
      onRouteCreated(response.data.route);
      
      // Reset form
      setFormData({
        name: '',
        startPoint: '',
        endPoint: '',
        startLatitude: '',
        startLongitude: '',
        endLatitude: '',
        endLongitude: '',
        description: '',
        waypoints: []
      });
      
    } catch (error) {
      console.error('Error creating route:', error);
      toast.error('Failed to create route');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Create New Route</h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
          {/* Basic Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Route Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., City Center to Airport"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Point *
              </label>
              <input
                type="text"
                name="startPoint"
                value={formData.startPoint}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., City Center"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Point *
              </label>
              <input
                type="text"
                name="endPoint"
                value={formData.endPoint}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., Airport Terminal"
                required
              />
            </div>
          </div>

          {/* Coordinates Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Coordinates (Optional)
              </label>
              <button
                type="button"
                onClick={() => setShowCoordinates(!showCoordinates)}
                className="text-sm text-primary-600 hover:text-primary-800"
              >
                {showCoordinates ? 'Hide' : 'Show'} Coordinates
              </button>
            </div>

            {showCoordinates && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Coordinates
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        step="any"
                        name="startLatitude"
                        value={formData.startLatitude}
                        onChange={handleInputChange}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Latitude"
                      />
                      <input
                        type="number"
                        step="any"
                        name="startLongitude"
                        value={formData.startLongitude}
                        onChange={handleInputChange}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Longitude"
                      />
                      <button
                        type="button"
                        onClick={() => getCurrentLocation('start')}
                        className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                        title="Use current location"
                      >
                        <MapPinIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Coordinates
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        step="any"
                        name="endLatitude"
                        value={formData.endLatitude}
                        onChange={handleInputChange}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Latitude"
                      />
                      <input
                        type="number"
                        step="any"
                        name="endLongitude"
                        value={formData.endLongitude}
                        onChange={handleInputChange}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Longitude"
                      />
                      <button
                        type="button"
                        onClick={() => getCurrentLocation('end')}
                        className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                        title="Use current location"
                      >
                        <MapPinIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-500">
                  💡 Coordinates will be used to generate real road paths instead of straight lines
                </p>
              </div>
            )}
          </div>

          {/* Waypoints */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bus Stops (Optional)
            </label>
            
            <div className="space-y-3">
              {formData.waypoints.map((waypoint, index) => (
                <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                  <span className="text-sm font-medium text-gray-600">{index + 1}.</span>
                  <span className="flex-1 text-sm">{waypoint.name}</span>
                  <span className="text-xs text-gray-500">
                    {waypoint.latitude.toFixed(4)}, {waypoint.longitude.toFixed(4)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeWaypoint(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}

              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newWaypoint.name}
                  onChange={(e) => setNewWaypoint(prev => ({ ...prev, name: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Bus stop name"
                />
                <input
                  type="number"
                  step="any"
                  value={newWaypoint.latitude}
                  onChange={(e) => setNewWaypoint(prev => ({ ...prev, latitude: e.target.value }))}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Lat"
                />
                <input
                  type="number"
                  step="any"
                  value={newWaypoint.longitude}
                  onChange={(e) => setNewWaypoint(prev => ({ ...prev, longitude: e.target.value }))}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Lng"
                />
                <button
                  type="button"
                  onClick={addWaypoint}
                  className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Route description..."
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Route'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RouteForm;
