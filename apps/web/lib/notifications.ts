/**
 * Enhanced notification system for Defeat the Dragon
 * Integrates with Base App and provides smart re-engagement strategies
 */

import { useMiniKit } from '@coinbase/onchainkit/minikit';

// Notification types for different scenarios
export type NotificationType = 
  | 'session_complete'
  | 'session_failed'
  | 'soft_shield_warning'
  | 'level_up'
  | 'achievement_unlocked'

  | 'boss_defeated'
  | 'daily_reminder'
  | 'weekly_challenge'
  | 'social_achievement'
  | 're_engagement';

// Notification priority levels
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

// Notification configuration
export interface NotificationConfig {
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: NotificationAction[];
  data?: Record<string, any>;
  rateLimit?: {
    maxPerHour: number;
    maxPerDay: number;
  };
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

// Rate limiting storage
const notificationCounts: Record<string, { hourly: number; daily: number; lastReset: number }> = {};

// Base App notification integration
let isBaseApp = false;
let baseAppNotificationCallback: ((notification: NotificationConfig) => void) | null = null;

// Initialize Base App detection
export function initializeBaseAppNotifications() {
  try {
    // Check if we're in Base App environment
    isBaseApp = typeof window !== 'undefined' && 
      (window.location.hostname.includes('base.org') || 
       window.navigator.userAgent.includes('BaseApp'));
    
    if (isBaseApp) {
      console.log('🔔 Base App notifications enabled');
    }
  } catch (error) {
    console.warn('Could not detect Base App environment:', error);
  }
}

// Set Base App notification callback
export function setBaseAppNotificationCallback(callback: (notification: NotificationConfig) => void) {
  baseAppNotificationCallback = callback;
}

/**
 * Request notification permission with Base App integration
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.log('Notification permission denied');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

/**
 * Check if notification should be rate limited
 */
function checkRateLimit(type: NotificationType, config: NotificationConfig): boolean {
  if (!config.rateLimit) return true;

  const now = Date.now();
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;

  if (!notificationCounts[type]) {
    notificationCounts[type] = { hourly: 0, daily: 0, lastReset: now };
  }

  const counts = notificationCounts[type];

  // Reset counters if needed
  if (now - counts.lastReset > day) {
    counts.daily = 0;
    counts.hourly = 0;
    counts.lastReset = now;
  } else if (now - counts.lastReset > hour) {
    counts.hourly = 0;
  }

  // Check limits
  if (counts.hourly >= config.rateLimit.maxPerHour || 
      counts.daily >= config.rateLimit.maxPerDay) {
    return false;
  }

  // Increment counters
  counts.hourly++;
  counts.daily++;

  return true;
}

/**
 * Show notification with Base App integration
 */
export async function showNotification(config: NotificationConfig): Promise<boolean> {
  // Check rate limiting
  if (!checkRateLimit(config.type, config)) {
    console.log(`Notification rate limited: ${config.type}`);
    return false;
  }

  // Use Base App notifications if available
  if (isBaseApp && baseAppNotificationCallback) {
    try {
      baseAppNotificationCallback(config);
      return true;
    } catch (error) {
      console.warn('Base App notification failed, falling back to browser notifications:', error);
    }
  }

  // Fallback to browser notifications
  if (Notification.permission === 'granted') {
    const notificationOptions: NotificationOptions = {
      body: config.body,
      icon: config.icon || '/icon.png',
      badge: config.badge || '/icon.png',
      tag: config.tag || config.type,
      requireInteraction: config.requireInteraction || false,
      data: config.data,
    };

    // Add actions if supported (not all browsers support this)
    if (config.actions && 'actions' in Notification.prototype) {
      (notificationOptions as any).actions = config.actions;
    }

    const notification = new Notification(config.title, notificationOptions);

    // Handle notification clicks
    notification.onclick = () => {
      window.focus();
      notification.close();
      
      // Handle deep linking
      if (config.data?.deepLink) {
        window.location.href = config.data.deepLink;
      }
    };

    return true;
  }

  return false;
}

/**
 * Smart re-engagement notifications
 */
export async function showReEngagementNotification(
  daysSinceLastSession: number,
  playerLevel: number
): Promise<boolean> {
  let config: NotificationConfig;

  if (daysSinceLastSession >= 7) {
    config = {
      type: 're_engagement',
      priority: 'high',
      title: '🐉 Your Dragon Awaits!',
      body: `It's been ${daysSinceLastSession} days since your last focus session. Ready to continue your quest?`,
      icon: '/icon.png',
      tag: 're-engagement-week',
      rateLimit: { maxPerHour: 1, maxPerDay: 2 },
      data: { deepLink: '/?action=start' }
    };
  } else if (daysSinceLastSession >= 3) {
    config = {
      type: 're_engagement',
      priority: 'medium',
      title: '⚔️ Adventure Calls!',
      body: `Your focus journey continues! Level ${playerLevel} adventurer, are you ready for today's challenge?`,
      icon: '/icon.png',
      tag: 're-engagement-days',
      rateLimit: { maxPerHour: 1, maxPerDay: 1 },
      data: { deepLink: '/?action=start' }
    };
  } else {
    config = {
      type: 're_engagement',
      priority: 'low',
      title: '✨ Daily Focus Quest',
      body: `Ready for today's focus adventure? Every session brings you closer to defeating the dragon!`,
      icon: '/icon.png',
      tag: 're-engagement-daily',
      rateLimit: { maxPerHour: 1, maxPerDay: 1 },
      data: { deepLink: '/?action=start' }
    };
  }

  return showNotification(config);
}

/**
 * Session completion notification with enhanced details
 */
export function showSessionCompleteNotification(
  xpGained: number, 
  coinsGained: number, 
  sparksGained?: number,
  levelUp?: boolean,
  newLevel?: number
): Promise<boolean> {
  const config: NotificationConfig = {
    type: 'session_complete',
    priority: 'high',
    title: levelUp ? '🎉 LEVEL UP!' : '🎉 Session Complete!',
    body: levelUp 
      ? `Congratulations! You reached Level ${newLevel}! Gained ${xpGained} XP and ${coinsGained} coins.`
      : `Great focus! You gained ${xpGained} XP and ${coinsGained} coins${sparksGained ? `, plus ${sparksGained} sparks` : ''}.`,
    icon: '/icon.png',
    tag: 'session-complete',
    requireInteraction: false,
    rateLimit: { maxPerHour: 10, maxPerDay: 50 },
    data: { 
      deepLink: '/?action=summary',
      xpGained,
      coinsGained,
      sparksGained,
      levelUp,
      newLevel
    }
  };

  return showNotification(config);
}

/**
 * Session failed notification with encouragement
 */
export function showSessionFailedNotification(
  disturbedSeconds: number,
  sessionDuration: number
): Promise<boolean> {
  const config: NotificationConfig = {
    type: 'session_failed',
    priority: 'medium',
    title: "💪 Don't Give Up!",
    body: `Your ${sessionDuration}min session was interrupted. Every attempt makes you stronger!`,
    icon: '/icon.png',
    tag: 'session-failed',
    requireInteraction: false,
    rateLimit: { maxPerHour: 5, maxPerDay: 20 },
    data: { 
      deepLink: '/?action=retry',
      disturbedSeconds,
      sessionDuration
    }
  };

  return showNotification(config);
}

/**
 * Soft shield warning notification
 */
export function showSoftShieldWarningNotification(remainingTime: number): Promise<boolean> {
  const config: NotificationConfig = {
    type: 'soft_shield_warning',
    priority: 'urgent',
    title: '⚠️ Focus Interrupted!',
    body: `Return within ${remainingTime} seconds or your session will fail!`,
    icon: '/icon.png',
    tag: 'soft-shield-warning',
    requireInteraction: true,
    rateLimit: { maxPerHour: 20, maxPerDay: 100 },
    actions: [
      {
        action: 'return',
        title: 'Return Now',
        icon: '/icon.png'
      }
    ],
    data: { 
      deepLink: '/?action=session',
      remainingTime
    }
  };

  return showNotification(config);
}

/**
 * Level up notification
 */
export function showLevelUpNotification(
  newLevel: number, 
  unlockedFeatures?: string[]
): Promise<boolean> {
  const config: NotificationConfig = {
    type: 'level_up',
    priority: 'high',
    title: '🌟 LEVEL UP!',
    body: `Congratulations! You reached Level ${newLevel}!${unlockedFeatures ? ` Unlocked: ${unlockedFeatures.join(', ')}` : ''}`,
    icon: '/icon.png',
    tag: 'level-up',
    requireInteraction: false,
    rateLimit: { maxPerHour: 5, maxPerDay: 20 },
    data: { 
      deepLink: '/?action=levelup',
      newLevel,
      unlockedFeatures
    }
  };

  return showNotification(config);
}

/**
 * Achievement unlocked notification
 */
export function showAchievementNotification(
  achievementName: string,
  achievementDescription: string,
  rarity?: 'common' | 'rare' | 'epic' | 'legendary'
): Promise<boolean> {
  const rarityEmoji = {
    common: '🥉',
    rare: '🥈', 
    epic: '🥇',
    legendary: '💎'
  };

  const config: NotificationConfig = {
    type: 'achievement_unlocked',
    priority: 'high',
    title: `${rarityEmoji[rarity || 'common']} Achievement Unlocked!`,
    body: `${achievementName}: ${achievementDescription}`,
    icon: '/icon.png',
    tag: 'achievement',
    requireInteraction: false,
    rateLimit: { maxPerHour: 10, maxPerDay: 50 },
    data: { 
      deepLink: '/?action=achievements',
      achievementName,
      rarity
    }
  };

  return showNotification(config);
}



/**
 * Boss defeated notification
 */
export function showBossDefeatedNotification(
  bossName: string,
  rewards: { xp: number; coins: number; sparks?: number }
): Promise<boolean> {
  const config: NotificationConfig = {
    type: 'boss_defeated',
    priority: 'high',
    title: '⚔️ Boss Defeated!',
    body: `You defeated ${bossName}! Rewards: ${rewards.xp} XP, ${rewards.coins} coins${rewards.sparks ? `, ${rewards.sparks} sparks` : ''}`,
    icon: '/icon.png',
    tag: 'boss-defeated',
    requireInteraction: false,
    rateLimit: { maxPerHour: 5, maxPerDay: 20 },
    data: { 
      deepLink: '/?action=boss-rewards',
      bossName,
      rewards
    }
  };

  return showNotification(config);
}

/**
 * Daily reminder notification
 */
export function showDailyReminderNotification(
  lastSessionDate?: string
): Promise<boolean> {
  const today = new Date().toDateString();
  const hasSessionToday = lastSessionDate && lastSessionDate === today;

  const config: NotificationConfig = {
    type: 'daily_reminder',
    priority: hasSessionToday ? 'low' : 'medium',
    title: '🐉 Daily Focus Quest',
    body: "Ready for today's focus adventure? Every session brings you closer to defeating the dragon!",
    icon: '/icon.png',
    tag: 'daily-reminder',
    requireInteraction: false,
    rateLimit: { maxPerHour: 1, maxPerDay: 2 },
    data: { 
      deepLink: '/?action=start',
      hasSessionToday
    }
  };

  return showNotification(config);
}

/**
 * Social achievement notification
 */
export function showSocialAchievementNotification(
  achievementType: 'first_share' | 'milestone_share' | 'community_challenge',
  details: string
): Promise<boolean> {
  const config: NotificationConfig = {
    type: 'social_achievement',
    priority: 'medium',
    title: '🌟 Social Achievement!',
    body: details,
    icon: '/icon.png',
    tag: 'social-achievement',
    requireInteraction: false,
    rateLimit: { maxPerHour: 5, maxPerDay: 20 },
    data: { 
      deepLink: '/?action=social',
      achievementType
    }
  };

  return showNotification(config);
}

/**
 * Weekly challenge notification
 */
export function showWeeklyChallengeNotification(
  challengeName: string,
  challengeDescription: string,
  reward: string
): Promise<boolean> {
  const config: NotificationConfig = {
    type: 'weekly_challenge',
    priority: 'medium',
    title: '🎯 Weekly Challenge!',
    body: `${challengeName}: ${challengeDescription} Reward: ${reward}`,
    icon: '/icon.png',
    tag: 'weekly-challenge',
    requireInteraction: false,
    rateLimit: { maxPerHour: 1, maxPerDay: 3 },
    data: { 
      deepLink: '/?action=challenges',
      challengeName,
      reward
    }
  };

  return showNotification(config);
}

/**
 * Clear notification rate limits (for testing)
 */
export function clearNotificationRateLimits(): void {
  Object.keys(notificationCounts).forEach(key => {
    delete notificationCounts[key];
  });
}

/**
 * Get notification statistics
 */
export function getNotificationStats(): Record<string, { hourly: number; daily: number }> {
  const stats: Record<string, { hourly: number; daily: number }> = {};
  
  Object.entries(notificationCounts).forEach(([type, counts]) => {
    stats[type] = { hourly: counts.hourly, daily: counts.daily };
  });
  
  return stats;
}

// Initialize Base App detection on module load
if (typeof window !== 'undefined') {
  initializeBaseAppNotifications();
}
