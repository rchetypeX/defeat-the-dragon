'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { 
  NotificationConfig, 
  setBaseAppNotificationCallback,
  initializeBaseAppNotifications,
  showNotification,
  showReEngagementNotification,
  showSessionCompleteNotification,
  showSessionFailedNotification,
  showSoftShieldWarningNotification,
  showSoftShieldBrokenNotification,
  showLevelUpNotification,
  showAchievementNotification,

  showBossDefeatedNotification,
  showDailyReminderNotification,
  showSocialAchievementNotification,
  showWeeklyChallengeNotification,
  getNotificationStats,
  clearNotificationRateLimits
} from '../lib/notifications';

interface UseBaseAppNotificationsOptions {
  enableReEngagement?: boolean;
  enableDailyReminders?: boolean;
  enableSocialNotifications?: boolean;
  maxNotificationsPerHour?: number;
  maxNotificationsPerDay?: number;
}

interface NotificationManager {
  // Core notification functions
  showNotification: (config: NotificationConfig) => Promise<boolean>;
  showReEngagement: (daysSinceLastSession: number, playerLevel: number) => Promise<boolean>;
  showSessionComplete: (xpGained: number, coinsGained: number, sparksGained?: number, levelUp?: boolean, newLevel?: number) => Promise<boolean>;
  showSessionFailed: (disturbedSeconds: number, sessionDuration: number) => Promise<boolean>;
  showSoftShieldWarning: (remainingTime: number) => Promise<boolean>;
  showSoftShieldBroken: (remainingTime: number) => Promise<boolean>;
  showLevelUp: (newLevel: number, unlockedFeatures?: string[]) => Promise<boolean>;
  showAchievement: (achievementName: string, achievementDescription: string, rarity?: 'common' | 'rare' | 'epic' | 'legendary') => Promise<boolean>;

  showBossDefeated: (bossName: string, rewards: { xp: number; coins: number; sparks?: number }) => Promise<boolean>;
  showDailyReminder: (lastSessionDate?: string) => Promise<boolean>;
  showSocialAchievement: (achievementType: 'first_share' | 'milestone_share' | 'community_challenge', details: string) => Promise<boolean>;
  showWeeklyChallenge: (challengeName: string, challengeDescription: string, reward: string) => Promise<boolean>;
  
  // Management functions
  getStats: () => Record<string, { hourly: number; daily: number }>;
  clearRateLimits: () => void;
  isBaseApp: boolean;
  isEnabled: boolean;
}

