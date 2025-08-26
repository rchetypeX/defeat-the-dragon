'use client';

import { useEffect } from 'react';
import { useFarcasterSDK } from '../hooks/useFarcasterSDK';

interface MiniAppDetectorProps {
  children: React.ReactNode;
}

export function MiniAppDetector({ children }: MiniAppDetectorProps) {
  const { ready: farcasterReady, isReady: isFarcasterReady, isLoading: isFarcasterLoading } = useFarcasterSDK();

  useEffect(() => {
    // Check if we're running as a Mini App
    const url = new URL(window.location.href);
    const isMiniApp = 
      url.pathname.startsWith('/miniapp') ||
      url.searchParams.get('miniApp') === 'true' ||
      // Check for Farcaster-specific user agents or other indicators
      navigator.userAgent.includes('Farcaster') ||
      window.location.hostname.includes('farcaster');

    if (isMiniApp) {
      console.log('🚀 Detected Farcaster Mini App environment');
      
      // Import and initialize Farcaster SDK
      import('@farcaster/miniapp-sdk').then(({ sdk }) => {
        console.log('✅ Farcaster SDK loaded in Mini App mode');
        
        // Call ready() when interface is stable
        const timer = setTimeout(() => {
          if (!isFarcasterReady && !isFarcasterLoading) {
            farcasterReady();
          }
        }, 100);
        
        return () => clearTimeout(timer);
      }).catch((error) => {
        console.error('❌ Failed to load Farcaster SDK:', error);
      });
    } else {
      console.log('🌐 Running in standard web mode');
    }
  }, [farcasterReady, isFarcasterReady, isFarcasterLoading]);

  return <>{children}</>;
}
