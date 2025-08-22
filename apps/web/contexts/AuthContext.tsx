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

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
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
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
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
        setGameUser(null);
        resetGame();
      }
    });

    return () => subscription.unsubscribe();
  }, [setGameUser, resetGame]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
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
          emailRedirectTo: `${window.location.origin}/auth/callback`,
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
    await supabase.auth.signOut();
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
