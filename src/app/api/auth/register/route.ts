/**
 * POST /api/auth/register
 * Body: { email, password, name, phone?, role }
 *
 * Creates a new account with a bcrypt-hashed password. Rate-limited to
 * 5 attempts per IP per 10 minutes to slow down signup-abuse scripts.
 */
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validations';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
  const ip = getClientIp(req.headers);
  const rl = rateLimit(`register:${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 });
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many signup attempts. Please try again later.' },
      { status: 429 }
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { email, password, name, phone, role } = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);

  // Auto-promote the configured admin email on first signup so you
  // don't need to manually flip a DB row.
  const finalRole = email.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase()
    ? 'ADMIN'
    : role;

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashed,
      name,
      phone: phone || null,
      role: finalRole,
    },
    select: { id: true, email: true, name: true, role: true },
  });

  return NextResponse.json({ user });
}
