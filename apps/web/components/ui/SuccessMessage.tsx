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
        {/* Session Complete Popup */}
        <div className="bg-white p-6 border-2 border-black max-w-md w-full mx-4">
          {/* Title */}
          <div className="text-center mb-6">
            <div className="text-black text-xl font-bold mb-2">
              🎉 Session Complete! 🎉
            </div>
          </div>
          
          {/* Rewards */}
          <div className="space-y-4">
            {levelUp && (
              <div className="text-orange-500 font-bold text-center py-2">
                🚀 LEVEL UP! You are now Level {newLevel}!
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-gray-100 border-2 border-black flex flex-col items-center justify-center">
                <div className="text-black text-sm mb-1 font-bold">XP</div>
                <div className="text-black font-bold text-lg">+{xpGained}</div>
              </div>
              <div className="p-3 bg-gray-100 border-2 border-black flex flex-col items-center justify-center">
                <div className="text-black text-sm mb-1 font-bold">Coins</div>
                <div className="text-black font-bold text-lg">+{coinsGained}</div>
              </div>
            </div>
            
            {/* Keep Focusing Prompt */}
            <div className="text-center mt-6">
              <div className="text-black text-lg font-bold mb-4">
                Keep Focusing?
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={onKeepFocusing}
                  className="bg-blue-500 hover:bg-blue-700 text-white px-8 py-2 text-sm"
                >
                  Yes
                </button>
                <button
                  onClick={onGoHome}
                  className="bg-gray-500 hover:bg-gray-700 text-white px-8 py-2 text-sm"
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
