/**
 * GET /api/users/[id]
 *
 * Public-ish profile view — what one user sees when tapping another
 * user's name. Returns only non-sensitive fields.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      image: true,
      bio: true,
      role: true,
      avgRating: true,
      ratingCount: true,
      createdAt: true,
      vehicles: {
        select: { make: true, model: true, year: true, color: true, capacity: true },
      },
      reviewsReceived: {
        where: { hidden: false },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          reviewer: { select: { id: true, name: true, image: true } },
        },
      },
    },
  });

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ user });
}
