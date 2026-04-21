/**
 * POST /api/jobs/[id]/status
 * Body: { action: "START" | "COMPLETE" | "CANCEL" }
 *
 * Encodes the valid state transitions:
 *   ACCEPTED   --START--> IN_PROGRESS
 *   IN_PROGRESS --COMPLETE--> COMPLETED
 *   ACCEPTED|IN_PROGRESS --CANCEL--> CANCELLED
 *
 * Only the assigned helper (or admin) can START/COMPLETE.
 * Either party can CANCEL.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jobStatusSchema } from '@/lib/validations';
import { notify } from '@/lib/notifications';
import type { JobStatus } from '@prisma/client';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = jobStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const job = await prisma.job.findUnique({ where: { id: params.id } });
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const isCustomer = job.customerId === session.user.id;
  const isHelper = job.helperId === session.user.id;
  const isAdmin = session.user.role === 'ADMIN';

  if (!isCustomer && !isHelper && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Build the state transition
  let nextStatus: JobStatus;
  const patch: Record<string, unknown> = {};

  switch (parsed.data.action) {
    case 'START':
      if (!(isHelper || isAdmin)) {
        return NextResponse.json({ error: 'Only the helper can start' }, { status: 403 });
      }
      if (job.status !== 'ACCEPTED') {
        return NextResponse.json({ error: 'Job is not ready to start' }, { status: 400 });
      }
      nextStatus = 'IN_PROGRESS';
      patch.startedAt = new Date();
      break;

    case 'COMPLETE':
      if (!(isHelper || isAdmin)) {
        return NextResponse.json({ error: 'Only the helper can complete' }, { status: 403 });
      }
      if (job.status !== 'IN_PROGRESS') {
        return NextResponse.json({ error: 'Job is not in progress' }, { status: 400 });
      }
      nextStatus = 'COMPLETED';
      patch.completedAt = new Date();
      break;

    case 'CANCEL':
      if (!['OPEN', 'ACCEPTED', 'IN_PROGRESS'].includes(job.status)) {
        return NextResponse.json({ error: 'Job cannot be cancelled' }, { status: 400 });
      }
      nextStatus = 'CANCELLED';
      patch.cancelledAt = new Date();
      break;

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }

  const updated = await prisma.job.update({
    where: { id: params.id },
    data: { ...patch, status: nextStatus },
  });

  // Fan out the right notifications
  const otherPartyId = isCustomer ? job.helperId : job.customerId;
  if (otherPartyId) {
    const msg =
      nextStatus === 'IN_PROGRESS' ? { type: 'JOB_IN_PROGRESS' as const, title: 'Helper is on the way', body: `Your move "${job.title}" is now in progress.` }
      : nextStatus === 'COMPLETED' ? { type: 'JOB_COMPLETED' as const, title: 'Job completed', body: `"${job.title}" has been marked complete.` }
      : nextStatus === 'CANCELLED' ? { type: 'JOB_CANCELLED' as const, title: 'Job cancelled', body: `"${job.title}" was cancelled.` }
      : null;
    if (msg) {
      await notify({ ...msg, userId: otherPartyId, jobId: job.id });
    }
  }

  return NextResponse.json({ job: updated });
}
