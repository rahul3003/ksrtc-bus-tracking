const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authenticateToken = require('../middleware/authenticateToken');

const router = express.Router();
const prisma = new PrismaClient();

// Get locations for a trip
router.get('/trip/:tripId', authenticateToken, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { limit = 100 } = req.query;

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        driver: true
      }
    });

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Only driver assigned to trip, passengers with bookings, or admin can view locations
    if (req.user.role !== 'ADMIN' && trip.driverId !== req.user.userId) {
      // Check if user has a booking for this trip
      const booking = await prisma.booking.findFirst({
        where: {
          userId: req.user.userId,
          tripId: tripId
        }
      });

      if (!booking) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const locations = await prisma.location.findMany({
      where: { tripId },
      orderBy: {
        timestamp: 'desc'
      },
      take: parseInt(limit)
    });

    res.json({ locations });
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get latest location for a trip
router.get('/trip/:tripId/latest', authenticateToken, async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        driver: true
      }
    });

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Only driver assigned to trip, passengers with bookings, or admin can view locations
    if (req.user.role !== 'ADMIN' && trip.driverId !== req.user.userId) {
      // Check if user has a booking for this trip
      const booking = await prisma.booking.findFirst({
        where: {
          userId: req.user.userId,
          tripId: tripId
        }
      });

      if (!booking) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const location = await prisma.location.findFirst({
      where: { tripId },
      orderBy: {
        timestamp: 'desc'
      }
    });

    res.json({ location });
  } catch (error) {
    console.error('Get latest location error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all active buses with their current locations
router.get('/active-buses', authenticateToken, async (req, res) => {
  try {
    const activeTrips = await prisma.trip.findMany({
      where: {
        status: 'IN_PROGRESS'
      },
      include: {
        bus: true,
        route: true,
        driver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        locations: {
          orderBy: {
            timestamp: 'desc'
          },
          take: 1
        }
      }
    });

    const activeBuses = activeTrips.map(trip => {
      const latestLocation = trip.locations[0];
      return {
        tripId: trip.id,
        busNumber: trip.bus.busNumber,
        routeName: trip.route.name,
        driverName: trip.driver.name,
        status: trip.status,
        currentLocation: latestLocation ? {
          latitude: latestLocation.latitude,
          longitude: latestLocation.longitude,
          speed: latestLocation.speed,
          heading: latestLocation.heading,
          timestamp: latestLocation.timestamp
        } : null
      };
    });

    res.json({ activeBuses });
  } catch (error) {
    console.error('Get active buses error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create sample live data for testing
router.post('/create-sample-data', authenticateToken, async (req, res) => {
  try {
    // Only admin can create sample data
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get the first trip to add sample location data
    const trip = await prisma.trip.findFirst({
      include: {
        bus: true,
        route: true,
        driver: true
      }
    });

    if (!trip) {
      return res.status(404).json({ message: 'No trips found. Please create a trip first.' });
    }

    // Update trip status to IN_PROGRESS if it's not already
    if (trip.status !== 'IN_PROGRESS') {
      await prisma.trip.update({
        where: { id: trip.id },
        data: { status: 'IN_PROGRESS' }
      });
    }

    // Create sample location data around Bangalore
    const sampleLocations = [
      {
        tripId: trip.id,
        latitude: 12.9716,
        longitude: 77.5946,
        speed: 25.5,
        heading: 45,
        timestamp: new Date()
      },
      {
        tripId: trip.id,
        latitude: 12.9750,
        longitude: 77.6000,
        speed: 30.2,
        heading: 60,
        timestamp: new Date(Date.now() - 30000) // 30 seconds ago
      },
      {
        tripId: trip.id,
        latitude: 12.9780,
        longitude: 77.6050,
        speed: 28.8,
        heading: 75,
        timestamp: new Date(Date.now() - 60000) // 1 minute ago
      }
    ];

    // Create location records
    const createdLocations = await Promise.all(
      sampleLocations.map(location => 
        prisma.location.create({ data: location })
      )
    );

    res.json({ 
      message: 'Sample location data created successfully',
      trip: {
        id: trip.id,
        busNumber: trip.bus.busNumber,
        routeName: trip.route.name,
        driverName: trip.driver.name,
        status: 'IN_PROGRESS'
      },
      locations: createdLocations
    });
  } catch (error) {
    console.error('Create sample data error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Start bus movement simulation along a route
router.post('/start-route-simulation/:tripId', authenticateToken, async (req, res) => {
  try {
    // Only admin can start simulation
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { tripId } = req.params;

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        bus: true,
        route: true,
        driver: true
      }
    });

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Update trip status to IN_PROGRESS
    await prisma.trip.update({
      where: { id: tripId },
      data: { status: 'IN_PROGRESS' }
    });

    // Get route waypoints from the route data
    let routeWaypoints = [];
    if (trip.route.waypoints) {
      routeWaypoints = JSON.parse(trip.route.waypoints);
    } else {
      // Fallback waypoints for Karnataka routes
      routeWaypoints = [
        { name: "Start Point", latitude: trip.route.startLatitude || 12.9716, longitude: trip.route.startLongitude || 77.5946, stopTime: 0, type: 'start' },
        { name: "Intermediate Stop 1", latitude: 12.9750, longitude: 77.6000, stopTime: 30000, type: 'intermediate' },
        { name: "Intermediate Stop 2", latitude: 12.9780, longitude: 77.6050, stopTime: 30000, type: 'intermediate' },
        { name: "Intermediate Stop 3", latitude: 12.9810, longitude: 77.6100, stopTime: 30000, type: 'intermediate' },
        { name: "End Point", latitude: trip.route.endLatitude || 12.9900, longitude: trip.route.endLongitude || 77.6250, stopTime: 0, type: 'end' }
      ];
    }

    // Store route waypoints in trip data (we'll use a simple approach)
    await prisma.trip.update({
      where: { id: tripId },
      data: { 
        status: 'IN_PROGRESS',
        // Store route waypoints as JSON in a custom field or use a separate table
        // For now, we'll simulate the movement
      }
    });

    res.json({ 
      message: 'Route simulation started successfully',
      trip: {
        id: trip.id,
        busNumber: trip.bus.busNumber,
        routeName: trip.route.name,
        driverName: trip.driver.name,
        status: 'IN_PROGRESS'
      },
      waypoints: routeWaypoints
    });
  } catch (error) {
    console.error('Start route simulation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get route waypoints for a trip
router.get('/route-waypoints/:tripId', authenticateToken, async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        route: true
      }
    });

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Use route waypoints if available, otherwise use default Karnataka waypoints
    let routeWaypoints = [];
    if (trip.route.waypoints) {
      routeWaypoints = JSON.parse(trip.route.waypoints);
    } else {
      // Default Karnataka waypoints
      routeWaypoints = [
        { name: trip.route.startPoint || "Start Point", latitude: trip.route.startLatitude || 12.9716, longitude: trip.route.startLongitude || 77.5946, stopTime: 0, type: 'start' },
        { name: "Intermediate Stop 1", latitude: 12.9750, longitude: 77.6000, stopTime: 30000, type: 'intermediate' },
        { name: "Intermediate Stop 2", latitude: 12.9780, longitude: 77.6050, stopTime: 30000, type: 'intermediate' },
        { name: "Intermediate Stop 3", latitude: 12.9810, longitude: 77.6100, stopTime: 30000, type: 'intermediate' },
        { name: trip.route.endPoint || "End Point", latitude: trip.route.endLatitude || 12.9900, longitude: trip.route.endLongitude || 77.6250, stopTime: 0, type: 'end' }
      ];
    }

    res.json({ waypoints: routeWaypoints });
  } catch (error) {
    console.error('Get route waypoints error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Generate comprehensive sample data
router.post('/generate-sample-data', authenticateToken, async (req, res) => {
  try {
    // Only admin can generate sample data
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Import and run the sample data generator
    const { exec } = require('child_process');
    const path = require('path');
    
    const scriptPath = path.join(__dirname, '../scripts/generateSampleData.js');
    
    exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error('Error running sample data generator:', error);
        return res.status(500).json({ message: 'Failed to generate sample data' });
      }
      
      if (stderr) {
        console.error('Sample data generator stderr:', stderr);
      }
      
      console.log('Sample data generator output:', stdout);
      res.json({ 
        message: 'Sample data generated successfully!',
        output: stdout
      });
    });

  } catch (error) {
    console.error('Generate sample data error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add location update (Driver only)
router.post('/trip/:tripId', authenticateToken, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { latitude, longitude, speed, heading } = req.body;

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        driver: true
      }
    });

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Only driver assigned to trip can add location updates
    if (trip.driverId !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only allow location updates for trips in progress
    if (trip.status !== 'IN_PROGRESS') {
      return res.status(400).json({ 
        message: 'Location updates only allowed for trips in progress' 
      });
    }

    const location = await prisma.location.create({
      data: {
        tripId,
        latitude,
        longitude,
        speed,
        heading
      }
    });

    // Emit real-time update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`trip-${tripId}`).emit('location-update', {
        tripId,
        location: {
          id: location.id,
          latitude: location.latitude,
          longitude: location.longitude,
          speed: location.speed,
          heading: location.heading,
          timestamp: location.timestamp
        }
      });
    }

    res.status(201).json({ 
      message: 'Location updated successfully', 
      location 
    });
  } catch (error) {
    console.error('Add location error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all active trips with their latest locations
router.get('/active', authenticateToken, async (req, res) => {
  try {
    const activeTrips = await prisma.trip.findMany({
      where: {
        status: 'IN_PROGRESS'
      },
      include: {
        bus: {
          select: {
            id: true,
            busNumber: true
          }
        },
        route: {
          select: {
            id: true,
            name: true,
            startPoint: true,
            endPoint: true
          }
        },
        driver: {
          select: {
            id: true,
            name: true
          }
        },
        locations: {
          orderBy: {
            timestamp: 'desc'
          },
          take: 1
        }
      }
    });

    res.json({ trips: activeTrips });
  } catch (error) {
    console.error('Get active trips error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get location history for analytics (Admin only)
router.get('/analytics/:tripId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { tripId } = req.params;
    const { startDate, endDate } = req.query;

    let whereClause = { tripId };

    if (startDate && endDate) {
      whereClause.timestamp = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const locations = await prisma.location.findMany({
      where: whereClause,
      orderBy: {
        timestamp: 'asc'
      }
    });

    // Calculate analytics
    const analytics = {
      totalLocations: locations.length,
      averageSpeed: locations.reduce((sum, loc) => sum + (loc.speed || 0), 0) / locations.length,
      maxSpeed: Math.max(...locations.map(loc => loc.speed || 0)),
      minSpeed: Math.min(...locations.map(loc => loc.speed || 0)),
      totalDistance: 0, // This would require distance calculation between points
      duration: locations.length > 0 ? 
        new Date(locations[locations.length - 1].timestamp) - new Date(locations[0].timestamp) : 0
    };

    res.json({ 
      locations, 
      analytics 
    });
  } catch (error) {
    console.error('Get location analytics error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
