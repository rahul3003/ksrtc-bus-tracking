import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MapPinIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const StopManagement = ({ route, onRouteUpdated }) => {
  const [waypoints, setWaypoints] = useState([]);
  const [editingStop, setEditingStop] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStop, setNewStop] = useState({
    name: '',
    latitude: '',
    longitude: '',
    district: '',
    taluk: ''
  });
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Karnataka Districts and Taluks data
  const karnatakaData = {
    'Bangalore Urban': {
      taluks: ['Bangalore North', 'Bangalore South', 'Bangalore East', 'Bangalore West', 'Anekal', 'Yelahanka'],
      coordinates: { lat: 12.9716, lng: 77.5946 }
    },
    'Mysore': {
      taluks: ['Mysore', 'Hunsur', 'Krishnarajanagara', 'Nanjangud', 'Piriyapatna', 'Tirumakudal Narsipur'],
      coordinates: { lat: 12.2958, lng: 76.6394 }
    },
    'Hassan': {
      taluks: ['Hassan', 'Arsikere', 'Belur', 'Channarayapatna', 'Hole Narsipur', 'Sakleshpur'],
      coordinates: { lat: 13.0049, lng: 76.0995 }
    },
    'Dharwad': {
      taluks: ['Dharwad', 'Hubli', 'Kalghatgi', 'Kundgol', 'Navalgund'],
      coordinates: { lat: 15.3647, lng: 75.1240 }
    },
    'Dakshina Kannada': {
      taluks: ['Mangalore', 'Bantwal', 'Belthangady', 'Kadaba', 'Moodbidri', 'Puttur', 'Sullia'],
      coordinates: { lat: 12.9141, lng: 74.8560 }
    },
    'Davangere': {
      taluks: ['Davangere', 'Channagiri', 'Harihar', 'Honnali', 'Jagalur', 'Mayakonda'],
      coordinates: { lat: 14.4644, lng: 75.9218 }
    },
    'Haveri': {
      taluks: ['Haveri', 'Byadgi', 'Hangal', 'Hirekerur', 'Ranibennur', 'Savanur', 'Shiggaon'],
      coordinates: { lat: 14.7936, lng: 75.4044 }
    }
  };

  useEffect(() => {
    if (route?.waypoints) {
      const parsedWaypoints = typeof route.waypoints === 'string' 
        ? JSON.parse(route.waypoints) 
        : route.waypoints;
      setWaypoints(parsedWaypoints || []);
    }
  }, [route]);

  const geocodeLocation = async (locationName, district, taluk) => {
    try {
      const query = `${locationName}, ${taluk}, ${district}, Karnataka, India`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  const handleAddStop = async () => {
    if (!newStop.name || !newStop.district || !newStop.taluk) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      let coordinates = { latitude: newStop.latitude, longitude: newStop.longitude };
      
      // If coordinates not provided, try to geocode
      if (!newStop.latitude || !newStop.longitude) {
        const geocoded = await geocodeLocation(newStop.name, newStop.district, newStop.taluk);
        if (geocoded) {
          coordinates = geocoded;
        } else {
          toast.error('Could not find coordinates for this location');
          setLoading(false);
          return;
        }
      }

      const stopData = {
        ...newStop,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude
      };

      const updatedWaypoints = [...waypoints, stopData];
      
      // Update route in backend
      const response = await axios.put(`${API_BASE_URL}/routes/${route.id}`, {
        waypoints: JSON.stringify(updatedWaypoints)
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data) {
        setWaypoints(updatedWaypoints);
        setNewStop({ name: '', latitude: '', longitude: '', district: '', taluk: '' });
        setShowAddForm(false);
        toast.success('Stop added successfully');
        if (onRouteUpdated) {
          onRouteUpdated(response.data.route);
        }
      }
    } catch (error) {
      console.error('Error adding stop:', error);
      toast.error('Failed to add stop');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStop = async (index, updatedStop) => {
    setLoading(true);
    try {
      const updatedWaypoints = [...waypoints];
      updatedWaypoints[index] = updatedStop;
      
      const response = await axios.put(`${API_BASE_URL}/routes/${route.id}`, {
        waypoints: JSON.stringify(updatedWaypoints)
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data) {
        setWaypoints(updatedWaypoints);
        setEditingStop(null);
        toast.success('Stop updated successfully');
        if (onRouteUpdated) {
          onRouteUpdated(response.data.route);
        }
      }
    } catch (error) {
      console.error('Error updating stop:', error);
      toast.error('Failed to update stop');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStop = async (index) => {
    if (!window.confirm('Are you sure you want to delete this stop?')) {
      return;
    }

    setLoading(true);
    try {
      const updatedWaypoints = waypoints.filter((_, i) => i !== index);
      
      const response = await axios.put(`${API_BASE_URL}/routes/${route.id}`, {
        waypoints: JSON.stringify(updatedWaypoints)
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data) {
        setWaypoints(updatedWaypoints);
        toast.success('Stop deleted successfully');
        if (onRouteUpdated) {
          onRouteUpdated(response.data.route);
        }
      }
    } catch (error) {
      console.error('Error deleting stop:', error);
      toast.error('Failed to delete stop');
    } finally {
      setLoading(false);
    }
  };

  const getCoordinates = (district) => {
    if (district && karnatakaData[district]) {
      const coords = karnatakaData[district].coordinates;
      setNewStop(prev => ({
        ...prev,
        latitude: coords.lat.toString(),
        longitude: coords.lng.toString()
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Manage Bus Stops</h3>
          <p className="text-sm text-gray-500">Add, edit, or remove intermediate stops for this route</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Stop
        </button>
      </div>

      {/* Add Stop Form */}
      {showAddForm && (
        <div className="bg-gray-50 p-6 rounded-lg border">
          <h4 className="text-md font-medium text-gray-900 mb-4">Add New Stop</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stop Name *
              </label>
              <input
                type="text"
                value={newStop.name}
                onChange={(e) => setNewStop(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., Arsikere Bus Stand"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                District *
              </label>
              <select
                value={newStop.district}
                onChange={(e) => {
                  setNewStop(prev => ({ ...prev, district: e.target.value, taluk: '' }));
                  getCoordinates(e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select District</option>
                {Object.keys(karnatakaData).map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taluk *
              </label>
              <select
                value={newStop.taluk}
                onChange={(e) => setNewStop(prev => ({ ...prev, taluk: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={!newStop.district}
              >
                <option value="">Select Taluk</option>
                {newStop.district && karnatakaData[newStop.district] && 
                  karnatakaData[newStop.district].taluks.map(taluk => (
                    <option key={taluk} value={taluk}>{taluk}</option>
                  ))
                }
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Coordinates (Auto-filled)
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  step="any"
                  value={newStop.latitude}
                  onChange={(e) => setNewStop(prev => ({ ...prev, latitude: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Latitude"
                />
                <input
                  type="number"
                  step="any"
                  value={newStop.longitude}
                  onChange={(e) => setNewStop(prev => ({ ...prev, longitude: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Longitude"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewStop({ name: '', latitude: '', longitude: '', district: '', taluk: '' });
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleAddStop}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Adding...' : 'Add Stop'}
            </button>
          </div>
        </div>
      )}

      {/* Stops List */}
      <div className="space-y-3">
        {waypoints.map((stop, index) => (
          <div key={index} className="bg-white p-4 rounded-lg border shadow-sm">
            {editingStop === index ? (
              <EditStopForm
                stop={stop}
                index={index}
                onSave={handleUpdateStop}
                onCancel={() => setEditingStop(null)}
                karnatakaData={karnatakaData}
              />
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{stop.name}</h4>
                    {(stop.district || stop.taluk) && (
                      <p className="text-xs text-gray-500">
                        {stop.district && stop.taluk 
                          ? `${stop.taluk}, ${stop.district}`
                          : stop.district || stop.taluk
                        }
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      📍 {stop.latitude?.toFixed(4)}, {stop.longitude?.toFixed(4)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditingStop(index)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Edit"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteStop(index)}
                    className="p-1 text-red-400 hover:text-red-600"
                    title="Delete"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {waypoints.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <MapPinIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No intermediate stops added yet</p>
            <p className="text-sm">Click "Add Stop" to add bus stops along this route</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Edit Stop Form Component
const EditStopForm = ({ stop, index, onSave, onCancel, karnatakaData }) => {
  const [editStop, setEditStop] = useState(stop);

  const handleSave = () => {
    onSave(index, editStop);
  };

  const getCoordinates = (district) => {
    if (district && karnatakaData[district]) {
      const coords = karnatakaData[district].coordinates;
      setEditStop(prev => ({
        ...prev,
        latitude: coords.lat,
        longitude: coords.lng
      }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stop Name
          </label>
          <input
            type="text"
            value={editStop.name}
            onChange={(e) => setEditStop(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            District
          </label>
          <select
            value={editStop.district || ''}
            onChange={(e) => {
              setEditStop(prev => ({ ...prev, district: e.target.value, taluk: '' }));
              getCoordinates(e.target.value);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select District</option>
            {Object.keys(karnatakaData).map(district => (
              <option key={district} value={district}>{district}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Taluk
          </label>
          <select
            value={editStop.taluk || ''}
            onChange={(e) => setEditStop(prev => ({ ...prev, taluk: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={!editStop.district}
          >
            <option value="">Select Taluk</option>
            {editStop.district && karnatakaData[editStop.district] && 
              karnatakaData[editStop.district].taluks.map(taluk => (
                <option key={taluk} value={taluk}>{taluk}</option>
              ))
            }
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Coordinates
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              step="any"
              value={editStop.latitude || ''}
              onChange={(e) => setEditStop(prev => ({ ...prev, latitude: parseFloat(e.target.value) }))}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Latitude"
            />
            <input
              type="number"
              step="any"
              value={editStop.longitude || ''}
              onChange={(e) => setEditStop(prev => ({ ...prev, longitude: parseFloat(e.target.value) }))}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Longitude"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="btn-primary"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default StopManagement;
