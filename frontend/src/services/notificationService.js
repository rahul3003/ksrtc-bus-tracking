import toast from 'react-hot-toast';

class NotificationService {
  constructor() {
    this.permission = null;
    this.isSupported = 'Notification' in window;
    this.initialize();
  }

  async initialize() {
    if (this.isSupported) {
      this.permission = Notification.permission;
      
      if (this.permission === 'default') {
        this.permission = await Notification.requestPermission();
      }
    }
  }

  async requestPermission() {
    if (!this.isSupported) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    this.permission = await Notification.requestPermission();
    return this.permission === 'granted';
  }

  showNotification(title, options = {}) {
    // Show browser notification if permission is granted
    if (this.isSupported && this.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/vite.svg',
        badge: '/vite.svg',
        ...options
      });

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    }

    // Fallback to toast notification
    return this.showToastNotification(title, options);
  }

  showToastNotification(title, options = {}) {
    const { body, type = 'info' } = options;
    
    const message = body ? `${title}: ${body}` : title;
    
    switch (type) {
      case 'success':
        return toast.success(message);
      case 'error':
        return toast.error(message);
      case 'warning':
        return toast(message, { icon: '⚠️' });
      default:
        return toast(message);
    }
  }

  // Bus-specific notifications
  showBusArrivalNotification(busNumber, routeName, eta) {
    this.showNotification(
      `Bus ${busNumber} Arriving Soon`,
      {
        body: `Route: ${routeName} - ETA: ${eta}`,
        icon: '/bus-icon.png',
        tag: `bus-${busNumber}`,
        type: 'info'
      }
    );
  }

  showBusDelayNotification(busNumber, routeName, delay) {
    this.showNotification(
      `Bus ${busNumber} Delayed`,
      {
        body: `Route: ${routeName} - Delay: ${delay} minutes`,
        icon: '/bus-icon.png',
        tag: `bus-${busNumber}`,
        type: 'warning'
      }
    );
  }

  showBusCancellationNotification(busNumber, routeName) {
    this.showNotification(
      `Bus ${busNumber} Cancelled`,
      {
        body: `Route: ${routeName} has been cancelled`,
        icon: '/bus-icon.png',
        tag: `bus-${busNumber}`,
        type: 'error'
      }
    );
  }

  showRouteChangeNotification(busNumber, oldRoute, newRoute) {
    this.showNotification(
      `Route Change for Bus ${busNumber}`,
      {
        body: `Route changed from ${oldRoute} to ${newRoute}`,
        icon: '/bus-icon.png',
        tag: `bus-${busNumber}`,
        type: 'warning'
      }
    );
  }

  showTripStartedNotification(tripId, routeName) {
    this.showNotification(
      'Trip Started',
      {
        body: `Your trip on route ${routeName} has started`,
        icon: '/bus-icon.png',
        tag: `trip-${tripId}`,
        type: 'success'
      }
    );
  }

  showTripCompletedNotification(tripId, routeName) {
    this.showNotification(
      'Trip Completed',
      {
        body: `Your trip on route ${routeName} has been completed`,
        icon: '/bus-icon.png',
        tag: `trip-${tripId}`,
        type: 'success'
      }
    );
  }

  // Location-based notifications
  showLocationUpdateNotification(busNumber, location) {
    this.showNotification(
      `Bus ${busNumber} Location Update`,
      {
        body: `Current location: ${location}`,
        icon: '/bus-icon.png',
        tag: `location-${busNumber}`,
        type: 'info'
      }
    );
  }

  // Booking notifications
  showBookingConfirmationNotification(bookingId, routeName, seatNumber) {
    this.showNotification(
      'Booking Confirmed',
      {
        body: `Route: ${routeName}, Seat: ${seatNumber}`,
        icon: '/bus-icon.png',
        tag: `booking-${bookingId}`,
        type: 'success'
      }
    );
  }

  showBookingCancellationNotification(bookingId, routeName) {
    this.showNotification(
      'Booking Cancelled',
      {
        body: `Your booking for route ${routeName} has been cancelled`,
        icon: '/bus-icon.png',
        tag: `booking-${bookingId}`,
        type: 'error'
      }
    );
  }

  // System notifications
  showSystemMaintenanceNotification(message) {
    this.showNotification(
      'System Maintenance',
      {
        body: message,
        icon: '/bus-icon.png',
        tag: 'system-maintenance',
        type: 'warning'
      }
    );
  }

  showServiceUpdateNotification(message) {
    this.showNotification(
      'Service Update',
      {
        body: message,
        icon: '/bus-icon.png',
        tag: 'service-update',
        type: 'info'
      }
    );
  }

  // Clear all notifications
  clearAllNotifications() {
    if (this.isSupported && this.permission === 'granted') {
      // Note: There's no direct way to clear all notifications in the browser
      // This would need to be handled by the service worker in a PWA
      console.log('Clear all notifications requested');
    }
  }

  // Check if notifications are supported and enabled
  isNotificationEnabled() {
    return this.isSupported && this.permission === 'granted';
  }

  // Get notification permission status
  getPermissionStatus() {
    return this.permission;
  }
}

// Create a singleton instance
const notificationService = new NotificationService();

export default notificationService;
