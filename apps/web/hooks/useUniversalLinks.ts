'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';

export interface UniversalLinkInfo {
  appId: string | null;
  appSlug: string | null;
  subPath: string | null;
  queryParams: Record<string, string>;
  universalLink: string | null;
  isUniversalLink: boolean;
}

export function useUniversalLinks(): UniversalLinkInfo {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [appId, setAppId] = useState<string | null>(null);
  const [appSlug, setAppSlug] = useState<string | null>(null);
  const [universalLink, setUniversalLink] = useState<string | null>(null);

  // Extract sub-path from current pathname
  const subPath = useCallback(() => {
    // Remove the base path and get the sub-path
    const basePath = '/';
    if (pathname === basePath) {
      return null;
    }
    
    // Remove leading slash and return sub-path
    return pathname.startsWith('/') ? pathname.slice(1) : pathname;
  }, [pathname]);

  // Extract query parameters
  const queryParams = useCallback(() => {
    const params: Record<string, string> = {};
    
    if (searchParams) {
      for (const [key, value] of searchParams.entries()) {
        params[key] = value;
      }
    }
    
    return params;
  }, [searchParams]);

  // Check if current URL is a Universal Link
  const isUniversalLink = useCallback(() => {
    // Check if we're being accessed via a Universal Link
    // This could be determined by checking the referrer or other indicators
    if (typeof window !== 'undefined') {
      const referrer = document.referrer;
      return referrer.includes('farcaster.xyz/miniapps/');
    }
    return false;
  }, []);

  // Get current Mini App information
  const getCurrentAppInfo = useCallback(async () => {
    try {
      // In a real implementation, you would get this from your manifest or environment
      // For now, using placeholder values that would be replaced with actual values
      const currentAppId = process.env.NEXT_PUBLIC_FARCASTER_APP_ID || 'your-app-id';
      const currentAppSlug = process.env.NEXT_PUBLIC_FARCASTER_APP_SLUG || 'defeat-the-dragon';
      
      setAppId(currentAppId);
      setAppSlug(currentAppSlug);
      setUniversalLink(`https://farcaster.xyz/miniapps/${currentAppId}/${currentAppSlug}`);
      
    } catch (error) {
      console.error('Failed to get current app info:', error);
    }
  }, []);

  // Handle Universal Link navigation
  const navigateToSubPath = useCallback((newSubPath: string, newQueryParams?: Record<string, string>) => {
    try {
      // Construct the new URL
      let newUrl = `/${newSubPath}`;
      
      if (newQueryParams && Object.keys(newQueryParams).length > 0) {
        const params = new URLSearchParams(newQueryParams);
        newUrl += `?${params.toString()}`;
      }
      
      // Navigate to the new path
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', newUrl);
        // Trigger a custom event to notify components of the navigation
        window.dispatchEvent(new CustomEvent('universalLinkNavigation', {
          detail: { subPath: newSubPath, queryParams: newQueryParams }
        }));
      }
      
    } catch (error) {
      console.error('Failed to navigate to sub-path:', error);
    }
  }, []);

  // Generate Universal Link with sub-path and query parameters
  const generateUniversalLink = useCallback((
    targetSubPath?: string, 
    targetQueryParams?: Record<string, string>
  ) => {
    if (!appId || !appSlug) {
      return null;
    }
    
    let link = `https://farcaster.xyz/miniapps/${appId}/${appSlug}`;
    
    if (targetSubPath) {
      link += `/${targetSubPath}`;
    }
    
    if (targetQueryParams && Object.keys(targetQueryParams).length > 0) {
      const params = new URLSearchParams(targetQueryParams);
      link += `?${params.toString()}`;
    }
    
    return link;
  }, [appId, appSlug]);

  // Copy Universal Link to clipboard
  const copyUniversalLink = useCallback(async (
    targetSubPath?: string, 
    targetQueryParams?: Record<string, string>
  ) => {
    try {
      const link = generateUniversalLink(targetSubPath, targetQueryParams);
      
      if (!link) {
        throw new Error('Unable to generate Universal Link');
      }
      
      await navigator.clipboard.writeText(link);
      console.log('✅ Universal Link copied to clipboard:', link);
      
      return link;
      
    } catch (error) {
      console.error('❌ Failed to copy Universal Link:', error);
      throw error;
    }
  }, [generateUniversalLink]);

  // Initialize app info on mount
  useEffect(() => {
    getCurrentAppInfo();
  }, [getCurrentAppInfo]);

  return {
    appId,
    appSlug,
    subPath: subPath(),
    queryParams: queryParams(),
    universalLink,
    isUniversalLink: isUniversalLink(),
    navigateToSubPath,
    generateUniversalLink,
    copyUniversalLink,
  };
}

