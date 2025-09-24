const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authenticateToken = require('../middleware/authenticateToken');

const router = express.Router();
const prisma = new PrismaClient();

// Get all buses
router.get('/', authenticateToken, async (req, res) => {
  try {
    const buses = await prisma.bus.findMany({
      include: {
        trips: {
          include: {
            route: true,
            driver: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            scheduledAt: 'desc'
          },
          take: 5
        }
      },
      orderBy: {
        busNumber: 'asc'
      }
    });

    res.json({ buses });
  } catch (error) {
    console.error('Get buses error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get bus by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const bus = await prisma.bus.findUnique({
      where: { id },
      include: {
        trips: {
          include: {
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
          },
          orderBy: {
            scheduledAt: 'desc'
          }
        }
      }
    });

    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    res.json({ bus });
  } catch (error) {
    console.error('Get bus error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create bus (Admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { busNumber, capacity, model, licensePlate } = req.body;

    // Check if bus number already exists
    const existingBus = await prisma.bus.findUnique({
      where: { busNumber }
    });

    if (existingBus) {
      return res.status(400).json({ message: 'Bus number already exists' });
    }

    // Check if license plate already exists
    const existingLicense = await prisma.bus.findUnique({
      where: { licensePlate }
    });

    if (existingLicense) {
      return res.status(400).json({ message: 'License plate already exists' });
    }

    const bus = await prisma.bus.create({
      data: {
        busNumber,
        capacity,
        model,
        licensePlate
      }
    });

    res.status(201).json({ message: 'Bus created successfully', bus });
  } catch (error) {
    console.error('Create bus error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update bus (Admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { id } = req.params;
    const { busNumber, capacity, model, licensePlate, isActive } = req.body;

    const bus = await prisma.bus.update({
      where: { id },
      data: {
        busNumber,
        capacity,
        model,
        licensePlate,
        isActive
      }
    });

    res.json({ message: 'Bus updated successfully', bus });
  } catch (error) {
    console.error('Update bus error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete bus (Admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { id } = req.params;

    // Check if bus has active trips
    const activeTrips = await prisma.trip.findFirst({
      where: {
        busId: id,
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS']
        }
      }
    });

    if (activeTrips) {
      return res.status(400).json({ 
        message: 'Cannot delete bus with active trips' 
      });
    }

    await prisma.bus.delete({
      where: { id }
    });

    res.json({ message: 'Bus deleted successfully' });
  } catch (error) {
    console.error('Delete bus error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get active buses
router.get('/status/active', authenticateToken, async (req, res) => {
  try {
    const activeBuses = await prisma.bus.findMany({
      where: { isActive: true },
      include: {
        trips: {
          where: {
            status: 'IN_PROGRESS'
          },
          include: {
            route: true,
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
        }
      }
    });

    res.json({ buses: activeBuses });
  } catch (error) {
    console.error('Get active buses error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
