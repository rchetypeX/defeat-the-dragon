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
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });
    return { error };
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
