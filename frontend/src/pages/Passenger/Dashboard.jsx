import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import {
  TruckIcon,
  MapIcon,
  TicketIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const PassengerDashboard = () => {
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (user?.id) {
      fetchPassengerBookings();
    }
  }, [user]);

  const fetchPassengerBookings = async (isRefresh = false) => {
    if (!user?.id) {
      console.error('User ID not available');
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const response = await axios.get(`${API_BASE_URL}/bookings`, {
        params: {
          userId: user.id
        }
      });

      const bookings = response.data.bookings;
      
      // Filter upcoming bookings (future trips)
      const now = new Date();
      const upcoming = bookings.filter(booking => 
        new Date(booking.trip.scheduledAt) > now && 
        booking.status === 'CONFIRMED'
      );
      
      // Get recent bookings (last 5)
      const recent = bookings.slice(0, 5);
      
      setUpcomingBookings(upcoming);
      setRecentBookings(recent);

    } catch (error) {
      console.error('Error fetching passenger bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      CONFIRMED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status]}`}>
        {status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
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
          <h1 className="text-2xl font-bold text-gray-900">Passenger Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your bus bookings and track your trips
          </p>
        </div>
        <button
          onClick={() => fetchPassengerBookings(true)}
          disabled={refreshing}
          className="btn-secondary flex items-center"
        >
          <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Upcoming Bookings */}
      {upcomingBookings.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Upcoming Trips</h2>
            <Link
              to="/passenger/bookings"
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              View all bookings
            </Link>
          </div>
          
          <div className="space-y-4">
            {upcomingBookings.map((booking) => (
              <div
                key={booking.id}
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
                          {booking.trip.route?.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {booking.trip.route?.startPoint} → {booking.trip.route?.endPoint}
                        </p>
                        <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                          <span>Bus: {booking.trip.bus?.busNumber}</span>
                          {booking.seatNumber && <span>Seat: {booking.seatNumber}</span>}
                          <span>Driver: {booking.trip.driver?.name}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {formatTime(booking.trip.scheduledAt)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(booking.trip.scheduledAt)}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2">
                      {getStatusBadge(booking.status)}
                      
                      <Link
                        to="/passenger/tracking"
                        className="btn-primary text-xs py-1 px-2"
                      >
                        <MapIcon className="h-3 w-3 mr-1" />
                        Track Bus
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Bookings */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Recent Bookings</h2>
          <Link
            to="/passenger/bookings"
            className="text-sm font-medium text-primary-600 hover:text-primary-500"
          >
            View all bookings
          </Link>
        </div>
        
        {recentBookings.length > 0 ? (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trip
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bus
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scheduled
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.trip.route?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.trip.route?.startPoint} → {booking.trip.route?.endPoint}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.trip.bus?.busNumber}
                      {booking.seatNumber && (
                        <span className="text-gray-500"> (Seat {booking.seatNumber})</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(booking.trip.scheduledAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(booking.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6">
            <TicketIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start by finding and booking a trip.
            </p>
            <div className="mt-6">
              <Link
                to="/passenger/routes"
                className="btn-primary"
              >
                Find Routes
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          to="/passenger/routes"
          className="card hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MapIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">Find Routes</h3>
              <p className="text-sm text-gray-500">Search and book bus routes</p>
            </div>
          </div>
        </Link>

        <Link
          to="/passenger/bookings"
          className="card hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TicketIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">My Bookings</h3>
              <p className="text-sm text-gray-500">View and manage your bookings</p>
            </div>
          </div>
        </Link>

        <Link
          to="/passenger/tracking"
          className="card hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TruckIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">Track Bus</h3>
              <p className="text-sm text-gray-500">Track your bus in real-time</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default PassengerDashboard;
