const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Real Karnataka routes with districts and major locations
const sampleRoutes = [
  {
    name: "Bangalore to Mysore",
    startPoint: "Bangalore City Bus Stand (Majestic)",
    endPoint: "Mysore City Bus Stand",
    startDistrict: "Bangalore Urban",
    endDistrict: "Mysore",
    startLatitude: 12.9774,
    startLongitude: 77.5703,
    endLatitude: 12.2958,
    endLongitude: 76.6394,
    description: "Popular intercity route connecting Karnataka's capital to cultural capital"
  },
  {
    name: "Bangalore to Hubli",
    startPoint: "Bangalore City Bus Stand (Majestic)",
    endPoint: "Hubli Bus Stand",
    startDistrict: "Bangalore Urban",
    endDistrict: "Dharwad",
    startLatitude: 12.9774,
    startLongitude: 77.5703,
    endLatitude: 15.3647,
    endLongitude: 75.1240,
    description: "Major route connecting South Karnataka to North Karnataka"
  },
  {
    name: "Bangalore to Mangalore",
    startPoint: "Bangalore City Bus Stand (Majestic)",
    endPoint: "Mangalore Central Bus Stand",
    startDistrict: "Bangalore Urban",
    endDistrict: "Dakshina Kannada",
    startLatitude: 12.9774,
    startLongitude: 77.5703,
    endLatitude: 12.9141,
    endLongitude: 74.8560,
    description: "Coastal route connecting Bangalore to port city"
  },
  {
    name: "Mysore to Hassan",
    startPoint: "Mysore City Bus Stand",
    endPoint: "Hassan Bus Stand",
    startDistrict: "Mysore",
    endDistrict: "Hassan",
    startLatitude: 12.2958,
    startLongitude: 76.6394,
    endLatitude: 13.0048,
    endLongitude: 76.1025,
    description: "Route through Karnataka's heritage region"
  },
  {
    name: "Hubli to Belgaum",
    startPoint: "Hubli Bus Stand",
    endPoint: "Belgaum Bus Stand",
    startDistrict: "Dharwad",
    endDistrict: "Belgaum",
    startLatitude: 15.3647,
    startLongitude: 75.1240,
    endLatitude: 15.8497,
    endLongitude: 74.4977,
    description: "North Karnataka intercity route"
  },
  {
    name: "Bangalore to Tumkur",
    startPoint: "Bangalore City Bus Stand (Majestic)",
    endPoint: "Tumkur Bus Stand",
    startDistrict: "Bangalore Urban",
    endDistrict: "Tumkur",
    startLatitude: 12.9774,
    startLongitude: 77.5703,
    endLatitude: 13.3409,
    endLongitude: 77.1022,
    description: "Short distance route to industrial city"
  },
  {
    name: "Mangalore to Udupi",
    startPoint: "Mangalore Central Bus Stand",
    endPoint: "Udupi Bus Stand",
    startDistrict: "Dakshina Kannada",
    endDistrict: "Udupi",
    startLatitude: 12.9141,
    startLongitude: 74.8560,
    endLatitude: 13.3409,
    endLongitude: 74.7421,
    description: "Coastal route connecting major coastal cities"
  },
  {
    name: "Bangalore to Chitradurga",
    startPoint: "Bangalore City Bus Stand (Majestic)",
    endPoint: "Chitradurga Bus Stand",
    startDistrict: "Bangalore Urban",
    endDistrict: "Chitradurga",
    startLatitude: 12.9774,
    startLongitude: 77.5703,
    endLatitude: 14.2254,
    endLongitude: 76.3980,
    description: "Route to historical fort city"
  },
  {
    name: "Bangalore to Davangere",
    startPoint: "Bangalore City Bus Stand (Majestic)",
    endPoint: "Davangere Bus Stand",
    startDistrict: "Bangalore Urban",
    endDistrict: "Davangere",
    startLatitude: 12.9774,
    startLongitude: 77.5703,
    endLatitude: 14.4644,
    endLongitude: 75.9218,
    description: "Route to industrial city of Davangere"
  },
  {
    name: "Hubli to Haveri",
    startPoint: "Hubli Bus Stand",
    endPoint: "Haveri Bus Stand",
    startDistrict: "Dharwad",
    endDistrict: "Haveri",
    startLatitude: 15.3647,
    startLongitude: 75.1240,
    endLatitude: 14.7936,
    endLongitude: 75.4044,
    description: "Short distance route between Hubli and Haveri"
  }
];

