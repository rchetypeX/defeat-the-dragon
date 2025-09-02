'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthKitProvider, useProfile, useSignIn, useSignInMessage } from '@farcaster/auth-kit';
import '@farcaster/auth-kit/styles.css';
import { createClient } from '@supabase/supabase-js';

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
  
  // Supabase integration
  supabaseUser: any;
  linkSupabaseAccount: (email: string, displayName?: string) => Promise<void>;
  
  // Platform detection
  isBaseApp: boolean;
  isFarcaster: boolean;
}

const SIWFContext = createContext<SIWFContextType | undefined>(undefined);

// AuthKit Configuration
const authKitConfig = {
  domain: process.env.NEXT_PUBLIC_URL || 'dtd.rchetype.xyz',
  siweUri: `${process.env.NEXT_PUBLIC_URL || 'https://dtd.rchetype.xyz'}/auth/siwf`,
  rpcUrl: 'https://mainnet.optimism.io', // Base Network RPC
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

  // Farcaster Auth hooks
  const { isAuthenticated, profile } = useProfile();
  const { signIn: farcasterSignIn, signOut: farcasterSignOut, isConnected, connect } = useSignIn({
    onSuccess: async ({ fid, username, signature }) => {
      console.log('✅ SIWF Success:', { fid, username });
      setError(null);
      
      // Try to link with existing Supabase account or create new one
      try {
        await linkSupabaseAccount('', username);
      } catch (err) {
        console.error('❌ Failed to link Supabase account:', err);
        setError('Authentication successful but account linking failed');
      }
    },
    onError: (err) => {
      console.error('❌ SIWF Error:', err);
      setError(err.message || 'Authentication failed');
    }
  });

  const { message, signature } = useSignInMessage();

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
      if (!isConnected) {
        await connect();
      }
      await farcasterSignIn();
    } catch (err) {
      console.error('❌ Sign in failed:', err);
      setError(err instanceof Error ? err.message : 'Sign in failed');
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
      
      // Create initial inventory
      await supabase
        .from('user_inventory')
        .insert({
          user_id: newUser.id,
          item_id: 'fighter', // Default character
          item_type: 'character',
          quantity: 1,
          equipped: true,
          acquired_at: new Date().toISOString()
        });

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
    supabaseUser,
    linkSupabaseAccount,
    isBaseApp,
    isFarcaster
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
