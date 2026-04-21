import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { Plus, Search, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { JobCard } from '@/components/jobs/JobCard';
import { Card } from '@/components/ui/Card';
import { AvailabilityToggle } from '@/components/AvailabilityToggle';
import { formatPrice } from '@/lib/utils';

/**
 * Dashboard — the home screen after sign-in.
 *
 * Renders a role-aware split:
 *   - CUSTOMERS: their posted jobs + CTA to post another
 *   - HELPERS:   their active jobs + availability toggle + link to the board
 *   - ADMINS:    see both + a link to /admin
 *
 * Fetches happen on the server (direct Prisma) so the page ships fully
 * rendered — no client-side loading flash on first visit.
 */
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const userId = session.user.id;
  const role = session.user.role;

  // Fetch the user's jobs (both as customer AND helper — accommodates users who do both)
  const [myJobs, helperStats, customerStats, user] = await Promise.all([
    prisma.job.findMany({
      where: {
        OR: [{ customerId: userId }, { helperId: userId }],
        status: { in: ['OPEN', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'] },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 12,
      include: {
        customer: { select: { id: true, name: true, image: true, avgRating: true } },
        helper:   { select: { id: true, name: true, image: true, avgRating: true } },
      },
    }),
    prisma.job.aggregate({
      where: { helperId: userId, status: 'COMPLETED' },
      _count: true,
      _sum: { finalPriceCents: true },
    }),
    prisma.job.count({
      where: { customerId: userId, status: 'COMPLETED' },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { isHelperActive: true, avgRating: true, ratingCount: true },
    }),
  ]);

  const active = myJobs.filter((j) => j.status !== 'COMPLETED' && j.status !== 'CANCELLED');
  const history = myJobs.filter((j) => j.status === 'COMPLETED' || j.status === 'CANCELLED');

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
        <div>
          <div className="stamp text-ink-600">Dashboard</div>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl font-black tracking-tight">
            Hey, {session.user.name?.split(' ')[0] ?? 'friend'}.
          </h1>
          <p className="mt-2 text-ink-600">
            {role === 'HELPER'
              ? 'Here\'s what\'s on your plate today.'
              : role === 'ADMIN'
              ? 'You have the keys to the kingdom.'
              : "Let's get your stuff moved."}
          </p>
        </div>
        <div className="flex gap-2">
          {role !== 'HELPER' && (
            <Link
              href="/jobs/new"
              className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-3 font-semibold text-white hover:bg-brand-600"
            >
              <Plus size={16} /> Post a Job
            </Link>
          )}
          {role === 'HELPER' && (
            <Link
              href="/available-jobs"
              className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-3 font-semibold text-white hover:bg-brand-600"
            >
              <Search size={16} /> Find Jobs
            </Link>
          )}
        </div>
      </div>

      {/* Helper availability toggle */}
      {role === 'HELPER' && user && (
        <div className="mb-10">
          <AvailabilityToggle initial={user.isHelperActive} />
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard
          label="Active Jobs"
          value={active.length.toString()}
          icon={Clock}
        />
        <StatCard
          label="Completed"
          value={role === 'HELPER' ? helperStats._count.toString() : customerStats.toString()}
          icon={CheckCircle2}
        />
        {role === 'HELPER' ? (
          <StatCard
            label="Earned"
            value={formatPrice(helperStats._sum.finalPriceCents ?? 0)}
            icon={TrendingUp}
          />
        ) : (
          <StatCard
            label="Total Moves"
            value={customerStats.toString()}
            icon={TrendingUp}
          />
        )}
        <StatCard
          label={role === 'HELPER' ? 'Helper Rating' : 'Your Rating'}
          value={
            user?.ratingCount && user.ratingCount > 0
              ? `${user.avgRating.toFixed(1)}★`
              : '—'
          }
          icon={TrendingUp}
        />
      </div>

      {/* Active */}
      <section className="mb-12">
        <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-3">
          Active
          <span className="text-sm font-normal text-ink-500">
            {active.length} {active.length === 1 ? 'job' : 'jobs'}
          </span>
        </h2>
        {active.length === 0 ? (
          <EmptyState role={role} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {active.map((job) => (
              <JobCard
                key={job.id}
                job={{ ...job, createdAt: job.createdAt.toISOString(), preferredTime: job.preferredTime.toISOString() }}
                perspective={job.customerId === userId ? 'customer' : 'helper'}
              />
            ))}
          </div>
        )}
      </section>

      {/* History */}
      {history.length > 0 && (
        <section>
          <h2 className="font-display text-2xl font-bold mb-4">History</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {history.map((job) => (
              <JobCard
                key={job.id}
                job={{ ...job, createdAt: job.createdAt.toISOString(), preferredTime: job.preferredTime.toISOString() }}
                perspective={job.customerId === userId ? 'customer' : 'helper'}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-ink-500 font-semibold">
          {label}
        </div>
        <Icon size={16} className="text-ink-400" />
      </div>
      <div className="mt-2 font-display text-3xl font-black text-ink-900">{value}</div>
    </Card>
  );
}

function EmptyState({ role }: { role: string }) {
  return (
    <Card className="p-10 text-center bg-ink-50 border-dashed">
      <div className="mx-auto w-14 h-14 rounded-full bg-ink-200 grid place-items-center mb-4">
        <Clock size={24} className="text-ink-500" />
      </div>
      <h3 className="font-display text-xl font-bold">Nothing active right now</h3>
      <p className="mt-2 text-sm text-ink-600 max-w-md mx-auto">
        {role === 'HELPER'
          ? 'Flip yourself online and browse jobs to get started.'
          : 'Post a job and a nearby helper will pick it up shortly.'}
      </p>
      <Link
        href={role === 'HELPER' ? '/available-jobs' : '/jobs/new'}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
      >
        {role === 'HELPER' ? <><Search size={14} /> Browse jobs</> : <><Plus size={14} /> Post a job</>}
      </Link>
    </Card>
  );
}
