'use client';

import { useComposeCast } from '@coinbase/onchainkit/minikit';

interface ViralGrowthMechanicsProps {
  userTime?: string;
  playerCount?: number;
  timeRemaining?: string;
  className?: string;
}

export default function ViralGrowthMechanics({ 
  userTime = '2:34',
  playerCount = 50000,
  timeRemaining = '2 hours',
  className = '' 
}: ViralGrowthMechanicsProps) {
  const { composeCast } = useComposeCast();

  const shareChallengePattern = () => {
    composeCast({
      text: `Beat my time of ${userTime} if you can! ⏱️`,
      embeds: [window.location.href]
    });
  };

  const shareSocialProofPattern = () => {
    composeCast({
      text: `Join ${playerCount.toLocaleString()}+ players already playing!`,
      embeds: [window.location.href]
    });
  };

  const shareFOMOPattern = () => {
    composeCast({
      text: `Limited edition drop ends in ${timeRemaining}! 🔥`,
      embeds: [window.location.href]
    });
  };

  return (
    <div className={`viral-growth-mechanics bg-white rounded-lg p-6 shadow-md ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Viral Growth Mechanics</h3>
      
      <div className="flex flex-col space-y-3">
        <button 
          onClick={shareChallengePattern}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-left"
        >
          ⏱️ Challenge Pattern
        </button>
        
        <button 
          onClick={shareSocialProofPattern}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-left"
        >
          👥 Social Proof Pattern
        </button>
        
        <button 
          onClick={shareFOMOPattern}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-left"
        >
          🔥 FOMO Pattern
        </button>
      </div>
    </div>
  );
}
