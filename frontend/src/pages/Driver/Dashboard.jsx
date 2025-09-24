import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import {
  TruckIcon,
  MapIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  StopIcon
} from '@heroicons/react/24/outline';

const DriverDashboard = () => {
  const [todayTrips, setTodayTrips] = useState([]);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const { user } = useAuth();

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (user?.id) {
      fetchDriverTrips();
      
      // Set up auto-refresh every 30 seconds
      const interval = setInterval(() => {
        fetchDriverTrips();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchDriverTrips = async () => {
    if (!user?.id) {
      console.error('User ID not available');
      setLoading(false);
      setError('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching trips for driver:', user.id);
      
      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const response = await axios.get(`${API_BASE_URL}/trips/driver/${user.id}`, {
        params: {
          date: today.toISOString().split('T')[0]
        }
      });

      console.log('Trips response:', response.data);
      const trips = response.data.trips || [];
      setTodayTrips(trips);

      // Find current trip (in progress)
      const activeTrip = trips.find(trip => trip.status === 'IN_PROGRESS');
      setCurrentTrip(activeTrip);

      console.log('Today trips:', trips.length, 'Active trip:', activeTrip);
      
      // Update last updated timestamp
      setLastUpdated(new Date());

    } catch (error) {
      console.error('Error fetching driver trips:', error);
      setError(error.response?.data?.message || 'Failed to fetch trips');
      
      // Set empty data on error
      setTodayTrips([]);
      setCurrentTrip(null);
    } finally {
      setLoading(false);
    }
  };

  const updateTripStatus = async (tripId, status) => {
    try {
      await axios.put(`${API_BASE_URL}/trips/${tripId}/status`, { status });
      
      // Refresh trips
      await fetchDriverTrips();
      
    } catch (error) {
      console.error('Error updating trip status:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      SCHEDULED: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-blue-100 text-blue-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status]}`}>
        {status.replace('_', ' ')}
      </span>
    );
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

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Dashboard</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <div className="mt-6">
            <button
              onClick={fetchDriverTrips}
              className="btn-primary"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Driver Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your trips and track your bus location
            {lastUpdated && (
              <span className="ml-2 text-xs text-gray-400">
                • Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={fetchDriverTrips}
          disabled={loading}
          className="btn-secondary flex items-center"
        >
          <svg 
            className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Active Trip Section */}
      {currentTrip ? (
        <div className="card bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TruckIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-xl font-bold text-green-900">
                    Active Trip
                  </h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
                    IN PROGRESS
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {currentTrip.route?.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {currentTrip.route?.startPoint} → {currentTrip.route?.endPoint}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <TruckIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Bus: <span className="font-medium text-gray-900">{currentTrip.bus?.busNumber}</span></span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <ClockIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Started: <span className="font-medium text-gray-900">{formatTime(currentTrip.scheduledAt)}</span></span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircleIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Capacity: <span className="font-medium text-gray-900">{currentTrip.bus?.capacity} seats</span></span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Bookings: <span className="font-medium text-gray-900">{currentTrip._count?.bookings || 0}</span></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col space-y-2">
              <Link
                to="/driver/tracking"
                className="btn-primary bg-green-600 hover:bg-green-700 flex items-center justify-center"
              >
                <MapIcon className="h-4 w-4 mr-2" />
                Live Tracking
              </Link>
              <button
                onClick={() => updateTripStatus(currentTrip.id, 'COMPLETED')}
                className="btn-secondary flex items-center justify-center"
              >
                <StopIcon className="h-4 w-4 mr-2" />
                Complete Trip
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card bg-blue-50 border-blue-200">
          <div className="text-center py-6">
            <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <TruckIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-blue-900 mb-2">No Active Trip</h3>
            <p className="text-sm text-blue-700 mb-4">
              You don't have any trips in progress right now. Check your scheduled trips below.
            </p>
            <Link
              to="/driver/trips"
              className="btn-primary bg-blue-600 hover:bg-blue-700"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              View All Trips
            </Link>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CalendarIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Today's Trips</h3>
              <p className="text-2xl font-bold text-gray-900">{todayTrips.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Completed</h3>
              <p className="text-2xl font-bold text-gray-900">
                {todayTrips.filter(trip => trip.status === 'COMPLETED').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TruckIcon className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Bookings</h3>
              <p className="text-2xl font-bold text-gray-900">
                {todayTrips.reduce((total, trip) => total + (trip._count?.bookings || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Trips */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Today's Trips</h2>
          <Link
            to="/driver/trips"
            className="text-sm font-medium text-primary-600 hover:text-primary-500"
          >
            View all trips
          </Link>
        </div>
        
        {todayTrips.length > 0 ? (
          <div className="space-y-4">
            {todayTrips.map((trip) => (
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
                          {trip.route?.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {trip.route?.startPoint} → {trip.route?.endPoint}
                        </p>
                        <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                          <span>Bus: {trip.bus?.busNumber}</span>
                          <span>Capacity: {trip.bus?.capacity}</span>
                          <span>Bookings: {trip._count?.bookings || 0}</span>
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
                      {getStatusBadge(trip.status)}
                      
                      {trip.status === 'SCHEDULED' && (
                        <button
                          onClick={() => updateTripStatus(trip.id, 'IN_PROGRESS')}
                          className="btn-primary text-xs py-1 px-2"
                        >
                          <PlayIcon className="h-3 w-3 mr-1" />
                          Start Trip
                        </button>
                      )}
                      
                      {trip.status === 'IN_PROGRESS' && (
                        <Link
                          to="/driver/tracking"
                          className="btn-secondary text-xs py-1 px-2"
                        >
                          <MapIcon className="h-3 w-3 mr-1" />
                          Track
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No trips today</h3>
            <p className="mt-1 text-sm text-gray-500">
              You don't have any trips scheduled for today.
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          to="/driver/trips"
          className="card hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CalendarIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">All Trips</h3>
              <p className="text-sm text-gray-500">View and manage all your trips</p>
            </div>
          </div>
        </Link>

        <Link
          to="/driver/tracking"
          className="card hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MapIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">Live Tracking</h3>
              <p className="text-sm text-gray-500">Update location and track your bus</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default DriverDashboard;
