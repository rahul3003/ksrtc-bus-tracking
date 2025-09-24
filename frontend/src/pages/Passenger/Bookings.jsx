import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  TicketIcon,
  TruckIcon,
  MapIcon,
  CalendarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const PassengerBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/bookings`, {
        params: {
          userId: localStorage.getItem('userId')
        }
      });
      setBookings(response.data.bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await axios.put(`${API_BASE_URL}/bookings/${bookingId}/cancel`);
      toast.success('Booking cancelled successfully');
      fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking');
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

  const isUpcoming = (dateString) => {
    return new Date(dateString) > new Date();
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
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and manage your bus bookings
        </p>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {bookings.map((booking) => (
          <div key={booking.id} className="card">
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
                      {booking.trip.route?.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {booking.trip.route?.startPoint} → {booking.trip.route?.endPoint}
                    </p>
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
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
                    {formatDate(booking.trip.scheduledAt)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {isUpcoming(booking.trip.scheduledAt) ? 'Upcoming' : 'Past'}
                  </div>
                </div>
                
                <div className="flex flex-col items-end space-y-2">
                  {getStatusBadge(booking.status)}
                  
                  {booking.status === 'CONFIRMED' && isUpcoming(booking.trip.scheduledAt) && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => cancelBooking(booking.id)}
                        className="btn-danger text-xs py-1 px-2"
                      >
                        <XMarkIcon className="h-3 w-3 mr-1" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {bookings.length === 0 && (
        <div className="text-center py-12">
          <TicketIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Start by finding and booking a trip.
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

export default PassengerBookings;
