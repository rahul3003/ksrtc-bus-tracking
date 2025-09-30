const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authenticateToken = require('../middleware/authenticateToken');

const router = express.Router();
const prisma = new PrismaClient();

// Start tracking for a trip
router.post('/trips/:tripId/start-tracking', authenticateToken, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { location } = req.body;

    // Update trip status to IN_PROGRESS
    const trip = await prisma.trip.update({
      where: { id: tripId },
      data: { 
        status: 'IN_PROGRESS',
        startedAt: new Date()
      },
      include: {
        route: true,
        bus: true,
        driver: true
      }
    });

    // Create initial location record
    if (location) {
      await prisma.location.create({
        data: {
          tripId,
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: new Date(),
          accuracy: location.accuracy || null
        }
      });
    }

    res.json({ 
      message: 'Tracking started successfully',
      trip: {
        id: trip.id,
        status: trip.status,
        route: trip.route,
        bus: trip.bus,
        driver: trip.driver
      }
    });
  } catch (error) {
    console.error('Error starting tracking:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Stop tracking for a trip
router.post('/trips/:tripId/stop-tracking', authenticateToken, async (req, res) => {
  try {
    const { tripId } = req.params;

    // Update trip status to COMPLETED
    const trip = await prisma.trip.update({
      where: { id: tripId },
      data: { 
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    res.json({ 
      message: 'Tracking stopped successfully',
      trip: {
        id: trip.id,
        status: trip.status
      }
    });
  } catch (error) {
    console.error('Error stopping tracking:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update location for a trip
router.post('/trips/:tripId/location', authenticateToken, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { latitude, longitude, accuracy, stopIndex, progress } = req.body;

    // Validate required fields
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    // Create location record
    const location = await prisma.location.create({
      data: {
        tripId,
        latitude,
        longitude,
        timestamp: new Date(),
        accuracy: accuracy || null
      }
    });

    // Get the trip with route information
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        route: true,
        bus: true,
        driver: true
      }
    });

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    res.json({ 
      message: 'Location updated successfully',
      location: {
        id: location.id,
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: location.timestamp,
        stopIndex,
        progress
      },
      trip: {
        id: trip.id,
        status: trip.status,
        route: trip.route,
        bus: trip.bus,
        driver: trip.driver
      }
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get current location for a trip
router.get('/trips/:tripId/location', authenticateToken, async (req, res) => {
  try {
    const { tripId } = req.params;

    // Get the latest location for the trip
    const location = await prisma.location.findFirst({
      where: { tripId },
      orderBy: { timestamp: 'desc' }
    });

    if (!location) {
      return res.status(404).json({ message: 'No location data found for this trip' });
    }

    res.json({ location });
  } catch (error) {
    console.error('Error getting location:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get location history for a trip
router.get('/trips/:tripId/locations', authenticateToken, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    // Get location history for the trip
    const locations = await prisma.location.findMany({
      where: { tripId },
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    res.json({ locations });
  } catch (error) {
    console.error('Error getting location history:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get active trips with current locations
router.get('/active-trips', authenticateToken, async (req, res) => {
  try {
    // Get all active trips
    const activeTrips = await prisma.trip.findMany({
      where: { 
        status: 'IN_PROGRESS'
      },
      include: {
        route: true,
        bus: true,
        driver: true,
        locations: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      }
    });

    // Format response with current locations
    const tripsWithLocations = activeTrips.map(trip => ({
      id: trip.id,
      status: trip.status,
      route: trip.route,
      bus: trip.bus,
      driver: trip.driver,
      currentLocation: trip.locations[0] || null,
      startedAt: trip.startedAt
    }));

    res.json({ trips: tripsWithLocations });
  } catch (error) {
    console.error('Error getting active trips:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
