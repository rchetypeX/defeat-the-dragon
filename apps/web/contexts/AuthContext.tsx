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
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { setUser: setGameUser, resetGame } = useGameStore();

  // Database version check - force clear local storage if database was reset
  const checkDatabaseVersion = async () => {
    try {
      // Clear any old invalid UUIDs that might be cached
      const clearInvalidUUIDs = () => {
        const walletUserStr = localStorage.getItem('walletUser');
        const baseAppUserStr = localStorage.getItem('baseAppUser');
        
        if (walletUserStr) {
          try {
            const walletUser = JSON.parse(walletUserStr);
            if (walletUser.id === '795246' || walletUser.id === 795246) {
              console.log('AuthContext: Clearing old invalid wallet user UUID (795246)');
              localStorage.removeItem('walletUser');
            }
          } catch (e) {
            localStorage.removeItem('walletUser');
          }
        }
        
        if (baseAppUserStr) {
          try {
            const baseAppUser = JSON.parse(baseAppUserStr);
            if (baseAppUser.id === '795246' || baseAppUser.id === 795246) {
              console.log('AuthContext: Clearing old invalid Base App user UUID (795246)');
              localStorage.removeItem('baseAppUser');
            }
          } catch (e) {
            localStorage.removeItem('baseAppUser');
          }
        }
        
        // Clear any other potentially corrupted data
        if (localStorage.getItem('defeat-the-dragon-storage')) {
          try {
            const storageData = JSON.parse(localStorage.getItem('defeat-the-dragon-storage') || '{}');
            if (storageData.player?.id === '795246' || storageData.player?.id === 795246) {
              console.log('AuthContext: Clearing corrupted game storage data');
              localStorage.removeItem('defeat-the-dragon-storage');
            }
          } catch (e) {
            localStorage.removeItem('defeat-the-dragon-storage');
          }
        }
      };
      
      // Clear invalid UUIDs first
      clearInvalidUUIDs();
      
      // Only check if we have cached user data that might be stale
      const hasCachedData = localStorage.getItem('walletUser') || 
                           localStorage.getItem('baseAppUser') || 
                           localStorage.getItem('defeat-the-dragon-storage');
      
      if (!hasCachedData) {
        // No cached data, no need to check database version
        return true;
      }

      // For Base App, don't check database version as it might cause loops
      // Base App handles its own authentication and data management
      if (typeof window !== 'undefined' && window.location.href.includes('baseapp')) {
        console.log('AuthContext: Base App detected, skipping database version check');
        return true;
      }

      // Get the current database version from a simple API call
      const response = await fetch('/api/bootstrap', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.status === 401) {
        // If we get 401, it means the user doesn't exist in the database
        // Clear all local storage and reset the app
        console.log('AuthContext: Database reset detected (401), clearing local storage...');
        localStorage.clear();
        sessionStorage.clear();
        resetGame();
        window.location.reload();
        return false;
      }
      
      // Check for database reset header
      const databaseReset = response.headers.get('X-Database-Reset');
      if (databaseReset === 'true') {
        console.log('AuthContext: Database reset detected (header), clearing local storage...');
        localStorage.clear();
        sessionStorage.clear();
        resetGame();
        window.location.reload();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking database version:', error);
      // On network errors, don't clear storage - just continue normally
      return true;
    }
  };

  // Check for wallet user in localStorage
  const checkWalletUser = () => {
    const walletUserStr = localStorage.getItem('walletUser');
    if (walletUserStr) {
      try {
        const walletUser = JSON.parse(walletUserStr);
        
        // Check if this is the old invalid UUID that's causing loading issues
        if (walletUser.id === '795246' || walletUser.id === 795246) {
          console.log('AuthContext: Found old invalid wallet user UUID (795246), clearing...');
          localStorage.removeItem('walletUser');
          localStorage.removeItem('defeat-the-dragon-storage');
          return null;
        }
        
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

  // Check for Base App user in localStorage
  const checkBaseAppUser = () => {
    console.log('AuthContext: Checking for Base App user in localStorage...');
    const baseAppUserStr = localStorage.getItem('baseAppUser');
    console.log('AuthContext: Base App user string found:', !!baseAppUserStr);
    
    if (baseAppUserStr) {
      try {
        const baseAppUser = JSON.parse(baseAppUserStr);
        console.log('AuthContext: Parsed Base App user:', baseAppUser);
        
        // Check if this is the old invalid UUID that's causing loading issues
        if (baseAppUser.id === '795246' || baseAppUser.id === 795246) {
          console.log('AuthContext: Found old invalid Base App user UUID (795246), clearing...');
          localStorage.removeItem('baseAppUser');
          localStorage.removeItem('defeat-the-dragon-storage');
          return null;
        }
        
        console.log('AuthContext: Found valid Base App user in localStorage:', baseAppUser);
        return baseAppUser;
      } catch (error) {
        console.error('Error parsing Base App user data:', error);
        localStorage.removeItem('baseAppUser');
        return null;
      }
    }
    console.log('AuthContext: No Base App user found in localStorage');
    return null;
  };

  useEffect(() => {
    // Skip database version check for now to prevent refresh loops
    // TODO: Implement a more robust database version check later
    initializeAuth();
  }, [setGameUser, resetGame]);

  const initializeAuth = () => {
    console.log('AuthContext: Initializing authentication...');
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('AuthContext: Supabase session check completed:', !!session);
      setSession(session);
      setLoading(false);
      
      if (session?.user) {
        console.log('AuthContext: Supabase session exists, using Supabase user');
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
        console.log('AuthContext: No Supabase session, checking for wallet/Base App users...');
        // No Supabase session - check for wallet user
        const walletUser = checkWalletUser();
        if (walletUser) {
          console.log('AuthContext: Found wallet user:', walletUser.id);
          setUser(walletUser);
          setGameUser({
            id: walletUser.id,
            email: walletUser.email || `${walletUser.wallet_address}@wallet`,
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
          // Check for Base App user
          const baseAppUser = checkBaseAppUser();
          if (baseAppUser) {
            console.log('AuthContext: Found Base App user:', baseAppUser.id);
            setUser(baseAppUser);
            setGameUser({
              id: baseAppUser.id,
              email: baseAppUser.email,
            });
            // Load player data for Base App user
            try {
              const playerData = await getPlayerData();
              if (playerData) {
                useGameStore.getState().setPlayer(playerData);
                console.log('AuthContext: Successfully loaded player data for Base App user');
              }
            } catch (error) {
              console.error('Failed to load player data for Base App user:', error);
            }
          } else {
            console.log('AuthContext: No wallet or Base App user found in localStorage');
            setUser(null);
            setGameUser(null);
          }
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
            email: walletUser.email || `${walletUser.wallet_address}@wallet`,
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
          // Check for Base App user
          const baseAppUser = checkBaseAppUser();
          if (baseAppUser) {
            setUser(baseAppUser);
            setGameUser({
              id: baseAppUser.id,
              email: baseAppUser.email,
            });
            // Load player data for Base App user
            try {
              const playerData = await getPlayerData();
              if (playerData) {
                useGameStore.getState().setPlayer(playerData);
                console.log('AuthContext: Successfully loaded player data for Base App user after Supabase logout');
              }
            } catch (error) {
              console.error('Failed to load player data for Base App user after Supabase logout:', error);
            }
          } else {
            console.log('AuthContext: No wallet or Base App user found after Supabase logout');
            setUser(null);
            setGameUser(null);
            resetGame();
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  };

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

  const signUp = async (email: string, password: string, displayName?: string) => {
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
