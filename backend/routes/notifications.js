const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authenticateToken = require('../middleware/authenticateToken');
const authorizeRole = require('../middleware/authorizeRole');

const router = express.Router();
const prisma = new PrismaClient();

// Send notification to users
router.post('/send', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
  try {

    const { type, title, message, targetUsers, targetRoles } = req.body;

    // Get the io instance from the app
    const io = req.app.get('io');

    if (!io) {
      return res.status(500).json({ message: 'Socket.IO not available' });
    }

    // Determine target users
    let users = [];
    
    if (targetUsers && targetUsers.length > 0) {
      users = await prisma.user.findMany({
        where: {
          id: { in: targetUsers }
        }
      });
    } else if (targetRoles && targetRoles.length > 0) {
      users = await prisma.user.findMany({
        where: {
          role: { in: targetRoles }
        }
      });
    } else {
      // Send to all users
      users = await prisma.user.findMany();
    }

    // Send notification to each user
    const notificationData = {
      type,
      title,
      message,
      timestamp: new Date(),
      from: req.user.name
    };

    users.forEach(user => {
      io.to(`user-${user.id}`).emit('notification', notificationData);
    });

    res.json({
      message: 'Notification sent successfully',
      sentTo: users.length,
      users: users.map(u => ({ id: u.id, name: u.name, role: u.role }))
    });

  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Send bus-specific notifications
router.post('/bus/:busId', authenticateToken, async (req, res) => {
  try {
    const { busId } = req.params;
    const { type, message } = req.body;

    // Get bus and its current trip
    const bus = await prisma.bus.findUnique({
      where: { id: busId },
      include: {
        trips: {
          where: {
            status: 'IN_PROGRESS'
          },
          include: {
            bookings: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    const io = req.app.get('io');
    if (!io) {
      return res.status(500).json({ message: 'Socket.IO not available' });
    }

    // Send notification to all passengers on the bus
    const activeTrip = bus.trips[0];
    if (activeTrip && activeTrip.bookings.length > 0) {
      const notificationData = {
        type: 'BUS_UPDATE',
        title: `Bus ${bus.busNumber} Update`,
        message,
        busNumber: bus.busNumber,
        tripId: activeTrip.id,
        timestamp: new Date()
      };

      activeTrip.bookings.forEach(booking => {
        io.to(`user-${booking.userId}`).emit('notification', notificationData);
      });

      res.json({
        message: 'Bus notification sent successfully',
        sentTo: activeTrip.bookings.length,
        busNumber: bus.busNumber
      });
    } else {
      res.json({
        message: 'No active passengers found for this bus',
        sentTo: 0
      });
    }

  } catch (error) {
    console.error('Send bus notification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Send route-specific notifications
router.post('/route/:routeId', authenticateToken, async (req, res) => {
  try {
    const { routeId } = req.params;
    const { type, message } = req.body;

    // Get route and all users with bookings on this route
    const route = await prisma.route.findUnique({
      where: { id: routeId },
      include: {
        trips: {
          where: {
            status: { in: ['SCHEDULED', 'IN_PROGRESS'] }
          },
          include: {
            bookings: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    const io = req.app.get('io');
    if (!io) {
      return res.status(500).json({ message: 'Socket.IO not available' });
    }

    // Collect all unique users with bookings on this route
    const users = new Set();
    route.trips.forEach(trip => {
      trip.bookings.forEach(booking => {
        users.add(booking.userId);
      });
    });

    const notificationData = {
      type: 'ROUTE_UPDATE',
      title: `Route ${route.name} Update`,
      message,
      routeName: route.name,
      timestamp: new Date()
    };

    // Send notification to all users
    users.forEach(userId => {
      io.to(`user-${userId}`).emit('notification', notificationData);
    });

    res.json({
      message: 'Route notification sent successfully',
      sentTo: users.size,
      routeName: route.name
    });

  } catch (error) {
    console.error('Send route notification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get notification history (Admin only)
router.get('/history', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { limit = 50, offset = 0 } = req.query;

    // In a real implementation, you would store notifications in the database
    // For now, we'll return a mock response
    const notifications = [
      {
        id: '1',
        type: 'SYSTEM_UPDATE',
        title: 'System Maintenance',
        message: 'Scheduled maintenance will occur tonight from 2 AM to 4 AM',
        timestamp: new Date(Date.now() - 3600000),
        sentTo: 150
      },
      {
        id: '2',
        type: 'BUS_UPDATE',
        title: 'Bus KA-01-AB-1234 Delay',
        message: 'Bus is delayed by 15 minutes due to traffic',
        timestamp: new Date(Date.now() - 7200000),
        sentTo: 25
      }
    ];

    res.json({ notifications });

  } catch (error) {
    console.error('Get notification history error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Send delay notification
router.post('/delay', authenticateToken, async (req, res) => {
  try {
    const { tripId, delayMinutes, reason } = req.body;

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        bus: true,
        route: true,
        bookings: {
          include: {
            user: true
          }
        }
      }
    });

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const io = req.app.get('io');
    if (!io) {
      return res.status(500).json({ message: 'Socket.IO not available' });
    }

    const notificationData = {
      type: 'DELAY',
      title: `Bus ${trip.bus.busNumber} Delayed`,
      message: `Your bus is delayed by ${delayMinutes} minutes. ${reason || 'Due to traffic conditions.'}`,
      busNumber: trip.bus.busNumber,
      routeName: trip.route.name,
      delayMinutes,
      tripId: trip.id,
      timestamp: new Date()
    };

    // Send to all passengers
    trip.bookings.forEach(booking => {
      io.to(`user-${booking.userId}`).emit('notification', notificationData);
    });

    res.json({
      message: 'Delay notification sent successfully',
      sentTo: trip.bookings.length,
      busNumber: trip.bus.busNumber
    });

  } catch (error) {
    console.error('Send delay notification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
