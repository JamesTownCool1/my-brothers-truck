'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, CreditCard, Play, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatPrice } from '@/lib/utils';
import type { JobStatus } from '@prisma/client';

/**
 * JobActions — renders the right action buttons for the right party
 * at the right status. Handles accept / start / complete / cancel / pay.
 *
 * All paths refresh the server component after a successful action
 * so the rest of the page (timeline, status badge) re-renders with
 * the new state.
 */
export function JobActions({
  jobId,
  status,
  isCustomer,
  isHelper,
  canAccept,
  estimatedPriceCents,
  isPaid,
}: {
  jobId: string;
  status: JobStatus;
  isCustomer: boolean;
  isHelper: boolean;
  canAccept: boolean;
  estimatedPriceCents: number;
  isPaid: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [customPrice, setCustomPrice] = useState('');

  async function call(label: string, url: string, body?: unknown, method: 'POST' | 'DELETE' = 'POST') {
    setBusy(label);
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? 'Action failed');
      }
      return res.json();
    } finally {
      setBusy(null);
    }
  }

  async function onAccept() {
    try {
      const finalPriceCents = customPrice
        ? Math.round(parseFloat(customPrice) * 100)
        : undefined;
      await call('accept', `/api/jobs/${jobId}/accept`, { finalPriceCents });
      toast.success('Job accepted — reach out to the customer!');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not accept');
    }
  }

  async function onStatus(action: 'START' | 'COMPLETE' | 'CANCEL') {
    try {
      await call(action, `/api/jobs/${jobId}/status`, { action });
      const msg =
        action === 'START'    ? 'Job started'
        : action === 'COMPLETE' ? 'Job marked complete'
        : 'Job cancelled';
      toast.success(msg);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update');
    }
  }

  async function onPay() {
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? 'Could not start checkout');
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Payment failed');
    }
  }

  // OPEN + helper viewer — can accept with an optional price override
  if (status === 'OPEN' && canAccept) {
    return (
      <Card className="p-5 bg-brand-50 border-brand-300">
        <div className="font-display text-lg font-bold">This job is open</div>
        <p className="text-sm text-ink-700 mt-1">
          Accept it to claim the move. You can adjust the price if you'd like.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-ink-700">$</span>
            <input
              type="number"
              placeholder={(estimatedPriceCents / 100).toFixed(0)}
              className="h-11 w-28 rounded-lg border-2 border-ink-200 px-3 text-[15px]"
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              min={5}
              step={1}
            />
            <span className="text-xs text-ink-500">
              default {formatPrice(estimatedPriceCents)}
            </span>
          </div>
          <Button onClick={onAccept} loading={busy === 'accept'}>
            Accept this job
          </Button>
        </div>
      </Card>
    );
  }

  // ACCEPTED — helper can start, either party can cancel
  if (status === 'ACCEPTED') {
    return (
      <Card className="p-5 flex flex-wrap gap-3 items-center justify-between">
        <div>
          <div className="font-display text-lg font-bold">Ready to roll</div>
          <div className="text-sm text-ink-600">
            {isHelper ? 'Tap "Start" when you\'re on the way.' : 'Your helper will start when they\'re on the way.'}
          </div>
        </div>
        <div className="flex gap-2">
          {isHelper && (
            <Button onClick={() => onStatus('START')} loading={busy === 'START'}>
              <Play size={14} /> Start Job
            </Button>
          )}
          {(isCustomer || isHelper) && (
            <Button
              variant="ghost"
              onClick={() => onStatus('CANCEL')}
              loading={busy === 'CANCEL'}
            >
              <X size={14} /> Cancel
            </Button>
          )}
        </div>
      </Card>
    );
  }

  // IN_PROGRESS — helper completes, either can cancel
  if (status === 'IN_PROGRESS') {
    return (
      <Card className="p-5 flex flex-wrap gap-3 items-center justify-between bg-blue-50 border-blue-300">
        <div>
          <div className="font-display text-lg font-bold flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse-dot" />
            Move in progress
          </div>
          <div className="text-sm text-ink-700">
            {isHelper ? 'Drive safe. Mark complete after dropoff.' : 'Your helper is en route.'}
          </div>
        </div>
        <div className="flex gap-2">
          {isHelper && (
            <Button onClick={() => onStatus('COMPLETE')} loading={busy === 'COMPLETE'}>
              <CheckCircle2 size={14} /> Mark Complete
            </Button>
          )}
          {(isCustomer || isHelper) && (
            <Button
              variant="ghost"
              onClick={() => onStatus('CANCEL')}
              loading={busy === 'CANCEL'}
            >
              <X size={14} /> Cancel
            </Button>
          )}
        </div>
      </Card>
    );
  }

  // COMPLETED — customer pays if unpaid
  if (status === 'COMPLETED' && isCustomer && !isPaid) {
    return (
      <Card className="p-5 flex flex-wrap gap-3 items-center justify-between bg-emerald-50 border-emerald-300">
        <div>
          <div className="font-display text-lg font-bold">Job complete!</div>
          <div className="text-sm text-ink-700">
            Time to settle up. Don&rsquo;t forget to leave a review.
          </div>
        </div>
        <Button onClick={onPay} loading={busy === 'pay'}>
          <CreditCard size={14} /> Pay Now
        </Button>
      </Card>
    );
  }

  return null;
}
