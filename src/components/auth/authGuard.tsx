"use client";
import { useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSocketContext } from '@/context/SocketProvider';

interface AuthGuardProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export default function AuthGuard({ children, adminOnly = false }: AuthGuardProps) {
  const { isAuthenticated, user } = useSocketContext();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    const publicRoutes = ['/', '/login'];
    if (publicRoutes.includes(pathname)) {
      return;
    }

    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    // Admin route protection
    if (adminOnly && !user.is_admin) {
      router.push('/clinician-dashboard');
      return;
    }

    // Clinician route protection
    if (!user.is_admin) {
      // Only allow clinician-dashboard and session routes for clinicians
      const allowedClinicianRoutes = [
        '/clinician-dashboard',
        '/session',
        '/session/clinician',
        '/session/clinician/',
      ];
      const isAllowed = allowedClinicianRoutes.some((route) => pathname.startsWith(route));
      if (!isAllowed) {
        router.push('/clinician-dashboard');
        return;
      }
    }
  }, [isAuthenticated, user, router, pathname, adminOnly]);

  // Show loading or redirect for unauthenticated users
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Show access denied for non-admin users trying to access admin routes
  if (adminOnly && !user.is_admin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600">You dont have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}