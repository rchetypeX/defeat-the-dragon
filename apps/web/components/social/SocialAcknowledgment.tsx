'use client';

import { useContextAware } from '../../hooks/useContextAware';
import { useState } from 'react';

export function SocialAcknowledgment() {
  const {
    isViralEntry,
    castAuthor,
    castText,
    thankSharer,
    viewSharerProfile,
  } = useContextAware();

  const [hasThanked, setHasThanked] = useState(false);
  const [isThanking, setIsThanking] = useState(false);

  // Only show for viral entries
  if (!isViralEntry || !castAuthor) {
    return null;
  }

  const handleThankSharer = async () => {
    setIsThanking(true);
    try {
      await thankSharer();
      setHasThanked(true);
    } catch (error) {
      console.error('Failed to thank sharer:', error);
    } finally {
      setIsThanking(false);
    }
  };

  return (
    <div className="fixed top-4 left-4 right-4 z-50">
      <div className="pixel-card p-4 border-2 border-[#8B4513] bg-[#f5f5dc] max-w-md mx-auto">
        {/* Sharer Info */}
        <div className="flex items-center mb-3">
          <img 
            src={castAuthor.pfpUrl} 
            alt={castAuthor.displayName}
            className="w-10 h-10 rounded-full mr-3 border-2 border-[#8B4513]"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="flex-1">
            <p className="text-sm font-bold text-[#8B4513]">
              @{castAuthor.username}
            </p>
            <p className="text-xs text-[#654321]">
              shared this focus game
            </p>
          </div>
        </div>

        {/* Cast Text */}
        {castText && (
          <div className="mb-3 p-2 bg-[#f0f0e0] border border-[#d4d4c4] rounded text-xs text-[#654321]">
            "{castText.length > 100 ? `${castText.substring(0, 100)}...` : castText}"
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={handleThankSharer}
            disabled={hasThanked || isThanking}
            className={`flex-1 px-3 py-2 text-sm font-bold rounded transition-colors ${
              hasThanked 
                ? 'bg-green-600 text-white cursor-not-allowed'
                : 'bg-[#f2751a] hover:bg-[#e65a0a] text-white'
            }`}
          >
            {isThanking ? 'Thanking...' : hasThanked ? 'Thanked! 🙏' : 'Thank them! 🙏'}
          </button>
          
          <button
            onClick={viewSharerProfile}
            className="px-3 py-2 bg-[#6b7280] hover:bg-[#4b5563] text-white text-sm font-bold rounded transition-colors"
          >
            Profile
          </button>
        </div>

        {/* Viral Growth Message */}
        <div className="mt-3 pt-3 border-t border-[#d4d4c4] text-center">
          <p className="text-xs text-[#654321]">
            🚀 Share your focus achievements to help others discover this game!
          </p>
        </div>
      </div>
    </div>
  );
}
