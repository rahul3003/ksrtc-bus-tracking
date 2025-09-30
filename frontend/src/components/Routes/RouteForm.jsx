import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  MapPinIcon,
  PlusIcon,
  XMarkIcon,
  MapIcon,
  MagnifyingGlassIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

const RouteForm = ({ onRouteCreated, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    startPoint: '',
    endPoint: '',
    startDistrict: '',
    endDistrict: '',
    startTaluk: '',
    endTaluk: '',
    startLatitude: '',
    startLongitude: '',
    endLatitude: '',
    endLongitude: '',
    description: '',
    waypoints: []
  });
  const [loading, setLoading] = useState(false);
  const [showCoordinates, setShowCoordinates] = useState(false);
  const [newWaypoint, setNewWaypoint] = useState({ name: '', latitude: '', longitude: '', district: '', taluk: '' });
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Karnataka Districts and Taluks data
  const karnatakaData = useMemo(() => ({
    'Bangalore Urban': {
      taluks: ['Bangalore North', 'Bangalore South', 'Bangalore East', 'Bangalore West', 'Anekal', 'Yelahanka'],
      coordinates: { lat: 12.9716, lng: 77.5946 }
    },
    'Mysore': {
      taluks: ['Mysore', 'Hunsur', 'Krishnarajanagara', 'Nanjangud', 'Piriyapatna', 'Saragur', 'Tirumakudal Narsipur'],
      coordinates: { lat: 12.2958, lng: 76.6394 }
    },
    'Dharwad': {
      taluks: ['Dharwad', 'Hubli', 'Kalghatgi', 'Kundgol', 'Navalgund'],
      coordinates: { lat: 15.3647, lng: 75.1240 }
    },
    'Dakshina Kannada': {
      taluks: ['Mangalore', 'Bantwal', 'Belthangady', 'Kadaba', 'Moodbidri', 'Puttur', 'Sullia'],
      coordinates: { lat: 12.9141, lng: 74.8560 }
    },
    'Hassan': {
      taluks: ['Hassan', 'Alur', 'Arsikere', 'Belur', 'Channarayapatna', 'Holenarasipura', 'Sakleshpur'],
      coordinates: { lat: 13.0048, lng: 76.1025 }
    },
    'Belgaum': {
      taluks: ['Belgaum', 'Athani', 'Bailhongal', 'Chikkodi', 'Gokak', 'Hukkeri', 'Khanapur', 'Raibag', 'Ramdurg', 'Savadatti'],
      coordinates: { lat: 15.8497, lng: 74.4977 }
    },
    'Tumkur': {
      taluks: ['Tumkur', 'Chikkanayakanahalli', 'Gubbi', 'Koratagere', 'Kunigal', 'Madhugiri', 'Pavagada', 'Sira', 'Tiptur', 'Turuvekere'],
      coordinates: { lat: 13.3409, lng: 77.1022 }
    },
    'Udupi': {
      taluks: ['Udupi', 'Baindoor', 'Brahmavar', 'Byndoor', 'Hebri', 'Karkala', 'Kundapura'],
      coordinates: { lat: 13.3409, lng: 74.7421 }
    },
    'Chitradurga': {
      taluks: ['Chitradurga', 'Challakere', 'Hiriyur', 'Hosadurga', 'Holalkere', 'Molakalmuru'],
      coordinates: { lat: 14.2254, lng: 76.3980 }
    },
    'Shimoga': {
      taluks: ['Shimoga', 'Bhadravati', 'Hosanagara', 'Sagar', 'Shikaripura', 'Sorab', 'Thirthahalli'],
      coordinates: { lat: 13.9299, lng: 75.5681 }
    },
    'Bellary': {
      taluks: ['Bellary', 'Hospet', 'Kudligi', 'Sandur', 'Siruguppa'],
      coordinates: { lat: 15.1394, lng: 76.9214 }
    },
    'Raichur': {
      taluks: ['Raichur', 'Devadurga', 'Lingsugur', 'Manvi', 'Sindhnur'],
      coordinates: { lat: 16.2049, lng: 77.3550 }
    },
    'Davangere': {
      taluks: ['Davangere', 'Channagiri', 'Harihar', 'Honnali', 'Jagalur', 'Mayakonda'],
      coordinates: { lat: 14.4644, lng: 75.9218 }
    },
    'Haveri': {
      taluks: ['Haveri', 'Byadgi', 'Hangal', 'Hirekerur', 'Ranibennur', 'Savanur', 'Shiggaon'],
      coordinates: { lat: 14.7936, lng: 75.4044 }
    }
  }), []);

  // Update taluks when district changes
  useEffect(() => {
    if (formData.startDistrict && karnatakaData[formData.startDistrict]) {
      // Reset taluk when district changes
      setFormData(prev => ({
        ...prev,
        startTaluk: ''
      }));
    }
  }, [formData.startDistrict, karnatakaData]);

  // Also reset end taluk when end district changes
  useEffect(() => {
    if (formData.endDistrict && karnatakaData[formData.endDistrict]) {
      setFormData(prev => ({
        ...prev,
        endTaluk: ''
      }));
    }
  }, [formData.endDistrict, karnatakaData]);

  // Reset waypoint taluk when waypoint district changes
  useEffect(() => {
    if (newWaypoint.district && karnatakaData[newWaypoint.district]) {
      setNewWaypoint(prev => ({
        ...prev,
        taluk: ''
      }));
    }
  }, [newWaypoint.district, karnatakaData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-fill coordinates when district is selected
    if (name === 'startDistrict' && karnatakaData[value]) {
      const coords = karnatakaData[value].coordinates;
      setFormData(prev => ({
        ...prev,
        startLatitude: coords.lat.toString(),
        startLongitude: coords.lng.toString()
      }));
    } else if (name === 'endDistrict' && karnatakaData[value]) {
      const coords = karnatakaData[value].coordinates;
      setFormData(prev => ({
        ...prev,
        endLatitude: coords.lat.toString(),
        endLongitude: coords.lng.toString()
      }));
    }
  };

  // Geocoding function to get coordinates from location name
  const geocodeLocation = async (locationName, district, taluk) => {
    try {
      setGeocodingLoading(true);
      
      // Create a search query with location, taluk, district, Karnataka
      const query = `${locationName}, ${taluk}, ${district}, Karnataka, India`;
      
      // Use OpenStreetMap Nominatim API (free)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=in`
      );
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        };
      }
      
      // Fallback to district coordinates if specific location not found
      if (karnatakaData[district]) {
        return karnatakaData[district].coordinates;
      }
      
      return null;
    } catch (err) {
      console.error('Geocoding error:', err);
      toast.error('Failed to get coordinates for location');
      return null;
    } finally {
      setGeocodingLoading(false);
    }
  };

  const addWaypoint = () => {
    if (newWaypoint.name && newWaypoint.latitude && newWaypoint.longitude) {
      setFormData(prev => ({
        ...prev,
        waypoints: [...prev.waypoints, {
          name: newWaypoint.name,
          latitude: parseFloat(newWaypoint.latitude),
          longitude: parseFloat(newWaypoint.longitude),
          district: newWaypoint.district,
          taluk: newWaypoint.taluk,
          stopTime: 30000 // 30 seconds default
        }]
      }));
      setNewWaypoint({ name: '', latitude: '', longitude: '', district: '', taluk: '' });
    }
  };

  // Auto-get coordinates for start point
  const getStartCoordinates = async () => {
    if (!formData.startPoint || !formData.startDistrict || !formData.startTaluk) {
      toast.error('Please fill in start point, district, and taluk first');
      return;
    }

    const coords = await geocodeLocation(formData.startPoint, formData.startDistrict, formData.startTaluk);
    if (coords) {
      setFormData(prev => ({
        ...prev,
        startLatitude: coords.latitude.toString(),
        startLongitude: coords.longitude.toString()
      }));
      toast.success('Start coordinates updated!');
    }
  };

  // Auto-get coordinates for end point
  const getEndCoordinates = async () => {
    if (!formData.endPoint || !formData.endDistrict || !formData.endTaluk) {
      toast.error('Please fill in end point, district, and taluk first');
      return;
    }

    const coords = await geocodeLocation(formData.endPoint, formData.endDistrict, formData.endTaluk);
    if (coords) {
      setFormData(prev => ({
        ...prev,
        endLatitude: coords.latitude.toString(),
        endLongitude: coords.longitude.toString()
      }));
      toast.success('End coordinates updated!');
    }
  };

  // Auto-get coordinates for waypoint
  const getWaypointCoordinates = async () => {
    if (!newWaypoint.name || !newWaypoint.district || !newWaypoint.taluk) {
      toast.error('Please fill in waypoint name, district, and taluk first');
      return;
    }

    const coords = await geocodeLocation(newWaypoint.name, newWaypoint.district, newWaypoint.taluk);
    if (coords) {
      setNewWaypoint(prev => ({
        ...prev,
        latitude: coords.latitude.toString(),
        longitude: coords.longitude.toString()
      }));
      toast.success('Waypoint coordinates updated!');
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
        () => {
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
        startDistrict: '',
        endDistrict: '',
        startTaluk: '',
        endTaluk: '',
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
                placeholder="e.g., Bangalore City Bus Stand (Majestic)"
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
                placeholder="e.g., Mysore City Bus Stand"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start District
              </label>
              <select
                name="startDistrict"
                value={formData.startDistrict}
                onChange={handleInputChange}
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
                End District
              </label>
              <select
                name="endDistrict"
                value={formData.endDistrict}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select District</option>
                {Object.keys(karnatakaData).map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Taluk
              </label>
              <select
                name="startTaluk"
                value={formData.startTaluk}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={!formData.startDistrict}
              >
                <option value="">Select Taluk</option>
                {formData.startDistrict && karnatakaData[formData.startDistrict] && 
                  karnatakaData[formData.startDistrict].taluks.map(taluk => (
                    <option key={taluk} value={taluk}>{taluk}</option>
                  ))
                }
              </select>
              {formData.startDistrict && (
                <p className="text-xs text-gray-500 mt-1">
                  Available taluks: {karnatakaData[formData.startDistrict]?.taluks.length || 0}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Taluk
              </label>
              <select
                name="endTaluk"
                value={formData.endTaluk}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={!formData.endDistrict}
              >
                <option value="">Select Taluk</option>
                {formData.endDistrict && karnatakaData[formData.endDistrict] && 
                  karnatakaData[formData.endDistrict].taluks.map(taluk => (
                    <option key={taluk} value={taluk}>{taluk}</option>
                  ))
                }
              </select>
              {formData.endDistrict && (
                <p className="text-xs text-gray-500 mt-1">
                  Available taluks: {karnatakaData[formData.endDistrict]?.taluks.length || 0}
                </p>
              )}
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
                        onClick={getStartCoordinates}
                        disabled={geocodingLoading}
                        className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                        title="Auto-get coordinates from location"
                      >
                        {geocodingLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <GlobeAltIcon className="h-4 w-4" />
                        )}
                      </button>
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
                        onClick={getEndCoordinates}
                        disabled={geocodingLoading}
                        className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                        title="Auto-get coordinates from location"
                      >
                        {geocodingLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <GlobeAltIcon className="h-4 w-4" />
                        )}
                      </button>
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
                <div key={index} className="p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-600">{index + 1}.</span>
                        <span className="text-sm font-medium text-gray-900">{waypoint.name}</span>
                      </div>
                      {(waypoint.district || waypoint.taluk) && (
                        <div className="mt-1 text-xs text-gray-500">
                          {waypoint.district && waypoint.taluk 
                            ? `${waypoint.taluk}, ${waypoint.district}`
                            : waypoint.district || waypoint.taluk
                          }
                        </div>
                      )}
                      <div className="mt-1 text-xs text-gray-400">
                        📍 {waypoint.latitude.toFixed(4)}, {waypoint.longitude.toFixed(4)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeWaypoint(index)}
                      className="text-red-600 hover:text-red-800 ml-2"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newWaypoint.name}
                    onChange={(e) => setNewWaypoint(prev => ({ ...prev, name: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Bus stop name"
                  />
                  <select
                    value={newWaypoint.district}
                    onChange={(e) => setNewWaypoint(prev => ({ ...prev, district: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">District</option>
                    {Object.keys(karnatakaData).map(district => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                  <select
                    value={newWaypoint.taluk}
                    onChange={(e) => setNewWaypoint(prev => ({ ...prev, taluk: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={!newWaypoint.district}
                  >
                    <option value="">Taluk</option>
                    {newWaypoint.district && karnatakaData[newWaypoint.district] && 
                      karnatakaData[newWaypoint.district].taluks.map(taluk => (
                        <option key={taluk} value={taluk}>{taluk}</option>
                      ))
                    }
                  </select>
                </div>
                
                <div className="flex space-x-2">
                  <input
                    type="number"
                    step="any"
                    value={newWaypoint.latitude}
                    onChange={(e) => setNewWaypoint(prev => ({ ...prev, latitude: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Latitude"
                  />
                  <input
                    type="number"
                    step="any"
                    value={newWaypoint.longitude}
                    onChange={(e) => setNewWaypoint(prev => ({ ...prev, longitude: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Longitude"
                  />
                  <button
                    type="button"
                    onClick={getWaypointCoordinates}
                    disabled={geocodingLoading}
                    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                    title="Auto-get coordinates"
                  >
                    {geocodingLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <GlobeAltIcon className="h-4 w-4" />
                    )}
                  </button>
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
