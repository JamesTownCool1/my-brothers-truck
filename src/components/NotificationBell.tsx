'use client';

import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { formatRelative } from '@/lib/utils';

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  jobId: string | null;
  readAt: string | null;
  createdAt: string;
};

/**
 * NotificationBell — polls /api/notifications every 15s for new items.
 * The red dot appears when there's anything unread. Clicking the bell
 * opens a dropdown; opening the dropdown marks everything read.
 *
 * Pure polling because WebSockets are a pain on Vercel's serverless
 * runtime. 15s is plenty snappy for an MVP.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.notifications);
      setUnread(data.unreadCount);
    } catch {
      /* silent — just retry next tick */
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 15_000);
    return () => clearInterval(id);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [open]);

  async function onOpen() {
    setOpen(true);
    if (unread > 0) {
      // Optimistic: zero the badge immediately
      setUnread(0);
      fetch('/api/notifications', { method: 'POST', body: JSON.stringify({}) }).catch(() => {});
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => (open ? setOpen(false) : onOpen())}
        className="relative rounded-full p-2 hover:bg-ink-100"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-[70vh] overflow-y-auto nice-scroll rounded-xl border-2 border-ink-200 bg-white shadow-xl animate-slide-up z-50">
          <div className="sticky top-0 bg-white border-b border-ink-200 px-4 py-3 font-display text-lg font-bold">
            Notifications
          </div>
          {items.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-ink-500">
              Nothing yet. Post a job and watch this space.
            </div>
          ) : (
            <ul className="divide-y divide-ink-100">
              {items.map((n) => {
                const href = n.jobId ? `/jobs/${n.jobId}` : '#';
                return (
                  <li key={n.id}>
                    <Link
                      href={href}
                      className="block px-4 py-3 hover:bg-ink-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        {!n.readAt && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-ink-900">{n.title}</div>
                          <div className="text-sm text-ink-700 line-clamp-2">{n.body}</div>
                          <div className="mt-1 text-xs text-ink-500">
                            {formatRelative(n.createdAt)}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
