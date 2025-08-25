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



  // Different experiences based on entry point - no welcome cards for Base App
  switch (entryType) {
    case 'cast_embed':
      return (
        <div className={className}>
          {children}
        </div>
      );

    case 'launcher':
      return (
        <div className={className}>
          {children}
        </div>
      );

    case 'messaging':
      return (
        <div className={className}>
          {children}
        </div>
      );

    default:
      return (
        <div className={className}>
          {children}
        </div>
      );
  }
}
