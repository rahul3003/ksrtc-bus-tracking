const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const busRoutes = require('./routes/buses');
const routeRoutes = require('./routes/routes');
const tripRoutes = require('./routes/trips');
const locationRoutes = require('./routes/locations');
const bookingRoutes = require('./routes/bookings');
const notificationRoutes = require('./routes/notifications');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'KSRTC Bus Tracking API is running' });
});

// Socket.IO for real-time tracking
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user-specific room for notifications
  socket.on('join-user', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${socket.id} joined user room ${userId}`);
  });

  // Leave user room
  socket.on('leave-user', (userId) => {
    socket.leave(`user-${userId}`);
    console.log(`User ${socket.id} left user room ${userId}`);
  });

  // Join trip room for real-time updates
  socket.on('join-trip', (tripId) => {
    socket.join(`trip-${tripId}`);
    console.log(`User ${socket.id} joined trip ${tripId}`);
  });

  // Leave trip room
  socket.on('leave-trip', (tripId) => {
    socket.leave(`trip-${tripId}`);
    console.log(`User ${socket.id} left trip ${tripId}`);
  });

  // Handle location updates from drivers
  socket.on('location-update', (data) => {
    // Broadcast location update to all passengers in the trip
    socket.to(`trip-${data.tripId}`).emit('location-update', data);
  });

  // Handle trip status updates
  socket.on('trip-status-update', (data) => {
    // Broadcast trip status update to all passengers
    socket.to(`trip-${data.tripId}`).emit('trip-status-update', data);
  });

  // Handle delay notifications
  socket.on('delay-notification', (data) => {
    // Broadcast delay notification to all passengers
    socket.to(`trip-${data.tripId}`).emit('delay-notification', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚌 KSRTC Bus Tracking Server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready for real-time tracking`);
});

module.exports = { app, io };
