'use client';

import { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../../lib/store';
import { useAuth } from '../../contexts/AuthContext';

interface SettingsPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPopup: React.FC<SettingsPopupProps> = ({ isOpen, onClose }) => {
  const { player, updatePlayer } = useGameStore();
  const { signOut } = useAuth();
  const [displayName, setDisplayName] = useState(player?.display_name || '');
  const [isEditing, setIsEditing] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  // Update display name when player changes
  useEffect(() => {
    setDisplayName(player?.display_name || '');
  }, [player?.display_name]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Handle Escape key to close
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  const handleSaveName = () => {
    if (displayName.trim() && player) {
      updatePlayer({ display_name: displayName.trim() });
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setDisplayName(player?.display_name || '');
    setIsEditing(false);
  };

  const handleSignOut = async () => {
    try {
      // Clear all game data
      localStorage.removeItem('defeat-the-dragon-storage');
      localStorage.removeItem('defeat-the-dragon-store');
      
      // Sign out from Supabase
      await signOut();
      
      // Close the settings popup
      onClose();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div 
        ref={popupRef}
        className="bg-[#2d1b0e] border-2 border-[#8b4513] rounded-lg p-6 max-w-md w-full mx-4 pixel-art"
        style={{
          boxShadow: '0 0 20px rgba(139, 69, 19, 0.5)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#fbbf24]">⚙️ Settings</h2>
          <button
            onClick={onClose}
            className="text-[#fbbf24] hover:text-[#f2751a] text-xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Adventurer Name Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-[#fbbf24] mb-3">👤 Adventurer Name</h3>
          
          {!isEditing ? (
            <div className="flex items-center justify-between">
              <span className="text-white text-lg">{player?.display_name || 'Adventurer'}</span>
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1 bg-[#f2751a] hover:bg-[#e65a0a] transition-colors rounded text-white text-sm"
              >
                Edit
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full px-3 py-2 bg-[#1a1a2e] border border-[#8b4513] rounded text-white placeholder-gray-400 focus:outline-none focus:border-[#f2751a]"
                maxLength={20}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveName}
                  disabled={!displayName.trim()}
                  className="px-3 py-1 bg-[#22c55e] hover:bg-[#16a34a] disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors rounded text-white text-sm flex-1"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1 bg-[#6b7280] hover:bg-[#4b5563] transition-colors rounded text-white text-sm flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-[#8b4513] my-6"></div>

        {/* Sign Out Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-[#fbbf24] mb-3">🚪 Account</h3>
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-3 bg-[#dc2626] hover:bg-[#b91c1c] transition-colors rounded text-white font-semibold"
          >
            Sign Out
          </button>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-400">
          <p>Your progress will be saved locally</p>
        </div>
      </div>
    </div>
  );
};
