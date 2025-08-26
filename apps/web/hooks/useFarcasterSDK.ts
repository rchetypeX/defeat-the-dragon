'use client';

import { useEffect, useState, useCallback } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

interface FarcasterSDKState {
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  ready: () => Promise<void>;
}

export function useFarcasterSDK(): FarcasterSDKState {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Start as false, not loading
  const [error, setError] = useState<string | null>(null);

  // Call ready() when interface is ready to be displayed
  const ready = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Call the required ready() method to hide splash screen
      await sdk.actions.ready();
      
      setIsReady(true);
      
      console.log('✅ Farcaster SDK ready - splash screen hidden');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('❌ Farcaster SDK ready failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Don't auto-initialize on mount - let the app decide when to call ready()
  // This prevents jitter and content reflows as per Farcaster best practices

  return {
    isReady,
    isLoading,
    error,
    ready,
  };
}
