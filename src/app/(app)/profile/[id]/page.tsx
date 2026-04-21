import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Truck } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { Avatar, Card } from '@/components/ui/Card';
import { StarRating } from '@/components/ui/StarRating';
import { formatRelative } from '@/lib/utils';

/**
 * Public profile — the page you land on when you tap someone's name.
 * Shows their bio, rating, recent reviews, and (for helpers) their truck.
 */
export default async function PublicProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true, name: true, image: true, bio: true, role: true,
      avgRating: true, ratingCount: true, createdAt: true,
      vehicles: {
        select: { make: true, model: true, year: true, color: true, capacity: true },
      },
      reviewsReceived: {
        where: { hidden: false },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { reviewer: { select: { id: true, name: true, image: true } } },
      },
    },
  });
  if (!user) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900 mb-6"
      >
        <ArrowLeft size={14} /> Back
      </Link>

      <Card className="p-8">
        <div className="flex flex-wrap items-center gap-6">
          <Avatar src={user.image} name={user.name} size={112} />
          <div className="flex-1 min-w-0">
            <div className="stamp text-ink-600">
              {user.role === 'HELPER' ? 'Helper' : user.role === 'ADMIN' ? 'Admin' : 'Customer'}
            </div>
            <h1 className="mt-2 font-display text-4xl font-black tracking-tight">
              {user.name}
            </h1>
            <div className="mt-2 flex items-center gap-2 text-sm">
              {user.ratingCount > 0 ? (
                <>
                  <StarRating value={user.avgRating} size={16} readOnly />
                  <span className="text-ink-700">
                    {user.avgRating.toFixed(1)} · {user.ratingCount}{' '}
                    {user.ratingCount === 1 ? 'review' : 'reviews'}
                  </span>
                </>
              ) : (
                <span className="text-ink-500">No reviews yet</span>
              )}
            </div>
            <div className="mt-1 text-xs text-ink-500">
              Member since {new Date(user.createdAt).toLocaleDateString('en-US', {
                month: 'long', year: 'numeric',
              })}
            </div>
          </div>
        </div>

        {user.bio && (
          <div className="mt-6 text-ink-800 leading-relaxed">{user.bio}</div>
        )}

        {user.vehicles.length > 0 && (
          <div className="mt-6 border-t border-ink-100 pt-5">
            <div className="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-2">
              Vehicle
            </div>
            {user.vehicles.map((v, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Truck size={16} className="text-brand-500" />
                <span className="font-medium">
                  {v.year} {v.make} {v.model}
                </span>
                {v.color && <span className="text-ink-500">· {v.color}</span>}
                <span className="ml-auto stamp text-ink-700">{v.capacity.toLowerCase()} capacity</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Reviews */}
      <div className="mt-10">
        <h2 className="font-display text-2xl font-bold mb-4">Recent reviews</h2>
        {user.reviewsReceived.length === 0 ? (
          <Card className="p-6 text-sm text-ink-500 italic">
            No reviews yet.
          </Card>
        ) : (
          <div className="space-y-3">
            {user.reviewsReceived.map((r) => (
              <Card key={r.id} className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar src={r.reviewer.image} name={r.reviewer.name} size={32} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{r.reviewer.name}</div>
                    <div className="text-xs text-ink-500">{formatRelative(r.createdAt)}</div>
                  </div>
                  <StarRating value={r.rating} size={14} readOnly />
                </div>
                {r.comment && <p className="text-sm text-ink-800">{r.comment}</p>}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
