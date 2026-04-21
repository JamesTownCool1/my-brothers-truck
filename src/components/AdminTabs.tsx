'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { EyeOff, Eye, Trash2 } from 'lucide-react';
import { Card, StatusBadge, Avatar } from '@/components/ui/Card';
import { StarRating } from '@/components/ui/StarRating';
import { cn, formatPrice, formatRelative } from '@/lib/utils';
import type { JobStatus, JobSize, UserRole } from '@prisma/client';

interface UserRow {
  id: string; email: string; name: string; role: UserRole; image: string | null;
  isHelperActive: boolean; avgRating: number; ratingCount: number; createdAt: string;
  _count: { jobsAsCustomer: number; jobsAsHelper: number };
}
interface JobRow {
  id: string; title: string; status: JobStatus; size: JobSize;
  estimatedPriceCents: number; finalPriceCents: number | null;
  createdAt: string; preferredTime: string;
  customer: { id: string; name: string };
  helper: { id: string; name: string } | null;
}
interface ReviewRow {
  id: string; rating: number; comment: string | null; hidden: boolean;
  createdAt: string;
  reviewer: { id: string; name: string };
  reviewee: { id: string; name: string };
  job: { id: string; title: string };
}

type Tab = 'users' | 'jobs' | 'reviews';

/**
 * AdminTabs — the interactive admin table surface. Three tabs:
 *   - Users: role dropdown per row (PATCH /api/admin/users)
 *   - Jobs:  read-only list linking to the job detail page
 *   - Reviews: hide/unhide/delete (PATCH & DELETE /api/admin/reviews/[id])
 */
export function AdminTabs({
  users,
  jobs,
  reviews,
}: {
  users: UserRow[];
  jobs: JobRow[];
  reviews: ReviewRow[];
}) {
  const [tab, setTab] = useState<Tab>('users');
  const router = useRouter();

  async function changeRole(userId: string, role: UserRole) {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, patch: { role } }),
    });
    if (res.ok) {
      toast.success('Role updated');
      router.refresh();
    } else {
      toast.error('Failed');
    }
  }

  async function toggleHidden(reviewId: string, hidden: boolean) {
    const res = await fetch(`/api/admin/reviews/${reviewId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hidden }),
    });
    if (res.ok) {
      toast.success(hidden ? 'Review hidden' : 'Review restored');
      router.refresh();
    } else {
      toast.error('Failed');
    }
  }

  async function deleteReview(reviewId: string) {
    if (!confirm('Permanently delete this review?')) return;
    const res = await fetch(`/api/admin/reviews/${reviewId}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Review deleted');
      router.refresh();
    } else {
      toast.error('Failed');
    }
  }

  return (
    <>
      {/* Tab bar */}
      <div className="mt-10 flex gap-2 border-b-2 border-ink-200">
        {(['users', 'jobs', 'reviews'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-5 py-3 font-semibold text-sm capitalize -mb-[2px] border-b-2 transition-colors',
              tab === t
                ? 'border-brand-500 text-ink-900'
                : 'border-transparent text-ink-500 hover:text-ink-800'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'users' && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto nice-scroll">
              <table className="w-full text-sm">
                <thead className="bg-ink-50 text-xs uppercase tracking-wider text-ink-600">
                  <tr>
                    <th className="p-3 text-left">User</th>
                    <th className="p-3 text-left">Role</th>
                    <th className="p-3 text-left">Jobs</th>
                    <th className="p-3 text-left">Rating</th>
                    <th className="p-3 text-left">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-ink-50">
                      <td className="p-3">
                        <Link href={`/profile/${u.id}`} className="flex items-center gap-2">
                          <Avatar src={u.image} name={u.name} size={28} />
                          <div className="min-w-0">
                            <div className="font-medium truncate">{u.name}</div>
                            <div className="text-xs text-ink-500 truncate">{u.email}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="p-3">
                        <select
                          value={u.role}
                          onChange={(e) => changeRole(u.id, e.target.value as UserRole)}
                          className="h-8 rounded-md border border-ink-200 px-2 text-xs"
                        >
                          <option value="CUSTOMER">CUSTOMER</option>
                          <option value="HELPER">HELPER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </td>
                      <td className="p-3 whitespace-nowrap text-ink-700">
                        {u._count.jobsAsCustomer + u._count.jobsAsHelper}
                      </td>
                      <td className="p-3">
                        {u.ratingCount > 0 ? (
                          <div className="flex items-center gap-1">
                            <StarRating value={u.avgRating} size={12} readOnly />
                            <span className="text-xs">{u.avgRating.toFixed(1)}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-ink-400">—</span>
                        )}
                      </td>
                      <td className="p-3 text-xs text-ink-500 whitespace-nowrap">
                        {formatRelative(u.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {tab === 'jobs' && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto nice-scroll">
              <table className="w-full text-sm">
                <thead className="bg-ink-50 text-xs uppercase tracking-wider text-ink-600">
                  <tr>
                    <th className="p-3 text-left">Job</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Customer</th>
                    <th className="p-3 text-left">Helper</th>
                    <th className="p-3 text-left">Price</th>
                    <th className="p-3 text-left">Posted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {jobs.map((j) => (
                    <tr key={j.id} className="hover:bg-ink-50">
                      <td className="p-3">
                        <Link href={`/jobs/${j.id}`} className="font-medium hover:text-brand-600">
                          {j.title}
                        </Link>
                      </td>
                      <td className="p-3"><StatusBadge status={j.status} /></td>
                      <td className="p-3 text-ink-700">{j.customer.name}</td>
                      <td className="p-3 text-ink-700">{j.helper?.name ?? '—'}</td>
                      <td className="p-3 font-medium">
                        {formatPrice(j.finalPriceCents ?? j.estimatedPriceCents)}
                      </td>
                      <td className="p-3 text-xs text-ink-500 whitespace-nowrap">
                        {formatRelative(j.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {tab === 'reviews' && (
          <div className="space-y-3">
            {reviews.length === 0 && (
              <Card className="p-6 text-sm text-ink-500 italic">
                No reviews yet.
              </Card>
            )}
            {reviews.map((r) => (
              <Card
                key={r.id}
                className={cn('p-5', r.hidden && 'bg-red-50 border-red-200')}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold">{r.reviewer.name}</span>
                      <span className="text-ink-500">→</span>
                      <span className="font-semibold">{r.reviewee.name}</span>
                      <StarRating value={r.rating} size={12} readOnly />
                      {r.hidden && (
                        <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                          Hidden
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-ink-500 mt-0.5">
                      On{' '}
                      <Link href={`/jobs/${r.job.id}`} className="hover:text-brand-600 underline">
                        {r.job.title}
                      </Link>{' '}
                      · {formatRelative(r.createdAt)}
                    </div>
                    {r.comment && (
                      <p className="mt-2 text-sm text-ink-800">{r.comment}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleHidden(r.id, !r.hidden)}
                      className="rounded-lg border-2 border-ink-200 p-2 hover:bg-ink-50"
                      title={r.hidden ? 'Unhide' : 'Hide'}
                    >
                      {r.hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button
                      onClick={() => deleteReview(r.id)}
                      className="rounded-lg border-2 border-red-200 p-2 text-red-600 hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
