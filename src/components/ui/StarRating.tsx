'use client';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * StarRating — dual-mode component:
 *   - display mode (readOnly): shows the rating with half-star accuracy
 *   - interactive mode: click a star to set the rating (used in the review form)
 */
export function StarRating({
  value,
  onChange,
  size = 20,
  readOnly = false,
  className,
}: {
  value: number;
  onChange?: (n: number) => void;
  size?: number;
  readOnly?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('inline-flex items-center gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = value >= i;
        const half = !filled && value >= i - 0.5;
        return (
          <button
            key={i}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(i)}
            className={cn(
              'relative shrink-0',
              !readOnly && 'cursor-pointer hover:scale-110 transition-transform'
            )}
            style={{ width: size, height: size }}
            aria-label={`${i} star${i > 1 ? 's' : ''}`}
          >
            <Star
              size={size}
              className="text-ink-200"
              strokeWidth={1.5}
              aria-hidden
            />
            {(filled || half) && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: half ? '50%' : '100%' }}
              >
                <Star
                  size={size}
                  className="text-brand-500 fill-brand-500"
                  strokeWidth={1.5}
                  aria-hidden
                />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
