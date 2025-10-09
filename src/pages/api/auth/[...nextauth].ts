import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/mongodb';

const options: any = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'dev-secret',
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/', // Redirect to login page if not signed in
    signOut: '/', // Redirect to home page after sign out
    error: '/', // Redirect to error page
    verifyRequest: '/', // Redirect for email verification
    newUser: '/chat', // Redirect new users to chat screen
  },
  callbacks: {
    async signIn({ user, account, profile }: any) {
      console.log('signIn callback triggered:', { user, account, profile });
      return true; // Allow sign-in
    },
    async jwt({ token, user }: any) {
      console.log('jwt callback triggered:', { token, user });
      if (user) {
        token.dbUserId = user.dbUserId; // Attach user ID to token
      }
      return token;
    },
    async session({ session, token }: any) {
      console.log('session callback triggered:', { session, token });
      session.user.id = token.dbUserId; // Attach user ID to session
      return session;
    },
  },
};

export default (req: NextApiRequest, res: NextApiResponse) => NextAuth(req, res, options as any);

export { options as authOptions };
