'use client';

import { useState } from 'react';
import { useAudio } from '../../contexts/AudioContext';

interface FocusSessionAudioControlsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FocusSessionAudioControls: React.FC<FocusSessionAudioControlsProps> = ({
  isOpen,
  onClose
}) => {
  const {
    focusSessionVolume,
    setFocusSessionVolume,
    isFocusSessionPlaying,
    toggleFocusSessionPlayPause
  } = useAudio();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a2e] border-2 border-[#f2751a] rounded-lg p-4 max-w-xs w-full pixel-card">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[#f2751a] font-bold text-sm">🎵 Focus Session Audio</h3>
          <button
            onClick={onClose}
            className="text-[#fbbf24] hover:text-white transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* Play/Pause Button */}
        <div className="flex justify-center mb-3">
          <button
            onClick={() => {
              console.log('FocusSessionAudioControls: Play/pause clicked, current state:', isFocusSessionPlaying);
              toggleFocusSessionPlayPause();
            }}
            className="px-4 py-2 bg-[#f2751a] hover:bg-[#e65a0a] transition-colors rounded text-white text-sm font-bold"
          >
            {isFocusSessionPlaying ? '⏸️ Pause Music' : '▶️ Play Music'}
          </button>
        </div>

        {/* Volume Control */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[#fbbf24] text-xs">🔊 Volume</span>
            <span className="text-[#fbbf24] text-xs min-w-[2rem]">
              {Math.round(focusSessionVolume * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={focusSessionVolume}
            onChange={(e) => setFocusSessionVolume(parseFloat(e.target.value))}
            className="w-full h-2 bg-[#2a2a3e] rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Info */}
        <div className="text-center text-[#fbbf24] text-xs">
          <p>Music will play during your focus session</p>
        </div>
      </div>
    </div>
  );
};

export default FocusSessionAudioControls;
