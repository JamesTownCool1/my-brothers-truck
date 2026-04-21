/**
 * POST /api/availability
 * Body: { isHelperActive: boolean }
 *
 * Helper turns themselves online/offline. When offline:
 *   - they stop receiving JOB_NEW_NEARBY notifications
 *   - they don't appear on the "nearby helpers" map for customers
 *
 * Only helpers can flip this. Customers must first convert to helper
 * (via profile update) before going online.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { availabilitySchema } from '@/lib/validations';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== 'HELPER' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only helpers can toggle availability' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = availabilitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { isHelperActive: parsed.data.isHelperActive },
    select: { id: true, isHelperActive: true },
  });

  return NextResponse.json({ user });
}