// Hook to handle specific Universal Link scenarios
export function useUniversalLinkNavigation() {
  const universalLinks = useUniversalLinks();

  // Navigate to specific game sections
  const navigateToGameSection = useCallback((section: string, params?: Record<string, string>) => {
    universalLinks.navigateToSubPath(`game/${section}`, params);
  }, [universalLinks]);

  // Navigate to leaderboard
  const navigateToLeaderboard = useCallback((sortBy?: string) => {
    const params = sortBy ? { sort: sortBy } : undefined;
    universalLinks.navigateToSubPath('leaderboard', params);
  }, [universalLinks]);

  // Navigate to achievements
  const navigateToAchievements = useCallback((achievementId?: string) => {
    const params = achievementId ? { achievement: achievementId } : undefined;
    universalLinks.navigateToSubPath('achievements', params);
  }, [universalLinks]);

  // Navigate to profile
  const navigateToProfile = useCallback((userId?: string) => {
    const params = userId ? { user: userId } : undefined;
    universalLinks.navigateToSubPath('profile', params);
  }, [universalLinks]);

  // Navigate to settings
  const navigateToSettings = useCallback((tab?: string) => {
    const params = tab ? { tab } : undefined;
    universalLinks.navigateToSubPath('settings', params);
  }, [universalLinks]);

  return {
    ...universalLinks,
    navigateToGameSection,
    navigateToLeaderboard,
    navigateToAchievements,
    navigateToProfile,
    navigateToSettings,
  };
}

// Hook to handle Universal Link sharing
export function useUniversalLinkSharing() {
  const universalLinks = useUniversalLinks();

  // Share current page as Universal Link
  const shareCurrentPage = useCallback(async () => {
    try {
      const link = universalLinks.generateUniversalLink(
        universalLinks.subPath || undefined,
        Object.keys(universalLinks.queryParams).length > 0 ? universalLinks.queryParams : undefined
      );
      
      if (!link) {
        throw new Error('Unable to generate Universal Link');
      }
      
      // Use Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: 'Defeat the Dragon',
          text: 'Check out this awesome focus game!',
          url: link,
        });
      } else {
        // Fallback to clipboard
        await universalLinks.copyUniversalLink(
          universalLinks.subPath || undefined,
          Object.keys(universalLinks.queryParams).length > 0 ? universalLinks.queryParams : undefined
        );
      }
      
      console.log('✅ Page shared successfully');
      
    } catch (error) {
      console.error('❌ Failed to share page:', error);
      throw error;
    }
  }, [universalLinks]);

  // Share specific game achievements
  const shareAchievement = useCallback(async (achievementId: string, achievementName: string) => {
    try {
      const link = universalLinks.generateUniversalLink('achievements', { achievement: achievementId });
      
      if (!link) {
        throw new Error('Unable to generate Universal Link');
      }
      
      if (navigator.share) {
        await navigator.share({
          title: 'Achievement Unlocked!',
          text: `I just unlocked the "${achievementName}" achievement in Defeat the Dragon!`,
          url: link,
        });
      } else {
        await universalLinks.copyUniversalLink('achievements', { achievement: achievementId });
      }
      
      console.log('✅ Achievement shared successfully');
      
    } catch (error) {
      console.error('❌ Failed to share achievement:', error);
      throw error;
    }
  }, [universalLinks]);

  // Share leaderboard position
  const shareLeaderboardPosition = useCallback(async (position: number, score: number) => {
    try {
      const link = universalLinks.generateUniversalLink('leaderboard', { sort: 'score' });
      
      if (!link) {
        throw new Error('Unable to generate Universal Link');
      }
      
      if (navigator.share) {
        await navigator.share({
          title: 'Leaderboard Position',
          text: `I'm ranked #${position} with ${score} points in Defeat the Dragon!`,
          url: link,
        });
      } else {
        await universalLinks.copyUniversalLink('leaderboard', { sort: 'score' });
      }
      
      console.log('✅ Leaderboard position shared successfully');
      
    } catch (error) {
      console.error('❌ Failed to share leaderboard position:', error);
      throw error;
    }
  }, [universalLinks]);

  return {
    shareCurrentPage,
    shareAchievement,
    shareLeaderboardPosition,
  };
}
