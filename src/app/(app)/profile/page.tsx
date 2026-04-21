import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ProfileForm } from '@/components/ProfileForm';

/**
 * Own-profile editor — loads the current user's data on the server and
 * passes it down to a client-side form component.
 */
export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, email: true, name: true, phone: true, bio: true,
      image: true, role: true, isHelperActive: true,
      baseLat: true, baseLng: true, baseAddress: true,
      avgRating: true, ratingCount: true,
    },
  });
  if (!user) redirect('/login');

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      <div className="stamp text-ink-600">Your Profile</div>
      <h1 className="mt-3 font-display text-4xl sm:text-5xl font-black tracking-tight">
        Tell the world a bit about you.
      </h1>
      <p className="mt-2 text-ink-600">
        Profiles with a photo and phone number get matched faster.
      </p>

      <ProfileForm user={user} />
    </div>
  );
}
