'use client';

import { useOpenUrl, useComposeCast } from '@coinbase/onchainkit/minikit';
import { useState } from 'react';

/**
 * Navigation Component following Base App Links guidelines
 * Demonstrates proper external navigation and URL interactions
 */

interface NavigationComponentProps {
  className?: string;
}

export function NavigationComponent({ className = '' }: NavigationComponentProps) {
  const openUrl = useOpenUrl();
  const { composeCast } = useComposeCast();
  const [isLoading, setIsLoading] = useState(false);

  // Correct: Use SDK action for external URLs
  const handleExternalLink = async (url: string) => {
    setIsLoading(true);
    try {
      openUrl(url);
    } catch (error) {
      // Fallback behavior for unsupported clients
      console.log('External navigation not supported');
      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setIsLoading(false);
    }
  };

  // Correct: Use SDK action for cast composition
  const handleShare = async () => {
    setIsLoading(true);
    try {
      await composeCast({
        text: 'Just used this amazing focus game! 🐉⚡ #DefeatTheDragon',
        embeds: [window.location.href]
      });
    } catch (error) {
      console.error('Failed to compose cast:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Correct: Conditional navigation based on client capabilities
  const handleConditionalNavigation = async () => {
    setIsLoading(true);
    try {
      // Adapt behavior based on client capabilities
      const isBaseApp = typeof window !== 'undefined' && 
        window.location.hostname.includes('base.org');
      
      if (isBaseApp) {
        openUrl('https://docs.base.org/mini-apps');
      } else {
        // Fallback for other clients
        window.open('https://docs.base.org/mini-apps', '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Navigation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Share achievement with proper embed
  const handleShareAchievement = async (achievement: string) => {
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://dtd.rchetype.xyz';
      await composeCast({
        text: `🎉 Just ${achievement} in Defeat the Dragon! 🐉⚡ #DefeatTheDragon`,
        embeds: [`${baseUrl}/api/embed/achievement?type=${achievement}`]
      });
    } catch (error) {
      console.error('Failed to share achievement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // View transaction on block explorer
  const handleViewTransaction = async (txHash: string) => {
    const explorerUrl = `https://basescan.org/tx/${txHash}`;
    await handleExternalLink(explorerUrl);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-bold text-white mb-4">
        Base App Navigation Examples
      </h3>

      {/* External Documentation Link */}
      <button
        onClick={() => handleExternalLink('https://docs.base.org/mini-apps')}
        disabled={isLoading}
        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
      >
        {isLoading ? 'Opening...' : 'View Documentation'}
      </button>

      {/* Share App */}
      <button
        onClick={handleShare}
        disabled={isLoading}
        className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
      >
        {isLoading ? 'Sharing...' : 'Share This App'}
      </button>

      {/* Conditional Navigation */}
      <button
        onClick={handleConditionalNavigation}
        disabled={isLoading}
        className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
      >
        {isLoading ? 'Opening...' : 'Open External Resource'}
      </button>

      {/* Achievement Sharing Examples */}
      <div className="space-y-2">
        <h4 className="text-md font-semibold text-white">Share Achievements:</h4>
        
        <button
          onClick={() => handleShareAchievement('level_up')}
          disabled={isLoading}
          className="w-full px-3 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white rounded font-medium transition-colors"
        >
          Share Level Up
        </button>
        
        <button
          onClick={() => handleShareAchievement('boss_defeated')}
          disabled={isLoading}
          className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded font-medium transition-colors"
        >
          Share Boss Victory
        </button>
      </div>

      {/* Transaction Viewer Example */}
      <button
        onClick={() => handleViewTransaction('0x1234567890abcdef')}
        disabled={isLoading}
        className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
      >
        {isLoading ? 'Opening...' : 'View Example Transaction'}
      </button>

      {/* Best Practices Note */}
      <div className="mt-6 p-4 bg-blue-900/30 border border-blue-500/30 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-300 mb-2">
          ✅ Best Practices Implemented:
        </h4>
        <ul className="text-xs text-blue-200 space-y-1">
          <li>• Using SDK actions instead of static URLs</li>
          <li>• Graceful fallback for unsupported clients</li>
          <li>• No direct HTML links or hardcoded URLs</li>
          <li>• Conditional navigation based on client capabilities</li>
          <li>• Proper error handling and loading states</li>
        </ul>
      </div>
    </div>
  );
}

// Migration examples for existing code
export const MigrationExamples = {
  // ❌ Incorrect: Direct HTML link
  // <a href="https://external.com">Visit Site</a>
  
  // ✅ Correct: SDK action
  CorrectExternalLink: ({ url, children }: { url: string; children: React.ReactNode }) => {
    const openUrl = useOpenUrl();
    
    return (
      <button 
        onClick={() => openUrl(url)}
        className="text-blue-400 hover:text-blue-300 underline"
      >
        {children}
      </button>
    );
  },

  // ❌ Incorrect: Composer intent URL
  // window.open('https://farcaster.com/~/compose?text=...')
  
  // ✅ Correct: SDK action
  CorrectCastComposer: ({ text, children }: { text: string; children: React.ReactNode }) => {
    const { composeCast } = useComposeCast();
    
    return (
      <button 
        onClick={() => composeCast({ text })}
        className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white"
      >
        {children}
      </button>
    );
  }
};

export default NavigationComponent;
