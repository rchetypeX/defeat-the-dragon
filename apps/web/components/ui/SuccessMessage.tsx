'use client';

import { useState } from 'react';

interface SuccessMessageProps {
  xpGained: number;
  coinsGained: number;
  sparksGained: number;
  levelUp: boolean;
  newLevel: number;
  onDismiss?: () => void;
}

export function SuccessMessage({ 
  xpGained, 
  coinsGained, 
  sparksGained, 
  levelUp, 
  newLevel, 
  onDismiss 
}: SuccessMessageProps) {
  const [isVisible, setIsVisible] = useState(true);

  console.log('SuccessMessage: Rendering with props:', {
    xpGained,
    coinsGained,
    sparksGained,
    levelUp,
    newLevel,
    isVisible
  });

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <div className="pixel-card p-4 mb-4 border-2 border-[#10b981] bg-[#064e3b]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <span className="text-[#10b981] mr-2 text-xl">🎉</span>
          <span className="text-white text-lg font-bold">Session Complete!</span>
        </div>
        {onDismiss && (
          <button
            onClick={handleDismiss}
            className="text-[#10b981] hover:text-[#34d399] text-sm"
          >
            ✕
          </button>
        )}
      </div>
      
      <div className="space-y-2">
        {levelUp && (
          <div className="text-[#fbbf24] font-bold text-center py-2">
            🚀 LEVEL UP! You are now Level {newLevel}!
          </div>
        )}
        
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="pixel-card p-2 bg-[#1f2937]">
            <div className="text-[#fbbf24] text-sm">XP Gained</div>
            <div className="text-white font-bold">+{xpGained}</div>
          </div>
          <div className="pixel-card p-2 bg-[#1f2937]">
            <div className="text-[#fbbf24] text-sm">Coins</div>
            <div className="text-white font-bold">+{coinsGained}</div>
          </div>
          {sparksGained > 0 && (
            <div className="pixel-card p-2 bg-[#1f2937]">
              <div className="text-[#fbbf24] text-sm">Sparks</div>
              <div className="text-white font-bold">+{sparksGained}</div>
            </div>
          )}
        </div>
        
        <div className="text-center text-[#d1d5db] text-sm mt-3">
          Great job! Your tiny adventurer grows stronger! ⚔️
        </div>
      </div>
    </div>
  );
}
