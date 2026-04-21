import { Check, Circle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelative } from '@/lib/utils';
import type { JobStatus } from '@prisma/client';

/**
 * StatusTimeline — the visual job tracker shown on the job detail page.
 * Renders 4 stages (Open → Accepted → In Progress → Completed) with a
 * check, a live pulse dot on the current step, and empty circles ahead.
 * CANCELLED is rendered as its own red state overlaying the last step.
 */
export function StatusTimeline({
  status,
  acceptedAt,
  startedAt,
  completedAt,
  cancelledAt,
  createdAt,
}: {
  status: JobStatus;
  acceptedAt?: string | Date | null;
  startedAt?: string | Date | null;
  completedAt?: string | Date | null;
  cancelledAt?: string | Date | null;
  createdAt: string | Date;
}) {
  const steps = [
    { key: 'OPEN',        label: 'Posted',      time: createdAt },
    { key: 'ACCEPTED',    label: 'Accepted',    time: acceptedAt },
    { key: 'IN_PROGRESS', label: 'In Progress', time: startedAt },
    { key: 'COMPLETED',   label: 'Completed',   time: completedAt },
  ] as const;

  const order = ['OPEN', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'];
  const currentIndex = order.indexOf(status);
  const cancelled = status === 'CANCELLED';

  return (
    <div className="flex items-stretch gap-0">
      {steps.map((step, i) => {
        const isDone = !cancelled && i < currentIndex;
        const isCurrent = !cancelled && i === currentIndex;
        const isFuture = cancelled || i > currentIndex;

        return (
          <div key={step.key} className="flex-1 flex flex-col items-center relative">
            {/* Connector line to previous dot */}
            {i > 0 && (
              <div
                className={cn(
                  'absolute top-3 right-1/2 h-0.5 w-full',
                  isDone || isCurrent ? 'bg-brand-500' : 'bg-ink-200'
                )}
              />
            )}

            {/* Dot */}
            <div className="relative z-10 mb-2">
              {cancelled && i === currentIndex ? (
                <div className="h-6 w-6 rounded-full bg-red-500 grid place-items-center text-white">
                  <X size={14} strokeWidth={3} />
                </div>
              ) : isDone ? (
                <div className="h-6 w-6 rounded-full bg-brand-500 grid place-items-center text-white">
                  <Check size={14} strokeWidth={3} />
                </div>
              ) : isCurrent ? (
                <div className="h-6 w-6 rounded-full bg-brand-500 ring-4 ring-brand-200 animate-pulse-dot" />
              ) : (
                <Circle size={24} className="text-ink-300" strokeWidth={1.5} />
              )}
            </div>

            <div className="text-center">
              <div
                className={cn(
                  'text-xs font-semibold',
                  isFuture ? 'text-ink-400' : 'text-ink-900'
                )}
              >
                {step.label}
              </div>
              {step.time && !isFuture && (
                <div className="text-[10px] text-ink-500 mt-0.5">
                  {formatRelative(step.time)}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {cancelled && cancelledAt && (
        <div className="absolute bottom-0 right-0 text-xs text-red-600 font-medium">
          Cancelled {formatRelative(cancelledAt)}
        </div>
      )}
    </div>
  );
}
