import { useState, useEffect } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useNotifications } from '../../contexts/NotificationContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import OpenStreetMapComponent from '../../components/Maps/OpenStreetMapComponent';
import {
  MapIcon,
  TruckIcon,
  MapPinIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const PassengerTracking = () => {
  const [bookings, setBookings] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  const { socket, isConnected, joinTrip, leaveTrip, onLocationUpdate } = useSocket();
  const { notificationService } = useNotifications();

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchUpcomingBookings();
  }, []);

  useEffect(() => {
    if (socket && selectedTrip) {
      joinTrip(selectedTrip.id);
      
      const cleanup = onLocationUpdate((data) => {
        if (data.tripId === selectedTrip.id) {
          setCurrentLocation(data.location);
        }
      });

      return () => {
        cleanup();
        leaveTrip(selectedTrip.id);
      };
    }
  }, [socket, selectedTrip, joinTrip, leaveTrip, onLocationUpdate]);

  const fetchUpcomingBookings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/bookings`, {
        params: {
          userId: localStorage.getItem('userId'),
          status: 'CONFIRMED'
        }
      });

      const bookings = response.data.bookings;
      const now = new Date();
      
      // Filter upcoming trips
      const upcomingBookings = bookings.filter(booking => 
        new Date(booking.trip.scheduledAt) > now
      );

      setBookings(upcomingBookings);
      
      // Auto-select the first upcoming trip if available
      if (upcomingBookings.length > 0) {
        setSelectedTrip(upcomingBookings[0].trip);
        await fetchLatestLocation(upcomingBookings[0].trip.id);
      }

    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
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

  const handleTripSelect = async (trip) => {
    setSelectedTrip(trip);
    await fetchLatestLocation(trip.id);
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
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
        <h1 className="text-2xl font-bold text-gray-900">Track Bus</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track your bus in real-time
        </p>
      </div>

      {/* Trip Selection */}
      {bookings.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Select Trip to Track</h2>
          <div className="space-y-2">
            {bookings.map((booking) => (
              <button
                key={booking.id}
                onClick={() => handleTripSelect(booking.trip)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedTrip?.id === booking.trip.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {booking.trip.route?.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {booking.trip.route?.startPoint} → {booking.trip.route?.endPoint}
                    </p>
                    <div className="mt-1 text-xs text-gray-500">
                      Bus: {booking.trip.bus?.busNumber}
                      {booking.seatNumber && ` • Seat: ${booking.seatNumber}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatTime(booking.trip.scheduledAt)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(booking.trip.scheduledAt)}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tracking Information */}
      {selectedTrip ? (
        <>
          {/* Trip Details */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">
                  {selectedTrip.route?.name}
                </h2>
                <p className="text-sm text-gray-500">
                  {selectedTrip.route?.startPoint} → {selectedTrip.route?.endPoint}
                </p>
                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                  <span>Bus: {selectedTrip.bus?.busNumber}</span>
                  <span>Driver: {selectedTrip.driver?.name}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-sm text-gray-500">
                  {isConnected ? 'Live' : 'Offline'}
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
                  <h3 className="text-sm font-medium text-gray-500">Last Update</h3>
                  <p className="text-lg font-semibold text-gray-900">
                    {currentLocation ? 
                      new Date(currentLocation.timestamp).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 
                      'N/A'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* OpenStreetMap Integration */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Live Bus Tracking</h3>
            <OpenStreetMapComponent
              center={currentLocation ? 
                [currentLocation.latitude, currentLocation.longitude] : 
                [12.9716, 77.5946]
              }
              zoom={15}
              busLocations={currentLocation ? [{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                busNumber: selectedTrip?.bus?.busNumber || 'Unknown',
                routeName: selectedTrip?.route?.name || 'Unknown Route',
                driverName: selectedTrip?.driver?.name || 'Unknown Driver',
                speed: currentLocation.speed,
                status: selectedTrip?.status || 'Unknown',
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
        </>
      ) : (
        <div className="text-center py-12">
          <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No trips to track</h3>
          <p className="mt-1 text-sm text-gray-500">
            You need to have upcoming bookings to track a bus.
          </p>
          <div className="mt-6">
            <a
              href="/passenger/routes"
              className="btn-primary"
            >
              Find Routes
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default PassengerTracking;
