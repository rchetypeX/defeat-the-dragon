'use client';

import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../../lib/store';
import { actionForMinutes, actionMetadata, getValidDurations, isValidDuration } from '@defeat-the-dragon/engine';
import { Action } from '@defeat-the-dragon/engine';
import { testApi } from '../../lib/api';

interface SessionTimerProps {
  onSessionStart: (action: Action, durationMinutes: number) => void;
  onSessionCancel: () => void;
}

export function SessionTimer({ onSessionStart, onSessionCancel }: SessionTimerProps) {
  const [minutes, setMinutes] = useState(25);
  const [isStarting, setIsStarting] = useState(false);
  const currentAction = actionForMinutes(minutes);
  const actionInfo = actionMetadata[currentAction];
  const validDurations = getValidDurations();

  const handleDurationChange = useCallback((newMinutes: number) => {
    if (isValidDuration(newMinutes)) {
      setMinutes(newMinutes);
    }
  }, []);

  const handleStartSession = async () => {
    setIsStarting(true);
    try {
      console.log('SessionTimer: Starting session with:', { currentAction, minutes });
      await onSessionStart(currentAction, minutes);
      console.log('SessionTimer: Session started successfully');
      // Don't reset isStarting here - let the parent component handle it
    } catch (error) {
      console.error('SessionTimer: Failed to start session:', error);
      setIsStarting(false);
    }
  };

  const handleTestApi = async () => {
    try {
      console.log('SessionTimer: Testing API...');
      const result = await testApi();
      console.log('SessionTimer: API test result:', result);
    } catch (error) {
      console.error('SessionTimer: API test failed:', error);
    }
  };

  return (
    <div className="pixel-card p-4 max-w-sm mx-auto">
      <h2 className="text-lg font-bold text-center mb-4 text-[#f2751a]">
        Start Your Focus Session
      </h2>

      {/* Duration Picker */}
      <div className="mb-4">
        <label className="block text-xs font-medium mb-2 text-[#fbbf24]">
          Session Duration
        </label>
        <div className="grid grid-cols-3 gap-1">
          {validDurations.map((duration) => (
            <button
              key={duration}
              onClick={() => handleDurationChange(duration)}
              className={`pixel-button text-xs py-1 px-2 ${
                minutes === duration
                  ? 'bg-[#f2751a] text-white'
                  : 'bg-[#8B4513] text-[#fbbf24] hover:bg-[#f2751a] hover:text-white'
              }`}
            >
              {duration}m
            </button>
          ))}
        </div>
      </div>

      {/* Action Display */}
      <div className="mb-4 text-center">
        <div className="pixel-card p-3 mb-3">
          <div className="text-3xl mb-1">{actionInfo.emoji}</div>
          <h3 className="text-base font-bold text-[#f2751a] mb-1">
            {actionInfo.label}
          </h3>
          <p className="text-xs text-[#fbbf24]">
            {actionInfo.description}
          </p>
        </div>
        
        {/* Background Preview */}
        <div className="text-xs text-[#fbbf24] mb-3">
          Background: {actionInfo.background.replace('_', ' ')}
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
          {isStarting ? 'Starting...' : `Start • ${minutes}m`}
        </button>
      </div>

      {/* Test Button */}
      <div className="mt-2">
        <button
          onClick={handleTestApi}
          className="w-full pixel-button bg-[#6b7280] hover:bg-[#4b5563] text-xs py-1"
        >
          Test API
        </button>
      </div>

      {/* Action Chip */}
      <div className="mt-3 text-center">
        <span className="inline-block pixel-card px-2 py-1 text-xs">
          {actionInfo.emoji} {actionInfo.label}
        </span>
      </div>
    </div>
  );
}
