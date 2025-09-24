import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  TruckIcon,
  MapIcon,
  CalendarIcon,
  UsersIcon,
  TicketIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalBuses: 0,
    activeBuses: 0,
    totalRoutes: 0,
    activeRoutes: 0,
    totalTrips: 0,
    todayTrips: 0,
    totalUsers: 0,
    totalBookings: 0
  });
  const [recentTrips, setRecentTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [
        busesResponse,
        routesResponse,
        tripsResponse,
        usersResponse,
        bookingsResponse
      ] = await Promise.all([
        axios.get(`${API_BASE_URL}/buses`),
        axios.get(`${API_BASE_URL}/routes`),
        axios.get(`${API_BASE_URL}/trips`),
        axios.get(`${API_BASE_URL}/users`),
        axios.get(`${API_BASE_URL}/bookings`)
      ]);

      const buses = busesResponse.data.buses;
      const routes = routesResponse.data.routes;
      const trips = tripsResponse.data.trips;
      const users = usersResponse.data.users;
      const bookings = bookingsResponse.data.bookings;

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayTrips = trips.filter(trip => {
        const tripDate = new Date(trip.scheduledAt);
        return tripDate >= today && tripDate < tomorrow;
      });

      setStats({
        totalBuses: buses.length,
        activeBuses: buses.filter(bus => bus.isActive).length,
        totalRoutes: routes.length,
        activeRoutes: routes.filter(route => route.isActive).length,
        totalTrips: trips.length,
        todayTrips: todayTrips.length,
        totalUsers: users.length,
        totalBookings: bookings.length
      });

      // Set recent trips (last 5)
      setRecentTrips(trips.slice(0, 5));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of KSRTC Bus Tracking System
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TruckIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Buses
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.totalBuses}
                </dd>
              </dl>
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/admin/buses"
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              View all buses
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MapIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Routes
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.totalRoutes}
                </dd>
              </dl>
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/admin/routes"
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              View all routes
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CalendarIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Today's Trips
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.todayTrips}
                </dd>
              </dl>
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/admin/trips"
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              View all trips
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UsersIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Users
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.totalUsers}
                </dd>
              </dl>
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/admin/users"
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              View all users
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Trips */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Recent Trips</h2>
          <Link
            to="/admin/trips"
            className="text-sm font-medium text-primary-600 hover:text-primary-500"
          >
            View all
          </Link>
        </div>
        
        {recentTrips.length > 0 ? (
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
                    Driver
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
                {recentTrips.map((trip) => (
                  <tr key={trip.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {trip.route?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {trip.route?.startPoint} → {trip.route?.endPoint}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {trip.bus?.busNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {trip.driver?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(trip.scheduledAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(trip.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No trips</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new trip.
            </p>
            <div className="mt-6">
              <Link
                to="/admin/trips"
                className="btn-primary"
              >
                Create Trip
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
