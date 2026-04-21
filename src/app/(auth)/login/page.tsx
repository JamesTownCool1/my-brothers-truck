'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, Truck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const callbackUrl = search.get('callbackUrl') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    setLoading(false);

    if (result?.error) {
      toast.error('Invalid email or password');
      return;
    }
    toast.success('Welcome back');
    router.push(result?.url ?? '/dashboard');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Link
        href="/"
        className="absolute top-6 left-6 inline-flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900"
      >
        <ArrowLeft size={16} /> Home
      </Link>

      <main className="flex-1 grid md:grid-cols-2">
        {/* Left: form */}
        <section className="flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-sm">
            <div className="flex items-center gap-2 mb-8">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-ink-900 text-white">
                <Truck size={18} strokeWidth={2.5} />
              </div>
              <span className="font-display text-xl font-black">My Brother&rsquo;s Truck</span>
            </div>

            <h1 className="font-display text-4xl font-black tracking-tight">Welcome back.</h1>
            <p className="mt-2 text-ink-600">Sign in to post jobs or pick up a load.</p>

            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              <Input
                label="Email"
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                label="Password"
                type="password"
                name="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button type="submit" loading={loading} className="w-full" size="lg">
                Sign in
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-ink-600">
              New here?{' '}
              <Link href="/register" className="font-semibold text-brand-600 hover:underline">
                Create an account
              </Link>
            </p>

            <div className="mt-8 rounded-xl border border-ink-200 bg-ink-50 p-4 text-xs text-ink-600">
              <div className="font-semibold text-ink-800 mb-1">Demo accounts</div>
              <code className="text-[11px]">maria@example.com / password123</code>
              <br />
              <code className="text-[11px]">diego@example.com / password123</code>
            </div>
          </div>
        </section>

        {/* Right: editorial side */}
        <section className="hidden md:flex items-center justify-center bg-ink-900 text-white p-12 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_#ff7a11,_transparent_50%)]" />
          <div className="relative max-w-md">
            <span className="stamp text-brand-400">A peer-to-peer promise</span>
            <blockquote className="mt-6 font-display text-4xl font-black leading-tight">
              &ldquo;I didn&rsquo;t want to rent a U-Haul for a dresser.
              So I asked my brother. He was busy. Then I found
              <span className="text-brand-400"> this app.</span>&rdquo;
            </blockquote>
            <div className="mt-6 text-sm text-ink-300">— Maria, San Antonio</div>
          </div>
        </section>
      </main>
    </div>
  );
}
