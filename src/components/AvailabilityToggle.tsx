'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

/**
 * AvailabilityToggle — a big on/off switch for helpers.
 * Optimistic: flips the UI immediately, rolls back on failure.
 */
export function AvailabilityToggle({ initial }: { initial: boolean }) {
  const [active, setActive] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    const next = !active;
    setBusy(true);
    setActive(next); // optimistic
    try {
      const res = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHelperActive: next }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(next ? "You're online. Let's go." : 'You are offline.');
    } catch {
      setActive(!next); // rollback
      toast.error('Could not update availability');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={cn(
        'rounded-2xl border-2 p-5 flex items-center justify-between',
        active
          ? 'border-emerald-500 bg-emerald-50'
          : 'border-ink-200 bg-white'
      )}
    >
      <div>
        <div className="text-xs uppercase tracking-wider font-semibold text-ink-600">
          Helper Availability
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span
            className={cn(
              'h-2.5 w-2.5 rounded-full',
              active ? 'bg-emerald-500 animate-pulse-dot' : 'bg-ink-300'
            )}
          />
          <span className="font-display text-xl font-bold">
            {active ? "You're online" : 'Offline'}
          </span>
        </div>
        <div className="text-sm text-ink-600 mt-1">
          {active
            ? 'Nearby jobs will notify you.'
            : 'Flip on to start receiving job alerts.'}
        </div>
      </div>

      <button
        onClick={toggle}
        disabled={busy}
        aria-pressed={active}
        className={cn(
          'relative h-8 w-14 rounded-full transition-colors',
          active ? 'bg-emerald-500' : 'bg-ink-300',
          busy && 'opacity-50'
        )}
      >
        <span
          className={cn(
            'absolute top-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform',
            active ? 'translate-x-7' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  );
}
