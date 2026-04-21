/**
 * Seed script — populates the database with demo users, vehicles, and jobs
 * so you can explore the app immediately after setup.
 *
 * Run with: npm run prisma:seed
 */
import { PrismaClient, JobSize, JobStatus, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data (dev only)
  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.message.deleteMany();
  await prisma.job.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // --- Users ---
  const admin = await prisma.user.create({
    data: {
      email: 'admin@mbt.com',
      password: passwordHash,
      name: 'Admin User',
      role: UserRole.ADMIN,
      phone: '+1 555 000 0001',
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      email: 'maria@example.com',
      password: passwordHash,
      name: 'Maria Gonzalez',
      phone: '+1 210 555 1234',
      bio: 'Just bought a new apartment — lots of furniture coming soon!',
      role: UserRole.CUSTOMER,
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      email: 'james@example.com',
      password: passwordHash,
      name: 'James Carter',
      phone: '+1 210 555 2345',
      role: UserRole.CUSTOMER,
    },
  });

  const helper1 = await prisma.user.create({
    data: {
      email: 'diego@example.com',
      password: passwordHash,
      name: 'Diego Ramirez',
      phone: '+1 210 555 3456',
      bio: "Own a Ford F-150. Helping neighbors move stuff on weekends.",
      role: UserRole.HELPER,
      isHelperActive: true,
      avgRating: 4.9,
      ratingCount: 23,
      baseLat: 29.4241,
      baseLng: -98.4936,
      baseAddress: 'Downtown San Antonio, TX',
    },
  });

  const helper2 = await prisma.user.create({
    data: {
      email: 'sarah@example.com',
      password: passwordHash,
      name: 'Sarah Kim',
      phone: '+1 210 555 4567',
      bio: 'Retired, drive a Chevy Silverado. Happy to help with small moves.',
      role: UserRole.HELPER,
      isHelperActive: true,
      avgRating: 4.7,
      ratingCount: 14,
      baseLat: 29.4860,
      baseLng: -98.5120,
      baseAddress: 'Stone Oak, San Antonio, TX',
    },
  });

  // --- Vehicles ---
  await prisma.vehicle.create({
    data: {
      ownerId: helper1.id,
      make: 'Ford',
      model: 'F-150',
      year: 2020,
      color: 'Silver',
      capacity: JobSize.LARGE,
    },
  });

  await prisma.vehicle.create({
    data: {
      ownerId: helper2.id,
      make: 'Chevrolet',
      model: 'Silverado 1500',
      year: 2019,
      color: 'Red',
      capacity: JobSize.LARGE,
    },
  });

  // --- Jobs ---
  const sanAntonio = { lat: 29.4241, lng: -98.4936 };

  const openJob = await prisma.job.create({
    data: {
      customerId: customer1.id,
      title: 'Move new 65" TV from Best Buy',
      description:
        'Just bought a 65 inch LG TV. Need help getting it from Best Buy on Loop 1604 to my apartment downtown. Still in the box.',
      size: JobSize.MEDIUM,
      pickupAddress: 'Best Buy, 125 NW Loop 410, San Antonio, TX',
      pickupLat: sanAntonio.lat + 0.03,
      pickupLng: sanAntonio.lng + 0.02,
      dropoffAddress: '200 E Houston St, San Antonio, TX',
      dropoffLat: sanAntonio.lat,
      dropoffLng: sanAntonio.lng,
      preferredTime: new Date(Date.now() + 1000 * 60 * 60 * 24), // tomorrow
      estimatedPriceCents: 3500,
      distanceMeters: 8000,
      status: JobStatus.OPEN,
    },
  });

  const acceptedJob = await prisma.job.create({
    data: {
      customerId: customer2.id,
      helperId: helper1.id,
      title: 'IKEA couch pickup',
      description: 'Sectional sofa from IKEA Live Oak. It is flat-packed in two boxes.',
      size: JobSize.LARGE,
      pickupAddress: 'IKEA, 6711 Topperwein Rd, Live Oak, TX',
      pickupLat: 29.5510,
      pickupLng: -98.3410,
      dropoffAddress: '4521 Broadway, San Antonio, TX',
      dropoffLat: 29.4680,
      dropoffLng: -98.4700,
      preferredTime: new Date(Date.now() + 1000 * 60 * 60 * 3),
      estimatedPriceCents: 6000,
      finalPriceCents: 6500,
      distanceMeters: 15000,
      status: JobStatus.ACCEPTED,
      acceptedAt: new Date(),
    },
  });

  const completedJob = await prisma.job.create({
    data: {
      customerId: customer1.id,
      helperId: helper2.id,
      title: 'Dresser from Facebook Marketplace',
      description: 'Oak dresser, seller address below. Seller will help load.',
      size: JobSize.LARGE,
      pickupAddress: '1200 N Main Ave, San Antonio, TX',
      pickupLat: 29.4430,
      pickupLng: -98.4920,
      dropoffAddress: '800 S Alamo St, San Antonio, TX',
      dropoffLat: 29.4160,
      dropoffLng: -98.4930,
      preferredTime: new Date(Date.now() - 1000 * 60 * 60 * 48),
      estimatedPriceCents: 4500,
      finalPriceCents: 4500,
      distanceMeters: 3500,
      status: JobStatus.COMPLETED,
      acceptedAt: new Date(Date.now() - 1000 * 60 * 60 * 50),
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 49),
      completedAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
      paidAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
    },
  });

  // Messages for accepted job
  await prisma.message.createMany({
    data: [
      {
        jobId: acceptedJob.id,
        senderId: helper1.id,
        body: "Hey! I'll pick up the couch in about an hour. Sound good?",
      },
      {
        jobId: acceptedJob.id,
        senderId: customer2.id,
        body: 'Perfect — I just let the front desk know. Thanks!',
      },
    ],
  });

  // Reviews for the completed job (both directions)
  await prisma.review.create({
    data: {
      jobId: completedJob.id,
      reviewerId: customer1.id,
      revieweeId: helper2.id,
      rating: 5,
      comment: 'Sarah was super careful with my dresser. 10/10 would book again.',
    },
  });
  await prisma.review.create({
    data: {
      jobId: completedJob.id,
      reviewerId: helper2.id,
      revieweeId: customer1.id,
      rating: 5,
      comment: 'Easy pickup, item was exactly as described, great communication.',
    },
  });

  console.log('✅ Seed complete!');
  console.log('');
  console.log('Demo accounts (password for all: "password123"):');
  console.log('  Admin:    admin@mbt.com');
  console.log('  Customer: maria@example.com');
  console.log('  Customer: james@example.com');
  console.log('  Helper:   diego@example.com');
  console.log('  Helper:   sarah@example.com');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
