import { createContext, useContext, useEffect, useState } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import notificationService from '../services/notificationService';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [isEnabled, setIsEnabled] = useState(false);
  const [preferences, setPreferences] = useState({
    busArrivals: true,
    delays: true,
    cancellations: true,
    routeChanges: true,
    tripUpdates: true,
    bookingUpdates: true,
    systemUpdates: false
  });

  const { socket, isConnected } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    // Initialize notification service
    const initNotifications = async () => {
      const enabled = await notificationService.requestPermission();
      setIsEnabled(enabled);
      
      // Load saved preferences from localStorage
      const savedPreferences = localStorage.getItem('notificationPreferences');
      if (savedPreferences) {
        setPreferences(JSON.parse(savedPreferences));
      }
    };

    initNotifications();
  }, []);

  useEffect(() => {
    // Save preferences to localStorage when they change
    localStorage.setItem('notificationPreferences', JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    // Listen for bus location updates
    const handleLocationUpdate = (data) => {
      if (preferences.busArrivals && data.tripId) {
        // Check if user has bookings for this trip
        // This would need to be implemented with actual booking data
        notificationService.showLocationUpdateNotification(
          data.busNumber || 'Unknown',
          `${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}`
        );
      }
    };

    // Listen for trip status updates
    const handleTripStatusUpdate = (data) => {
      if (!preferences.tripUpdates) return;

      switch (data.status) {
        case 'IN_PROGRESS':
          notificationService.showTripStartedNotification(
            data.tripId,
            data.routeName || 'Unknown Route'
          );
          break;
        case 'COMPLETED':
          notificationService.showTripCompletedNotification(
            data.tripId,
            data.routeName || 'Unknown Route'
          );
          break;
        case 'CANCELLED':
          if (preferences.cancellations) {
            notificationService.showBusCancellationNotification(
              data.busNumber || 'Unknown',
              data.routeName || 'Unknown Route'
            );
          }
          break;
      }
    };

    // Listen for delay notifications
    const handleDelayNotification = (data) => {
      if (preferences.delays) {
        notificationService.showBusDelayNotification(
          data.busNumber,
          data.routeName,
          data.delayMinutes
        );
      }
    };

    // Listen for route change notifications
    const handleRouteChange = (data) => {
      if (preferences.routeChanges) {
        notificationService.showRouteChangeNotification(
          data.busNumber,
          data.oldRoute,
          data.newRoute
        );
      }
    };

    // Listen for booking updates
    const handleBookingUpdate = (data) => {
      if (!preferences.bookingUpdates || data.userId !== user.id) return;

      switch (data.type) {
        case 'CONFIRMED':
          notificationService.showBookingConfirmationNotification(
            data.bookingId,
            data.routeName,
            data.seatNumber
          );
          break;
        case 'CANCELLED':
          notificationService.showBookingCancellationNotification(
            data.bookingId,
            data.routeName
          );
          break;
      }
    };

    // Listen for system notifications
    const handleSystemNotification = (data) => {
      if (preferences.systemUpdates) {
        switch (data.type) {
          case 'MAINTENANCE':
            notificationService.showSystemMaintenanceNotification(data.message);
            break;
          case 'SERVICE_UPDATE':
            notificationService.showServiceUpdateNotification(data.message);
            break;
        }
      }
    };

    // Register socket listeners
    socket.on('location-update', handleLocationUpdate);
    socket.on('trip-status-update', handleTripStatusUpdate);
    socket.on('delay-notification', handleDelayNotification);
    socket.on('route-change', handleRouteChange);
    socket.on('booking-update', handleBookingUpdate);
    socket.on('system-notification', handleSystemNotification);

    // Cleanup listeners
    return () => {
      socket.off('location-update', handleLocationUpdate);
      socket.off('trip-status-update', handleTripStatusUpdate);
      socket.off('delay-notification', handleDelayNotification);
      socket.off('route-change', handleRouteChange);
      socket.off('booking-update', handleBookingUpdate);
      socket.off('system-notification', handleSystemNotification);
    };
  }, [socket, isConnected, user, preferences]);

  const updatePreferences = (newPreferences) => {
    setPreferences(prev => ({
      ...prev,
      ...newPreferences
    }));
  };

  const enableNotifications = async () => {
    const enabled = await notificationService.requestPermission();
    setIsEnabled(enabled);
    return enabled;
  };

  const disableNotifications = () => {
    setIsEnabled(false);
  };

  const addNotification = (notification) => {
    setNotifications(prev => [
      {
        id: Date.now(),
        timestamp: new Date(),
        ...notification
      },
      ...prev.slice(0, 49) // Keep only last 50 notifications
    ]);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const value = {
    notifications,
    isEnabled,
    preferences,
    updatePreferences,
    enableNotifications,
    disableNotifications,
    addNotification,
    clearNotifications,
    removeNotification,
    notificationService
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
