'use client';

import { useAuth } from '../contexts/AuthContext';
import { useSIWF } from '../contexts/SIWFContext';
import { useBaseAppWallet } from './useBaseAppWallet';
import { useMiniKitSafe } from './useMiniKitSafe';

interface UnifiedAuthState {
  // Primary authentication method
  primaryAuth: {
    type: 'baseapp' | 'siwf' | 'supabase' | 'none';
    data: any;
  };
  
  // Authentication state
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // User data (cryptographically verified)
  user: any;
  userId: string | null;
  
  // Platform detection
  isBaseApp: boolean;
  isFarcaster: boolean;
  
  // Auth methods
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * Unified authentication hook that prioritizes SIWF for Base App
 * as per Base App documentation recommendations
 */
export function useUnifiedAuth(): UnifiedAuthState {
  const supabaseAuth = useAuth();
  const siwfAuth = useSIWF();
  const baseAppAuth = useBaseAppWallet();
  const miniKitData = useMiniKitSafe();

  // Determine primary authentication method based on Base App documentation
  const getPrimaryAuth = () => {
    // In Base App, use native SIWF authentication via useAuthenticate
    if (baseAppAuth.isBaseApp && miniKitData.isAvailable) {
      // Use Base App's native SIWF authentication (cryptographically verified)
      if (miniKitData.user) {
        return { type: 'baseapp' as const, data: { user: miniKitData.user, context: miniKitData.context } };
      }
      // Fallback to wallet connection if no SIWF user
      if (baseAppAuth.isAuthenticated && baseAppAuth.address) {
        return { type: 'baseapp' as const, data: baseAppAuth };
      }
    }
    
    // Outside Base App, use traditional auth methods
    if (supabaseAuth.user) {
      return { type: 'supabase' as const, data: supabaseAuth };
    }
    
    if (siwfAuth.isAuthenticated && siwfAuth.user) {
      return { type: 'siwf' as const, data: siwfAuth };
    }
    
    return { type: 'none' as const, data: null };
  };

  const primaryAuth = getPrimaryAuth();
  
  // Determine if user is authenticated (cryptographically verified)
  const isAuthenticated = primaryAuth.type !== 'none';
  
  // Determine loading state
  const isLoading = baseAppAuth.isLoading || siwfAuth.isLoading || supabaseAuth.loading;
  
  // Get user data from primary auth method
  const getUserData = () => {
    switch (primaryAuth.type) {
      case 'baseapp':
        // Use Base App's native SIWF user data (cryptographically verified)
        const baseAppUser = (primaryAuth.data as any)?.user;
        if (baseAppUser && typeof baseAppUser === 'object' && 'fid' in baseAppUser) {
          return {
            user: {
              fid: baseAppUser.fid,
              username: baseAppUser.username,
              displayName: baseAppUser.displayName,
              pfpUrl: baseAppUser.pfpUrl,
              address: baseAppUser.address || baseAppAuth.address,
              platform: 'baseapp'
            },
            userId: baseAppUser.fid ? `baseapp-${baseAppUser.fid}` : null,
          };
        }
        // Fallback to wallet-only auth
        return {
          user: { address: baseAppAuth.address, fid: baseAppAuth.contextFid },
          userId: baseAppAuth.address ? `baseapp-${baseAppAuth.address}` : null,
        };
      case 'siwf':
        return {
          user: siwfAuth.user,
          userId: siwfAuth.user?.fid ? `siwf-${siwfAuth.user.fid}` : null,
        };
      case 'supabase':
        return {
          user: supabaseAuth.user,
          userId: supabaseAuth.user?.id || null,
        };
      default:
        return { user: null, userId: null };
    }
  };

  const { user, userId } = getUserData();

  // Unified sign in method
  const signIn = async () => {
    if (baseAppAuth.isBaseApp && miniKitData.isAvailable) {
      // In Base App, use native SIWF authentication
      if (miniKitData.signIn) {
        try {
          await miniKitData.signIn();
          return;
        } catch (error) {
          console.warn('Base App SIWF sign in failed, trying wallet auth:', error);
        }
      }
      
      // Fallback to wallet auth
      if (baseAppAuth.signIn) {
        await baseAppAuth.signIn();
        return;
      }
    } else {
      // Outside Base App, use traditional methods
      if (siwfAuth.signIn) {
        await siwfAuth.signIn();
      }
    }
  };

  // Unified sign out method
  const signOut = async () => {
    // Sign out from all active auth methods
    const signOutPromises = [];
    
    if (siwfAuth.signOut) {
      signOutPromises.push(siwfAuth.signOut());
    }
    
    if (baseAppAuth.signOut) {
      signOutPromises.push(baseAppAuth.signOut());
    }
    
    if (supabaseAuth.signOut) {
      signOutPromises.push(supabaseAuth.signOut());
    }
    
    await Promise.allSettled(signOutPromises);
  };

  return {
    primaryAuth,
    isAuthenticated,
    isLoading,
    user,
    userId,
    isBaseApp: baseAppAuth.isBaseApp,
    isFarcaster: siwfAuth.isFarcaster,
    signIn,
    signOut,
  };
}
