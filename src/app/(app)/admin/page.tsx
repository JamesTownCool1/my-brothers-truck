import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AdminTabs } from '@/components/AdminTabs';

/**
 * Admin panel — data-dense tables for managing the platform.
 *
 * Access is double-gated: middleware blocks non-admins at the edge, and
 * this server component verifies the session role again as a belt-and-
 * suspenders check. Data is fetched server-side and handed to a client
 * component for the interactive bits (tab switching, moderation toggles).
 */
export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/dashboard');

  const [users, jobs, reviews, counts] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true, email: true, name: true, role: true, image: true,
        isHelperActive: true, avgRating: true, ratingCount: true, createdAt: true,
        _count: { select: { jobsAsCustomer: true, jobsAsHelper: true } },
      },
    }),
    prisma.job.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        customer: { select: { id: true, name: true } },
        helper:   { select: { id: true, name: true } },
      },
    }),
    prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        reviewer: { select: { id: true, name: true } },
        reviewee: { select: { id: true, name: true } },
        job:      { select: { id: true, title: true } },
      },
    }),
    {
      users:      await prisma.user.count(),
      jobs:       await prisma.job.count(),
      openJobs:   await prisma.job.count({ where: { status: 'OPEN' } }),
      completed:  await prisma.job.count({ where: { status: 'COMPLETED' } }),
    },
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
      <div className="stamp text-ink-600">Admin</div>
      <h1 className="mt-3 font-display text-4xl sm:text-5xl font-black tracking-tight">
        Control Room
      </h1>

      {/* Stat cards */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Users" value={counts.users} />
        <Stat label="Jobs" value={counts.jobs} />
        <Stat label="Open" value={counts.openJobs} />
        <Stat label="Completed" value={counts.completed} />
      </div>

      <AdminTabs
        users={users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))}
        jobs={jobs.map((j) => ({
          ...j,
          createdAt: j.createdAt.toISOString(),
          preferredTime: j.preferredTime.toISOString(),
        }))}
        reviews={reviews.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border-2 border-ink-200 bg-white p-5">
      <div className="text-xs uppercase tracking-wider text-ink-500 font-semibold">
        {label}
      </div>
      <div className="mt-2 font-display text-3xl font-black">{value}</div>
    </div>
  );
}
