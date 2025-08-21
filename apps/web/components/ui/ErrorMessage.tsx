'use client';

import { useState } from 'react';

interface ErrorMessageProps {
  error: string | null;
  onDismiss?: () => void;
}

export function ErrorMessage({ error, onDismiss }: ErrorMessageProps) {
  if (!error) return null;

  return (
    <div className="pixel-card p-4 mb-4 border-2 border-[#ef4444]">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-[#ef4444] mr-2">⚠️</span>
          <span className="text-white text-sm">{error}</span>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-[#ef4444] hover:text-[#fca5a5] text-sm"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
