'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { sdk } from '@farcaster/miniapp-sdk';

export interface SharedCast {
  author: {
    fid: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
  };
  hash: string;
  parentHash?: string;
  parentFid?: number;
  timestamp?: number;
  mentions?: any[];
  text: string;
  embeds?: string[];
  channelKey?: string;
}

export interface ShareExtensionInfo {
  isShareContext: boolean;
  sharedCast: SharedCast | null;
  isLoading: boolean;
  error: string | null;
  castHash: string | null;
  castFid: number | null;
  viewerFid: number | null;
}

export function useShareExtension(): ShareExtensionInfo {
  const searchParams = useSearchParams();
  const [sharedCast, setSharedCast] = useState<SharedCast | null>(null);
  const [isShareContext, setIsShareContext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract URL parameters
  const castHash = searchParams.get('castHash');
  const castFid = searchParams.get('castFid') ? parseInt(searchParams.get('castFid')!) : null;
  const viewerFid = searchParams.get('viewerFid') ? parseInt(searchParams.get('viewerFid')!) : null;

  // Handle share extension detection
  const detectShareExtension = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check URL parameters (immediate access)
      if (castHash && castFid) {
        console.log('🔗 Share Extension detected via URL parameters:', {
          castHash,
          castFid,
          viewerFid
        });
        
        setIsShareContext(true);
        
        // Fetch cast data
        await fetchCastData(castHash, castFid);
        return;
      }

      // Check SDK context (available after initialization)
      const context = await sdk.context;
      if (context.location.type === 'cast_share') {
        console.log('🔗 Share Extension detected via SDK context');
        
        setIsShareContext(true);
        setSharedCast(context.location.cast);
        
        console.log('✅ Shared cast data from SDK:', context.location.cast);
        return;
      }

      // No share context detected
      setIsShareContext(false);
      setSharedCast(null);
      
    } catch (err) {
      console.error('❌ Error detecting share extension:', err);
      setError(err instanceof Error ? err.message : 'Failed to detect share extension');
    } finally {
      setIsLoading(false);
    }
  }, [castHash, castFid, viewerFid]);

  // Fetch cast data from Farcaster API
  const fetchCastData = useCallback(async (hash: string, fid: number) => {
    try {
      // In a real implementation, you would fetch from Farcaster API
      // For now, we'll create a mock cast object
      const mockCast: SharedCast = {
        author: {
          fid: fid,
          username: `user${fid}`,
          displayName: `User ${fid}`,
          pfpUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${fid}`
        },
        hash: hash,
        text: `This is a shared cast from user ${fid}. Let's analyze their focus patterns and create a personalized challenge!`,
        timestamp: Date.now(),
        embeds: []
      };

      setSharedCast(mockCast);
      console.log('✅ Cast data fetched:', mockCast);
      
    } catch (err) {
      console.error('❌ Error fetching cast data:', err);
      throw err;
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    detectShareExtension();
  }, [detectShareExtension]);

  return {
    isShareContext,
    sharedCast,
    isLoading,
    error,
    castHash,
    castFid,
    viewerFid,
  };
}

// Hook for share extension actions
export function useShareExtensionActions() {
  const shareExtension = useShareExtension();

  // Create focus challenge based on shared cast
  const createFocusChallenge = useCallback(async (cast: SharedCast) => {
    try {
      console.log('🎯 Creating focus challenge for cast:', cast.hash);
      
      // In a real implementation, you would:
      // 1. Analyze the cast content
      // 2. Create a personalized focus challenge
      // 3. Save it to your database
      // 4. Send notifications to the cast author
      
      // Mock implementation
      const challenge = {
        id: `challenge_${Date.now()}`,
        castHash: cast.hash,
        authorFid: cast.author.fid,
        title: `Focus Challenge for @${cast.author.username}`,
        description: `Based on your cast, here's a personalized focus challenge!`,
        duration: 25, // minutes
        difficulty: 'medium',
        createdAt: new Date().toISOString()
      };
      
      console.log('✅ Focus challenge created:', challenge);
      
      // You could also send a notification to the cast author
      // await notificationService.sendFocusChallengeNotification(cast.author.fid, challenge);
      
      return challenge;
      
    } catch (err) {
      console.error('❌ Error creating focus challenge:', err);
      throw err;
    }
  }, []);

  // Share achievement based on cast
  const shareAchievement = useCallback(async (cast: SharedCast, achievementType: string) => {
    try {
      console.log('🏆 Sharing achievement for cast:', cast.hash);
      
      // In a real implementation, you would:
      // 1. Create an achievement based on the cast
      // 2. Share it back to Farcaster
      // 3. Tag the original cast author
      
      const achievement = {
        id: `achievement_${Date.now()}`,
        type: achievementType,
        castHash: cast.hash,
        authorFid: cast.author.fid,
        title: `${achievementType} Achievement`,
        description: `Congratulations on your ${achievementType} achievement!`,
        createdAt: new Date().toISOString()
      };
      
      console.log('✅ Achievement created:', achievement);
      
      // You could use the Farcaster SDK to compose a cast
      // await sdk.actions.composeCast({
      //   text: `🏆 @${cast.author.username} just earned the ${achievementType} achievement!`,
      //   parentUrl: `https://warpcast.com/~/cast/${cast.hash}`
      // });
      
      return achievement;
      
    } catch (err) {
      console.error('❌ Error sharing achievement:', err);
      throw err;
    }
  }, []);

  // Analyze cast content for focus insights
  const analyzeCastContent = useCallback(async (cast: SharedCast) => {
    try {
      console.log('📊 Analyzing cast content:', cast.hash);
      
      // In a real implementation, you would:
      // 1. Analyze the cast text for focus-related keywords
      // 2. Determine the user's focus patterns
      // 3. Generate personalized recommendations
      
      const analysis = {
        focusScore: Math.floor(Math.random() * 40) + 60, // 60-100
        recommendedSessionDuration: [15, 25, 45][Math.floor(Math.random() * 3)],
        focusStreak: Math.floor(Math.random() * 10) + 1,
        keywords: ['productivity', 'focus', 'work', 'study'],
        recommendations: [
          'Try a 25-minute Pomodoro session',
          'Take regular breaks to maintain focus',
          'Set clear goals for each session'
        ]
      };
      
      console.log('✅ Cast analysis completed:', analysis);
      
      return analysis;
      
    } catch (err) {
      console.error('❌ Error analyzing cast content:', err);
      throw err;
    }
  }, []);

  return {
    ...shareExtension,
    createFocusChallenge,
    shareAchievement,
    analyzeCastContent,
  };
}

// Hook for share extension UI state
export function useShareExtensionUI() {
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareAction, setShareAction] = useState<'challenge' | 'achievement' | null>(null);

  const openShareModal = useCallback((action: 'challenge' | 'achievement') => {
    setShareAction(action);
    setShowShareModal(true);
  }, []);

  const closeShareModal = useCallback(() => {
    setShowShareModal(false);
    setShareAction(null);
  }, []);

  return {
    showShareModal,
    shareAction,
    openShareModal,
    closeShareModal,
  };
}
