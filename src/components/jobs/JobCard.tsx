'use client';

import Link from 'next/link';
import { ArrowRight, Clock, MapPin, Package } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { StatusBadge, Avatar } from '@/components/ui/Card';
import { StarRating } from '@/components/ui/StarRating';
import { formatDistance, formatPrice, formatRelative } from '@/lib/utils';
import type { JobStatus, JobSize } from '@prisma/client';

interface JobCardProps {
  job: {
    id: string;
    title: string;
    description: string;
    status: JobStatus;
    size: JobSize;
    pickupAddress: string;
    dropoffAddress: string;
    distanceMeters: number;
    estimatedPriceCents: number;
    finalPriceCents: number | null;
    preferredTime: string | Date;
    createdAt: string | Date;
    customer: { id: string; name: string; image: string | null; avgRating: number };
    helper: { id: string; name: string; image: string | null; avgRating: number } | null;
  };
  /** "customer" = I'm the customer (show helper info); "helper" = I'm the helper; "browse" = available-jobs feed */
  perspective?: 'customer' | 'helper' | 'browse';
}

/**
 * JobCard — compact summary used everywhere jobs are listed.
 * Clicking takes you to /jobs/[id]. Shows the other party's name +
 * rating when relevant, otherwise shows the customer posting the job.
 */
export function JobCard({ job, perspective = 'customer' }: JobCardProps) {
  const otherParty =
    perspective === 'customer' ? job.helper : job.customer;
  const price = job.finalPriceCents ?? job.estimatedPriceCents;

  return (
    <Link href={`/jobs/${job.id}`} className="block group">
      <Card className="overflow-hidden transition-all group-hover:border-brand-500 group-hover:shadow-md group-hover:-translate-y-0.5">
        <div className="p-5">
          {/* Header: title + status */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-xl font-bold text-ink-900 leading-tight truncate">
                {job.title}
              </h3>
              <div className="mt-1 text-xs text-ink-500">
                Posted {formatRelative(job.createdAt)}
              </div>
            </div>
            <StatusBadge status={job.status} />
          </div>

          {/* Route */}
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500 ring-2 ring-brand-200" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold">
                  Pickup
                </div>
                <div className="truncate text-ink-800">{job.pickupAddress}</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-ink-900" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold">
                  Dropoff
                </div>
                <div className="truncate text-ink-800">{job.dropoffAddress}</div>
              </div>
            </div>
          </div>

          {/* Metadata row */}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-600 border-t border-ink-100 pt-3">
            <span className="inline-flex items-center gap-1">
              <Package size={13} /> {job.size.toLowerCase()}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin size={13} /> {formatDistance(job.distanceMeters)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock size={13} /> {formatRelative(job.preferredTime)}
            </span>
            <span className="ml-auto font-display text-lg font-bold text-ink-900">
              {formatPrice(price)}
            </span>
          </div>

          {/* Other party */}
          {otherParty && (
            <div className="mt-3 flex items-center gap-2 border-t border-ink-100 pt-3">
              <Avatar src={otherParty.image} name={otherParty.name} size={28} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{otherParty.name}</div>
              </div>
              {otherParty.avgRating > 0 && (
                <StarRating value={otherParty.avgRating} size={12} readOnly />
              )}
              <ArrowRight size={16} className="text-ink-400 group-hover:text-brand-500" />
            </div>
          )}
          {!otherParty && perspective === 'browse' && (
            <div className="mt-3 flex items-center gap-2 border-t border-ink-100 pt-3">
              <Avatar src={job.customer.image} name={job.customer.name} size={28} />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-ink-500">Posted by</div>
                <div className="text-sm font-medium truncate">{job.customer.name}</div>
              </div>
              {job.customer.avgRating > 0 && (
                <StarRating value={job.customer.avgRating} size={12} readOnly />
              )}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
