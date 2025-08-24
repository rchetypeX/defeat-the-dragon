'use client';

import { useClose } from '@coinbase/onchainkit/minikit';
import { ReactNode } from 'react';

interface CloseButtonProps {
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function CloseButton({ children, className = '', onClick }: CloseButtonProps) {
  const close = useClose();

  const handleClick = () => {
    // Call custom onClick if provided
    onClick?.();
    
    // Close the mini app
    close();
  };

  return (
    <button 
      onClick={handleClick}
      className={className}
      type="button"
    >
      {children || 'Close'}
    </button>
  );
}
