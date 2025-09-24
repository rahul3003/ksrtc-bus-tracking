const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authenticateToken = require('../middleware/authenticateToken');

const router = express.Router();
const prisma = new PrismaClient();

// Get all trips
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, date, driverId } = req.query;
    
    let whereClause = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      whereClause.scheduledAt = {
        gte: startDate,
        lt: endDate
      };
    }
    
    if (driverId) {
      whereClause.driverId = driverId;
    }

    const trips = await prisma.trip.findMany({
      where: whereClause,
      include: {
        bus: {
          select: {
            id: true,
            busNumber: true,
            capacity: true
          }
        },
        route: true,
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        locations: {
          orderBy: {
            timestamp: 'desc'
          },
          take: 1
        },
        _count: {
          select: {
            bookings: true
          }
        }
      },
      orderBy: {
        scheduledAt: 'desc'
      }
    });

    res.json({ trips });
  } catch (error) {
    console.error('Get trips error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get trip by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        bus: {
          select: {
            id: true,
            busNumber: true,
            capacity: true,
            model: true,
            licensePlate: true
          }
        },
        route: true,
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        locations: {
          orderBy: {
            timestamp: 'desc'
          }
        },
        bookings: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    res.json({ trip });
  } catch (error) {
    console.error('Get trip error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create trip (Admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { busId, routeId, driverId, scheduledAt } = req.body;

    // Validate that bus, route, and driver exist
    const [bus, route, driver] = await Promise.all([
      prisma.bus.findUnique({ where: { id: busId } }),
      prisma.route.findUnique({ where: { id: routeId } }),
      prisma.user.findUnique({ where: { id: driverId, role: 'DRIVER' } })
    ]);

    if (!bus) {
      return res.status(400).json({ message: 'Bus not found' });
    }
    if (!route) {
      return res.status(400).json({ message: 'Route not found' });
    }
    if (!driver) {
      return res.status(400).json({ message: 'Driver not found' });
    }

    // Check if bus is available at the scheduled time
    const conflictingTrip = await prisma.trip.findFirst({
      where: {
        busId,
        scheduledAt: {
          gte: new Date(scheduledAt),
          lt: new Date(new Date(scheduledAt).getTime() + 24 * 60 * 60 * 1000) // 24 hours later
        },
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS']
        }
      }
    });

    if (conflictingTrip) {
      return res.status(400).json({ 
        message: 'Bus is already scheduled for another trip at this time' 
      });
    }

    const trip = await prisma.trip.create({
      data: {
        busId,
        routeId,
        driverId,
        scheduledAt: new Date(scheduledAt)
      },
      include: {
        bus: {
          select: {
            id: true,
            busNumber: true
          }
        },
        route: true,
        driver: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.status(201).json({ message: 'Trip created successfully', trip });
  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update trip status (Driver and Admin)
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        driver: true
      }
    });

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Only driver assigned to trip or admin can update status
    if (req.user.role !== 'ADMIN' && trip.driverId !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedTrip = await prisma.trip.update({
      where: { id },
      data: { status },
      include: {
        bus: {
          select: {
            id: true,
            busNumber: true
          }
        },
        route: true,
        driver: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json({ message: 'Trip status updated successfully', trip: updatedTrip });
  } catch (error) {
    console.error('Update trip status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update trip (Admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { id } = req.params;
    const { busId, routeId, driverId, scheduledAt, status } = req.body;

    const trip = await prisma.trip.update({
      where: { id },
      data: {
        busId,
        routeId,
        driverId,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        status
      },
      include: {
        bus: {
          select: {
            id: true,
            busNumber: true
          }
        },
        route: true,
        driver: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json({ message: 'Trip updated successfully', trip });
  } catch (error) {
    console.error('Update trip error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete trip (Admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { id } = req.params;

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        bookings: true
      }
    });

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    if (trip.status === 'IN_PROGRESS') {
      return res.status(400).json({ 
        message: 'Cannot delete trip that is in progress' 
      });
    }

    if (trip.bookings.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete trip with existing bookings' 
      });
    }

    await prisma.trip.delete({
      where: { id }
    });

    res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    console.error('Delete trip error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get driver's trips
router.get('/driver/:driverId', authenticateToken, async (req, res) => {
  try {
    const { driverId } = req.params;
    const { status, date } = req.query;

    // Only driver can view their own trips or admin can view any driver's trips
    if (req.user.role !== 'ADMIN' && req.user.userId !== driverId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    let whereClause = { driverId };
    
    if (status) {
      whereClause.status = status;
    }
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      whereClause.scheduledAt = {
        gte: startDate,
        lt: endDate
      };
    }

    const trips = await prisma.trip.findMany({
      where: whereClause,
      include: {
        bus: {
          select: {
            id: true,
            busNumber: true,
            capacity: true
          }
        },
        route: true,
        locations: {
          orderBy: {
            timestamp: 'desc'
          },
          take: 1
        },
        _count: {
          select: {
            bookings: true
          }
        }
      },
      orderBy: {
        scheduledAt: 'desc'
      }
    });

    res.json({ trips });
  } catch (error) {
    console.error('Get driver trips error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
