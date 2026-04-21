/**
 * POST /api/jobs/[id]/accept
 * Body: { finalPriceCents?: number }
 *
 * Helper accepts an open job. Uses an atomic `updateMany` with a status
 * guard so two helpers tapping "Accept" at the same instant can't both win —
 * exactly one of them will get rowsAffected === 1.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notify } from '@/lib/notifications';

const schema = z.object({
  finalPriceCents: z.number().int().min(500).max(500000).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== 'HELPER') {
    return NextResponse.json({ error: 'Only helpers can accept jobs' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
  }

  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (job.customerId === session.user.id) {
    return NextResponse.json({ error: "You can't accept your own job" }, { status: 400 });
  }

  const result = await prisma.job.updateMany({
    where: { id, status: 'OPEN', helperId: null },
    data: {
      helperId: session.user.id,
      status: 'ACCEPTED',
      acceptedAt: new Date(),
      finalPriceCents: parsed.data.finalPriceCents ?? job.estimatedPriceCents,
    },
  });

  if (result.count === 0) {
    return NextResponse.json(
      { error: 'This job is no longer available' },
      { status: 409 }
    );
  }

  const updated = await prisma.job.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true } },
      helper:   { select: { id: true, name: true } },
    },
  });

  if (updated) {
    await notify({
      userId: updated.customerId,
      type: 'JOB_ACCEPTED',
      title: 'Your job was accepted!',
      body: `${updated.helper?.name ?? 'A helper'} will handle "${updated.title}".`,
      jobId: updated.id,
    });
  }

  return NextResponse.json({ job: updated });
}