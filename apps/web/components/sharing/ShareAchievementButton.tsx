'use client';

import { useShareAchievement } from '../../hooks/useShareAchievement';
import { useState } from 'react';

interface ShareAchievementButtonProps {
  type: 'level_up' | 'session_complete' | 'boss_defeated' | 'milestone' | 'streak';
  level?: number;
  xpGained?: number;
  coinsGained?: number;
  sparksGained?: number;
  streakDays?: number;
  sessionDuration?: number;
  bossName?: string;
  className?: string;
  showConfirmation?: boolean;
  customMessage?: string;
}

export function ShareAchievementButton({
  type,
  level,
  xpGained,
  coinsGained,
  sparksGained,
  streakDays,
  sessionDuration,
  bossName,
  className = '',
  showConfirmation = true,
  customMessage,
}: ShareAchievementButtonProps) {
  const {
    shareLevelUp,
    shareSessionComplete,
    shareBossDefeated,
    shareMilestone,
    shareStreak,
  } = useShareAchievement();

  const [isSharing, setIsSharing] = useState(false);
  const [hasShared, setHasShared] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    
    try {
      let success = false;
      
      switch (type) {
        case 'level_up':
          success = await shareLevelUp(level || 1, { customMessage });
          break;
        
        case 'session_complete':
          success = await shareSessionComplete(
            sessionDuration || 0,
            xpGained || 0,
            coinsGained || 0,
            sparksGained || 0,
            { customMessage }
          );
          break;
        
        case 'boss_defeated':
          success = await shareBossDefeated(bossName || 'the Dragon', { customMessage });
          break;
        
        case 'milestone':
          success = await shareMilestone({ customMessage });
          break;
        
        case 'streak':
          success = await shareStreak(streakDays || 1, { customMessage });
          break;
      }
      
      if (success) {
        setHasShared(true);
        if (showConfirmation) {
          // Show success feedback
          console.log('✅ Achievement shared successfully!');
        }
      }
    } catch (error) {
      console.error('❌ Failed to share achievement:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const getButtonText = () => {
    if (hasShared) return 'Shared! 🎉';
    if (isSharing) return 'Sharing...';
    
    switch (type) {
      case 'level_up':
        return 'Share Level Up! 🎉';
      case 'session_complete':
        return 'Share Session! ✅';
      case 'boss_defeated':
        return 'Share Victory! ⚔️';
      case 'milestone':
        return 'Share Milestone! 🏆';
      case 'streak':
        return 'Share Streak! 🔥';
      default:
        return 'Share Achievement! 🎮';
    }
  };

  const getButtonEmoji = () => {
    switch (type) {
      case 'level_up':
        return '🎉';
      case 'session_complete':
        return '✅';
      case 'boss_defeated':
        return '⚔️';
      case 'milestone':
        return '🏆';
      case 'streak':
        return '🔥';
      default:
        return '🎮';
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={isSharing || hasShared}
      className={`
        px-4 py-2 rounded-lg font-bold text-white transition-all duration-200
        ${hasShared 
          ? 'bg-green-600 cursor-not-allowed' 
          : isSharing 
            ? 'bg-gray-600 cursor-not-allowed' 
            : 'bg-gradient-to-r from-[#f2751a] to-[#e65a0a] hover:from-[#e65a0a] hover:to-[#d1450a] active:scale-95'
        }
        ${className}
      `}
    >
      <span className="flex items-center gap-2">
        <span className="text-lg">{getButtonEmoji()}</span>
        <span>{getButtonText()}</span>
      </span>
    </button>
  );
}
