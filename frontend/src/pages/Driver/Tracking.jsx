import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import OpenStreetMapComponent from '../../components/Maps/OpenStreetMapComponent';
import {
  MapIcon,
  MapPinIcon,
  ClockIcon,
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const DriverTracking = () => {
  const [currentTrip, setCurrentTrip] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [locationHistory, setLocationHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { socket, isConnected } = useSocket();
  const { notificationService } = useNotifications();
  const { user } = useAuth();
  const watchId = useRef(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (user?.id) {
      fetchCurrentTrip();
    }
    
    return () => {
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [user]);

  useEffect(() => {
    if (socket && currentTrip) {
      // Listen for location updates from other clients
      const handleLocationUpdate = (data) => {
        if (data.tripId === currentTrip.id) {
          setCurrentLocation(data.location);
        }
      };

      socket.on('location-update', handleLocationUpdate);
      
      return () => {
        socket.off('location-update', handleLocationUpdate);
      };
    }
  }, [socket, currentTrip]);

  const fetchCurrentTrip = async () => {
    if (!user?.id) {
      console.error('User ID not available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Get today's trips for the driver
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const response = await axios.get(`${API_BASE_URL}/trips/driver/${user.id}`, {
        params: {
          date: today.toISOString().split('T')[0],
          status: 'IN_PROGRESS'
        }
      });

      const trips = response.data.trips;
      if (trips.length > 0) {
        const trip = trips[0];
        setCurrentTrip(trip);
        
        // Fetch latest location
        await fetchLatestLocation(trip.id);
      } else {
        setError('No active trip found. Please start a trip first.');
      }

    } catch (error) {
      console.error('Error fetching current trip:', error);
      setError('Failed to load trip information');
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestLocation = async (tripId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/locations/trip/${tripId}/latest`);
      if (response.data.location) {
        setCurrentLocation(response.data.location);
      }
    } catch (error) {
      console.error('Error fetching latest location:', error);
    }
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    setIsTracking(true);
    
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed, heading } = position.coords;
        
        const locationData = {
          latitude,
          longitude,
          speed: speed ? speed * 3.6 : null, // Convert m/s to km/h
          heading
        };

        setCurrentLocation(locationData);
        sendLocationUpdate(locationData);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Failed to get location: ' + error.message);
        setIsTracking(false);
      },
      options
    );

    toast.success('Location tracking started');
  };

  const stopTracking = () => {
    if (watchId.current) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    
    setIsTracking(false);
    toast.success('Location tracking stopped');
  };

  const sendLocationUpdate = async (locationData) => {
    try {
      await axios.post(`${API_BASE_URL}/locations/trip/${currentTrip.id}`, locationData);
      
      // Emit real-time update via socket
      if (socket && isConnected) {
        socket.emit('location-update', {
          tripId: currentTrip.id,
          ...locationData
        });
      }
    } catch (error) {
      console.error('Error sending location update:', error);
      toast.error('Failed to update location');
    }
  };

  const formatSpeed = (speed) => {
    return speed ? `${Math.round(speed)} km/h` : 'N/A';
  };

  const formatHeading = (heading) => {
    if (heading === null || heading === undefined) return 'N/A';
    
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(heading / 45) % 8;
    return `${Math.round(heading)}° ${directions[index]}`;
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <div className="mt-6">
          <button
            onClick={fetchCurrentTrip}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!currentTrip) {
    return (
      <div className="text-center py-12">
        <MapIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No Active Trip</h3>
        <p className="mt-1 text-sm text-gray-500">
          You need to start a trip before you can track your location.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Live Tracking</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track your bus location in real-time
        </p>
      </div>

      {/* Trip Information */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">
              {currentTrip.route?.name}
            </h2>
            <p className="text-sm text-gray-500">
              {currentTrip.route?.startPoint} → {currentTrip.route?.endPoint}
            </p>
            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
              <span>Bus: {currentTrip.bus?.busNumber}</span>
              <span>Driver: {currentTrip.driver?.name}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-sm text-gray-500">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Location Information */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MapPinIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Current Location</h3>
              <p className="text-lg font-semibold text-gray-900">
                {currentLocation ? (
                  <>
                    {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                  </>
                ) : (
                  'Not available'
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Speed</h3>
              <p className="text-lg font-semibold text-gray-900">
                {currentLocation ? formatSpeed(currentLocation.speed) : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Heading</h3>
              <p className="text-lg font-semibold text-gray-900">
                {currentLocation ? formatHeading(currentLocation.heading) : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tracking Controls */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Location Tracking</h3>
            <p className="text-sm text-gray-500">
              {isTracking ? 'Currently tracking your location' : 'Start tracking to update your location'}
            </p>
          </div>
          <div className="flex space-x-2">
            {!isTracking ? (
              <button
                onClick={startTracking}
                className="btn-primary"
              >
                <MapIcon className="h-4 w-4 mr-2" />
                Start Tracking
              </button>
            ) : (
              <button
                onClick={stopTracking}
                className="btn-danger"
              >
                Stop Tracking
              </button>
            )}
          </div>
        </div>
      </div>

      {/* OpenStreetMap Integration */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Live Map View</h3>
        <OpenStreetMapComponent
          center={currentLocation ? 
            [currentLocation.latitude, currentLocation.longitude] : 
            [12.9716, 77.5946]
          }
          zoom={15}
          busLocations={currentLocation ? [{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            busNumber: currentTrip?.bus?.busNumber || 'Unknown',
            routeName: currentTrip?.route?.name || 'Unknown Route',
            driverName: currentTrip?.driver?.name || 'Unknown Driver',
            speed: currentLocation.speed,
            status: currentTrip?.status || 'Unknown',
            timestamp: currentLocation.timestamp,
            heading: currentLocation.heading
          }] : []}
          busStops={[]} // You can add bus stops data here
          className="h-96 w-full"
        />
        {currentLocation && (
          <div className="mt-4 grid grid-cols-2 gap-4 text-xs text-gray-500">
            <div>
              <p>Latitude: {currentLocation.latitude.toFixed(6)}</p>
              <p>Longitude: {currentLocation.longitude.toFixed(6)}</p>
            </div>
            <div>
              <p>Speed: {formatSpeed(currentLocation.speed)}</p>
              <p>Heading: {formatHeading(currentLocation.heading)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverTracking;
