'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, Package, Truck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

type Role = 'CUSTOMER' | 'HELPER';

export default function RegisterPage() {
  const router = useRouter();
  const search = useSearchParams();
  const initialRole: Role = search.get('role') === 'helper' ? 'HELPER' : 'CUSTOMER';

  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', role: initialRole as Role,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setLoading(false);
      if (data?.details?.fieldErrors) {
        const flat: Record<string, string> = {};
        for (const [k, v] of Object.entries(data.details.fieldErrors)) {
          if (Array.isArray(v) && v[0]) flat[k] = v[0] as string;
        }
        setErrors(flat);
      } else {
        toast.error(data?.error ?? 'Signup failed');
      }
      return;
    }

    // Auto sign-in after registration
    const signInResult = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
      callbackUrl: '/dashboard',
    });
    setLoading(false);
    if (signInResult?.error) {
      toast.error('Signed up, but auto-login failed — please log in manually.');
      router.push('/login');
      return;
    }
    toast.success('Welcome to My Brother&rsquo;s Truck!');
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Link href="/" className="absolute top-6 left-6 inline-flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900">
        <ArrowLeft size={16} /> Home
      </Link>

      <main className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-lg">
          <div className="flex items-center gap-2 mb-6">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-ink-900 text-white">
              <Truck size={18} strokeWidth={2.5} />
            </div>
            <span className="font-display text-xl font-black">My Brother&rsquo;s Truck</span>
          </div>

          <h1 className="font-display text-4xl font-black tracking-tight">Create your account</h1>
          <p className="mt-2 text-ink-600">You can always switch roles later.</p>

          {/* Role picker */}
          <div className="mt-8 grid grid-cols-2 gap-3">
            {(
              [
                { key: 'CUSTOMER', label: 'I need something moved', icon: Package },
                { key: 'HELPER',   label: 'I have a truck',          icon: Truck   },
              ] as const
            ).map((opt) => {
              const active = form.role === opt.key;
              const Icon = opt.icon;
              return (
                <button
                  type="button"
                  key={opt.key}
                  onClick={() => update('role', opt.key)}
                  className={cn(
                    'rounded-xl border-2 p-4 text-left transition-all',
                    active
                      ? 'border-brand-500 bg-brand-50 shadow-sm'
                      : 'border-ink-200 hover:border-ink-400'
                  )}
                >
                  <Icon size={22} className={active ? 'text-brand-600' : 'text-ink-700'} />
                  <div className="mt-2 text-sm font-semibold">{opt.label}</div>
                </button>
              );
            })}
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <Input
              label="Full name" name="name" required
              placeholder="Maria Gonzalez"
              value={form.name}
              error={errors.name}
              onChange={(e) => update('name', e.target.value)}
            />
            <Input
              label="Email" type="email" name="email" required
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              error={errors.email}
              onChange={(e) => update('email', e.target.value)}
            />
            <Input
              label="Phone" type="tel" name="phone"
              placeholder="+1 555 123 4567"
              value={form.phone}
              error={errors.phone}
              onChange={(e) => update('phone', e.target.value)}
              hint="Optional — helpful for coordinating the move"
            />
            <Input
              label="Password" type="password" name="password" required
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={form.password}
              error={errors.password}
              onChange={(e) => update('password', e.target.value)}
            />

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-600">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-brand-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
