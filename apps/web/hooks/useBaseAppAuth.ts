'use client';

import { useBaseAppWallet } from './useBaseAppWallet';

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
  // Use the new wallet-based Base App authentication
  const {
    address,
    isConnected,
    isBaseApp,
    contextUser,
    contextFid,
    isAuthenticated,
    isLoading,
    signIn,
    signOut,
  } = useBaseAppWallet();

  // For backward compatibility, map the wallet-based auth to the expected interface
  return {
    // Use wallet address as verified user (cryptographically verified)
    verifiedUser: address ? { address, isConnected } : null,
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
