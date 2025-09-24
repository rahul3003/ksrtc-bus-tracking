import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io(SOCKET_URL, {
        auth: {
          userId: user.id,
          role: user.role
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setIsConnected(true);
        
        // Join user-specific room for notifications
        if (user) {
          newSocket.emit('join-user', user.id);
        }
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        setIsConnected(false);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
        setSocket(null);
        setIsConnected(false);
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [isAuthenticated, user]);

  const joinTrip = (tripId) => {
    if (socket && isConnected) {
      socket.emit('join-trip', tripId);
    }
  };

  const leaveTrip = (tripId) => {
    if (socket && isConnected) {
      socket.emit('leave-trip', tripId);
    }
  };

  const sendLocationUpdate = (tripId, locationData) => {
    if (socket && isConnected) {
      socket.emit('location-update', {
        tripId,
        ...locationData
      });
    }
  };

  const onLocationUpdate = (callback) => {
    if (socket) {
      socket.on('location-update', callback);
      return () => socket.off('location-update', callback);
    }
  };

  const value = {
    socket,
    isConnected,
    joinTrip,
    leaveTrip,
    sendLocationUpdate,
    onLocationUpdate
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
