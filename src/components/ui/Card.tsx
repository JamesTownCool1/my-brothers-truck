import { cn } from '@/lib/utils';
import type { JobStatus } from '@prisma/client';

export function Card({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border-2 border-ink-200 bg-white',
        className
      )}
      {...rest}
    />
  );
}

export function CardContent({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5', className)} {...rest} />;
}

/** The little status pill you see on every job card. Uses hand-picked
 *  colors so the state is legible at a glance — green = going well,
 *  blue = in-flight, gray = done, red = trouble. */
export function StatusBadge({ status, className }: { status: JobStatus; className?: string }) {
  const styles: Record<JobStatus, string> = {
    OPEN:        'bg-brand-100 text-brand-800 border-brand-300',
    ACCEPTED:    'bg-emerald-100 text-emerald-800 border-emerald-300',
    IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-300',
    COMPLETED:   'bg-ink-100 text-ink-700 border-ink-300',
    CANCELLED:   'bg-red-100 text-red-800 border-red-300',
  };
  const label: Record<JobStatus, string> = {
    OPEN:        'Open',
    ACCEPTED:    'Accepted',
    IN_PROGRESS: 'In Progress',
    COMPLETED:   'Completed',
    CANCELLED:   'Cancelled',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide',
        styles[status],
        className
      )}
    >
      {status === 'IN_PROGRESS' && (
        <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-dot" />
      )}
      {label[status]}
    </span>
  );
}

/** Simple avatar with initials fallback — doesn't rely on next/image so
 *  it works with any profile image URL (including Gravatar, Cloudinary). */
export function Avatar({
  src,
  name,
  size = 40,
  className,
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}) {
  const initials = (name ?? '??')
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name ?? ''}
        width={size}
        height={size}
        className={cn('rounded-full object-cover border-2 border-white shadow-sm', className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-ink-900 text-white font-semibold select-none',
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  );
}
