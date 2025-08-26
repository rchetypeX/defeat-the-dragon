'use client';

import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../../lib/store';
import { actionForMinutes, actionMetadata, getValidDurations, isValidDuration } from '@defeat-the-dragon/engine';
import { Action } from '@defeat-the-dragon/engine';

interface SessionTimerProps {
  onSessionStart: (action: Action, durationMinutes: number) => void;
  onSessionCancel: () => void;
}

export function SessionTimer({ onSessionStart, onSessionCancel }: SessionTimerProps) {
  const [minutes, setMinutes] = useState(5); // Default to 5 minutes
  const [isStarting, setIsStarting] = useState(false);
  const currentAction = actionForMinutes(minutes);
  const actionInfo = actionMetadata[currentAction];
  const validDurations = getValidDurations();

  const handleDurationChange = useCallback((newMinutes: number) => {
    if (isValidDuration(newMinutes)) {
      setMinutes(newMinutes);
    }
  }, []);

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    handleDurationChange(value);
  };

  const handleStartSession = async () => {
    setIsStarting(true);
    try {
      console.log('SessionTimer: Starting session with:', { currentAction, minutes });
      await onSessionStart(currentAction, minutes);
      console.log('SessionTimer: Session started successfully');
      // Reset isStarting when session starts successfully
      setIsStarting(false);
    } catch (error) {
      console.error('SessionTimer: Failed to start session:', error);
      setIsStarting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="pixel-card p-4 w-80 mx-auto">
        <h2 className="text-lg font-bold text-center mb-4 text-[#f2751a]">
          Start Your Focus Session
        </h2>

        {/* Duration Slider */}
        <div className="mb-4">
          <label className="block text-sm font-bold mb-2 text-[#f2751a]">
            Duration: <span className="text-lg">{minutes} minutes</span>
          </label>
          <div className="relative">
            <input
              type="range"
              min="5"
              max="120"
              step="5"
              value={minutes}
              onChange={handleSliderChange}
              className="w-full h-2 bg-[#8B4513] rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #f2751a 0%, #f2751a ${((minutes - 5) / (120 - 5)) * 100}%, #8B4513 ${((minutes - 5) / (120 - 5)) * 100}%, #8B4513 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-[#fbbf24] mt-1">
              <span>5m</span>
              <span>60m</span>
              <span>120m</span>
            </div>
          </div>
        </div>

        {/* Action Display */}
        <div className="mb-4 text-center">
          <div className="pixel-card p-3">
            <div className="text-3xl mb-1">{actionInfo.emoji}</div>
            <h3 className="text-base font-bold text-[#f2751a] mb-1">
              {actionInfo.label}
            </h3>
            <p className="text-xs text-[#fbbf24]">
              {actionInfo.description}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={onSessionCancel}
            className="flex-1 pixel-button bg-[#8B4513] hover:bg-[#654321] text-xs py-2"
          >
            Cancel
          </button>
          <button
            onClick={handleStartSession}
            disabled={isStarting}
            className="flex-1 pixel-button disabled:opacity-50 text-xs py-2"
          >
            {isStarting ? 'Starting' : 'Start'}
          </button>
        </div>
      </div>
    </div>
  );
}
