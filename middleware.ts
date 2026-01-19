import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth/auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    '/login',
    '/register',
    '/dashboard/:path*',
    '/admin/:path*',
    '/api/protected/:path*'
  ]
};
