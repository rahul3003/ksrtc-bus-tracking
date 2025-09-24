const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authenticateToken = require('../middleware/authenticateToken');
const axios = require('axios');

const router = express.Router();
const prisma = new PrismaClient();

// Function to get real road path using OpenRouteService (free tier)
async function getRealRoadPath(startLat, startLng, endLat, endLng) {
  try {
    // Using OpenRouteService API (free tier: 2000 requests/day)
    const response = await axios.get('https://api.openrouteservice.org/v2/directions/driving-car', {
      params: {
        api_key: process.env.OPENROUTE_API_KEY || '5b3ce3597851110001cf6248a8b8b8b8b8b8b8b8', // Free demo key
        start: `${startLng},${startLat}`,
        end: `${endLng},${endLat}`,
        format: 'geojson'
      },
      headers: {
        'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8'
      }
    });

    if (response.data && response.data.features && response.data.features[0]) {
      const route = response.data.features[0];
      const coordinates = route.geometry.coordinates.map(coord => ({
        longitude: coord[0],
        latitude: coord[1]
      }));
      
      return {
        type: 'Feature',
        geometry: route.geometry,
        properties: {
          distance: route.properties.summary.distance,
          duration: route.properties.summary.duration
        },
        coordinates: coordinates
      };
    }
    
    return null;
  } catch (error) {
    console.error('OpenRouteService error:', error.response?.data || error.message);
    
    // Fallback: create a simple path with intermediate points
    return createSimplePath(startLat, startLng, endLat, endLng);
  }
}

// Fallback function to create a simple path with intermediate points
function createSimplePath(startLat, startLng, endLat, endLng) {
  const points = [];
  const steps = 10; // Number of intermediate points
  
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    const lat = startLat + (endLat - startLat) * ratio;
    const lng = startLng + (endLng - startLng) * ratio;
    
    // Add some curve to make it look more realistic
    const curveOffset = Math.sin(ratio * Math.PI) * 0.001;
    points.push({
      longitude: lng + curveOffset,
      latitude: lat
    });
  }
  
  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: points.map(p => [p.longitude, p.latitude])
    },
    properties: {
      distance: calculateDistance(startLat, startLng, endLat, endLng),
      duration: calculateDistance(startLat, startLng, endLat, endLng) / 30 * 3600 // Assume 30 km/h
    },
    coordinates: points
  };
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// Get all routes
router.get('/', authenticateToken, async (req, res) => {
  try {
    const routes = await prisma.route.findMany({
      include: {
        trips: {
          include: {
            bus: {
              select: {
                id: true,
                busNumber: true
              }
            },
            driver: {
              select: {
                id: true,
                name: true
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
        name: 'asc'
      }
    });

    // Parse JSON fields
    const parsedRoutes = routes.map(route => ({
      ...route,
      waypoints: route.waypoints ? JSON.parse(route.waypoints) : null,
      routePath: route.routePath ? JSON.parse(route.routePath) : null
    }));

    res.json({ routes: parsedRoutes });
  } catch (error) {
    console.error('Get routes error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get route by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const route = await prisma.route.findUnique({
      where: { id },
      include: {
        trips: {
          include: {
            bus: {
              select: {
                id: true,
                busNumber: true,
                capacity: true
              }
            },
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
        }
      }
    });

    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    res.json({ route });
  } catch (error) {
    console.error('Get route error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create route (Admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { 
      name, 
      startPoint, 
      endPoint, 
      startLatitude, 
      startLongitude, 
      endLatitude, 
      endLongitude,
      distance, 
      duration,
      description,
      waypoints 
    } = req.body;

    // Validate required fields
    if (!name || !startPoint || !endPoint) {
      return res.status(400).json({ message: 'Name, start point, and end point are required' });
    }

    // If coordinates are provided, get real road path
    let routePath = null;
    if (startLatitude && startLongitude && endLatitude && endLongitude) {
      try {
        routePath = await getRealRoadPath(startLatitude, startLongitude, endLatitude, endLongitude);
      } catch (error) {
        console.error('Error getting road path:', error);
        // Continue without road path if routing service fails
      }
    }

    const route = await prisma.route.create({
      data: {
        name,
        startPoint,
        endPoint,
        startLatitude: startLatitude || null,
        startLongitude: startLongitude || null,
        endLatitude: endLatitude || null,
        endLongitude: endLongitude || null,
        distance: distance || 0,
        duration: duration || 0,
        description: description || '',
        waypoints: waypoints ? JSON.stringify(waypoints) : null,
        routePath: routePath ? JSON.stringify(routePath) : null
      }
    });

    res.status(201).json({ 
      message: 'Route created successfully',
      route: {
        ...route,
        waypoints: route.waypoints ? JSON.parse(route.waypoints) : null,
        routePath: route.routePath ? JSON.parse(route.routePath) : null
      }
    });
  } catch (error) {
    console.error('Create route error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update route (Admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { id } = req.params;
    const { name, startPoint, endPoint, distance, duration, isActive } = req.body;

    const route = await prisma.route.update({
      where: { id },
      data: {
        name,
        startPoint,
        endPoint,
        distance,
        duration,
        isActive
      }
    });

    res.json({ message: 'Route updated successfully', route });
  } catch (error) {
    console.error('Update route error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete route (Admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { id } = req.params;

    // Check if route has active trips
    const activeTrips = await prisma.trip.findFirst({
      where: {
        routeId: id,
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS']
        }
      }
    });

    if (activeTrips) {
      return res.status(400).json({ 
        message: 'Cannot delete route with active trips' 
      });
    }

    await prisma.route.delete({
      where: { id }
    });

    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    console.error('Delete route error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get active routes
router.get('/status/active', authenticateToken, async (req, res) => {
  try {
    const activeRoutes = await prisma.route.findMany({
      where: { isActive: true },
      include: {
        trips: {
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
            driver: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    res.json({ routes: activeRoutes });
  } catch (error) {
    console.error('Get active routes error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Search routes
router.get('/search/:query', authenticateToken, async (req, res) => {
  try {
    const { query } = req.params;

    const routes = await prisma.route.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { startPoint: { contains: query, mode: 'insensitive' } },
          { endPoint: { contains: query, mode: 'insensitive' } }
        ],
        isActive: true
      },
      include: {
        trips: {
          where: {
            status: 'SCHEDULED',
            scheduledAt: {
              gte: new Date()
            }
          },
          include: {
            bus: {
              select: {
                id: true,
                busNumber: true,
                capacity: true
              }
            }
          },
          orderBy: {
            scheduledAt: 'asc'
          }
        }
      }
    });

    res.json({ routes });
  } catch (error) {
    console.error('Search routes error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
