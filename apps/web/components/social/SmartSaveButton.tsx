'use client';

import { useAddFrame, useMiniKit } from '@coinbase/onchainkit/minikit';

interface SmartSaveButtonProps {
  className?: string;
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
}

export default function SmartSaveButton({ 
  className = '',
  onSuccess,
  onError
}: SmartSaveButtonProps) {
  const addFrame = useAddFrame();
  const { context } = useMiniKit();
  
  // Don't show save button if already saved
  if (context?.client?.added) {
    return (
      <div className={`flex items-center space-x-2 text-green-600 ${className}`}>
        <span>✅</span>
        <span>Already saved to your collection</span>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      const result = await addFrame();
      if (result) {
        // Save with user context for analytics
        await fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'frame_saved',
            userFid: context?.user?.fid,
            url: result.url,
            token: result.token
          })
        });
        
        onSuccess?.(result);
      }
    } catch (error) {
      console.error('Failed to save frame:', error);
      onError?.(error);
    }
  };

  return (
    <button 
      onClick={handleSave}
      className={`px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-colors font-semibold ${className}`}
    >
      Save to Collection
    </button>
  );
}
