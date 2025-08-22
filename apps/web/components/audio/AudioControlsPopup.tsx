'use client';

import { useState, useEffect, useRef } from 'react';

interface AudioControlsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  backgroundVolume: number;
  onBackgroundVolumeChange: (volume: number) => void;
  isBackgroundPlaying: boolean;
  onBackgroundPlayPause: () => void;
  isSessionActive: boolean;
}

export const AudioControlsPopup: React.FC<AudioControlsPopupProps> = ({
  isOpen,
  onClose,
  backgroundVolume,
  onBackgroundVolumeChange,
  isBackgroundPlaying,
  onBackgroundPlayPause,
  isSessionActive
}) => {
  const popupRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close popup when pressing Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        ref={popupRef}
        className="bg-[#1a1a2e] border-2 border-[#f2751a] rounded-lg p-6 max-w-sm w-full pixel-card"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[#f2751a] font-bold text-lg">🎵 Audio Controls</h2>
          <button
            onClick={onClose}
            className="text-[#fbbf24] hover:text-white transition-colors text-xl"
          >
            ✕
          </button>
        </div>

        {/* Background Music Controls */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[#fbbf24] font-semibold">Background Music</h3>
            <button
              onClick={() => {
                console.log('AudioControlsPopup: Background play/pause clicked, current state:', isBackgroundPlaying);
                onBackgroundPlayPause();
              }}
              className="px-3 py-1 bg-[#f2751a] hover:bg-[#e65a0a] transition-colors rounded text-white text-sm"
            >
              {isBackgroundPlaying ? '⏸️ Pause' : '▶️ Play'}
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-[#fbbf24] text-sm">🔊</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={backgroundVolume}
              onChange={(e) => onBackgroundVolumeChange(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-[#2a2a3e] rounded-lg appearance-none cursor-pointer slider"
            />
            <span className="text-[#fbbf24] text-sm min-w-[3rem]">
              {Math.round(backgroundVolume * 100)}%
            </span>
          </div>
          
          {isSessionActive && (
            <p className="text-gray-400 text-xs mt-2">
              Background music is paused during active focus sessions
            </p>
          )}
        </div>

        

        {/* Footer */}
        <div className="text-center text-[#fbbf24] text-sm">
          <p>Audio controls are saved automatically</p>
        </div>
      </div>
    </div>
  );
};

export default AudioControlsPopup;
