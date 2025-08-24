'use client';

import { useContextAware } from '../../hooks/useContextAware';
import { ReactNode } from 'react';

interface EntryPointExperienceProps {
  children: ReactNode;
  className?: string;
}

export function EntryPointExperience({ children, className = '' }: EntryPointExperienceProps) {
  const {
    entryType,
    isViralEntry,
    isReturningUser,
    isAvailable,
  } = useContextAware();

  // If not in Base App, show default experience
  if (!isAvailable) {
    return <div className={className}>{children}</div>;
  }

  // Different experiences based on entry point
  switch (entryType) {
    case 'cast_embed':
      return (
        <div className={className}>
          {/* Viral onboarding experience */}
          <div className="mb-4 p-3 bg-gradient-to-r from-[#f2751a] to-[#e65a0a] border-2 border-[#8B4513] rounded-lg">
            <h3 className="text-lg font-bold text-white mb-2">🎉 Welcome to Defeat the Dragon!</h3>
            <p className="text-sm text-white">
              You discovered this focus game through a friend! Start your first focus session to begin your adventure.
            </p>
          </div>
          {children}
        </div>
      );

    case 'launcher':
      return (
        <div className={className}>
          {/* Returning user experience */}
          <div className="mb-4 p-3 bg-gradient-to-r from-[#4ade80] to-[#22c55e] border-2 border-[#8B4513] rounded-lg">
            <h3 className="text-lg font-bold text-white mb-2">👋 Welcome back, Focus Warrior!</h3>
            <p className="text-sm text-white">
              Ready to continue your journey? Your dragon awaits your next focus session.
            </p>
          </div>
          {children}
        </div>
      );

    case 'messaging':
      return (
        <div className={className}>
          {/* Private share experience */}
          <div className="mb-4 p-3 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] border-2 border-[#8B4513] rounded-lg">
            <h3 className="text-lg font-bold text-white mb-2">💬 Private Focus Session</h3>
            <p className="text-sm text-white">
              Someone shared this focus game with you privately. Start your journey in peace.
            </p>
          </div>
          {children}
        </div>
      );

    default:
      return (
        <div className={className}>
          {/* Default experience */}
          <div className="mb-4 p-3 bg-gradient-to-r from-[#6b7280] to-[#4b5563] border-2 border-[#8B4513] rounded-lg">
            <h3 className="text-lg font-bold text-white mb-2">🐉 Defeat the Dragon</h3>
            <p className="text-sm text-white">
              Transform your focus sessions into an epic adventure. Level up your productivity!
            </p>
          </div>
          {children}
        </div>
      );
  }
}
