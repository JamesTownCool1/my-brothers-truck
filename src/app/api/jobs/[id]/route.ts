/**
 * /api/jobs/[id]
 *
 * GET    — job detail (any party: customer, helper, admin)
 * DELETE — customer cancels BEFORE anyone accepts (soft-cancel if accepted)
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notify } from '@/lib/notifications';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: {
      customer: { select: { id: true, name: true, image: true, phone: true, avgRating: true, ratingCount: true } },
      helper:   { select: { id: true, name: true, image: true, phone: true, avgRating: true, ratingCount: true } },
      reviews: {
        where: { hidden: false },
        include: { reviewer: { select: { id: true, name: true, image: true } } },
      },
    },
  });

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  // Authorization: only the two parties + admins + (if OPEN) any helper can view
  const isParty = job.customerId === session.user.id || job.helperId === session.user.id;
  const isAdmin = session.user.role === 'ADMIN';
  const isOpenForHelpers = job.status === 'OPEN' && session.user.role === 'HELPER';

  if (!isParty && !isAdmin && !isOpenForHelpers) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ job });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const job = await prisma.job.findUnique({ where: { id: params.id } });
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  // Only the customer who posted it (or an admin) can cancel
  if (job.customerId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Completed jobs cannot be cancelled — they're immutable history
  if (job.status === 'COMPLETED') {
    return NextResponse.json({ error: 'Completed jobs cannot be cancelled' }, { status: 400 });
  }

  const updated = await prisma.job.update({
    where: { id: params.id },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  });

  // If a helper was assigned, let them know
  if (job.helperId) {
    await notify({
      userId: job.helperId,
      type: 'JOB_CANCELLED',
      title: 'Job cancelled',
      body: `"${job.title}" was cancelled by the customer.`,
      jobId: job.id,
    });
  }

  return NextResponse.json({ job: updated });
}
