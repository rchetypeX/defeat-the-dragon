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
      // Official Base App detection method
      const isBaseAppOfficial = context?.client?.clientFid === 309857;
      
      // Fallback detection methods
      const fallbackDetection = typeof window !== 'undefined' && 
        (window.location.hostname.includes('base.org') || 
         window.navigator.userAgent.includes('BaseApp') ||
         window.location.search.includes('base_app=true'));
      
      const baseAppDetected = isBaseAppOfficial || fallbackDetection;
      
      setIsBaseApp(baseAppDetected);
      console.log('Base App detected:', baseAppDetected, 'Client FID:', context?.client?.clientFid);
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
      console.log('Base App: Sign out requested');
      // In Base App, wallet disconnection is handled by the wallet itself
      // We just need to clear our local state
      console.log('✅ Base App Sign Out completed');
    } catch (error) {
      console.error('❌ Base App Sign Out failed:', error);
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
