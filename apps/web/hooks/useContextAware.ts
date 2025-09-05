'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  useMiniKit, 
  useIsInMiniApp, 
  useComposeCast, 
  useViewProfile, 
  useViewCast 
} from '@coinbase/onchainkit/minikit';

interface ContextAwareState {
  // Context data
  user: any | null;
  client: any | null;
  location: any | null;
  
  // Entry point detection
  entryType: 'cast_embed' | 'launcher' | 'messaging' | 'notification' | 'open_miniapp' | 'cast_share' | 'channel' | 'unknown';
  isViralEntry: boolean;
  isReturningUser: boolean;
  
  // Client information
  platformType: 'mobile' | 'desktop' | 'web' | 'unknown';
  isAdded: boolean;
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  
  // Cast embed data (for viral features)
  castAuthor: any | null;
  castText: string | null;
  castHash: string | null;
  
  // Loading and availability
  isLoading: boolean;
  isAvailable: boolean;
  
  // Social actions
  thankSharer: () => Promise<void>;
  viewSharerProfile: () => void;
  viewCast: (castHash: string) => void;
  composeCast: (text: string, parentHash?: string) => Promise<void>;
  
  // Analytics
  trackDiscovery: () => void;
}

export function useContextAware(): ContextAwareState {
  // Initialize state with default values to prevent build-time errors
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Set client flag on mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Use MiniKit hooks only if available and on client side
  let context = null;
  let isFrameReady = false;
  let setFrameReady = null;
  let isInMiniApp = false;
  let composeCastFn = null;
  let viewProfileFn = null;
  let viewCastFn = null;

  // Use MiniKit hooks with proper error handling
  try {
    const miniKitResult = useMiniKit();
    const isInMiniAppResult = useIsInMiniApp();
    const composeCastResult = useComposeCast();
    const viewProfileResult = useViewProfile();
    const viewCastResult = useViewCast();

    context = miniKitResult?.context || null;
    isFrameReady = miniKitResult?.isFrameReady || false;
    setFrameReady = miniKitResult?.setFrameReady || null;
    isInMiniApp = isInMiniAppResult?.isInMiniApp || false;
    
    composeCastFn = (() => {
      if (typeof composeCastResult === 'function') {
        return composeCastResult;
      }
      if (composeCastResult && typeof composeCastResult.composeCast === 'function') {
        return composeCastResult.composeCast;
      }
      return null;
    })();
    
    viewProfileFn = viewProfileResult || null;
    viewCastFn = viewCastResult || null;
  } catch (error) {
    // MiniKit not available - provide fallback values
    console.warn('MiniKit hooks not available:', error);
    context = null;
    isFrameReady = false;
    setFrameReady = null;
    isInMiniApp = false;
    composeCastFn = null;
    viewProfileFn = null;
    viewCastFn = null;
  }

  // Set frame ready when available
  useEffect(() => {
    if (setFrameReady && !isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Extract context data
  const user = context?.user || null;
  const client = context?.client || null;
  const location = context?.location || null;

  // Entry point detection
  const entryType = location?.type || 'unknown';
  const isViralEntry = entryType === 'cast_embed';
  const isReturningUser = entryType === 'launcher';

  // Client information
  const platformType = client?.platformType || 'unknown';
  const isAdded = client?.added || false;
  const safeAreaInsets = client?.safeAreaInsets || {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  };

  // Cast embed data
  const castAuthor = location?.type === 'cast_embed' ? location.cast?.author : null;
  const castText = location?.type === 'cast_embed' ? location.cast?.text : null;
  const castHash = location?.type === 'cast_embed' ? location.cast?.hash : null;

  // Context availability
  const isAvailable = isInMiniApp && !!context;

  // Social actions
  const thankSharer = useCallback(async () => {
    if (!castAuthor || !castHash || !composeCastFn) return;
    
    try {
      await composeCastFn({
        text: `Thanks @${castAuthor.username} for sharing this awesome focus game! 🐉⚡ #DefeatTheDragon`,
        parent: {
          type: 'cast',
          hash: castHash
        }
      });
      console.log('✅ Thanked sharer successfully');
    } catch (error) {
      console.error('❌ Failed to thank sharer:', error);
    }
  }, [castAuthor, castHash, composeCastFn]);

  const viewSharerProfile = useCallback(() => {
    if (!castAuthor?.fid) return;
    viewProfileFn(castAuthor.fid);
  }, [castAuthor, viewProfileFn]);

  const viewCastHandler = useCallback((castHash: string) => {
    if (!castHash) return;
    viewCastFn.viewCast({ hash: castHash });
  }, [viewCastFn]);

  const composeCast = useCallback(async (text: string, parentHash?: string) => {
    if (!composeCastFn) return;
    
    try {
      const castOptions: any = { text };
      if (parentHash) {
        castOptions.parent = {
          type: 'cast',
          hash: parentHash
        };
      }
      await composeCastFn(castOptions);
      console.log('✅ Cast composed successfully');
    } catch (error) {
      console.error('❌ Failed to compose cast:', error);
    }
  }, [composeCastFn]);

  // Analytics tracking
  const trackDiscovery = useCallback(() => {
    const discoveryData: any = {
      type: entryType,
      platform: platformType,
      userAdded: isAdded,
      timestamp: Date.now(),
    };

    if (isViralEntry && castAuthor) {
      discoveryData.sharedBy = castAuthor.username;
      discoveryData.castHash = castHash;
    }

    // Log for analytics (in production, send to analytics service)
    console.log('📊 Discovery tracked:', discoveryData);
    
    // Here you would send to your analytics service
    // analytics.track('mini_app_launch', discoveryData);
  }, [entryType, platformType, isAdded, isViralEntry, castAuthor, castHash]);

  // Initialize
  useEffect(() => {
    if (isAvailable) {
      trackDiscovery();
    }
    setIsLoading(false);
  }, [isAvailable, trackDiscovery]);

  // Development logging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && context) {
      console.log('🔍 Context Data:', {
        user: context.user,
        client: context.client,
        location: context.location,
        entryType,
        isViralEntry,
        isReturningUser,
      });
    }
  }, [context, entryType, isViralEntry, isReturningUser]);

  return {
    // Context data
    user,
    client,
    location,
    entryType,
    isViralEntry,
    isReturningUser,
    platformType,
    isAdded,
    safeAreaInsets,
    castAuthor,
    castText,
    castHash,
    isLoading,
    isAvailable,
    thankSharer,
    viewSharerProfile,
    viewCast: viewCastHandler,
    composeCast,
    trackDiscovery,
  };
}