export function useBaseAppNotifications(options: UseBaseAppNotificationsOptions = {}): NotificationManager {
  const { 
    enableReEngagement = true,
    enableDailyReminders = true,
    enableSocialNotifications = true,
    maxNotificationsPerHour = 20,
    maxNotificationsPerDay = 100
  } = options;

  const { isFrameReady } = useMiniKit();
  const isBaseAppRef = useRef(false);
  const isEnabledRef = useRef(false);

  // Initialize Base App notifications
  useEffect(() => {
    // Initialize MiniKit hooks only on client side to prevent build errors
    let isFrameReady = false;
    
    if (typeof window !== 'undefined') {
      try {
        const { useMiniKit } = require('@coinbase/onchainkit/minikit');
        const { isFrameReady: miniKitIsFrameReady } = useMiniKit();
        isFrameReady = miniKitIsFrameReady;
      } catch (error) {
        console.warn('MiniKit not available during build:', error);
      }
    }
    
    initializeBaseAppNotifications();
    
    // Check if we're in Base App environment
    isBaseAppRef.current = typeof window !== 'undefined' && 
      (window.location.hostname.includes('base.org') || 
       window.navigator.userAgent.includes('BaseApp') ||
       window.location.search.includes('base_app=true'));

    // Set up Base App notification callback
    setBaseAppNotificationCallback((notification: NotificationConfig) => {
      if (isBaseAppRef.current && isFrameReady) {
        // Use Base App's native notification system
        console.log('🔔 Sending notification to Base App:', notification);
        
        // Here you would integrate with Base App's notification API
        // For now, we'll use the enhanced browser notifications
        return showNotification(notification);
      }
    });

    isEnabledRef.current = true;
  }, [isFrameReady]);

  // Set up daily reminder scheduling
  useEffect(() => {
    if (!enableDailyReminders || !isEnabledRef.current) return;

    const scheduleDailyReminder = () => {
      const now = new Date();
      const reminderTime = new Date(now);
      reminderTime.setHours(10, 0, 0, 0); // 10 AM daily

      if (now > reminderTime) {
        reminderTime.setDate(reminderTime.getDate() + 1);
      }

      const timeUntilReminder = reminderTime.getTime() - now.getTime();

      setTimeout(() => {
        showDailyReminderNotification();
        // Schedule next reminder
        scheduleDailyReminder();
      }, timeUntilReminder);
    };

    scheduleDailyReminder();
  }, [enableDailyReminders]);

  // Enhanced notification functions with Base App integration
  const enhancedShowNotification = useCallback(async (config: NotificationConfig): Promise<boolean> => {
    if (!isEnabledRef.current) return false;

    // Apply global rate limiting
    const stats = getNotificationStats();
    const totalHourly = Object.values(stats).reduce((sum, stat) => sum + stat.hourly, 0);
    const totalDaily = Object.values(stats).reduce((sum, stat) => sum + stat.daily, 0);

    if (totalHourly >= maxNotificationsPerHour || totalDaily >= maxNotificationsPerDay) {
      console.log('Global notification rate limit reached');
      return false;
    }

    return showNotification(config);
  }, [maxNotificationsPerHour, maxNotificationsPerDay]);

  const enhancedShowReEngagement = useCallback(async (
    daysSinceLastSession: number,
    playerLevel: number
  ): Promise<boolean> => {
    if (!enableReEngagement) return false;
    return showReEngagementNotification(daysSinceLastSession, playerLevel);
  }, [enableReEngagement]);

  const enhancedShowSessionComplete = useCallback(async (
    xpGained: number,
    coinsGained: number,
    sparksGained?: number,
    levelUp?: boolean,
    newLevel?: number
  ): Promise<boolean> => {
    return showSessionCompleteNotification(xpGained, coinsGained, sparksGained, levelUp, newLevel);
  }, []);

  const enhancedShowSessionFailed = useCallback(async (
    disturbedSeconds: number,
    sessionDuration: number
  ): Promise<boolean> => {
    return showSessionFailedNotification(disturbedSeconds, sessionDuration);
  }, []);

  const enhancedShowSoftShieldWarning = useCallback(async (remainingTime: number): Promise<boolean> => {
    return showSoftShieldWarningNotification(remainingTime);
  }, []);

  const enhancedShowSoftShieldBroken = useCallback(async (remainingTime: number): Promise<boolean> => {
    return showSoftShieldBrokenNotification(remainingTime);
  }, []);

  const enhancedShowLevelUp = useCallback(async (
    newLevel: number,
    unlockedFeatures?: string[]
  ): Promise<boolean> => {
    return showLevelUpNotification(newLevel, unlockedFeatures);
  }, []);

  const enhancedShowAchievement = useCallback(async (
    achievementName: string,
    achievementDescription: string,
    rarity?: 'common' | 'rare' | 'epic' | 'legendary'
  ): Promise<boolean> => {
    return showAchievementNotification(achievementName, achievementDescription, rarity);
  }, []);



  const enhancedShowBossDefeated = useCallback(async (
    bossName: string,
    rewards: { xp: number; coins: number; sparks?: number }
  ): Promise<boolean> => {
    return showBossDefeatedNotification(bossName, rewards);
  }, []);

  const enhancedShowDailyReminder = useCallback(async (
    lastSessionDate?: string
  ): Promise<boolean> => {
    if (!enableDailyReminders) return false;
    return showDailyReminderNotification(lastSessionDate);
  }, [enableDailyReminders]);

  const enhancedShowSocialAchievement = useCallback(async (
    achievementType: 'first_share' | 'milestone_share' | 'community_challenge',
    details: string
  ): Promise<boolean> => {
    if (!enableSocialNotifications) return false;
    return showSocialAchievementNotification(achievementType, details);
  }, [enableSocialNotifications]);

  const enhancedShowWeeklyChallenge = useCallback(async (
    challengeName: string,
    challengeDescription: string,
    reward: string
  ): Promise<boolean> => {
    return showWeeklyChallengeNotification(challengeName, challengeDescription, reward);
  }, []);

  return {
    showNotification: enhancedShowNotification,
    showReEngagement: enhancedShowReEngagement,
    showSessionComplete: enhancedShowSessionComplete,
    showSessionFailed: enhancedShowSessionFailed,
    showSoftShieldWarning: enhancedShowSoftShieldWarning,
    showSoftShieldBroken: enhancedShowSoftShieldBroken,
    showLevelUp: enhancedShowLevelUp,
    showAchievement: enhancedShowAchievement,

    showBossDefeated: enhancedShowBossDefeated,
    showDailyReminder: enhancedShowDailyReminder,
    showSocialAchievement: enhancedShowSocialAchievement,
    showWeeklyChallenge: enhancedShowWeeklyChallenge,
    getStats: getNotificationStats,
    clearRateLimits: clearNotificationRateLimits,
    isBaseApp: isBaseAppRef.current,
    isEnabled: isEnabledRef.current
  };
}
