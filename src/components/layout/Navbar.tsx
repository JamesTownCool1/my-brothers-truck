'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Bell, LogOut, Menu, Plus, Truck, User as UserIcon, X } from 'lucide-react';
import { Avatar } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { NotificationBell } from '@/components/NotificationBell';
import { cn } from '@/lib/utils';

/**
 * Navbar — sticky top nav for the signed-in app shell.
 * Responsive: hamburger menu on mobile, inline links on desktop.
 * Shows different links for CUSTOMER / HELPER / ADMIN.
 */
export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close mobile menu whenever the route changes
  useEffect(() => setOpen(false), [pathname]);

  if (!session?.user) return null;

  const role = session.user.role;
  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    ...(role !== 'HELPER' ? [{ href: '/jobs/new', label: 'Post a Job' }] : []),
    ...(role === 'HELPER' ? [{ href: '/available-jobs', label: 'Find Jobs' }] : []),
    ...(role === 'ADMIN' ? [{ href: '/admin', label: 'Admin' }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-[color:var(--background)]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="relative grid h-9 w-9 place-items-center rounded-lg bg-ink-900 text-white">
            <Truck size={18} strokeWidth={2.5} />
          </div>
          <div className="hidden sm:block">
            <div className="font-display text-lg font-black leading-none tracking-tight">
              My Brother&rsquo;s Truck
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-ink-500">
              peer-to-peer moving
            </div>
          </div>
        </Link>

        {/* Desktop links */}
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                pathname.startsWith(l.href)
                  ? 'bg-ink-900 text-white'
                  : 'text-ink-800 hover:bg-ink-100'
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Link href="/profile" className="hidden sm:block">
            <Avatar src={session.user.image} name={session.user.name} size={36} />
          </Link>
          <button
            onClick={() => setOpen((o) => !o)}
            className="md:hidden rounded-lg border-2 border-ink-200 p-2"
            aria-label="Toggle menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-ink-200 bg-white animate-slide-up">
          <div className="mx-auto max-w-7xl px-4 py-4 flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  'rounded-lg px-4 py-3 text-base font-medium',
                  pathname.startsWith(l.href) ? 'bg-ink-900 text-white' : 'hover:bg-ink-100'
                )}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/profile"
              className="rounded-lg px-4 py-3 text-base font-medium hover:bg-ink-100 flex items-center gap-3"
            >
              <UserIcon size={16} /> Profile
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="rounded-lg px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 flex items-center gap-3 text-left"
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
