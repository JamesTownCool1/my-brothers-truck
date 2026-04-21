/**
 * /api/admin/users — admin-only user management.
 *
 * GET   — list all users with basic stats
 * PATCH — { userId, patch: { role?, isHelperActive? } } update any user
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') return null;
  return session;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, email: true, name: true, role: true, image: true,
      isHelperActive: true, avgRating: true, ratingCount: true, createdAt: true,
      _count: { select: { jobsAsCustomer: true, jobsAsHelper: true } },
    },
    take: 500,
  });

  return NextResponse.json({ users });
}

const patchSchema = z.object({
  userId: z.string().cuid(),
  patch: z.object({
    role: z.enum(['CUSTOMER', 'HELPER', 'ADMIN']).optional(),
    isHelperActive: z.boolean().optional(),
  }),
});

export async function PATCH(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: parsed.data.userId },
    data: parsed.data.patch,
    select: { id: true, role: true, isHelperActive: true },
  });

  return NextResponse.json({ user });
}
