import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Navbar } from '@/components/layout/Navbar';

/**
 * Layout for the signed-in section of the app.
 * Middleware already enforces auth at the edge, but we double-check here
 * because middleware can be bypassed by misconfigured deployments.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
