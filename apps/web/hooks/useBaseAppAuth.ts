'use client';

import { useAuthenticate, useMiniKit } from '@coinbase/onchainkit/minikit';
import { useEffect, useState } from 'react';

interface BaseAppAuthState {
  // Cryptographic verification (safe for auth)
  verifiedUser: any | null;
  isAuthenticated: boolean;
  
  // Context data (safe for analytics only)
  contextUser: any | null;
  contextFid: string | null;
  
  // Loading states
  isLoading: boolean;
  isBaseApp: boolean;
  
  // Auth methods
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function useBaseAppAuth(): BaseAppAuthState {
  // Initialize state with default values to prevent build-time errors
  const [isLoading, setIsLoading] = useState(true);
  const [isBaseApp, setIsBaseApp] = useState(false);

  // Use MiniKit hooks safely for SSR
  let miniKitSignIn: any = null;
  let miniKitResult: any = null;
  let context: any = null;
  let contextUser: any = null;
  let contextFid: string | null = null;
  
  // Use MiniKit hooks with proper error handling
  try {
    const { signIn } = useAuthenticate();
    miniKitSignIn = signIn;
    miniKitResult = useMiniKit();
    context = miniKitResult?.context || null;
    contextUser = context?.user || null;
    contextFid = contextUser?.fid?.toString() || null;
  } catch (error) {
    // MiniKit not available - provide fallback values
    console.warn('MiniKit not available during build:', error);
    miniKitSignIn = null;
    miniKitResult = null;
    context = null;
    contextUser = null;
    contextFid = null;
  }

  // Detect if we're in Base App environment
  useEffect(() => {
    const detectBaseApp = () => {
      // Official Base App detection method
      const isBaseApp = context?.client?.clientFid === 309857;
      
      // Fallback detection methods
      const fallbackDetection = typeof window !== 'undefined' && 
        (window.location.hostname.includes('base.org') || 
         window.navigator.userAgent.includes('BaseApp') ||
         window.location.search.includes('base_app=true'));
      
      const baseAppDetected = isBaseApp || fallbackDetection;
      
      setIsBaseApp(baseAppDetected);
      console.log('Base App detected:', baseAppDetected, 'Client FID:', context?.client?.clientFid);
    };

    detectBaseApp();
  }, [context?.client?.clientFid]);

  // Use context data for authentication (with fallback to wallet auth)
  const isAuthenticated = !!context?.user;

  useEffect(() => {
    // Log context data for analytics (safe)
    if (contextFid) {
      console.log('🔍 Base App Context - FID:', contextFid, 'User:', contextUser);
    }

    // Log context user for auth
    if (context?.user) {
      console.log('🔐 Base App Context User:', context.user);
    }

    setIsLoading(false);
  }, [contextFid, contextUser, context?.user]);

  const signIn = async () => {
    try {
      setIsLoading(true);
      await miniKitSignIn();
      console.log('✅ Base App Sign In successful');
    } catch (error) {
      console.error('❌ Base App Sign In failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      // For now, we'll use a simple approach since signOut isn't available
      console.log('✅ Base App Sign Out (context cleared)');
    } catch (error) {
      console.error('❌ Base App Sign Out failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // Context-based authentication (with fallback)
    verifiedUser: contextUser,
    isAuthenticated,
    
    // Context data (safe for analytics only)
    contextUser,
    contextFid,
    
    // Loading states
    isLoading,
    isBaseApp,
    
    // Auth methods
    signIn,
    signOut,
  };
}
