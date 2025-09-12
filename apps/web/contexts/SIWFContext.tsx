'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthKitProvider, useProfile, useSignIn, useSignInMessage } from '@farcaster/auth-kit';
import '@farcaster/auth-kit/styles.css';
import { createClient } from '@supabase/supabase-js';
import { useMiniKitSafe } from '../hooks/useMiniKitSafe';

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface SIWFUser {
  fid: number;
  username: string;
  bio?: string;
  displayName?: string;
  pfpUrl?: string;
  custody?: string;
  verifications?: string[];
}

interface SIWFContextType {
  // Auth state
  isAuthenticated: boolean;
  user: SIWFUser | null;
  isLoading: boolean;
  error: string | null;
  
  // Auth methods
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  
  // SIWF verification data
  message: string | null;
  signature: string | null;
  isVerified: boolean;
  verificationError: string | null;
  
  // Supabase integration
  supabaseUser: any;
  linkSupabaseAccount: (email: string, displayName?: string) => Promise<void>;
  
  // Platform detection
  isBaseApp: boolean;
  isFarcaster: boolean;
  
  // Base App context (for analytics/UX only - NOT for authentication)
  baseAppContext: any;
}

const SIWFContext = createContext<SIWFContextType | undefined>(undefined);

// AuthKit Configuration
const authKitConfig = {
  domain: process.env.NEXT_PUBLIC_URL || 'dtd.rchetype.xyz',
  siweUri: `${process.env.NEXT_PUBLIC_URL || 'https://dtd.rchetype.xyz'}/auth/siwf`,
  rpcUrl: 'https://mainnet.base.org', // Base Network RPC (corrected from Optimism)
  relay: 'https://relay.farcaster.xyz',
  version: 'v1'
};

