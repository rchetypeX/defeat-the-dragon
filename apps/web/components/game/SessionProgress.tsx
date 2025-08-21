'use client';

import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../lib/store';
import { actionMetadata } from '@defeat-the-dragon/engine';
import { Action } from '@defeat-the-dragon/engine';
import { createSoftShield } from '../../lib/softShield';
import { SoftShieldWarning } from '../ui/SoftShieldWarning';
import { showSoftShieldWarningNotification } from '../../lib/notifications';

interface SessionProgressProps {
  onSessionComplete: () => void;
  onSessionFail: () => void;
}

export function SessionProgress({ onSessionComplete, onSessionFail }: SessionProgressProps) {
  const { currentSession, sessionProgress, updateSessionProgress } = useGameStore();
  const [timeLeft, setTimeLeft] = useState(0);
  const [isDisturbed, setIsDisturbed] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningTimeLeft, setWarningTimeLeft] = useState(0);
  const softShieldRef = useRef<any>(null);

  const actionInfo = currentSession ? actionMetadata[currentSession.action as Action] : null;

  // Debug logging
  console.log('SessionProgress render:', {
    currentSession: !!currentSession,
    sessionProgress: {
      isActive: sessionProgress.isActive,
      startTime: sessionProgress.startTime,
      durationMinutes: sessionProgress.durationMinutes,
      isDisturbed: sessionProgress.isDisturbed
    },
    timeLeft
  });

  // Initialize Soft Shield
  useEffect(() => {
    if (sessionProgress.isActive && !softShieldRef.current) {
      softShieldRef.current = createSoftShield(
        {
          maxAwayTime: 15, // 15 seconds
          warningTime: 10, // 10 seconds
        },
        {
          onDisturbance: (awayTime: number) => {
            console.log(`SoftShield: Disturbed for ${awayTime}s`);
            updateSessionProgress({
              isDisturbed: true,
              disturbedSeconds: sessionProgress.disturbedSeconds + awayTime
            });
          },
          onWarning: (remainingTime: number) => {
            console.log(`SoftShield: Warning - ${remainingTime}s remaining`);
            setShowWarning(true);
            setWarningTimeLeft(remainingTime);
            showSoftShieldWarningNotification(remainingTime);
          },
          onFail: (totalAwayTime: number) => {
            console.log(`SoftShield: Failed after ${totalAwayTime}s away`);
            onSessionFail();
          }
        }
      );
      
      softShieldRef.current.start();
    }

    return () => {
      if (softShieldRef.current) {
        softShieldRef.current.stop();
        softShieldRef.current = null;
      }
    };
  }, [sessionProgress.isActive, updateSessionProgress, sessionProgress.disturbedSeconds, onSessionFail]);

  useEffect(() => {
    if (!sessionProgress.isActive || !sessionProgress.startTime) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionProgress.startTime) / 1000);
      const remaining = sessionProgress.durationMinutes * 60 - elapsed;
      
      setTimeLeft(Math.max(0, remaining));
      setIsDisturbed(sessionProgress.isDisturbed);

      if (remaining <= 0) {
        clearInterval(interval);
        if (softShieldRef.current) {
          softShieldRef.current.stop();
        }
        console.log('SessionProgress: Timer reached zero, calling onSessionComplete');
        onSessionComplete();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionProgress.isActive, sessionProgress.startTime, sessionProgress.durationMinutes, sessionProgress.isDisturbed, onSessionComplete]);

  if (!currentSession || !actionInfo) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = ((sessionProgress.durationMinutes * 60 - timeLeft) / (sessionProgress.durationMinutes * 60)) * 100;

  return (
    <>
      {/* Soft Shield Warning */}
      {showWarning && (
        <SoftShieldWarning
          remainingTime={warningTimeLeft}
          onDismiss={() => setShowWarning(false)}
        />
      )}
      
      <div className="pixel-card p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="text-center mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-[#f2751a] mb-2">
          Current Session
        </h2>
        
        {/* Action Display */}
        <div className="pixel-card p-3 sm:p-4 mb-3 sm:mb-4 inline-block">
          <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{actionInfo.emoji}</div>
          <h3 className="text-base sm:text-lg font-bold text-[#f2751a]">
            {actionInfo.label}
          </h3>
          <p className="text-xs sm:text-sm text-[#fbbf24]">
            {actionInfo.description}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4 sm:mb-6">
        <div className="flex justify-between text-xs sm:text-sm text-[#fbbf24] mb-2">
          <span>Progress</span>
          <span>{formatTime(timeLeft)} remaining</span>
        </div>
        <div className="w-full bg-[#8B4513] border-2 border-[#654321] h-5 sm:h-6 relative">
          <div 
            className={`h-full transition-all duration-1000 ${
              isDisturbed ? 'bg-[#ef4444]' : 'bg-[#f2751a]'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
          {isDisturbed && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white text-xs font-bold">DISTURBED!</span>
            </div>
          )}
        </div>
        
        {/* Soft Shield Status */}
        <div className="flex items-center justify-center mt-2">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-[#10b981] rounded-full animate-pulse"></div>
            <span className="text-xs text-[#10b981]">Soft Shield Active</span>
          </div>
        </div>
      </div>

      {/* Session Info */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="pixel-card p-2 sm:p-3 text-center">
          <div className="text-xs sm:text-sm text-[#fbbf24]">Started</div>
          <div className="text-white text-xs sm:text-sm">
            {new Date(currentSession.started_at).toLocaleTimeString()}
          </div>
        </div>
        <div className="pixel-card p-2 sm:p-3 text-center">
          <div className="text-xs sm:text-sm text-[#fbbf24]">Duration</div>
          <div className="text-white text-xs sm:text-sm">
            {sessionProgress.durationMinutes} minutes
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2 sm:space-x-4">
        <button
          onClick={onSessionFail}
          className="flex-1 pixel-button bg-[#ef4444] hover:bg-[#dc2626] text-xs sm:text-sm py-2"
        >
          Fail Session
        </button>
        <button
          onClick={() => {
            console.log('SessionProgress: Manual complete button clicked');
            onSessionComplete();
          }}
          className="flex-1 pixel-button text-xs sm:text-sm py-2"
        >
          Complete Session
        </button>
        <button
          onClick={() => {
            console.log('Manual complete test');
            onSessionComplete();
          }}
          className="flex-1 pixel-button bg-[#10b981] hover:bg-[#059669] text-xs sm:text-sm py-2"
        >
          Test Complete
        </button>
      </div>

      {/* Background Info */}
      <div className="mt-3 sm:mt-4 text-center text-xs text-[#fbbf24]">
        Background: {actionInfo.background.replace('_', ' ')} • 
        Animation: {actionInfo.idleAnimation}
      </div>
    </div>
    </>
  );
}
