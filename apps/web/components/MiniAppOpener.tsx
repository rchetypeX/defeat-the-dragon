'use client';

import { useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

interface MiniAppOpenerProps {
  appId: string;
  appSlug: string;
  subPath?: string;
  queryParams?: Record<string, string>;
  children: React.ReactNode;
  className?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function MiniAppOpener({ 
  appId, 
  appSlug, 
  subPath, 
  queryParams, 
  children, 
  className = '',
  onSuccess,
  onError 
}: MiniAppOpenerProps) {
  const [isOpening, setIsOpening] = useState(false);

  const handleOpenMiniApp = async () => {
    try {
      setIsOpening(true);
      
      // Construct the Universal Link
      let universalLink = `https://farcaster.xyz/miniapps/${appId}/${appSlug}`;
      
      // Add sub-path if provided
      if (subPath) {
        universalLink += `/${subPath}`;
      }
      
      // Add query parameters if provided
      if (queryParams && Object.keys(queryParams).length > 0) {
        const params = new URLSearchParams(queryParams);
        universalLink += `?${params.toString()}`;
      }
      
      console.log('🔗 Opening Mini App:', universalLink);
      
      // Open the Mini App using the SDK
      await sdk.actions.openMiniApp(universalLink);
      
      console.log('✅ Mini App opened successfully');
      onSuccess?.();
      
    } catch (error) {
      console.error('❌ Failed to open Mini App:', error);
      onError?.(error as Error);
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <button
      onClick={handleOpenMiniApp}
      disabled={isOpening}
      className={`${className} ${isOpening ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
    >
      {isOpening ? (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
          <span>Opening...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}

// Hook to get current Mini App information
export function useMiniAppInfo() {
  const [appId, setAppId] = useState<string | null>(null);
  const [appSlug, setAppSlug] = useState<string | null>(null);
  const [universalLink, setUniversalLink] = useState<string | null>(null);

  // In a real implementation, you would get this from your manifest or environment
  // For now, we'll use placeholder values
  const getAppInfo = async () => {
    try {
      // You could fetch this from your manifest or environment variables
      const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://dtd.rchetype.xyz';
      
      // This would be your actual app ID and slug from Farcaster
      // For now, using placeholder values
      const currentAppId = 'your-app-id'; // Replace with actual app ID
      const currentAppSlug = 'defeat-the-dragon'; // Replace with actual app slug
      
      setAppId(currentAppId);
      setAppSlug(currentAppSlug);
      setUniversalLink(`https://farcaster.xyz/miniapps/${currentAppId}/${currentAppSlug}`);
      
    } catch (error) {
      console.error('Failed to get Mini App info:', error);
    }
  };

  return {
    appId,
    appSlug,
    universalLink,
    getAppInfo,
  };
}

// Component to copy Universal Link to clipboard
export function CopyUniversalLink({ 
  appId, 
  appSlug, 
  subPath, 
  queryParams,
  className = '',
  onSuccess,
  onError 
}: {
  appId: string;
  appSlug: string;
  subPath?: string;
  queryParams?: Record<string, string>;
  className?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const [isCopying, setIsCopying] = useState(false);

  const handleCopyLink = async () => {
    try {
      setIsCopying(true);
      
      // Construct the Universal Link
      let universalLink = `https://farcaster.xyz/miniapps/${appId}/${appSlug}`;
      
      // Add sub-path if provided
      if (subPath) {
        universalLink += `/${subPath}`;
      }
      
      // Add query parameters if provided
      if (queryParams && Object.keys(queryParams).length > 0) {
        const params = new URLSearchParams(queryParams);
        universalLink += `?${params.toString()}`;
      }
      
      // Copy to clipboard
      await navigator.clipboard.writeText(universalLink);
      
      console.log('✅ Universal Link copied to clipboard:', universalLink);
      onSuccess?.();
      
    } catch (error) {
      console.error('❌ Failed to copy Universal Link:', error);
      onError?.(error as Error);
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <button
      onClick={handleCopyLink}
      disabled={isCopying}
      className={`${className} ${isCopying ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
    >
      {isCopying ? (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
          <span>Copying...</span>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <span>🔗</span>
          <span>Copy Universal Link</span>
        </div>
      )}
    </button>
  );
}

// Predefined Mini App configurations
export const POPULAR_MINI_APPS = {
  YOINK: {
    appId: '12345', // Replace with actual Yoink app ID
    appSlug: 'yoink',
    name: 'Yoink',
    description: 'Social trading platform',
  },
  DRAKULA: {
    appId: '67890', // Replace with actual Drakula app ID
    appSlug: 'drakula',
    name: 'Drakula',
    description: 'Social media platform',
  },
  // Add more popular Mini Apps as needed
};

// Component to open popular Mini Apps
export function PopularMiniApps({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <h3 className="text-sm font-medium text-gray-700">Popular Mini Apps</h3>
      <div className="space-y-1">
        {Object.entries(POPULAR_MINI_APPS).map(([key, app]) => (
          <MiniAppOpener
            key={key}
            appId={app.appId}
            appSlug={app.appSlug}
            className="w-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            onSuccess={() => console.log(`✅ Opened ${app.name}`)}
            onError={(error) => console.error(`❌ Failed to open ${app.name}:`, error)}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{app.name}</div>
                <div className="text-xs text-gray-500">{app.description}</div>
              </div>
              <span>→</span>
            </div>
          </MiniAppOpener>
        ))}
      </div>
    </div>
  );
}
