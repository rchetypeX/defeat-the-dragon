'use client';

import { useViewProfile } from '@coinbase/onchainkit/minikit';

interface UserCardProps {
  userFid: string;
  userName: string;
  userAvatar?: string;
  className?: string;
}

export default function UserCard({ 
  userFid, 
  userName, 
  userAvatar,
  className = '' 
}: UserCardProps) {
  const viewProfile = useViewProfile();

  const handleViewProfile = () => {
    viewProfile(parseInt(userFid));
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 border border-gray-200 ${className}`}>
      <div className="flex items-center space-x-3">
        {userAvatar && (
          <img 
            src={userAvatar} 
            alt={`${userName}'s avatar`}
            className="w-10 h-10 rounded-full"
          />
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{userName}</h3>
          <p className="text-sm text-gray-500">FID: {userFid}</p>
        </div>
        <button 
          onClick={handleViewProfile}
          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
        >
          View Profile
        </button>
      </div>
    </div>
  );
}
