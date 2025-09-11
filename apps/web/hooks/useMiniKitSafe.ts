'use client';

import { useEffect, useState } from 'react';

interface MiniKitSafeData {
  isAvailable: boolean;
  context: any;
  user: any;
  signIn: (() => Promise<void>) | null;
  setFrameReady: (() => void) | null;
  isFrameReady: boolean;
  isInMiniApp: boolean;
  composeCast: (() => void) | null;
  viewProfile: (() => void) | null;
  viewCast: (() => void) | null;
  openUrl: (() => void) | null;
}

/**
 * Safe wrapper for MiniKit hooks that handles errors gracefully
 * This prevents hook violations and provides fallback values
 */
export function useMiniKitSafe(): MiniKitSafeData {
  const [data, setData] = useState<MiniKitSafeData>({
    isAvailable: false,
    context: null,
    user: null,
    signIn: null,
    setFrameReady: null,
    isFrameReady: false,
    isInMiniApp: false,
    composeCast: null,
    viewProfile: null,
    viewCast: null,
    openUrl: null,
  });

  // Call MiniKit hooks directly (they must be called at the top level)
  // This will only work if we're inside a MiniKit provider
  let miniKitData: MiniKitSafeData = {
    isAvailable: false,
    context: null,
    user: null,
    signIn: null,
    setFrameReady: null,
    isFrameReady: false,
    isInMiniApp: false,
    composeCast: null,
    viewProfile: null,
    viewCast: null,
    openUrl: null,
  };

  // Only call MiniKit hooks on client side
  if (typeof window !== 'undefined') {
    try {
      const { 
        useAuthenticate, 
        useMiniKit, 
        useIsInMiniApp,
        useComposeCast,
        useViewProfile,
        useViewCast,
        useOpenUrl
      } = require('@coinbase/onchainkit/minikit');
      
      // These will only work if we're inside a MiniKit provider
      const authenticateResult = useAuthenticate();
      const miniKitResult = useMiniKit();
      const isInMiniAppResult = useIsInMiniApp();
      const composeCastResult = useComposeCast();
      const viewProfileResult = useViewProfile();
      const viewCastResult = useViewCast();
      const openUrlResult = useOpenUrl();
      
      miniKitData = {
        isAvailable: true,
        context: miniKitResult?.context || null,
        user: authenticateResult?.user || null,
        signIn: authenticateResult?.signIn || null,
        setFrameReady: miniKitResult?.setFrameReady || null,
        isFrameReady: miniKitResult?.isFrameReady || false,
        isInMiniApp: isInMiniAppResult?.isInMiniApp || false,
        composeCast: composeCastResult || null,
        viewProfile: viewProfileResult || null,
        viewCast: viewCastResult || null,
        openUrl: openUrlResult || null,
      };
    } catch (error) {
      // Expected when not in Base App environment or MiniKit not available
      console.log('MiniKit not available (expected when not in Base App):', error.message);
    }
  }

  // Update state when data changes
  useEffect(() => {
    setData(miniKitData);
  }, [miniKitData.context, miniKitData.user, miniKitData.isAvailable]);

  return data;
}
