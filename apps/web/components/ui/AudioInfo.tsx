'use client';

import { useAudio } from '../../contexts/AudioContext';
import { useState } from 'react';

export function AudioInfo() {
  const { hasUserInteracted, isBackgroundPlaying } = useAudio();
  const [isVisible, setIsVisible] = useState(true);

  // Don't show if user hasn't interacted or if audio is already playing
  if (!hasUserInteracted || isBackgroundPlaying || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4 z-50 bg-[#1a1a2e] border-2 border-[#654321] rounded-lg p-3 sm:p-4 text-center">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#fbbf24]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <span className="text-[#fbbf24] text-xs sm:text-sm">
            Click the sound button in the top-right to enable background music
          </span>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-[#fbbf24] hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
