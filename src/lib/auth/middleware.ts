import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './auth';

export function createAuthMiddleware() {
  return async (request: NextRequest) => {
    const { pathname } = request.nextUrl;
    
    // Public routes that don't require authentication
    const publicRoutes = ['/', '/login', '/api/auth/login'];
    
    if (publicRoutes.includes(pathname)) {
      return NextResponse.next();
    }

    // Check for authentication token
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Admin-only routes
    const adminRoutes = ['/admin', '/users'];
    const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
    
    if (isAdminRoute && !user.is_admin) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Add user info to headers for use in components
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.clinician_id.toString());
    requestHeaders.set('x-user-admin', user.is_admin.toString());

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  };
}