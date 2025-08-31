'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '../../lib/store';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface AdventurerNamePromptProps {
  onComplete: (displayName: string) => void;
}

export function AdventurerNamePrompt({ onComplete }: AdventurerNamePromptProps) {
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { player } = useGameStore();
  const { user, session, loading } = useAuth();

  // Wait for authentication to be ready
  useEffect(() => {
    if (!loading && !user && !session) {
      setError('Authentication required. Please sign in to continue.');
    }
  }, [loading, user, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName.trim() || displayName.trim().length < 2 || displayName.trim().length > 20) {
      setError('Adventurer name must be between 2 and 20 characters.');
      return;
    }

    if (!user && !session) {
      setError('Authentication required. Please sign in to continue.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Get the current session token for authentication
      let authToken = '';
      if (session?.access_token) {
        authToken = session.access_token;
      } else if (user) {
        // If we have a user but no session, try to get a fresh session
        const { data: { session: freshSession } } = await supabase.auth.getSession();
        if (freshSession?.access_token) {
          authToken = freshSession.access_token;
        }
      }

      if (!authToken) {
        throw new Error('No authentication token available');
      }

      // Update the player's display name in the database
      const response = await fetch('/api/user/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          player: {
            display_name: displayName.trim(),
            level: player?.level || 1,
            xp: player?.xp || 0,
            coins: player?.coins || 0,
            sparks: player?.sparks || 0,
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update adventurer name');
      }

      // Update local store
      useGameStore.getState().updatePlayer({ 
        display_name: displayName.trim(),
        needsAdventurerName: false 
      });
      
      // Call the completion callback
      onComplete(displayName.trim());
      
    } catch (err) {
      console.error('Error updating adventurer name:', err);
      setError('Failed to save adventurer name. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while authentication is being determined
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-[#f5f5dc] border-4 border-[#8B4513] rounded-lg p-6 max-w-md w-full text-center">
          <div className="text-4xl mb-4">⚔️</div>
          <h2 className="text-2xl font-bold text-[#f2751a] mb-2">Loading...</h2>
          <p className="text-[#8B4513] text-sm">Preparing your adventure...</p>
        </div>
      </div>
    );
  }

  // Show error if no authentication
  if (!user && !session) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-[#f5f5dc] border-4 border-[#8B4513] rounded-lg p-6 max-w-md w-full text-center">
          <div className="text-4xl mb-4">⚔️</div>
          <h2 className="text-2xl font-bold text-[#f2751a] mb-2">Authentication Required</h2>
          <p className="text-[#8B4513] text-sm">Please sign in to continue your adventure.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#f5f5dc] border-4 border-[#8B4513] rounded-lg p-6 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">⚔️</div>
          <h2 className="text-2xl font-bold text-[#f2751a] mb-2">Name Your Adventurer</h2>
          <p className="text-[#8B4513] text-sm">
            Choose a name for your character to begin your journey!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-[#ef4444] text-white p-3 border-2 border-[#654321] text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="adventurerName" className="block text-sm font-medium mb-2 text-[#f2751a]">
              Adventurer Name
            </label>
            <input
              id="adventurerName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              maxLength={20}
              className="w-full pixel-input text-sm"
              placeholder="Enter your adventurer name"
              autoFocus
            />
            <div className="mt-1 flex justify-between items-center">
              <p className="text-xs text-[#8B4513]">
                Choose a name for your character (2-20 characters)
              </p>
              <span className="text-xs text-[#8B4513] font-medium">
                {displayName.length}/20
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !displayName.trim() || displayName.trim().length < 2}
            className="w-full pixel-button disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Begin Adventure'}
          </button>
        </form>
      </div>
    </div>
  );
}
