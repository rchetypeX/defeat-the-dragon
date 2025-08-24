'use client';

import { useMiniKit, useComposeCast } from '@coinbase/onchainkit/minikit';

interface Achievement {
  category: string;
  type: string;
  streak: number;
}

interface PersonalizedShareProps {
  achievement: Achievement;
  className?: string;
}

export default function PersonalizedShare({ 
  achievement, 
  className = '' 
}: PersonalizedShareProps) {
  const { context } = useMiniKit();
  const { composeCast } = useComposeCast();
  
  const sharePersonalized = (achievement: Achievement) => {
    const isNewUser = !context?.client?.added;
    
    const text = isNewUser 
      ? `Just discovered this amazing ${achievement.category} app! 🚀`
      : `Another ${achievement.type} completed! ${achievement.streak} day streak 🔥`;
      
    composeCast({
      text,
      embeds: [window.location.href]
    });
  };

  return (
    <button 
      onClick={() => sharePersonalized(achievement)}
      className={`px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-colors font-semibold ${className}`}
    >
      Share Progress
    </button>
  );
}
