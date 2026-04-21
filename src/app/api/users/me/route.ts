/**
 * /api/users/me
 *
 * GET   — full profile of the authenticated user
 * PATCH — update own profile (name, phone, bio, image, role, base location)
 *
 * Note: role can be flipped here (e.g. a customer opts-in to being a helper).
 * The JWT will carry stale role info until the user calls session.update()
 * on the client, which we trigger in the profile form.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { profileUpdateSchema } from '@/lib/validations';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      vehicles: true,
      _count: { select: { jobsAsCustomer: true, jobsAsHelper: true, reviewsReceived: true } },
    },
  });

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Never leak the password hash
  const { password, ...safe } = user;
  return NextResponse.json({ user: safe });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...parsed.data,
      image: parsed.data.image || undefined,
    },
    select: {
      id: true, email: true, name: true, phone: true, bio: true,
      image: true, role: true, isHelperActive: true,
      baseLat: true, baseLng: true, baseAddress: true,
      avgRating: true, ratingCount: true,
    },
  });

  return NextResponse.json({ user });
}
