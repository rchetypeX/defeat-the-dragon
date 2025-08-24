'use client';
import { MiniKitProvider } from '@coinbase/onchainkit/minikit';
import { ReactNode, useEffect } from 'react';
import { base } from 'wagmi/chains';

export function MiniKitContextProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Suppress Coinbase analytics errors in development
    if (process.env.NODE_ENV === 'development') {
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
      
      return () => {
        console.error = originalError;
      };
    }
  }, []);

  return (
    <MiniKitProvider 
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY} 
      chain={base}
      config={{
        appearance: {
          mode: 'auto',
          theme: 'snake',
          name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
          logo: process.env.NEXT_PUBLIC_APP_ICON,
        },
        // Disable analytics in development to prevent errors
        analytics: process.env.NODE_ENV === 'production' ? undefined : false,
      }}
    >
      {children}
    </MiniKitProvider>
  );
}