const sampleBuses = [
  { busNumber: "KA-01-AB-1234", capacity: 50, model: "Tata Marcopolo", licensePlate: "KA-01-AB-1234" },
  { busNumber: "KA-02-CD-5678", capacity: 45, model: "Ashok Leyland", licensePlate: "KA-02-CD-5678" },
  { busNumber: "KA-03-EF-9012", capacity: 55, model: "Volvo B7R", licensePlate: "KA-03-EF-9012" },
  { busNumber: "KA-04-GH-3456", capacity: 40, model: "Tata Starbus", licensePlate: "KA-04-GH-3456" },
  { busNumber: "KA-05-IJ-7890", capacity: 50, model: "Ashok Leyland JanBus", licensePlate: "KA-05-IJ-7890" }
];

const sampleDrivers = [
  { name: "Rajesh Kumar", email: "rajesh@ksrtc.com", phone: "9876543210" },
  { name: "Suresh Reddy", email: "suresh@ksrtc.com", phone: "9876543211" },
  { name: "Kumar Swamy", email: "kumar@ksrtc.com", phone: "9876543212" },
  { name: "Venkatesh Gowda", email: "venkatesh@ksrtc.com", phone: "9876543213" },
  { name: "Manoj Singh", email: "manoj@ksrtc.com", phone: "9876543214" }
];

const samplePassengers = [
  { name: "Priya Sharma", email: "priya@example.com", phone: "9123456780" },
  { name: "Amit Patel", email: "amit@example.com", phone: "9123456781" },
  { name: "Sunita Devi", email: "sunita@example.com", phone: "9123456782" },
  { name: "Ravi Kumar", email: "ravi@example.com", phone: "9123456783" },
  { name: "Kavitha Reddy", email: "kavitha@example.com", phone: "9123456784" },
  { name: "Suresh Nair", email: "suresh@example.com", phone: "9123456785" },
  { name: "Meera Joshi", email: "meera@example.com", phone: "9123456786" },
  { name: "Vikram Singh", email: "vikram@example.com", phone: "9123456787" }
];

