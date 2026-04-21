/**
 * NextAuth configuration.
 *
 * Uses credentials (email + password) strategy with a JWT session.
 * JWTs are signed with NEXTAUTH_SECRET and carry:
 *   - sub  (user id)
 *   - role (CUSTOMER | HELPER | ADMIN)
 *   - name, email
 *
 * This means API routes can authenticate a request by calling
 * `getServerSession(authOptions)` — no DB round-trip required.
 */
import { PrismaAdapter } from '@auth/prisma-adapter';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import type { UserRole } from '@prisma/client';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 }, // 30 days
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });
        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // On login, copy role + id from the `user` returned by authorize()
      if (user) {
        token.id = user.id;
        token.role = (user as { role: UserRole }).role;
      }
      // Allow session.update() to refresh role (e.g. when user toggles to helper)
      if (trigger === 'update' && session) {
        if (session.role) token.role = session.role;
        if (session.name) token.name = session.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
};
