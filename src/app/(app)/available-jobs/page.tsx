import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { Search } from 'lucide-react';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { JobCard } from '@/components/jobs/JobCard';
import { Card } from '@/components/ui/Card';
import { haversineMeters } from '@/lib/utils';

/**
 * Available Jobs — the helper's marketplace.
 *
 * Sorts OPEN jobs by proximity to the helper's base location, so the
 * first thing they see is the closest pickup. Helpers without a set
 * base location see the newest jobs first (with a nudge to set one).
 */
export default async function AvailableJobsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  // Only helpers + admins see this page. Customers get sent to the dashboard.
  if (session.user.role !== 'HELPER' && session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const [me, openJobs] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { baseLat: true, baseLng: true, isHelperActive: true, baseAddress: true },
    }),
    prisma.job.findMany({
      where: { status: 'OPEN', helperId: null },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        customer: { select: { id: true, name: true, image: true, avgRating: true } },
        helper:   { select: { id: true, name: true, image: true, avgRating: true } },
      },
    }),
  ]);

  // Sort by distance from helper's base, if known
  const sorted =
    me?.baseLat != null && me?.baseLng != null
      ? [...openJobs].sort((a, b) => {
          const da = haversineMeters(
            { lat: me.baseLat!, lng: me.baseLng! },
            { lat: a.pickupLat, lng: a.pickupLng }
          );
          const db = haversineMeters(
            { lat: me.baseLat!, lng: me.baseLng! },
            { lat: b.pickupLat, lng: b.pickupLng }
          );
          return da - db;
        })
      : openJobs;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
      <div className="stamp text-ink-600">Job Board</div>
      <h1 className="mt-3 font-display text-4xl sm:text-5xl font-black tracking-tight">
        Available jobs
      </h1>
      <p className="mt-2 text-ink-600">
        {me?.baseAddress
          ? <>Sorted by distance from <span className="font-medium text-ink-800">{me.baseAddress}</span>.</>
          : 'Set your base address in profile to see the closest jobs first.'}
      </p>

      {!me?.isHelperActive && (
        <div className="mt-6 rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          You&rsquo;re currently <strong>offline</strong>. You can still accept jobs here,
          but you won&rsquo;t receive notifications for new ones. Flip yourself online from
          the dashboard.
        </div>
      )}

      <div className="mt-10">
        {sorted.length === 0 ? (
          <Card className="p-10 text-center bg-ink-50 border-dashed">
            <div className="mx-auto w-14 h-14 rounded-full bg-ink-200 grid place-items-center mb-4">
              <Search size={24} className="text-ink-500" />
            </div>
            <h3 className="font-display text-xl font-bold">No open jobs right now</h3>
            <p className="mt-2 text-sm text-ink-600 max-w-md mx-auto">
              Check back in a bit — new jobs post throughout the day. Keep your
              notifications on so we can ping you.
            </p>
            <Link
              href="/dashboard"
              className="mt-5 inline-flex items-center gap-2 rounded-full border-2 border-ink-900 px-5 py-2.5 text-sm font-semibold hover:bg-ink-900 hover:text-white"
            >
              Back to dashboard
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sorted.map((job) => (
              <JobCard
                key={job.id}
                job={{
                  ...job,
                  createdAt: job.createdAt.toISOString(),
                  preferredTime: job.preferredTime.toISOString(),
                }}
                perspective="browse"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
