/**
 * Middleware — edge-level route protection.
 *
 * Uses NextAuth's JWT helper to check auth on every request hitting a
 * protected path. Unauthenticated users are bounced to /login with a
 * ?callbackUrl so they land where they intended after signing in.
 *
 * Admin paths additionally require role === ADMIN.
 */
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role;

    // Admin paths: ADMIN only
    if (pathname.startsWith('/admin') && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  // Protect app routes but leave landing + auth pages public
  matcher: [
    '/dashboard/:path*',
    '/jobs/:path*',
    '/available-jobs/:path*',
    '/profile/:path*',
    '/admin/:path*',
  ],
};
