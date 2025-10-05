"use client";
import { ReactNode } from 'react';
import { useSocketContext } from '@/context/SocketProvider';

interface KidsCardProps {
  children: ReactNode;
  title?: string;
  className?: string;
  colorScheme?: 'blue' | 'green' | 'purple' | 'pink' | 'yellow';
}

export default function KidsCard({ 
  children, 
  title, 
  className = '', 
  colorScheme = 'blue' 
}: KidsCardProps) {
  const { isKidsMode } = useSocketContext();

  if (!isKidsMode) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
        {children}
      </div>
    );
  }

  const colorSchemes = {
    blue: "bg-gradient-to-br from-blue-100 to-blue-200 border-blue-300",
    green: "bg-gradient-to-br from-green-100 to-green-200 border-green-300",
    purple: "bg-gradient-to-br from-purple-100 to-purple-200 border-purple-300",
    pink: "bg-gradient-to-br from-pink-100 to-pink-200 border-pink-300",
    yellow: "bg-gradient-to-br from-yellow-100 to-yellow-200 border-yellow-300"
  };

  return (
    <div className={`${colorSchemes[colorScheme]} rounded-3xl shadow-xl p-8 border-4 transform hover:scale-102 transition-transform duration-200 ${className}`}>
      {title && (
        <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}