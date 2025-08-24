'use client';

import { useAddFrame } from '@coinbase/onchainkit/minikit';
import { useState } from 'react';

interface SaveButtonProps {
  className?: string;
  children?: React.ReactNode;
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
}

export default function SaveButton({ 
  className = '',
  children = 'Save Mini App',
  onSuccess,
  onError
}: SaveButtonProps) {
  const addFrame = useAddFrame();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddFrame = async () => {
    setIsAdding(true);
    try {
      const result = await addFrame();
      if (result) {
        console.log('Frame saved:', result.url);
        console.log('Notification token:', result.token);
        
        // Save to your database for future notifications
        await saveNotificationToken(result.token, result.url);
        
        console.log('Mini App saved successfully! 🎉');
        onSuccess?.(result);
      } else {
        console.log('User cancelled or frame already saved');
      }
    } catch (error) {
      console.error('Failed to save frame:', error);
      onError?.(error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <button 
      onClick={handleAddFrame}
      disabled={isAdding}
      className={`px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed ${className}`}
    >
      {isAdding ? 'Saving...' : children}
    </button>
  );
}

async function saveNotificationToken(token: string, url: string) {
  try {
    await fetch('/api/notification-tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, url })
    });
  } catch (error) {
    console.error('Failed to save notification token:', error);
  }
}
