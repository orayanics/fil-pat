"use client";
import { ReactNode } from 'react';
import { useSocketContext } from '@/context/SocketProvider';

interface KidsLayoutProps {
  children: ReactNode;
}

export default function KidsLayout({ children }: KidsLayoutProps) {
  const { isKidsMode } = useSocketContext();

  if (!isKidsMode) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-16 h-16 bg-yellow-300 rounded-full opacity-70 animate-bounce" />
        <div className="absolute top-32 right-20 w-12 h-12 bg-green-300 rounded-full opacity-60 animate-pulse" />
        <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-blue-300 rounded-full opacity-50 animate-bounce" style={{animationDelay: '1s'}} />
        <div className="absolute bottom-40 right-1/4 w-8 h-8 bg-red-300 rounded-full opacity-70 animate-pulse" style={{animationDelay: '0.5s'}} />
      </div>

      {/* Main content with kids-friendly styling */}
      <div className="relative z-10 p-4">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </div>

      {/* Decorative elements */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-green-200 to-transparent pointer-events-none" />
    </div>
  );
}