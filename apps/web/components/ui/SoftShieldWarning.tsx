'use client';

import { useState, useEffect } from 'react';

interface SoftShieldWarningProps {
  remainingTime: number;
  onDismiss?: () => void;
}

export function SoftShieldWarning({ remainingTime, onDismiss }: SoftShieldWarningProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState(remainingTime);

  useEffect(() => {
    setTimeLeft(remainingTime);
    
    if (remainingTime <= 0) {
      setIsVisible(false);
      onDismiss?.();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          setIsVisible(false);
          onDismiss?.();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingTime, onDismiss]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="pixel-card p-6 max-w-sm w-full text-center bg-[#dc2626] border-4 border-[#991b1b]">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-white mb-2">Focus Interrupted!</h2>
        <p className="text-white mb-4">
          You've been away from the app for too long. Return to continue your focus session!
        </p>
        
        <div className="bg-[#991b1b] border-2 border-[#7f1d1d] p-3 mb-4">
          <div className="text-white text-sm mb-1">Time remaining before session fails:</div>
          <div className="text-2xl font-bold text-white">
            {timeLeft}s
          </div>
        </div>
        
        <div className="text-white text-sm">
          ⚡ Stay focused! Your tiny adventurer needs you!
        </div>
      </div>
    </div>
  );
}
