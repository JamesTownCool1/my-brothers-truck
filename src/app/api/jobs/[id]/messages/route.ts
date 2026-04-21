/**
 * /api/jobs/[id]/messages
 *
 * GET  — list messages for a job (chronological). Optionally pass
 *        ?since=<ISO>  to poll only newer messages (lightweight real-time).
 * POST — send a message. Only the customer and helper of the job can chat.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { messageSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/rate-limit';
import { notify } from '@/lib/notifications';

async function authorize(jobId: string, userId: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { id: true, customerId: true, helperId: true, title: true },
  });
  if (!job) return { ok: false as const, status: 404, error: 'Job not found' };
  if (job.customerId !== userId && job.helperId !== userId) {
    return { ok: false as const, status: 403, error: 'Forbidden' };
  }
  return { ok: true as const, job };
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const guard = await authorize(params.id, session.user.id);
  if (!guard.ok && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const url = new URL(req.url);
  const since = url.searchParams.get('since');

  const messages = await prisma.message.findMany({
    where: {
      jobId: params.id,
      ...(since ? { createdAt: { gt: new Date(since) } } : {}),
    },
    orderBy: { createdAt: 'asc' },
    include: { sender: { select: { id: true, name: true, image: true } } },
    take: 200,
  });

  // Mark other party's messages as read (fire & forget)
  prisma.message
    .updateMany({
      where: {
        jobId: params.id,
        senderId: { not: session.user.id },
        readAt: null,
      },
      data: { readAt: new Date() },
    })
    .catch(() => {});

  return NextResponse.json({ messages });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Messaging rate limit — stops chat-flood abuse
  const rl = rateLimit(`msg:${session.user.id}`, {
    limit: 30,
    windowMs: 60 * 1000, // 30/min
  });
  if (!rl.success) {
    return NextResponse.json({ error: 'Slow down — too many messages' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
  }

  const guard = await authorize(params.id, session.user.id);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }
  const { job } = guard;

  const message = await prisma.message.create({
    data: {
      jobId: params.id,
      senderId: session.user.id,
      body: parsed.data.body,
    },
    include: { sender: { select: { id: true, name: true, image: true } } },
  });

  // Notify the other party
  const recipientId =
    job.customerId === session.user.id ? job.helperId : job.customerId;
  if (recipientId) {
    await notify({
      userId: recipientId,
      type: 'NEW_MESSAGE',
      title: `New message from ${session.user.name ?? 'someone'}`,
      body: parsed.data.body.slice(0, 140),
      jobId: job.id,
    });
  }

  return NextResponse.json({ message });
}
