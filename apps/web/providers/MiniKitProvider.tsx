'use client';
import { MiniKitProvider } from '@coinbase/onchainkit/minikit';
import { ReactNode, useEffect } from 'react';
import { base } from 'wagmi/chains';

export function MiniKitContextProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Suppress Coinbase analytics errors in development
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      const originalError = console.error;
      console.error = (...args) => {
        // Filter out Coinbase analytics errors
        const message = args.join(' ');
        if (message.includes('cca-lite.coinbase.com') || 
            message.includes('net::ERR_ABORTED 401') ||
            message.includes('analyticsTracker')) {
          // Silently ignore these errors in development
          return;
        }
        originalError.apply(console, args);
      };
    }
  }, []);

  return (
    <MiniKitProvider
      apiKey=""
      config={{
        appearance: {
          mode: 'auto',
          theme: 'snake',
          name: 'Defeat the Dragon',
          logo: undefined,
        },
        analytics: false, // Disable analytics to prevent errors
      }}
      chain={base}
    >
      {children}
    </MiniKitProvider>
  );
}
