/**
 * /api/notifications
 *
 * GET  — list recent notifications for the signed-in user
 * POST — mark notifications read. Body: { ids?: string[] } — if omitted,
 *        marks ALL unread as read (the "clear all" button).
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.notification.count({
      where: { userId: session.user.id, readAt: null },
    }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const ids: string[] | undefined = Array.isArray(body.ids) ? body.ids : undefined;

  await prisma.notification.updateMany({
    where: {
      userId: session.user.id,
      readAt: null,
      ...(ids ? { id: { in: ids } } : {}),
    },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
