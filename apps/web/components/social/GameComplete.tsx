'use client';

import { useComposeCast } from '@coinbase/onchainkit/minikit';

interface GameCompleteProps {
  score: number;
  level: number;
  achievementId?: string;
  className?: string;
}

export default function GameComplete({ 
  score, 
  level, 
  achievementId,
  className = '' 
}: GameCompleteProps) {
  const { composeCast } = useComposeCast();

  const shareAchievement = () => {
    const embeds: [string] | [string, string] = achievementId 
      ? [window.location.href, `https://dtd.rchetype.xyz/achievements/${achievementId}`]
      : [window.location.href];

    composeCast({
      text: `🎉 Just hit level ${level} with ${score} points!`,
      embeds: embeds
    });
  };

  const shareGameInvite = () => {
    composeCast({
      text: 'Want to challenge me? Try to beat my high score! 🏆',
      embeds: [window.location.href]
    });
  };

  return (
    <div className={`achievement-share bg-white rounded-lg p-6 shadow-md ${className}`}>
      <h2 className="text-2xl font-bold text-center mb-2">Congratulations! 🎉</h2>
      <p className="text-center text-gray-600 mb-6">Level {level} completed with {score} points</p>
      
      <div className="share-options flex flex-col space-y-3">
        <button 
          onClick={shareAchievement}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors font-semibold"
        >
          Share Achievement
        </button>
        <button 
          onClick={shareGameInvite}
          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-colors font-semibold"
        >
          Challenge Friends
        </button>
      </div>
    </div>
  );
}
