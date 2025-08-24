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
    
    try {
      // Try to close the mini app (Base App environment)
      close();
    } catch (error) {
      console.log('Mini app close failed, trying alternative methods:', error);
      
      // Fallback for non-Base App environments
      try {
        // Try to close the window/tab
        if (typeof window !== 'undefined') {
          // Check if we're in a Base App environment
          const isBaseApp = window.location.hostname.includes('base.app') || 
                           window.location.hostname.includes('coinbase.com') ||
                           window.location.hostname.includes('onchainkit.com');
          
          if (isBaseApp) {
            // In Base App, try to close the frame
            if (window.parent && window.parent !== window) {
              window.parent.postMessage({ type: 'close' }, '*');
            }
          } else {
            // In regular web environment, try to close the tab
            window.close();
            
            // If window.close() doesn't work (due to browser restrictions),
            // redirect to a blank page or show a message
            setTimeout(() => {
              window.location.href = 'about:blank';
            }, 100);
          }
        }
      } catch (fallbackError) {
        console.error('All close methods failed:', fallbackError);
        // Last resort: redirect to blank page
        if (typeof window !== 'undefined') {
          window.location.href = 'about:blank';
        }
      }
    }
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
