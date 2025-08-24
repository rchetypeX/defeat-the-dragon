'use client';

import { useComposeCast } from '@coinbase/onchainkit/minikit';

interface AchievementMomentsProps {
  className?: string;
}

export default function AchievementMoments({ className = '' }: AchievementMomentsProps) {
  const { composeCast } = useComposeCast();

  const shareQuizCompletion = () => {
    composeCast({
      text: "I'm a Ravenclaw! 🦅 What house are you?",
      embeds: [window.location.href]
    });
  };

  const shareNFTMint = () => {
    composeCast({
      text: "Just minted my first collectible! 🎨",
      embeds: [window.location.href, 'https://dtd.rchetype.xyz/nft/example.png'] as [string, string]
    });
  };

  const shareGameMilestone = () => {
    composeCast({
      text: "Finally beat level 50! This game is addictive 🎮",
      embeds: [window.location.href]
    });
  };

  return (
    <div className={`achievement-moments bg-white rounded-lg p-6 shadow-md ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Achievement Moments</h3>
      
      <div className="flex flex-col space-y-3">
        <button 
          onClick={shareQuizCompletion}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-left"
        >
          🦅 Share Quiz Result
        </button>
        
        <button 
          onClick={shareNFTMint}
          className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors text-left"
        >
          🎨 Share NFT Mint
        </button>
        
        <button 
          onClick={shareGameMilestone}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-left"
        >
          🎮 Share Game Milestone
        </button>
      </div>
    </div>
  );
}
