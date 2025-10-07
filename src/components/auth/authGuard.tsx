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
    const adminRoutes = [
      '/admin-dashboard',
      '/admin-dashboard/',
      '/admin-dashboard/clinicians',
      '/admin-dashboard/patients',
      '/admin-dashboard/reports',
      '/admin-dashboard/activity-logs',
      '/users',
    ];
    const clinicianRoutes = [
      '/clinician-dashboard',
      '/clinician-dashboard/',
      '/clinician-dashboard/patients',
      '/session',
      '/session/clinician',
      '/session/clinician/',
    ];

    if (user.is_admin) {
      // If admin tries to access clinician-only route, redirect to admin-dashboard
      const isAdminAllowed = adminRoutes.some((route) => pathname.startsWith(route));
      if (!isAdminAllowed) {
        router.replace('/admin-dashboard');
        return;
      }
    } else {
      // If clinician tries to access admin-only route, redirect to clinician-dashboard
      const isClinicianAllowed = clinicianRoutes.some((route) => pathname.startsWith(route));
      if (!isClinicianAllowed) {
        router.replace('/clinician-dashboard');
        return;
      }
      // If adminOnly prop is set, block clinicians
      if (adminOnly) {
        router.replace('/clinician-dashboard');
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