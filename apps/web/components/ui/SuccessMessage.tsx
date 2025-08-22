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
        {/* Large Character in Center */}
        <div className="absolute left-1/2 transform -translate-x-1/2 bottom-1/3 z-10">
          <img 
            src={getCharacterImage(equippedCharacter)} 
            alt="Tiny Adventurer" 
            className="w-32 h-40 sm:w-40 sm:h-48 pixel-art drop-shadow-lg"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        {/* Session Complete Popup */}
        <div className="pixel-card p-6 sm:p-8 border-2 border-[#10b981] bg-[#064e3b] max-w-md w-full mx-4 relative z-20">
          {/* Title */}
          <div className="text-center mb-6">
            <div className="text-white text-xl sm:text-2xl font-bold mb-2">
              🎉 Session Complete! 🎉
            </div>
          </div>
          
          {/* Rewards */}
          <div className="space-y-4">
            {levelUp && (
              <div className="text-[#fbbf24] font-bold text-center py-2">
                🚀 LEVEL UP! You are now Level {newLevel}!
              </div>
            )}
            
                         <div className="grid grid-cols-3 gap-3 text-center">
               <div className="pixel-card p-3 bg-[#1f2937] flex flex-col items-center justify-center">
                 <div className="text-[#fbbf24] text-sm mb-1">XP</div>
                 <div className="text-white font-bold text-lg">+{xpGained}</div>
               </div>
               <div className="pixel-card p-3 bg-[#1f2937] flex flex-col items-center justify-center">
                 <div className="text-[#fbbf24] text-sm mb-1">Coins</div>
                 <div className="text-white font-bold text-lg">+{coinsGained}</div>
               </div>
               {sparksGained > 0 && (
                 <div className="pixel-card p-3 bg-[#1f2937] flex flex-col items-center justify-center">
                   <div className="text-[#fbbf24] text-sm mb-1">Sparks</div>
                   <div className="text-white font-bold text-lg">+{sparksGained}</div>
                 </div>
               )}
             </div>
            
                         {/* Keep Focusing Prompt */}
             <div className="text-center mt-6">
               <div className="text-white text-lg font-bold mb-4">
                 Keep Focusing?
               </div>
                               <div className="flex gap-3 justify-center">
                  <button
                    onClick={onKeepFocusing}
                    className="pixel-button bg-[#10b981] hover:bg-[#059669] text-white px-8 py-2 text-sm flex-1 max-w-[100px] flex items-center justify-center"
                  >
                    Yes
                  </button>
                  <button
                    onClick={onGoHome}
                    className="pixel-button bg-[#6b7280] hover:bg-[#4b5563] text-white px-8 py-2 text-sm flex-1 max-w-[100px] flex items-center justify-center"
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
