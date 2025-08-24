'use client';

import { useAddFrame } from '@coinbase/onchainkit/minikit';
import { useEffect, useState } from 'react';

interface GameCompletionProps {
  onGameWin?: () => void;
  className?: string;
}

export default function GameCompletion({ 
  onGameWin,
  className = '' 
}: GameCompletionProps) {
  const addFrame = useAddFrame();
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  
  // Show save prompt after user achieves something
  const handleGameWin = () => {
    setShowSavePrompt(true);
    onGameWin?.();
  };

  const handleSave = async () => {
    try {
      const result = await addFrame();
      if (result) {
        // User saved after achievement - high engagement signal
        console.log('Post-achievement save analytics:', {
          achievement: 'game_completed',
          token: result.token
        });
        
        // Send analytics
        await fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'post_achievement_save',
            achievement: 'game_completed',
            token: result.token
          })
        });
      }
      setShowSavePrompt(false);
    } catch (error) {
      console.error('Failed to save after achievement:', error);
    }
  };

  const handleDismiss = () => {
    setShowSavePrompt(false);
  };

  return (
    <div className={className}>
      {/* Trigger button for demo purposes */}
      <button 
        onClick={handleGameWin}
        className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
      >
        Complete Game (Demo)
      </button>
      
      {showSavePrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">🎉 Congratulations!</h3>
              <p className="text-gray-600 mb-6">Save this game to play again anytime</p>
              
              <div className="flex flex-col space-y-3">
                <button 
                  onClick={handleSave}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-colors font-semibold"
                >
                  Save Game
                </button>
                <button 
                  onClick={handleDismiss}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
