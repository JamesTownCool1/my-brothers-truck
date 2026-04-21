'use client';

/**
 * Client-side providers: NextAuth session + hot toast container.
 * Kept in its own file so the root layout can stay a Server Component.
 */
import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0c0a09',
            color: '#fbf9f5',
            border: '1px solid #27272a',
            fontFamily: 'var(--font-sans)',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#ff7a11', secondary: '#0c0a09' } },
        }}
      />
    </SessionProvider>
  );
}
