const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Sample data for different cities in India
const sampleRoutes = [
  {
    name: "City Center to Airport",
    startPoint: "City Center",
    endPoint: "Kempegowda International Airport",
    startLatitude: 12.9716,
    startLongitude: 77.5946,
    endLatitude: 13.1986,
    endLongitude: 77.7063,
    description: "Direct route from city center to airport"
  },
  {
    name: "Railway Station to Mall",
    startPoint: "Bangalore City Railway Station",
    endPoint: "Phoenix MarketCity",
    startLatitude: 12.9767,
    startLongitude: 77.5753,
    endLatitude: 12.9958,
    endLongitude: 77.6591,
    description: "Route connecting railway station to shopping mall"
  },
  {
    name: "University to Hospital",
    startPoint: "Indian Institute of Science",
    endPoint: "Manipal Hospital",
    startLatitude: 13.0208,
    startLongitude: 77.5701,
    endLatitude: 12.9141,
    startLongitude: 77.5962,
    description: "Route from university to major hospital"
  },
  {
    name: "IT Park to Residential Area",
    startPoint: "Electronic City",
    endPoint: "Koramangala",
    startLatitude: 12.8456,
    startLongitude: 77.6603,
    endLatitude: 12.9279,
    endLongitude: 77.6271,
    description: "Route from IT hub to residential area"
  },
  {
    name: "Bus Stand to Temple",
    startPoint: "Majestic Bus Stand",
    endPoint: "ISKCON Temple",
    startLatitude: 12.9774,
    startLongitude: 77.5703,
    endLatitude: 12.8408,
    endLongitude: 77.6651,
    description: "Route from main bus stand to temple"
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
        routeData.endLongitude
      );

      const route = await prisma.route.create({
        data: {
          ...routeData,
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
        
        const location = await prisma.location.create({
          data: {
            tripId: trip.id,
            latitude: waypoint.latitude + (Math.random() - 0.5) * 0.001, // Add some randomness
            longitude: waypoint.longitude + (Math.random() - 0.5) * 0.001,
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

// Helper function to generate waypoints along a route
function generateWaypoints(startLat, startLng, endLat, endLng) {
  const waypoints = [];
  const numWaypoints = 5;
  
  for (let i = 0; i <= numWaypoints; i++) {
    const ratio = i / numWaypoints;
    const lat = startLat + (endLat - startLat) * ratio;
    const lng = startLng + (endLng - startLng) * ratio;
    
    // Add some curve to make it look more realistic
    const curveOffset = Math.sin(ratio * Math.PI) * 0.002;
    
    waypoints.push({
      name: i === 0 ? 'Start Point' : i === numWaypoints ? 'End Point' : `Stop ${i}`,
      latitude: lat + curveOffset,
      longitude: lng,
      stopTime: i === 0 || i === numWaypoints ? 0 : 30000 // 30 seconds at intermediate stops
    });
  }
  
  return waypoints;
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
