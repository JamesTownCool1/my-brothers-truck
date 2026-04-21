import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { ArrowLeft, Clock, MapPin, Package, Phone } from 'lucide-react';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, StatusBadge, Avatar } from '@/components/ui/Card';
import { StarRating } from '@/components/ui/StarRating';
import { StatusTimeline } from '@/components/jobs/StatusTimeline';
import { ChatWindow } from '@/components/jobs/ChatWindow';
import { JobMap } from '@/components/map/JobMap';
import { JobActions } from '@/components/jobs/JobActions';
import { ReviewSection } from '@/components/jobs/ReviewSection';
import { formatDistance, formatPrice, formatRelative } from '@/lib/utils';

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      customer: {
        select: { id: true, name: true, image: true, phone: true, avgRating: true, ratingCount: true },
      },
      helper: {
        select: { id: true, name: true, image: true, phone: true, avgRating: true, ratingCount: true },
      },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: { sender: { select: { id: true, name: true, image: true } } },
      },
      reviews: {
        where: { hidden: false },
        include: { reviewer: { select: { id: true, name: true, image: true } } },
      },
    },
  });

  if (!job) notFound();

  const userId = session.user.id;
  const isCustomer = job.customerId === userId;
  const isHelper = job.helperId === userId;
  const isAdmin = session.user.role === 'ADMIN';
  const canSeeOpen = job.status === 'OPEN' && session.user.role === 'HELPER';

  if (!(isCustomer || isHelper || isAdmin || canSeeOpen)) {
    redirect('/dashboard');
  }

  const isParty = isCustomer || isHelper;
  const counterpart = isCustomer ? job.helper : job.customer;
  const finalPrice = job.finalPriceCents ?? job.estimatedPriceCents;
  const myReview = job.reviews.find((r) => r.reviewerId === userId);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900 mb-6"
      >
        <ArrowLeft size={14} /> Back to dashboard
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <StatusBadge status={job.status} />
          <h1 className="mt-3 font-display text-4xl sm:text-5xl font-black tracking-tight leading-tight">
            {job.title}
          </h1>
          <p className="mt-2 text-ink-600">
            Posted {formatRelative(job.createdAt)} · Preferred time{' '}
            <span className="font-medium text-ink-800">
              {new Date(job.preferredTime).toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wider text-ink-500 font-semibold">
            {job.finalPriceCents ? 'Final Price' : 'Estimated'}
          </div>
          <div className="font-display text-4xl sm:text-5xl font-black text-brand-500">
            {formatPrice(finalPrice)}
          </div>
        </div>
      </div>

      <div className="mt-8 mb-8 relative">
        <Card className="p-6">
          <StatusTimeline
            status={job.status}
            createdAt={job.createdAt}
            acceptedAt={job.acceptedAt}
            startedAt={job.startedAt}
            completedAt={job.completedAt}
            cancelledAt={job.cancelledAt}
          />
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <JobActions
            jobId={job.id}
            status={job.status}
            isCustomer={isCustomer}
            isHelper={isHelper}
            canAccept={canSeeOpen && !isCustomer}
            estimatedPriceCents={job.estimatedPriceCents}
            isPaid={!!job.paidAt}
          />

          <Card className="p-6">
            <h2 className="font-display text-xl font-bold mb-4">Route</h2>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-brand-600 font-semibold">
                  Pickup
                </div>
                <div className="mt-1 font-medium text-ink-900">{job.pickupAddress}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-ink-700 font-semibold">
                  Dropoff
                </div>
                <div className="mt-1 font-medium text-ink-900">{job.dropoffAddress}</div>
              </div>
            </div>
            <JobMap
              pickup={{ lat: job.pickupLat, lng: job.pickupLng }}
              dropoff={{ lat: job.dropoffLat, lng: job.dropoffLng }}
              height={320}
            />
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-700">
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={14} /> {formatDistance(job.distanceMeters)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Package size={14} /> {job.size.toLowerCase()} load
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock size={14} /> {formatRelative(job.preferredTime)}
              </span>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-xl font-bold mb-3">Details</h2>
            <div className="prose-mbt text-ink-800 whitespace-pre-wrap">{job.description}</div>
            {job.imageUrl && (
              <img
                src={job.imageUrl}
                alt="Item"
                className="mt-4 max-h-96 rounded-xl border-2 border-ink-200 object-contain bg-ink-50"
              />
            )}
          </Card>

          {isParty && job.helperId && (
            <ChatWindow
              jobId={job.id}
              currentUserId={userId}
              initialMessages={job.messages.map((m) => ({
                ...m,
                createdAt: m.createdAt.toISOString(),
              }))}
            />
          )}

          {job.status === 'COMPLETED' && isParty && (
            <ReviewSection
              jobId={job.id}
              hasReviewed={!!myReview}
              counterpartName={counterpart?.name ?? 'the other party'}
              reviews={job.reviews.map((r) => ({
                ...r,
                createdAt: r.createdAt.toISOString(),
              }))}
            />
          )}
        </div>

        <aside className="space-y-6">
          {counterpart ? (
            <PersonCard
              title={isCustomer ? 'Your helper' : 'Customer'}
              person={counterpart}
              showPhone={isParty}
            />
          ) : job.status === 'OPEN' ? (
            <Card className="p-6 text-center bg-ink-50 border-dashed">
              <div className="font-display text-xl font-bold">Waiting for a helper</div>
              <p className="mt-2 text-sm text-ink-600">
                Nearby helpers have been notified. You&rsquo;ll hear back soon.
              </p>
            </Card>
          ) : null}

          {isHelper && (
            <PersonCard title="Customer" person={job.customer} showPhone />
          )}
        </aside>
      </div>
    </div>
  );
}

function PersonCard({
  title,
  person,
  showPhone,
}: {
  title: string;
  person: {
    id: string;
    name: string;
    image: string | null;
    phone: string | null;
    avgRating: number;
    ratingCount: number;
  };
  showPhone: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="text-xs uppercase tracking-wider text-ink-500 font-semibold">
        {title}
      </div>
      <Link
        href={`/profile/${person.id}`}
        className="mt-3 flex items-center gap-3 group"
      >
        <Avatar src={person.image} name={person.name} size={52} />
        <div className="flex-1 min-w-0">
          <div className="font-display text-lg font-bold truncate group-hover:text-brand-600">
            {person.name}
          </div>
          {person.ratingCount > 0 ? (
            <div className="flex items-center gap-1.5 text-xs text-ink-600">
              <StarRating value={person.avgRating} size={12} readOnly />
              <span>{person.avgRating.toFixed(1)} · {person.ratingCount} reviews</span>
            </div>
          ) : (
            <div className="text-xs text-ink-500">New member</div>
          )}
        </div>
      </Link>
      {showPhone && person.phone && (
        
          href={`tel:${person.phone}`}
          className="mt-4 flex items-center justify-center gap-2 rounded-lg border-2 border-ink-200 py-2 text-sm font-medium hover:bg-ink-50"
        >
          <Phone size={14} /> {person.phone}
        </a>
      )}
    </Card>
  );
}