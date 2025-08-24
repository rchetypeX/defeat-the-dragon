'use client';

import { useViewProfile, useMiniKit } from '@coinbase/onchainkit/minikit';

export default function SocialActions() {
  const { context } = useMiniKit();
  const viewMyProfile = useViewProfile(); // Current user
  const viewHostProfile = useViewProfile(); // Host app profile

  const isBaseApp = context?.client?.clientFid === 309857;

  const handleViewMyProfile = () => {
    viewMyProfile(); // No parameter for current user
  };

  const handleViewHostProfile = () => {
    if (context?.client?.clientFid) {
      viewHostProfile(context.client.clientFid);
    }
  };

  return (
    <div className="flex flex-col space-y-3 p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-900">Social Actions</h3>
      
      <div className="flex flex-col space-y-2">
        <button 
          onClick={handleViewMyProfile}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          My Profile
        </button>
        
        <button 
          onClick={handleViewHostProfile}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          View {isBaseApp ? 'Base App' : 'Host'} Profile
        </button>
      </div>
      
      <div className="text-xs text-gray-500 mt-2">
        <p>Client FID: {context?.client?.clientFid || 'Unknown'}</p>
        <p>User FID: {context?.user?.fid || 'Not authenticated'}</p>
      </div>
    </div>
  );
}
