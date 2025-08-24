'use client';

import { useViewProfile } from '@coinbase/onchainkit/minikit';

interface ProfileButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function ProfileButton({ 
  className = '', 
  children = 'View My Profile' 
}: ProfileButtonProps) {
  const viewProfile = useViewProfile(); // Uses current user's FID

  const handleViewProfile = () => {
    viewProfile(); // No parameter for current user
  };

  return (
    <button 
      onClick={handleViewProfile}
      className={`px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors ${className}`}
    >
      {children}
    </button>
  );
}
