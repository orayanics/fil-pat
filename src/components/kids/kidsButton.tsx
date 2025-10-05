"use client";
import { ReactNode, ButtonHTMLAttributes } from 'react';
import { useSocketContext } from '@/context/SocketProvider';

interface KidsButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: ReactNode;
}

export default function KidsButton({ 
  children, 
  variant = 'primary', 
  size = 'lg',
  icon,
  className = '',
  ...props 
}: KidsButtonProps) {
  const { isKidsMode } = useSocketContext();

  const baseClasses = "font-bold rounded-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg";
  
  const variantClasses = {
    primary: isKidsMode 
      ? "bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white"
      : "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: isKidsMode
      ? "bg-gradient-to-r from-purple-400 to-purple-600 hover:from-purple-500 hover:to-purple-700 text-white"
      : "bg-gray-600 hover:bg-gray-700 text-white",
    success: isKidsMode
      ? "bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white"
      : "bg-green-600 hover:bg-green-700 text-white",
    warning: isKidsMode
      ? "bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white"
      : "bg-yellow-600 hover:bg-yellow-700 text-white",
        danger: isKidsMode
      ? "bg-gradient-to-r from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600 text-white"
      : "bg-red-600 hover:bg-red-700 text-white"
  };

  const sizeClasses = {
    sm: isKidsMode ? "px-4 py-2 text-sm" : "px-3 py-2 text-sm",
    md: isKidsMode ? "px-6 py-3 text-base" : "px-4 py-2 text-base",
    lg: isKidsMode ? "px-8 py-4 text-lg" : "px-6 py-3 text-lg",
    xl: isKidsMode ? "px-12 py-6 text-xl" : "px-8 py-4 text-xl"
  };

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button className={combinedClasses} {...props}>
      <div className="flex items-center justify-center gap-3">
        {icon && <span className="text-current">{icon}</span>}
        <span>{children}</span>
      </div>
    </button>
  );
}