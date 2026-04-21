/**
 * /api/jobs/[id]/reviews
 *
 * GET  — list reviews for a job (both directions)
 * POST — post a review. Only allowed when:
 *        - the job is COMPLETED
 *        - you are one of the two parties
 *        - you haven't already reviewed this job (unique constraint)
 *
 * Also recomputes the reviewee's avgRating / ratingCount in the same
 * transaction so profile scores stay accurate without a nightly job.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { reviewSchema } from '@/lib/validations';
import { notify } from '@/lib/notifications';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const reviews = await prisma.review.findMany({
    where: { jobId: params.id, hidden: false },
    include: {
      reviewer: { select: { id: true, name: true, image: true } },
      reviewee: { select: { id: true, name: true, image: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ reviews });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid review' }, { status: 400 });
  }

  const job = await prisma.job.findUnique({
    where: { id: params.id },
    select: { id: true, status: true, customerId: true, helperId: true, title: true },
  });
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (job.status !== 'COMPLETED') {
    return NextResponse.json(
      { error: 'Reviews are only allowed on completed jobs' },
      { status: 400 }
    );
  }

  // Determine reviewee (the other party)
  let revieweeId: string | null = null;
  if (job.customerId === session.user.id && job.helperId) revieweeId = job.helperId;
  else if (job.helperId === session.user.id) revieweeId = job.customerId;

  if (!revieweeId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Use a transaction: create review + update aggregate in lockstep so the
  // denormalized avgRating can never drift from the underlying reviews table.
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.review.findUnique({
      where: { jobId_reviewerId: { jobId: job.id, reviewerId: session.user.id } },
    });
    if (existing) throw new Error('ALREADY_REVIEWED');

    const review = await tx.review.create({
      data: {
        jobId: job.id,
        reviewerId: session.user.id,
        revieweeId: revieweeId!,
        rating: parsed.data.rating,
        comment: parsed.data.comment ?? null,
      },
    });

    // Recompute aggregate from source of truth
    const agg = await tx.review.aggregate({
      where: { revieweeId: revieweeId!, hidden: false },
      _avg: { rating: true },
      _count: true,
    });

    await tx.user.update({
      where: { id: revieweeId! },
      data: {
        avgRating: agg._avg.rating ?? 0,
        ratingCount: agg._count,
      },
    });

    return review;
  }).catch((err) => {
    if (err.message === 'ALREADY_REVIEWED') return null;
    throw err;
  });

  if (!result) {
    return NextResponse.json(
      { error: "You've already reviewed this job" },
      { status: 409 }
    );
  }

  await notify({
    userId: revieweeId,
    type: 'NEW_REVIEW',
    title: 'You got a new review',
    body: `${parsed.data.rating}★ on "${job.title}"`,
    jobId: job.id,
  });

  return NextResponse.json({ review: result });
}
