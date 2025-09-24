const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authenticateToken = require('../middleware/authenticateToken');

const router = express.Router();
const prisma = new PrismaClient();

// Get all bookings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { userId, tripId, status } = req.query;
    
    let whereClause = {};
    
    if (userId) {
      whereClause.userId = userId;
    }
    
    if (tripId) {
      whereClause.tripId = tripId;
    }
    
    if (status) {
      whereClause.status = status;
    }

    // Non-admin users can only see their own bookings
    if (req.user.role !== 'ADMIN' && !userId) {
      whereClause.userId = req.user.userId;
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        trip: {
          include: {
            bus: {
              select: {
                id: true,
                busNumber: true,
                capacity: true
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
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ bookings });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get booking by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        trip: {
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
              },
              take: 1
            }
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Users can only view their own bookings unless they're admin
    if (req.user.role !== 'ADMIN' && booking.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ booking });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create booking
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { tripId, seatNumber } = req.body;

    // Find the trip
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        bus: true,
        route: true,
        bookings: true
      }
    });

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Check if trip is available for booking
    if (trip.status !== 'SCHEDULED') {
      return res.status(400).json({ 
        message: 'Trip is not available for booking' 
      });
    }

    // Check if trip is in the future
    if (new Date(trip.scheduledAt) <= new Date()) {
      return res.status(400).json({ 
        message: 'Cannot book for past trips' 
      });
    }

    // Check if user already has a booking for this trip
    const existingBooking = await prisma.booking.findFirst({
      where: {
        userId: req.user.userId,
        tripId: tripId,
        status: 'CONFIRMED'
      }
    });

    if (existingBooking) {
      return res.status(400).json({ 
        message: 'You already have a booking for this trip' 
      });
    }

    // Check seat availability if seat number is specified
    if (seatNumber) {
      const seatTaken = await prisma.booking.findFirst({
        where: {
          tripId: tripId,
          seatNumber: seatNumber,
          status: 'CONFIRMED'
        }
      });

      if (seatTaken) {
        return res.status(400).json({ 
          message: 'Seat is already taken' 
        });
      }
    }

    // Check bus capacity
    const confirmedBookings = trip.bookings.filter(
      booking => booking.status === 'CONFIRMED'
    ).length;

    if (confirmedBookings >= trip.bus.capacity) {
      return res.status(400).json({ 
        message: 'Trip is fully booked' 
      });
    }

    const booking = await prisma.booking.create({
      data: {
        userId: req.user.userId,
        tripId: tripId,
        seatNumber: seatNumber || null
      },
      include: {
        trip: {
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
            }
          }
        }
      }
    });

    res.status(201).json({ 
      message: 'Booking created successfully', 
      booking 
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Cancel booking
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        trip: true
      }
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Users can only cancel their own bookings unless they're admin
    if (req.user.role !== 'ADMIN' && booking.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if booking can be cancelled
    if (booking.status === 'CANCELLED') {
      return res.status(400).json({ 
        message: 'Booking is already cancelled' 
      });
    }

    // Check if trip has started
    if (new Date(booking.trip.scheduledAt) <= new Date()) {
      return res.status(400).json({ 
        message: 'Cannot cancel booking for trips that have started' 
      });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        trip: {
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
            }
          }
        }
      }
    });

    res.json({ 
      message: 'Booking cancelled successfully', 
      booking: updatedBooking 
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update booking (Admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { id } = req.params;
    const { seatNumber, status } = req.body;

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        seatNumber,
        status
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        trip: {
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
            }
          }
        }
      }
    });

    res.json({ 
      message: 'Booking updated successfully', 
      booking 
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete booking (Admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { id } = req.params;

    await prisma.booking.delete({
      where: { id }
    });

    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get available seats for a trip
router.get('/trip/:tripId/seats', authenticateToken, async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        bus: true,
        bookings: {
          where: {
            status: 'CONFIRMED'
          }
        }
      }
    });

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const bookedSeats = trip.bookings.map(booking => booking.seatNumber).filter(Boolean);
    const availableSeats = [];

    for (let i = 1; i <= trip.bus.capacity; i++) {
      if (!bookedSeats.includes(i)) {
        availableSeats.push(i);
      }
    }

    res.json({ 
      totalSeats: trip.bus.capacity,
      bookedSeats,
      availableSeats,
      availableCount: availableSeats.length
    });
  } catch (error) {
    console.error('Get available seats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
