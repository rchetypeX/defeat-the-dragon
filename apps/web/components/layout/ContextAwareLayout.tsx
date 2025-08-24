'use client';

import { useContextAware } from '../../hooks/useContextAware';
import { ReactNode } from 'react';

interface ContextAwareLayoutProps {
  children: ReactNode;
  className?: string;
}

export function ContextAwareLayout({ children, className = '' }: ContextAwareLayoutProps) {
  const {
    safeAreaInsets,
    platformType,
    isAvailable,
    isLoading,
  } = useContextAware();

  // Apply safe area insets for mobile devices
  const safeAreaStyle = {
    paddingTop: safeAreaInsets.top,
    paddingBottom: safeAreaInsets.bottom,
    paddingLeft: safeAreaInsets.left,
    paddingRight: safeAreaInsets.right,
  };

  // Show loading state while context is loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#f2751a] mx-auto mb-4"></div>
          <p className="text-lg text-white drop-shadow-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen bg-[#1a1a2e] ${className}`}
      style={isAvailable ? safeAreaStyle : {}}
    >
      {/* Platform indicator for development */}
      {process.env.NODE_ENV === 'development' && isAvailable && (
        <div className="fixed top-0 left-0 bg-black bg-opacity-75 text-white text-xs p-1 z-50">
          {platformType} • Safe: {safeAreaInsets.top}/{safeAreaInsets.bottom}
        </div>
      )}
      
      {children}
    </div>
  );
}
