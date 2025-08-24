'use client';

import { useComposeCast } from '@coinbase/onchainkit/minikit';
import { useState } from 'react';

interface ComposeCastButtonProps {
  text?: string;
  includeEmbed?: boolean;
  embedUrl?: string;
  className?: string;
  children?: React.ReactNode;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export default function ComposeCastButton({
  text = 'Just completed an awesome focus session in Defeat the Dragon! 🐉⚡ #DefeatTheDragon',
  includeEmbed = true,
  embedUrl,
  className = '',
  children,
  onSuccess,
  onError,
}: ComposeCastButtonProps) {
  const { composeCast } = useComposeCast();
  const [isComposing, setIsComposing] = useState(false);

  const handleCompose = async () => {
    setIsComposing(true);
    
    try {
      const castOptions: any = { text };
      
      if (includeEmbed) {
        const embed = embedUrl || process.env.NEXT_PUBLIC_URL || 'https://dtd.rchetype.xyz';
        castOptions.embeds = [embed];
      }

      await composeCast(castOptions);
      console.log('✅ Cast composed successfully');
      onSuccess?.();
    } catch (error) {
      console.error('❌ Failed to compose cast:', error);
      onError?.(error);
    } finally {
      setIsComposing(false);
    }
  };

  const handleComposeWithEmbed = async () => {
    setIsComposing(true);
    
    try {
      const embed = embedUrl || process.env.NEXT_PUBLIC_URL || 'https://dtd.rchetype.xyz';
      
      await composeCast({
        text: 'Check out this amazing focus game! 🐉⚡ #DefeatTheDragon',
        embeds: [embed],
      });
      
      console.log('✅ Cast with embed composed successfully');
      onSuccess?.();
    } catch (error) {
      console.error('❌ Failed to compose cast with embed:', error);
      onError?.(error);
    } finally {
      setIsComposing(false);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <button
        onClick={handleCompose}
        disabled={isComposing}
        className={`
          px-4 py-2 rounded-lg font-bold text-white transition-all duration-200
          ${isComposing 
            ? 'bg-gray-600 cursor-not-allowed' 
            : 'bg-gradient-to-r from-[#f2751a] to-[#e65a0a] hover:from-[#e65a0a] hover:to-[#d1450a] active:scale-95'
          }
        `}
      >
        {isComposing ? 'Sharing...' : children || 'Share Achievement'}
      </button>
      
      {includeEmbed && (
        <button
          onClick={handleComposeWithEmbed}
          disabled={isComposing}
          className={`
            px-4 py-2 rounded-lg font-bold text-white transition-all duration-200
            ${isComposing 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:from-[#2563eb] hover:to-[#1d4ed8] active:scale-95'
            }
          `}
        >
          {isComposing ? 'Sharing...' : 'Share with Frame'}
        </button>
      )}
    </div>
  );
}
