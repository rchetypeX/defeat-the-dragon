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
    
    // Use Base App's native browser
    openUrl(href);
  };

  return (
    <a 
      href={href} 
      onClick={handleClick}
      className={className}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}
