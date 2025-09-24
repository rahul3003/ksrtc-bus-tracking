import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import {
  CalendarIcon,
  TruckIcon,
  MapIcon,
  ClockIcon,
  PlayIcon,
  StopIcon
} from '@heroicons/react/24/outline';

const DriverTrips = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (user?.id) {
      fetchDriverTrips();
    }
  }, [user]);

  const fetchDriverTrips = async () => {
    if (!user?.id) {
      console.error('User ID not available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/trips/driver/${user.id}`);
      setTrips(response.data.trips);
    } catch (error) {
      console.error('Error fetching driver trips:', error);
      toast.error('Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const updateTripStatus = async (tripId, status) => {
    try {
      await axios.put(`${API_BASE_URL}/trips/${tripId}/status`, { status });
      toast.success('Trip status updated successfully');
      fetchDriverTrips();
    } catch (error) {
      console.error('Error updating trip status:', error);
      toast.error('Failed to update trip status');
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

  if (loading || !user) {
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
        <h1 className="text-2xl font-bold text-gray-900">My Trips</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and manage your assigned trips
        </p>
      </div>

      {/* Trips List */}
      <div className="space-y-4">
        {trips.map((trip) => (
          <div key={trip.id} className="card">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <TruckIcon className="h-6 w-6 text-primary-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900">
                      {trip.route?.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {trip.route?.startPoint} → {trip.route?.endPoint}
                    </p>
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
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
                    {formatDate(trip.scheduledAt)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Scheduled
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
                    <div className="flex space-x-2">
                      <button
                        onClick={() => updateTripStatus(trip.id, 'COMPLETED')}
                        className="btn-secondary text-xs py-1 px-2"
                      >
                        <StopIcon className="h-3 w-3 mr-1" />
                        Complete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {trips.length === 0 && (
        <div className="text-center py-12">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No trips assigned</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have any trips assigned yet.
          </p>
        </div>
      )}
    </div>
  );
};

export default DriverTrips;
