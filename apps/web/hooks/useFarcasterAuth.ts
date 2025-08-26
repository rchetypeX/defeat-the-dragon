'use client';

import { useState, useEffect, useCallback } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

export interface FarcasterUser {
  fid: string;
  username?: string;
  displayName?: string;
  pfp?: string;
  verifiedAddresses?: string[];
  authAddress?: string;
}

export interface FarcasterAuthState {
  user: FarcasterUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  quickAuth: () => Promise<FarcasterUser | null>;
  signIn: () => Promise<FarcasterUser | null>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export function useFarcasterAuth(): FarcasterAuthState {
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick Auth - easiest way to get authenticated session
  const quickAuth = useCallback(async (): Promise<FarcasterUser | null> => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔐 Starting Quick Auth...');
      
      // Call Quick Auth which returns a JWT
      const authResult = await sdk.actions.quickAuth();
      
      console.log('✅ Quick Auth successful:', authResult);
      
      // Extract user information from the auth result
      const farcasterUser: FarcasterUser = {
        fid: authResult.fid,
        username: authResult.username,
        displayName: authResult.displayName,
        pfp: authResult.pfp,
        verifiedAddresses: authResult.verifiedAddresses,
        authAddress: authResult.authAddress,
      };

      setUser(farcasterUser);
      
      // Store the JWT token for server verification
      if (authResult.token) {
        localStorage.setItem('farcaster_jwt', authResult.token);
      }

      return farcasterUser;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Quick Auth failed';
      setError(errorMessage);
      console.error('❌ Quick Auth error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sign In with Farcaster - alternative method
  const signIn = useCallback(async (): Promise<FarcasterUser | null> => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔐 Starting Sign In with Farcaster...');
      
      // Get Sign in with Farcaster credential
      const signInResult = await sdk.actions.signIn();
      
      console.log('✅ Sign In successful:', signInResult);
      
      // Extract user information
      const farcasterUser: FarcasterUser = {
        fid: signInResult.fid,
        username: signInResult.username,
        displayName: signInResult.displayName,
        pfp: signInResult.pfp,
        verifiedAddresses: signInResult.verifiedAddresses,
        authAddress: signInResult.authAddress,
      };

      setUser(farcasterUser);
      
      // Store the credential for server verification
      if (signInResult.credential) {
        localStorage.setItem('farcaster_credential', signInResult.credential);
      }

      return farcasterUser;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign In failed';
      setError(errorMessage);
      console.error('❌ Sign In error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sign out
  const signOut = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      
      console.log('🚪 Signing out...');
      
      // Clear local storage
      localStorage.removeItem('farcaster_jwt');
      localStorage.removeItem('farcaster_credential');
      
      // Clear user state
      setUser(null);
      
      console.log('✅ Sign out successful');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign out failed';
      setError(errorMessage);
      console.error('❌ Sign out error:', err);
    }
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      
      // Check if we have a stored JWT or credential
      const jwt = localStorage.getItem('farcaster_jwt');
      const credential = localStorage.getItem('farcaster_credential');
      
      if (jwt || credential) {
        // Verify the stored token/credential with our server
        const response = await fetch('/api/auth/farcaster/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jwt,
            credential,
          }),
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData.user);
        } else {
          // Token is invalid, clear it
          localStorage.removeItem('farcaster_jwt');
          localStorage.removeItem('farcaster_credential');
          setUser(null);
        }
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh user';
      setError(errorMessage);
      console.error('❌ Refresh user error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-authenticate on mount if we have stored credentials
  useEffect(() => {
    const autoAuth = async () => {
      const jwt = localStorage.getItem('farcaster_jwt');
      const credential = localStorage.getItem('farcaster_credential');
      
      if (jwt || credential) {
        await refreshUser();
      } else {
        setIsLoading(false);
      }
    };

    autoAuth();
  }, [refreshUser]);

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    quickAuth,
    signIn,
    signOut,
    refreshUser,
  };
}
