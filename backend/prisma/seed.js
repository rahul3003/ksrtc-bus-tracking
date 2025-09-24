const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ksrtc.com' },
    update: {},
    create: {
      email: 'admin@ksrtc.com',
      password: adminPassword,
      name: 'KSRTC Admin',
      phone: '+91-9876543210',
      role: 'ADMIN'
    }
  });

  // Create sample drivers
  const driver1Password = await bcrypt.hash('driver123', 12);
  const driver1 = await prisma.user.upsert({
    where: { email: 'driver1@ksrtc.com' },
    update: {},
    create: {
      email: 'driver1@ksrtc.com',
      password: driver1Password,
      name: 'Rajesh Kumar',
      phone: '+91-9876543211',
      role: 'DRIVER'
    }
  });

  const driver2Password = await bcrypt.hash('driver123', 12);
  const driver2 = await prisma.user.upsert({
    where: { email: 'driver2@ksrtc.com' },
    update: {},
    create: {
      email: 'driver2@ksrtc.com',
      password: driver2Password,
      name: 'Suresh Nair',
      phone: '+91-9876543212',
      role: 'DRIVER'
    }
  });

  // Create sample passenger
  const passengerPassword = await bcrypt.hash('passenger123', 12);
  const passenger = await prisma.user.upsert({
    where: { email: 'passenger@example.com' },
    update: {},
    create: {
      email: 'passenger@example.com',
      password: passengerPassword,
      name: 'John Doe',
      phone: '+91-9876543213',
      role: 'PASSENGER'
    }
  });

  // Create sample buses
  const bus1 = await prisma.bus.upsert({
    where: { busNumber: 'KA-01-AB-1234' },
    update: {},
    create: {
      busNumber: 'KA-01-AB-1234',
      capacity: 50,
      model: 'Volvo B9R',
      licensePlate: 'KA-01-AB-1234'
    }
  });

  const bus2 = await prisma.bus.upsert({
    where: { busNumber: 'KA-02-CD-5678' },
    update: {},
    create: {
      busNumber: 'KA-02-CD-5678',
      capacity: 45,
      model: 'Tata Marcopolo',
      licensePlate: 'KA-02-CD-5678'
    }
  });

  // Create sample routes
  const route1 = await prisma.route.upsert({
    where: { id: 'route-bangalore-mysore' },
    update: {},
    create: {
      id: 'route-bangalore-mysore',
      name: 'Bangalore to Mysore',
      startPoint: 'Bangalore City Bus Stand',
      endPoint: 'Mysore Bus Stand',
      distance: 150.5,
      duration: 180
    }
  });

  const route2 = await prisma.route.upsert({
    where: { id: 'route-bangalore-mangalore' },
    update: {},
    create: {
      id: 'route-bangalore-mangalore',
      name: 'Bangalore to Mangalore',
      startPoint: 'Bangalore City Bus Stand',
      endPoint: 'Mangalore Bus Stand',
      distance: 350.0,
      duration: 420
    }
  });

  // Create sample trips
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(8, 0, 0, 0);

  const trip1 = await prisma.trip.create({
    data: {
      busId: bus1.id,
      routeId: route1.id,
      driverId: driver1.id,
      scheduledAt: tomorrow,
      status: 'SCHEDULED'
    }
  });

  const trip2 = await prisma.trip.create({
    data: {
      busId: bus2.id,
      routeId: route2.id,
      driverId: driver2.id,
      scheduledAt: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000), // 2 hours later
      status: 'SCHEDULED'
    }
  });

  // Create sample booking
  const booking = await prisma.booking.create({
    data: {
      userId: passenger.id,
      tripId: trip1.id,
      seatNumber: 15,
      status: 'CONFIRMED'
    }
  });

  console.log('✅ Database seeding completed!');
  console.log('📋 Created:');
  console.log(`   - Admin: ${admin.email}`);
  console.log(`   - Drivers: ${driver1.email}, ${driver2.email}`);
  console.log(`   - Passenger: ${passenger.email}`);
  console.log(`   - Buses: ${bus1.busNumber}, ${bus2.busNumber}`);
  console.log(`   - Routes: ${route1.name}, ${route2.name}`);
  console.log(`   - Trips: 2 scheduled trips`);
  console.log(`   - Booking: 1 confirmed booking`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