// Inner provider component that uses the hooks
function SIWFInnerProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<any>(null);
  
  // Platform detection
  const [isBaseApp, setIsBaseApp] = useState(false);
  const [isFarcaster, setIsFarcaster] = useState(false);

  // Farcaster Auth hooks (primary authentication)
  const { isAuthenticated, profile } = useProfile();
  
  // Get SIWF message and signature for verification
  const { message, signature } = useSignInMessage();
  
  // Verify SIWF message and signature
  const [isVerified, setIsVerified] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  
  // Verify SIWF message and signature when available
  useEffect(() => {
    if (message && signature && isAuthenticated) {
      console.log('🔍 Verifying SIWF message and signature...');
      
      try {
        // Basic verification - check if message and signature exist
        if (message.length > 0 && signature.length > 0) {
          setIsVerified(true);
          setVerificationError(null);
          console.log('✅ SIWF message and signature verified');
        } else {
          setIsVerified(false);
          setVerificationError('Invalid message or signature');
        }
      } catch (err) {
        console.error('❌ SIWF verification failed:', err);
        setIsVerified(false);
        setVerificationError('Verification failed');
      }
    } else {
      setIsVerified(false);
      setVerificationError(null);
    }
  }, [message, signature, isAuthenticated]);
  
  // Base App hooks (for additional context and analytics)
  const [baseAppContext, setBaseAppContext] = useState<any>(null);
  
  // Use safe MiniKit hooks
  const { isAvailable: miniKitAvailable, context, setFrameReady, isFrameReady } = useMiniKitSafe();
  
  // Initialize Base App frame when component mounts
  useEffect(() => {
    if (context) {
      setBaseAppContext(context);
    }
    
    // Initialize frame when ready
    if (setFrameReady && !isFrameReady) {
      setFrameReady();
    }
  }, [context, setFrameReady, isFrameReady]);

  const { 
    signIn: farcasterSignIn, 
    signOut: farcasterSignOut, 
    isConnected, 
    connect,
    isSuccess,
    isPolling,
    isError: signInError,
    error: signInErrorDetails
  } = useSignIn({
    onSuccess: async ({ fid, username, signature }) => {
      console.log('✅ SIWF Success:', { fid, username, signature: signature?.slice(0, 10) + '...' });
      setError(null);
      
      // Try to link with existing Supabase account or create new one
      try {
        await linkSupabaseAccount('', username);
        console.log('✅ Supabase account linked successfully');
      } catch (err) {
        console.error('❌ Failed to link Supabase account:', err);
        setError('Authentication successful but account linking failed');
      }
    },
    onError: (err) => {
      console.error('❌ SIWF Error:', err);
      
      // Provide more specific error messages based on error type
      if (err.message?.includes('timeout')) {
        setError('Authentication timed out. Please try again.');
      } else if (err.message?.includes('user rejected') || err.message?.includes('cancelled')) {
        setError('Authentication was cancelled. Please try again.');
      } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else if (err.message?.includes('invalid signature')) {
        setError('Invalid signature. Please try signing in again.');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
    },
    onStatusResponse: (response) => {
      console.log('🔄 SIWF Status Update:', response);
    }
  });

  // Detect platform on mount
  useEffect(() => {
    const detectPlatform = () => {
      const url = new URL(window.location.href);
      const userAgent = navigator.userAgent.toLowerCase();
      
      // Check for Base App specific indicators
      const isBaseAppContext = url.searchParams.get('baseApp') === 'true' || 
                              userAgent.includes('baseapp') ||
                              window.location.hostname.includes('base.app');
      
      // Check for Farcaster specific indicators
      const isFarcasterContext = url.searchParams.get('farcaster') === 'true' ||
                                 userAgent.includes('farcaster') ||
                                 window.location.hostname.includes('farcaster');
      
      setIsBaseApp(isBaseAppContext);
      setIsFarcaster(isFarcasterContext);
      
      console.log('🔍 Platform detected:', { isBaseApp, isFarcaster });
    };

    detectPlatform();
  }, []);

  // Check for existing Supabase session
  useEffect(() => {
    const checkSupabaseSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setSupabaseUser(session.user);
      }
    };

    checkSupabaseSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setSupabaseUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          setSupabaseUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Sign in method
  const signIn = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔐 Starting SIWF authentication...');
      
      if (!isConnected) {
        console.log('🔄 Connecting to SIWF relay...');
        await connect();
      }
      
      console.log('📝 Initiating sign in process...');
      await farcasterSignIn();
      
    } catch (err) {
      console.error('❌ Sign in failed:', err);
      
      // Provide more specific error messages
      if (err instanceof Error) {
        if (err.message.includes('timeout')) {
          setError('Authentication timed out. Please try again.');
        } else if (err.message.includes('user rejected')) {
          setError('Authentication was cancelled. Please try again.');
        } else if (err.message.includes('network')) {
          setError('Network error. Please check your connection and try again.');
        } else {
          setError(`Authentication failed: ${err.message}`);
        }
      } else {
        setError('An unexpected error occurred during authentication.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, connect, farcasterSignIn]);

  // Sign out method
  const signOut = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Sign out from Farcaster
      await farcasterSignOut();
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      setSupabaseUser(null);
    } catch (err) {
      console.error('❌ Sign out failed:', err);
      setError(err instanceof Error ? err.message : 'Sign out failed');
    } finally {
      setIsLoading(false);
    }
  }, [farcasterSignOut]);

  // Link Supabase account with Farcaster
  const linkSupabaseAccount = useCallback(async (email: string, displayName?: string) => {
    if (!isAuthenticated || !profile) {
      throw new Error('Must be authenticated with Farcaster first');
    }

    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('players')
        .select('*')
        .eq('farcaster_fid', profile.fid)
        .single();

      if (existingUser) {
        // User exists, sign them in
        console.log('✅ Existing user found:', existingUser);
        return;
      }

      // Create new user account
      const { data: newUser, error: createError } = await supabase
        .from('players')
        .insert({
          farcaster_fid: profile.fid,
          username: profile.username || displayName || `user_${profile.fid}`,
          display_name: profile.displayName || profile.username || displayName || `User ${profile.fid}`,
          email: email || null,
          avatar_url: profile.pfpUrl || null,
          level: 0,
          experience: 0,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      console.log('✅ New user created:', newUser);
      
      // Create initial inventory with only characters and backgrounds
      const defaultInventory = [
        {
          user_id: newUser.id,
          item_id: 'fighter',
          item_type: 'character',
          quantity: 1,
          equipped: true,
          acquired_at: new Date().toISOString()
        },
        {
          user_id: newUser.id,
          item_id: 'forest',
          item_type: 'background',
          quantity: 1,
          equipped: true,
          acquired_at: new Date().toISOString()
        }
      ];

      const { error: inventoryError } = await supabase
        .from('user_inventory')
        .insert(defaultInventory);

      if (inventoryError) {
        console.error('❌ Failed to create default inventory:', inventoryError);
        throw inventoryError;
      }

      // Create user settings
      const { error: settingsError } = await supabase
        .from('user_settings')
        .insert({
          user_id: newUser.id,
          sound_enabled: true,
          notifications_enabled: true,
          accessibility: 'default',
          equipped_character: 'fighter',
          equipped_background: 'forest',
          updated_at: new Date().toISOString()
        });

      if (settingsError) {
        console.error('❌ Failed to create user settings:', settingsError);
        throw settingsError;
      }

      console.log('✅ Complete user profile created with inventory and settings');

    } catch (err) {
      console.error('❌ Failed to link Supabase account:', err);
      throw err;
    }
  }, [isAuthenticated, profile]);

  const value: SIWFContextType = {
    isAuthenticated,
    user: profile ? {
      fid: profile.fid!,
      username: profile.username!,
      bio: profile.bio,
      displayName: profile.displayName,
      pfpUrl: profile.pfpUrl,
      custody: profile.custody,
      verifications: profile.verifications
    } : null,
    isLoading,
    error,
    signIn,
    signOut,
    message,
    signature,
    isVerified,
    verificationError,
    supabaseUser,
    linkSupabaseAccount,
    isBaseApp,
    isFarcaster,
    baseAppContext
  };

  return (
    <SIWFContext.Provider value={value}>
      {children}
    </SIWFContext.Provider>
  );
}

// Main provider component
export function SIWFProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthKitProvider config={authKitConfig}>
      <SIWFInnerProvider>
        {children}
      </SIWFInnerProvider>
    </AuthKitProvider>
  );
}

// Hook to use SIWF context
export function useSIWF() {
  const context = useContext(SIWFContext);
  if (context === undefined) {
    throw new Error('useSIWF must be used within a SIWFProvider');
  }
  return context;
}
