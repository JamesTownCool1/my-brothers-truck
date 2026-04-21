'use client';

/**
 * Global error boundary — catches runtime errors from any page below it.
 * In dev you'll see the stack in the terminal; in prod we just show a
 * friendly "something broke" screen with a retry button.
 */
import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="text-center max-w-md">
        <div className="font-display text-[120px] font-black leading-none text-brand-500">
          ×_×
        </div>
        <h1 className="mt-2 font-display text-3xl font-bold">Something broke.</h1>
        <p className="mt-3 text-ink-600">
          Not your fault. Try again, or head home and start fresh.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-ink-400 font-mono">Error ID: {error.digest}</p>
        )}
        <div className="mt-6 flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="rounded-full bg-brand-500 px-6 py-3 font-semibold text-white hover:bg-brand-600"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-full border-2 border-ink-900 px-6 py-3 font-semibold text-ink-900 hover:bg-ink-900 hover:text-white"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
