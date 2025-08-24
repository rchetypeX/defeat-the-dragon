'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session as SupabaseSession } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useGameStore } from '../lib/store';
import { getPlayerData } from '../lib/api';

interface AuthContextType {
  user: User | null;
  session: SupabaseSession | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { setUser: setGameUser, resetGame } = useGameStore();

  // Check for wallet user in localStorage
  const checkWalletUser = () => {
    const walletUserStr = localStorage.getItem('walletUser');
    if (walletUserStr) {
      try {
        const walletUser = JSON.parse(walletUserStr);
        console.log('AuthContext: Found wallet user in localStorage:', walletUser);
        return walletUser;
      } catch (error) {
        console.error('Error parsing wallet user data:', error);
        localStorage.removeItem('walletUser');
        return null;
      }
    }
    return null;
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      
      if (session?.user) {
        // Supabase session exists - use it
        setUser(session.user);
        setGameUser({
          id: session.user.id,
          email: session.user.email!,
        });
        // Load player data
        try {
          const playerData = await getPlayerData();
          if (playerData) {
            useGameStore.getState().setPlayer(playerData);
          }
        } catch (error) {
          console.error('Failed to load player data:', error);
        }
      } else {
        // No Supabase session - check for wallet user
        const walletUser = checkWalletUser();
        if (walletUser) {
          setUser(walletUser);
          setGameUser({
            id: walletUser.id,
            email: walletUser.email || `${walletUser.wallet_address}@wallet.local`,
          });
          // Load player data for wallet user
          try {
            const playerData = await getPlayerData();
            if (playerData) {
              useGameStore.getState().setPlayer(playerData);
              console.log('AuthContext: Successfully loaded player data for wallet user');
            }
          } catch (error) {
            console.error('Failed to load player data for wallet user:', error);
          }
        } else {
          console.log('AuthContext: No wallet user found in localStorage');
          setUser(null);
          setGameUser(null);
        }
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthContext: Supabase auth state changed:', event, session?.user?.id);
      setSession(session);
      setLoading(false);
      
      if (session?.user) {
        // Supabase session exists - use it
        setUser(session.user);
        setGameUser({
          id: session.user.id,
          email: session.user.email!,
        });
        // Load player data
        try {
          const playerData = await getPlayerData();
          if (playerData) {
            useGameStore.getState().setPlayer(playerData);
          }
        } catch (error) {
          console.error('Failed to load player data:', error);
        }
      } else {
        // No Supabase session - check for wallet user
        const walletUser = checkWalletUser();
        if (walletUser) {
          setUser(walletUser);
          setGameUser({
            id: walletUser.id,
            email: walletUser.email || `${walletUser.wallet_address}@wallet.local`,
          });
          // Load player data for wallet user
          try {
            const playerData = await getPlayerData();
            if (playerData) {
              useGameStore.getState().setPlayer(playerData);
              console.log('AuthContext: Successfully loaded player data for wallet user after Supabase logout');
            }
          } catch (error) {
            console.error('Failed to load player data for wallet user after Supabase logout:', error);
          }
        } else {
          console.log('AuthContext: No wallet user found after Supabase logout');
          setUser(null);
          setGameUser(null);
          resetGame();
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [setGameUser, resetGame]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // Provide more specific error messages for common cases
        if (error.message.includes('Invalid login credentials') || 
            error.message.includes('Invalid email or password') ||
            error.message.includes('Email not confirmed') ||
            error.message.includes('User not found')) {
          return { 
            error: { 
              message: 'No account found with this email. Please create an account first.' 
            } 
          };
        }
        if (error.message.includes('Email not confirmed')) {
          return { 
            error: { 
              message: 'Please check your email and click the confirmation link before signing in.' 
            } 
          };
        }
        return { error };
      }
      
      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { 
        error: { 
          message: 'An unexpected error occurred. Please try again.' 
        } 
      };
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      // First, check if the email already exists using our API
      const checkResponse = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (checkResponse.ok) {
        const checkResult = await checkResponse.json();
        if (checkResult.exists) {
          return { 
            error: { 
              message: 'An account with this email already exists. Please sign in instead.' 
            } 
          };
        }
      }

      // Proceed with sign up
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_URL || 'https://dtd.rchetype.xyz'}/auth/callback`,
        },
      });

      if (error) {
        console.log('Sign up error:', error.message); // Debug log
        
        // Provide more specific error messages
        if (error.message.includes('already registered') || 
            error.message.includes('already exists') ||
            error.message.includes('User already registered') ||
            error.message.includes('duplicate key') ||
            error.message.includes('already been registered') ||
            error.message.includes('User already registered') ||
            error.message.includes('Email already registered')) {
          return { 
            error: { 
              message: 'An account with this email already exists. Please sign in instead.' 
            } 
          };
        }
        if (error.message.includes('password') || error.message.includes('Password')) {
          return { 
            error: { 
              message: 'Password must be at least 6 characters long.' 
            } 
          };
        }
        if (error.message.includes('email') || error.message.includes('Email')) {
          return { 
            error: { 
              message: 'Please enter a valid email address.' 
            } 
          };
        }
        // Return the original error if we can't categorize it
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { 
        error: { 
          message: 'An unexpected error occurred. Please try again.' 
        } 
      };
    }
  };

  const signOut = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear all local storage
      localStorage.removeItem('defeat-the-dragon-storage');
      localStorage.removeItem('defeat-the-dragon-store');
      localStorage.removeItem('walletUser');
      
      // Clear all session storage
      sessionStorage.clear();
      
      // Reset game state
      resetGame();
      
      // Redirect to login page
      window.location.href = '/';
    } catch (error) {
      console.error('Error during sign out:', error);
      // Even if there's an error, try to redirect
      window.location.href = '/';
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