async function generateSampleData() {
  try {
    console.log('🚀 Starting sample data generation...');

    // Clear existing data
    await prisma.booking.deleteMany();
    await prisma.location.deleteMany();
    await prisma.trip.deleteMany();
    await prisma.route.deleteMany();
    await prisma.bus.deleteMany();
    await prisma.user.deleteMany();

    console.log('✅ Cleared existing data');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@ksrtc.com',
        password: hashedPassword,
        phone: '9876543210',
        role: 'ADMIN'
      }
    });
    console.log('✅ Created admin user');

    // Create drivers
    const drivers = [];
    for (const driverData of sampleDrivers) {
      const hashedPassword = await bcrypt.hash('driver123', 10);
      const driver = await prisma.user.create({
        data: {
          ...driverData,
          password: hashedPassword,
          role: 'DRIVER'
        }
      });
      drivers.push(driver);
    }
    console.log('✅ Created drivers');

    // Create passengers
    const passengers = [];
    for (const passengerData of samplePassengers) {
      const hashedPassword = await bcrypt.hash('passenger123', 10);
      const passenger = await prisma.user.create({
        data: {
          ...passengerData,
          password: hashedPassword,
          role: 'PASSENGER'
        }
      });
      passengers.push(passenger);
    }
    console.log('✅ Created passengers');

    // Create buses
    const buses = [];
    for (const busData of sampleBuses) {
      const bus = await prisma.bus.create({
        data: busData
      });
      buses.push(bus);
    }
    console.log('✅ Created buses');

    // Create routes with waypoints
    const routes = [];
    for (const routeData of sampleRoutes) {
      // Generate waypoints along the route
      const waypoints = generateWaypoints(
        routeData.startLatitude,
        routeData.startLongitude,
        routeData.endLatitude,
        routeData.endLongitude,
        routeData.startDistrict,
        routeData.endDistrict
      );

      const route = await prisma.route.create({
        data: {
          name: routeData.name,
          startPoint: routeData.startPoint,
          endPoint: routeData.endPoint,
          startDistrict: routeData.startDistrict,
          endDistrict: routeData.endDistrict,
          startLatitude: routeData.startLatitude,
          startLongitude: routeData.startLongitude,
          endLatitude: routeData.endLatitude,
          endLongitude: routeData.endLongitude,
          distance: calculateDistance(
            routeData.startLatitude,
            routeData.startLongitude,
            routeData.endLatitude,
            routeData.endLongitude
          ),
          duration: Math.floor(calculateDistance(
            routeData.startLatitude,
            routeData.startLongitude,
            routeData.endLatitude,
            routeData.endLongitude
          ) / 30 * 60), // Assume 30 km/h average speed
          description: routeData.description,
          waypoints: JSON.stringify(waypoints)
        }
      });
      routes.push(route);
    }
    console.log('✅ Created routes with waypoints');

    // Create trips for today and tomorrow
    const trips = [];
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    for (let day = 0; day < 2; day++) {
      const tripDate = day === 0 ? today : tomorrow;
      
      for (let i = 0; i < routes.length; i++) {
        const route = routes[i];
        const bus = buses[i % buses.length];
        const driver = drivers[i % drivers.length];

        // Create multiple trips per route per day
        for (let tripTime = 0; tripTime < 3; tripTime++) {
          const scheduledAt = new Date(tripDate);
          scheduledAt.setHours(8 + tripTime * 4, 0, 0, 0); // 8 AM, 12 PM, 4 PM

          const trip = await prisma.trip.create({
            data: {
              busId: bus.id,
              routeId: route.id,
              driverId: driver.id,
              scheduledAt: scheduledAt,
              status: tripTime === 0 ? 'IN_PROGRESS' : 'SCHEDULED'
            }
          });
          trips.push(trip);
        }
      }
    }
    console.log('✅ Created trips');

    // Create bookings for passengers
    const bookings = [];
    for (const trip of trips) {
      // Create 3-8 bookings per trip
      const numBookings = Math.floor(Math.random() * 6) + 3;
      const shuffledPassengers = [...passengers].sort(() => 0.5 - Math.random());
      
      for (let i = 0; i < numBookings && i < shuffledPassengers.length; i++) {
        const passenger = shuffledPassengers[i];
        const seatNumber = i + 1;
        const fare = Math.floor(Math.random() * 50) + 20; // ₹20-70

        const booking = await prisma.booking.create({
          data: {
            userId: passenger.id,
            tripId: trip.id,
            seatNumber: seatNumber,
            status: 'CONFIRMED'
          }
        });
        bookings.push(booking);
      }
    }
    console.log('✅ Created bookings');

    // Create location data for active trips
    for (const trip of trips.filter(t => t.status === 'IN_PROGRESS')) {
      const route = routes.find(r => r.id === trip.routeId);
      const waypoints = JSON.parse(route.waypoints);
      
      // Create 5-10 location updates for each active trip
      const numLocations = Math.floor(Math.random() * 6) + 5;
      for (let i = 0; i < numLocations; i++) {
        const waypointIndex = Math.floor((i / numLocations) * waypoints.length);
        const waypoint = waypoints[waypointIndex];
        
        // Ensure valid coordinates
        const latitude = waypoint.latitude + (Math.random() - 0.5) * 0.001;
        const longitude = waypoint.longitude + (Math.random() - 0.5) * 0.001;
        
        if (isNaN(latitude) || isNaN(longitude)) {
          console.log('Invalid waypoint coordinates:', waypoint);
          continue;
        }
        
        const location = await prisma.location.create({
          data: {
            tripId: trip.id,
            latitude: latitude,
            longitude: longitude,
            speed: Math.floor(Math.random() * 20) + 20, // 20-40 km/h
            heading: Math.floor(Math.random() * 360),
            timestamp: new Date(Date.now() - (numLocations - i) * 2 * 60 * 1000) // 2 minutes apart
          }
        });
      }
    }
    console.log('✅ Created location data');

    console.log('\n🎉 Sample data generation completed!');
    console.log(`📊 Generated:`);
    console.log(`   - 1 Admin user`);
    console.log(`   - ${drivers.length} Drivers`);
    console.log(`   - ${passengers.length} Passengers`);
    console.log(`   - ${buses.length} Buses`);
    console.log(`   - ${routes.length} Routes`);
    console.log(`   - ${trips.length} Trips`);
    console.log(`   - ${bookings.length} Bookings`);
    console.log(`   - Location data for active trips`);
    
    console.log('\n🔑 Login Credentials:');
    console.log('   Admin: admin@ksrtc.com / admin123');
    console.log('   Driver: rajesh@ksrtc.com / driver123');
    console.log('   Passenger: priya@example.com / passenger123');

  } catch (error) {
    console.error('❌ Error generating sample data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to generate waypoints along a route with real Karnataka locations
function generateWaypoints(startLat, startLng, endLat, endLng, startDistrict, endDistrict) {
  const waypoints = [];
  
  // Define major intermediate locations based on route
  const intermediateStops = getIntermediateStops(startLat, startLng, endLat, endLng, startDistrict, endDistrict);
  
  // Add start point
  waypoints.push({
    name: getStartLocationName(startDistrict),
    district: startDistrict,
    latitude: startLat,
    longitude: startLng,
    stopTime: 0,
    type: 'start'
  });
  
  // Add intermediate stops
  intermediateStops.forEach((stop, index) => {
    waypoints.push({
      name: stop.name,
      district: stop.district,
      latitude: stop.latitude,
      longitude: stop.longitude,
      stopTime: 30000, // 30 seconds at intermediate stops
      type: 'intermediate'
    });
  });
  
  // Add end point
  waypoints.push({
    name: getEndLocationName(endDistrict),
    district: endDistrict,
    latitude: endLat,
    longitude: endLng,
    stopTime: 0,
    type: 'end'
  });
  
  return waypoints;
}

// Get intermediate stops based on route
function getIntermediateStops(startLat, startLng, endLat, endLng, startDistrict, endDistrict) {
  const stops = [];
  
  // Major Karnataka cities and towns with coordinates
  const karnatakaLocations = {
    'Bangalore Urban': [
      { name: 'Electronic City', lat: 12.8456, lng: 77.6603 },
      { name: 'Koramangala', lat: 12.9279, lng: 77.6271 },
      { name: 'Whitefield', lat: 12.9698, lng: 77.7500 },
      { name: 'Yelahanka', lat: 13.1007, lng: 77.5963 }
    ],
    'Mysore': [
      { name: 'Srirangapatna', lat: 12.4141, lng: 76.7042 },
      { name: 'Mandya', lat: 12.5242, lng: 76.8958 },
      { name: 'Chamundi Hills', lat: 12.2729, lng: 76.6700 }
    ],
    'Dharwad': [
      { name: 'Dharwad City', lat: 15.4589, lng: 75.0078 },
      { name: 'Gadag', lat: 15.4319, lng: 75.6319 },
      { name: 'Haveri', lat: 14.7936, lng: 75.4044 }
    ],
    'Dakshina Kannada': [
      { name: 'Bantwal', lat: 12.9025, lng: 75.0336 },
      { name: 'Puttur', lat: 12.7667, lng: 75.2167 },
      { name: 'Sullia', lat: 12.5667, lng: 75.3833 }
    ],
    'Hassan': [
      { name: 'Arsikere', lat: 13.3167, lng: 76.2500 },
      { name: 'Holenarasipura', lat: 12.7833, lng: 76.2500 },
      { name: 'Sakleshpur', lat: 12.9500, lng: 75.7833 }
    ],
    'Belgaum': [
      { name: 'Gokak', lat: 16.1667, lng: 74.8333 },
      { name: 'Chikkodi', lat: 16.4167, lng: 74.6000 },
      { name: 'Athani', lat: 16.7333, lng: 75.0667 }
    ],
    'Tumkur': [
      { name: 'Sira', lat: 13.7500, lng: 76.9000 },
      { name: 'Tiptur', lat: 13.2500, lng: 76.4833 },
      { name: 'Madhugiri', lat: 13.6667, lng: 77.2167 }
    ],
    'Udupi': [
      { name: 'Kundapura', lat: 13.6333, lng: 74.6833 },
      { name: 'Karkala', lat: 13.2000, lng: 74.9833 },
      { name: 'Kaup', lat: 13.4000, lng: 74.7500 }
    ],
    'Chitradurga': [
      { name: 'Hiriyur', lat: 13.9500, lng: 76.6167 },
      { name: 'Hosadurga', lat: 13.7833, lng: 76.2833 },
      { name: 'Molakalmuru', lat: 14.7333, lng: 76.7167 }
    ],
    'Davangere': [
      { name: 'Harihar', lat: 14.5167, lng: 75.8000 },
      { name: 'Honnali', lat: 14.2333, lng: 75.6500 },
      { name: 'Channagiri', lat: 14.0167, lng: 75.9333 }
    ],
    'Haveri': [
      { name: 'Ranibennur', lat: 14.6167, lng: 75.6167 },
      { name: 'Hangal', lat: 14.7667, lng: 75.1333 },
      { name: 'Byadgi', lat: 14.6833, lng: 75.4833 }
    ]
  };
  
  // Select 2-3 intermediate stops based on the route
  const startLocations = karnatakaLocations[startDistrict] || [];
  const endLocations = karnatakaLocations[endDistrict] || [];
  
  // Add stops from start district
  if (startLocations.length > 0) {
    const startStop = startLocations[Math.floor(Math.random() * startLocations.length)];
    stops.push({
      name: startStop.name,
      district: startDistrict,
      latitude: startStop.lat,
      longitude: startStop.lng
    });
  }
  
  // Add stops from end district
  if (endLocations.length > 0) {
    const endStop = endLocations[Math.floor(Math.random() * endLocations.length)];
    stops.push({
      name: endStop.name,
      district: endDistrict,
      latitude: endStop.lat,
      longitude: endStop.lng
    });
  }
  
  return stops;
}

// Get start location name based on district
function getStartLocationName(district) {
  const locationNames = {
    'Bangalore Urban': 'Bangalore City Bus Stand (Majestic)',
    'Mysore': 'Mysore City Bus Stand',
    'Dharwad': 'Hubli Bus Stand',
    'Dakshina Kannada': 'Mangalore Central Bus Stand',
    'Hassan': 'Hassan Bus Stand',
    'Belgaum': 'Belgaum Bus Stand',
    'Tumkur': 'Tumkur Bus Stand',
    'Udupi': 'Udupi Bus Stand',
    'Chitradurga': 'Chitradurga Bus Stand',
    'Davangere': 'Davangere Bus Stand',
    'Haveri': 'Haveri Bus Stand'
  };
  return locationNames[district] || `${district} Bus Stand`;
}

// Get end location name based on district
function getEndLocationName(district) {
  const locationNames = {
    'Bangalore Urban': 'Bangalore City Bus Stand (Majestic)',
    'Mysore': 'Mysore City Bus Stand',
    'Dharwad': 'Hubli Bus Stand',
    'Dakshina Kannada': 'Mangalore Central Bus Stand',
    'Hassan': 'Hassan Bus Stand',
    'Belgaum': 'Belgaum Bus Stand',
    'Tumkur': 'Tumkur Bus Stand',
    'Udupi': 'Udupi Bus Stand',
    'Chitradurga': 'Chitradurga Bus Stand',
    'Davangere': 'Davangere Bus Stand',
    'Haveri': 'Haveri Bus Stand'
  };
  return locationNames[district] || `${district} Bus Stand`;
}

// Helper function to calculate distance between two points
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

// Run the script
generateSampleData();
