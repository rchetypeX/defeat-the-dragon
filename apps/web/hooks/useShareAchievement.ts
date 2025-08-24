'use client';

import { useComposeCast } from '@coinbase/onchainkit/minikit';
import { useCallback } from 'react';

interface AchievementShareData {
  type: 'level_up' | 'session_complete' | 'boss_defeated' | 'milestone' | 'streak';
  level?: number;
  xpGained?: number;
  coinsGained?: number;
  sparksGained?: number;
  streakDays?: number;
  sessionDuration?: number;
  bossName?: string;
}

interface ShareOptions {
  includeEmbed?: boolean;
  customMessage?: string;
  hashtags?: string[];
}

export function useShareAchievement() {
  const { composeCast } = useComposeCast();

  const generateShareText = useCallback((achievement: AchievementShareData, options: ShareOptions = {}) => {
    const { customMessage, hashtags = ['#DefeatTheDragon', '#FocusRPG'] } = options;
    
    if (customMessage) {
      return `${customMessage} ${hashtags.join(' ')}`;
    }

    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://dtd.rchetype.xyz';
    
    switch (achievement.type) {
      case 'level_up':
        return `🎉 Just reached Level ${achievement.level} in Defeat the Dragon! Leveling up my focus game! 🐉⚡ ${hashtags.join(' ')}`;
      
      case 'session_complete':
        const duration = achievement.sessionDuration || 0;
        const xp = achievement.xpGained || 0;
        const coins = achievement.coinsGained || 0;
        const sparks = achievement.sparksGained || 0;
        
        let message = `✅ Completed a ${duration}-minute focus session!`;
        if (xp > 0) message += ` +${xp} XP`;
        if (coins > 0) message += ` +${coins} coins`;
        if (sparks > 0) message += ` +${sparks} sparks`;
        message += ` 🐉⚡ ${hashtags.join(' ')}`;
        return message;
      
      case 'boss_defeated':
        return `⚔️ Defeated ${achievement.bossName || 'the Dragon'}! My focus training is paying off! 🐉⚡ ${hashtags.join(' ')}`;
      
      case 'milestone':
        return `🏆 Reached a major milestone in my focus journey! Every session brings me closer to defeating the dragon! 🐉⚡ ${hashtags.join(' ')}`;
      
      case 'streak':
        return `🔥 ${achievement.streakDays} day focus streak! Consistency is the key to defeating the dragon! 🐉⚡ ${hashtags.join(' ')}`;
      
      default:
        return `🎮 Making progress in Defeat the Dragon! Transform focus into adventure! 🐉⚡ ${hashtags.join(' ')}`;
    }
  }, []);

  const shareAchievement = useCallback(async (
    achievement: AchievementShareData, 
    options: ShareOptions = {}
  ) => {
    try {
      const { includeEmbed = true } = options;
      const shareText = generateShareText(achievement, options);
      const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://dtd.rchetype.xyz';
      
      const castOptions: any = {
        text: shareText,
      };

      // Include embed for better discovery
      if (includeEmbed) {
        castOptions.embeds = [baseUrl];
      }

      await composeCast(castOptions);
      console.log('✅ Achievement shared successfully:', achievement.type);
      
      // Track sharing analytics
      console.log('📊 Achievement Share Analytics:', {
        type: achievement.type,
        timestamp: Date.now(),
        includeEmbed,
        customMessage: !!options.customMessage,
      });
      
      return true;
    } catch (error) {
      console.error('❌ Failed to share achievement:', error);
      return false;
    }
  }, [composeCast, generateShareText]);

  const shareLevelUp = useCallback((level: number, options?: ShareOptions) => {
    return shareAchievement({ type: 'level_up', level }, options);
  }, [shareAchievement]);

  const shareSessionComplete = useCallback((
    duration: number, 
    xpGained: number, 
    coinsGained: number, 
    sparksGained: number = 0,
    options?: ShareOptions
  ) => {
    return shareAchievement({
      type: 'session_complete',
      sessionDuration: duration,
      xpGained,
      coinsGained,
      sparksGained,
    }, options);
  }, [shareAchievement]);

  const shareBossDefeated = useCallback((bossName: string, options?: ShareOptions) => {
    return shareAchievement({ type: 'boss_defeated', bossName }, options);
  }, [shareAchievement]);

  const shareMilestone = useCallback((options?: ShareOptions) => {
    return shareAchievement({ type: 'milestone' }, options);
  }, [shareAchievement]);

  const shareStreak = useCallback((streakDays: number, options?: ShareOptions) => {
    return shareAchievement({ type: 'streak', streakDays }, options);
  }, [shareAchievement]);

  return {
    shareAchievement,
    shareLevelUp,
    shareSessionComplete,
    shareBossDefeated,
    shareMilestone,
    shareStreak,
    generateShareText,
  };
}
