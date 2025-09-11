'use client';

import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';
import { useAuthenticate, useMiniKit } from '@coinbase/onchainkit/minikit';

interface BaseAppWalletState {
  // Wallet connection state
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  
  // Base App context
  isBaseApp: boolean;
  contextUser: any | null;
  contextFid: string | null;
  
  // Authentication state
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Methods
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function useBaseAppWallet(): BaseAppWalletState {
  const [isLoading, setIsLoading] = useState(true);
  const [isBaseApp, setIsBaseApp] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Use wagmi hooks for wallet connection (as recommended by Base App support)
  const { address, isConnected } = useAccount();

  // Use MiniKit hooks for Base App context with proper error handling
  let miniKitSignIn: any = null;
  let miniKitResult: any = null;
  let context: any = null;
  let contextUser: any = null;
  let contextFid: string | null = null;
  
  try {
    const { signIn } = useAuthenticate();
    miniKitSignIn = signIn;
    miniKitResult = useMiniKit();
    context = miniKitResult?.context || null;
    contextUser = context?.user || null;
    // CRITICAL FIX: Add proper null safety for FID conversion
    contextFid = contextUser?.fid ? contextUser.fid.toString() : null;
  } catch (error) {
    // This is expected when not in Base App environment
    console.log('MiniKit not available (expected when not in Base App):', error.message);
    miniKitSignIn = null;
    miniKitResult = null;
    context = null;
    contextUser = null;
    contextFid = null;
  }

  // Detect Base App environment
  useEffect(() => {
    const detectBaseApp = () => {
      // Official Base App detection method (as per Base App documentation)
      const isBaseAppOfficial = context?.client?.clientFid === 309857;
      
      // Fallback detection methods
      const fallbackDetection = typeof window !== 'undefined' && 
        (window.location.hostname.includes('base.org') || 
         window.navigator.userAgent.includes('BaseApp') ||
         window.location.search.includes('base_app=true'));
      
      const baseAppDetected = isBaseAppOfficial || fallbackDetection;
      
      setIsBaseApp(baseAppDetected);
      console.log('Base App detected:', baseAppDetected, 'Client FID:', context?.client?.clientFid);
      
      // Log detection details for debugging
      if (baseAppDetected) {
        console.log('✅ Base App environment confirmed');
      } else {
        console.log('ℹ️ Not in Base App environment');
      }
    };

    detectBaseApp();
  }, [context?.client?.clientFid]);

  // Authentication is based on wallet connection in Base App
  const isAuthenticated = isConnected && !!address;

  useEffect(() => {
    console.log('Base App Wallet State:', {
      address,
      isConnected,
      isBaseApp,
      contextFid,
      isAuthenticated
    });

    setIsLoading(false);
  }, [address, isConnected, isBaseApp, contextFid, isAuthenticated]);

  const signIn = async () => {
    try {
      setIsConnecting(true);
      console.log('Base App: Starting sign in process...');
      
      if (miniKitSignIn) {
        await miniKitSignIn();
        console.log('✅ Base App Sign In successful');
      } else {
        console.warn('MiniKit sign in not available');
      }
    } catch (error) {
      console.error('❌ Base App Sign In failed:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const signOut = async () => {
    try {
      console.log('Base App: Starting sign out process...');
      
      // Clear Base App user data and all related storage
      if (typeof window !== 'undefined') {
        const keysToRemove = [
          'baseAppUser',
          'defeat-the-dragon-storage',
          'defeat-the-dragon-store',
          'defeat-the-dragon-character-storage',
          'background-store',
          'playerData'
        ];
        
        keysToRemove.forEach(key => {
          try {
            localStorage.removeItem(key);
            console.log(`Base App: Removed ${key} from localStorage`);
          } catch (error) {
            console.warn(`Base App: Failed to remove ${key}:`, error);
          }
        });
        
        // Clear session storage
        try {
          sessionStorage.clear();
          console.log('Base App: Session storage cleared');
        } catch (error) {
          console.warn('Base App: Failed to clear session storage:', error);
        }
        
        // Clear cookies
        const cookiesToClear = ['base-app-user', 'wallet-user'];
        cookiesToClear.forEach(cookieName => {
          try {
            document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
            console.log(`Base App: Cleared ${cookieName} cookie`);
          } catch (error) {
            console.warn(`Base App: Failed to clear ${cookieName} cookie:`, error);
          }
        });
      }
      
      // Reset states
      setIsLoading(false);
      
      console.log('✅ Base App Sign Out successful');
    } catch (error) {
      console.error('❌ Base App Sign Out failed:', error);
      // Even if there's an error, try to clear storage
      if (typeof window !== 'undefined') {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (cleanupError) {
          console.error('Base App: Failed to clear storage during error cleanup:', cleanupError);
        }
      }
      throw error;
    }
  };

  return {
    // Wallet connection state (cryptographically verified)
    address,
    isConnected,
    isConnecting,
    
    // Base App context
    isBaseApp,
    contextUser,
    contextFid,
    
    // Authentication state
    isAuthenticated,
    isLoading,
    
    // Methods
    signIn,
    signOut,
  };
}
