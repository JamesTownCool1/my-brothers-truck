/**
 * Notification helper — creates a Notification row which the client polls
 * via /api/notifications. In a full build this would also push to the
 * user via WebSocket / Web Push / SMS, but the DB record is the canonical
 * source of truth either way.
 */
import { prisma } from './prisma';
import type { NotificationType } from '@prisma/client';

export async function notify(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  jobId?: string;
}) {
  try {
    await prisma.notification.create({ data: params });
  } catch (err) {
    // Non-critical — log and move on rather than failing the parent request
    console.error('Failed to create notification:', err);
  }
}

/**
 * Broadcast a new-job notification to every online helper within `radiusMeters`
 * of the pickup location. Uses a naive bounding-box + haversine filter because
 * PostGIS would be overkill for the MVP.
 */
export async function notifyNearbyHelpers(params: {
  jobId: string;
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  jobTitle: string;
  excludeUserId: string; // don't notify the customer who just posted
  radiusMeters?: number;
}) {
  const radius = params.radiusMeters ?? 25000; // 25km default
  // Rough degree-per-meter for bounding box pre-filter (1° lat ≈ 111km)
  const latDelta = radius / 111000;
  const lngDelta = radius / (111000 * Math.cos((params.pickupLat * Math.PI) / 180));

  const candidates = await prisma.user.findMany({
    where: {
      role: 'HELPER',
      isHelperActive: true,
      id: { not: params.excludeUserId },
      baseLat: { gte: params.pickupLat - latDelta, lte: params.pickupLat + latDelta },
      baseLng: { gte: params.pickupLng - lngDelta, lte: params.pickupLng + lngDelta },
    },
    select: { id: true },
  });

  if (candidates.length === 0) return;

  await prisma.notification.createMany({
    data: candidates.map((h) => ({
      userId: h.id,
      type: 'JOB_NEW_NEARBY' as NotificationType,
      title: 'New job nearby',
      body: `${params.jobTitle} — pickup near ${params.pickupAddress}`,
      jobId: params.jobId,
    })),
  });
}
