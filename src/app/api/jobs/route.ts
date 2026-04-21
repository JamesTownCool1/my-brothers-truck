/**
 * /api/jobs
 *
 * GET  — list jobs (filtered by user role):
 *        - Customer: their own jobs
 *        - Helper:   open jobs near them + jobs they've accepted
 *        - Admin:    all jobs
 *        Supports ?status=OPEN|ACCEPTED|... and ?scope=mine|available
 *
 * POST — customer creates a new job. Computes distance + price estimate
 *        server-side (never trust the client with money math) and
 *        broadcasts a "job nearby" notification to active helpers.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jobCreateSchema } from '@/lib/validations';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { estimatePriceCents, haversineMeters } from '@/lib/utils';
import { notifyNearbyHelpers } from '@/lib/notifications';
import type { JobStatus, Prisma } from '@prisma/client';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get('status') as JobStatus | null;
  const scope = url.searchParams.get('scope') ?? 'mine';

  // Build a where clause based on who's asking + what they want
  let where: Prisma.JobWhereInput = {};

  if (session.user.role === 'ADMIN') {
    // Admin sees everything
    where = status ? { status } : {};
  } else if (scope === 'available' && session.user.role === 'HELPER') {
    // Helpers browsing the open marketplace
    where = { status: 'OPEN', helperId: null };
  } else {
    // Default "mine" view: jobs I posted OR jobs I'm the helper on
    where = {
      OR: [
        { customerId: session.user.id },
        { helperId: session.user.id },
      ],
      ...(status ? { status } : {}),
    };
  }

  const jobs = await prisma.job.findMany({
    where,
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 100,
    include: {
      customer: { select: { id: true, name: true, image: true, avgRating: true } },
      helper:   { select: { id: true, name: true, image: true, avgRating: true } },
      _count:   { select: { messages: true, reviews: true } },
    },
  });

  return NextResponse.json({ jobs });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit job creation so one user can't spam the board
  const rl = rateLimit(`jobs:create:${session.user.id}`, {
    limit: 10,
    windowMs: 60 * 60 * 1000, // 10 jobs / hour
  });
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many jobs posted recently' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = jobCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  // Compute distance + estimated price on the server — never from client input
  const distanceMeters = Math.round(
    haversineMeters(
      { lat: data.pickupLat,  lng: data.pickupLng },
      { lat: data.dropoffLat, lng: data.dropoffLng }
    )
  );
  const estimated = estimatePriceCents({ distanceMeters, size: data.size });
  // If the customer suggested a budget, use the max of estimate vs budget so
  // the helper isn't pressured into an underpriced job.
  const estimatedPriceCents = data.budgetCents
    ? Math.max(estimated, data.budgetCents)
    : estimated;

  const job = await prisma.job.create({
    data: {
      customerId: session.user.id,
      title: data.title,
      description: data.description,
      size: data.size,
      pickupAddress: data.pickupAddress,
      pickupLat: data.pickupLat,
      pickupLng: data.pickupLng,
      dropoffAddress: data.dropoffAddress,
      dropoffLat: data.dropoffLat,
      dropoffLng: data.dropoffLng,
      preferredTime: new Date(data.preferredTime),
      imageUrl: data.imageUrl || null,
      estimatedPriceCents,
      distanceMeters,
    },
  });

  // Fan-out notifications to nearby active helpers. Don't await blocking —
  // wrapped in try so a notification failure never kills job creation.
  notifyNearbyHelpers({
    jobId: job.id,
    pickupLat: job.pickupLat,
    pickupLng: job.pickupLng,
    pickupAddress: job.pickupAddress,
    jobTitle: job.title,
    excludeUserId: session.user.id,
  }).catch((e) => console.error('notify fan-out failed', e));

  return NextResponse.json({ job });
}
