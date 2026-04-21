/**
 * GET /api/admin/jobs — admin job board with full details.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      customer: { select: { id: true, name: true, email: true } },
      helper:   { select: { id: true, name: true, email: true } },
      _count:   { select: { messages: true, reviews: true } },
    },
  });

  return NextResponse.json({ jobs });
}
