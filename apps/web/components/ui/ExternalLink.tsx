'use client';

import { useOpenUrl } from '@coinbase/onchainkit/minikit';
import { ReactNode } from 'react';

interface ExternalLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function ExternalLink({ href, children, className = '', onClick }: ExternalLinkProps) {
  const openUrl = useOpenUrl();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Call custom onClick if provided
    onClick?.();
    
    try {
      // Use SDK action for cross-client compatibility
      openUrl(href);
    } catch (error) {
      // Fallback behavior for unsupported clients
      console.log('External navigation not supported, using fallback');
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <button 
      onClick={handleClick}
      className={`${className} cursor-pointer`}
      type="button"
    >
      {children}
    </button>
  );
}
