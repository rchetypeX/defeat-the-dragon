'use client';

import { useState } from 'react';
import { useCharacterStore } from '../../lib/characterStore';

interface SuccessMessageProps {
  xpGained: number;
  coinsGained: number;
  sparksGained: number;
  levelUp: boolean;
  newLevel: number;
  onDismiss?: () => void;
  onKeepFocusing?: () => void;
  onGoHome?: () => void;
}

export function SuccessMessage({ 
  xpGained, 
  coinsGained, 
  sparksGained, 
  levelUp, 
  newLevel, 
  onDismiss,
  onKeepFocusing,
  onGoHome
}: SuccessMessageProps) {
  const [isVisible, setIsVisible] = useState(true);
  const { equippedCharacter, getCharacterImage } = useCharacterStore();

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
    <>
      {/* Full Screen Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        {/* Large Character in Center - Much bigger like reference image */}
        <div className="absolute left-1/2 transform -translate-x-1/2 bottom-1/3 z-10">
          <img 
            src={getCharacterImage(equippedCharacter)} 
            alt="Tiny Adventurer" 
            className="w-96 h-[28rem] sm:w-[32rem] sm:h-[36rem] lg:w-[40rem] lg:h-[44rem] pixel-art drop-shadow-lg"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        {/* Session Complete Popup */}
        <div className="pixel-card p-6 sm:p-8 border-2 border-[#8B4513] bg-[#f5f5dc] max-w-md w-full mx-4 relative z-20">
          {/* Title */}
          <div className="text-center mb-6">
            <div className="text-[#8B4513] text-xl sm:text-2xl font-bold mb-2">
              🎉 Session Complete! 🎉
            </div>
          </div>
          
          {/* Rewards */}
          <div className="space-y-4">
            {levelUp && (
              <div className="text-[#f2751a] font-bold text-center py-2">
                🚀 LEVEL UP! You are now Level {newLevel}!
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="pixel-card p-3 bg-[#f5f5dc] border-2 border-[#8B4513] flex flex-col items-center justify-center">
                <div className="text-[#8B4513] text-sm mb-1 font-bold">XP</div>
                <div className="text-[#654321] font-bold text-lg">+{xpGained}</div>
              </div>
              <div className="pixel-card p-3 bg-[#f5f5dc] border-2 border-[#8B4513] flex flex-col items-center justify-center">
                <div className="text-[#8B4513] text-sm mb-1 font-bold">Coins</div>
                <div className="text-[#654321] font-bold text-lg">+{coinsGained}</div>
              </div>
            </div>
            
            {/* Sparks reward - only show if gained */}
            {sparksGained > 0 && (
              <div className="grid grid-cols-1 gap-3 text-center">
                <div className="pixel-card p-3 bg-[#f5f5dc] border-2 border-[#8B4513] flex flex-col items-center justify-center">
                  <div className="text-[#8B4513] text-sm mb-1 font-bold">✨ Sparks</div>
                  <div className="text-[#654321] font-bold text-lg">+{sparksGained}</div>
                </div>
              </div>
            )}
            
            {/* Keep Focusing Prompt */}
            <div className="text-center mt-6">
              <div className="text-[#8B4513] text-lg font-bold mb-4">
                Keep Focusing?
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={onKeepFocusing}
                  className="pixel-button bg-[#8B4513] hover:bg-[#654321] text-white px-8 py-2 text-sm flex-1 max-w-[100px] flex items-center justify-center"
                >
                  Yes
                </button>
                <button
                  onClick={onGoHome}
                  className="pixel-button bg-[#8B4513] hover:bg-[#654321] text-white px-8 py-2 text-sm flex-1 max-w-[100px] flex items-center justify-center"
                >
                  No
                </button>
              </div>
             </div>
          </div>
        </div>
      </div>
    </>
  );
}
