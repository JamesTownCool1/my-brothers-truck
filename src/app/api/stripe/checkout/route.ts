/**
 * POST /api/stripe/checkout
 * Body: { jobId: string }
 *
 * Creates a Stripe Checkout Session in TEST MODE so the customer can pay
 * for a completed job. We store the Stripe PaymentIntent id on the job
 * once the webhook confirms payment — but for the MVP, we also set
 * `paidAt` on successful checkout completion via the session redirect.
 *
 * To enable: set STRIPE_SECRET_KEY + NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
 * in `.env.local`. Use a 4242 4242 4242 4242 test card.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import Stripe from 'stripe';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const schema = z.object({ jobId: z.string().cuid() });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: 'Payments are not configured on this deploy' },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const job = await prisma.job.findUnique({ where: { id: parsed.data.jobId } });
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (job.customerId !== session.user.id) {
    return NextResponse.json({ error: 'Only the customer can pay' }, { status: 403 });
  }
  if (job.status !== 'COMPLETED') {
    return NextResponse.json({ error: 'Pay after job is complete' }, { status: 400 });
  }
  if (job.paidAt) {
    return NextResponse.json({ error: 'Already paid' }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const amount = job.finalPriceCents ?? job.estimatedPriceCents;

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: session.user.email ?? undefined,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: amount,
          product_data: { name: `Move: ${job.title}` },
        },
        quantity: 1,
      },
    ],
    metadata: { jobId: job.id },
    success_url: `${appUrl}/jobs/${job.id}?paid=1`,
    cancel_url:  `${appUrl}/jobs/${job.id}?paid=0`,
  });

  await prisma.job.update({
    where: { id: job.id },
    data: { paymentIntentId: checkoutSession.id },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
