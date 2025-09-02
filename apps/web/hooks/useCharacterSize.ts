'use client';

import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../lib/store';
import { supabase } from '../lib/supabase';

export type CharacterSize = 'small' | 'medium' | 'large';

interface UseCharacterSizeReturn {
  characterSize: CharacterSize;
  setCharacterSize: (size: CharacterSize) => Promise<void>;
  resetToDefault: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useCharacterSize(): UseCharacterSizeReturn {
  const { user } = useGameStore();
  const [characterSize, setCharacterSizeState] = useState<CharacterSize>('small');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load character size preference from database or localStorage
  useEffect(() => {
    const loadCharacterSize = async () => {
      if (!user?.id) {
        // Fallback to localStorage for non-authenticated users
        const stored = localStorage.getItem('character-size');
        if (stored && ['small', 'medium', 'large'].includes(stored)) {
          setCharacterSizeState(stored as CharacterSize);
        }
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Try to get from database first
        const { data, error: dbError } = await supabase
          .from('user_settings')
          .select('character_size')
          .eq('user_id', user.id)
          .single();

        if (dbError && dbError.code !== 'PGRST116') {
          // PGRST116 is "no rows returned", which is fine for new users
          console.warn('Could not load character size from database:', dbError);
        }

        if (data?.character_size) {
          setCharacterSizeState(data.character_size as CharacterSize);
          // Also store in localStorage as backup
          localStorage.setItem('character-size', data.character_size);
        } else {
          // Default to small for new users
          setCharacterSizeState('small');
          localStorage.setItem('character-size', 'small');
        }
      } catch (err) {
        console.error('Error loading character size:', err);
        setError('Failed to load character size preference');
        
        // Fallback to localStorage
        const stored = localStorage.getItem('character-size');
        if (stored && ['small', 'medium', 'large'].includes(stored)) {
          setCharacterSizeState(stored as CharacterSize);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadCharacterSize();
  }, [user?.id]);

  // Update character size preference
  const setCharacterSize = useCallback(async (size: CharacterSize) => {
    try {
      setIsLoading(true);
      setError(null);

      // Update local state immediately
      setCharacterSizeState(size);
      localStorage.setItem('character-size', size);

      // Update database if user is authenticated
      if (user?.id) {
        const { error: dbError } = await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            character_size: size,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (dbError) {
          console.warn('Could not save character size to database:', dbError);
          setError('Failed to save preference to cloud');
        }
      }

      // Apply size class to body for CSS variables
      document.body.classList.remove('character-size-small', 'character-size-medium', 'character-size-large');
      document.body.classList.add(`character-size-${size}`);

    } catch (err) {
      console.error('Error setting character size:', err);
      setError('Failed to update character size');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Reset to default size (small)
  const resetToDefault = useCallback(async () => {
    await setCharacterSize('small');
  }, [setCharacterSize]);

  // Apply size class when component mounts or size changes
  useEffect(() => {
    document.body.classList.remove('character-size-small', 'character-size-medium', 'character-size-large');
    document.body.classList.add(`character-size-${characterSize}`);
  }, [characterSize]);

  return {
    characterSize,
    setCharacterSize,
    resetToDefault,
    isLoading,
    error
  };
}
