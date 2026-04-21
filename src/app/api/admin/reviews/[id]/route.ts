/**
 * PATCH /api/admin/reviews/[id]
 * Body: { hidden: boolean }
 *
 * Hides/unhides an abusive review. Recomputes the reviewee's aggregate
 * avgRating/ratingCount so the hidden review stops contributing to their
 * public score.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const schema = z.object({ hidden: z.boolean() });

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    const review = await tx.review.update({
      where: { id: params.id },
      data: { hidden: parsed.data.hidden },
    });

    // Keep aggregate rating in sync
    const agg = await tx.review.aggregate({
      where: { revieweeId: review.revieweeId, hidden: false },
      _avg: { rating: true },
      _count: true,
    });

    await tx.user.update({
      where: { id: review.revieweeId },
      data: {
        avgRating: agg._avg.rating ?? 0,
        ratingCount: agg._count,
      },
    });
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const review = await prisma.review.findUnique({ where: { id: params.id } });
  if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.review.delete({ where: { id: params.id } });
    const agg = await tx.review.aggregate({
      where: { revieweeId: review.revieweeId, hidden: false },
      _avg: { rating: true },
      _count: true,
    });
    await tx.user.update({
      where: { id: review.revieweeId },
      data: { avgRating: agg._avg.rating ?? 0, ratingCount: agg._count },
    });
  });

  return NextResponse.json({ ok: true });
}
