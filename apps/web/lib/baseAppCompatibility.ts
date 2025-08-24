'use client';

/**
 * Base App Compatibility Checker
 * Following the official "Base App Compatibility" documentation
 */

import { useMiniKit } from '@coinbase/onchainkit/minikit';

// Base App Client FID (official identifier)
export const BASE_APP_CLIENT_FID = 309857;

// Supported chains in Base App
export const SUPPORTED_CHAINS = [
  'base',      // Base
  'mainnet',   // Ethereum Mainnet
  'optimism',  // Optimism
  'arbitrum',  // Arbitrum
  'polygon',   // Polygon
  'zora',      // Zora
  'bnb',       // BNB Chain
  'avalanche', // Avalanche C-Chain
];

// Currently unsupported features
export const UNSUPPORTED_FEATURES = [
  'notifications',           // Notifications not yet supported
  'addMiniApp',             // .addMiniApp() action
  'requestCameraAndMicrophoneAccess', // Camera/microphone access
];

export interface BaseAppCompatibilityInfo {
  // Client detection
  isBaseApp: boolean;
  clientFid: number | null;
  
  // Feature support
  supportsNotifications: boolean;
  supportsMiniAppActions: boolean;
  supportsCameraAccess: boolean;
  
  // Wallet integration
  supportsOnchainKit: boolean;
  supportsWagmi: boolean;
  supportsWindowEthereum: boolean;
  
  // Navigation support
  supportsOpenUrl: boolean;
  supportsComposeCast: boolean;
  supportsViewProfile: boolean;
  
  // Chain support
  supportedChains: string[];
  
  // Development info
  environment: 'development' | 'production';
  userAgent: string;
  hostname: string;
}

/**
 * Hook for checking Base App compatibility
 * Following official Base App detection guidelines
 */
export function useBaseAppCompatibility(): BaseAppCompatibilityInfo {
  const { context } = useMiniKit();
  
  // Official Base App detection
  const clientFid = context?.client?.clientFid || null;
  const isBaseApp = clientFid === BASE_APP_CLIENT_FID;
  
  // Environment detection
  const environment = process.env.NODE_ENV as 'development' | 'production';
  const userAgent = typeof window !== 'undefined' ? navigator.userAgent : '';
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  
  // Feature support (based on current Base App capabilities)
  const supportsNotifications = false; // Not yet supported
  const supportsMiniAppActions = false; // ETA 8/28
  const supportsCameraAccess = false; // ETA 8/28
  
  // Wallet integration support
  const supportsOnchainKit = true; // Always supported
  const supportsWagmi = true; // Works with Base App's injected provider
  const supportsWindowEthereum = true; // Direct access to Base App's provider
  
  // Navigation support
  const supportsOpenUrl = isBaseApp; // Use MiniKit hooks instead of manual deeplinks
  const supportsComposeCast = isBaseApp; // Use MiniKit hooks instead of composer URLs
  const supportsViewProfile = isBaseApp; // Use MiniKit hooks instead of profile deeplinks
  
  return {
    // Client detection
    isBaseApp,
    clientFid,
    
    // Feature support
    supportsNotifications,
    supportsMiniAppActions,
    supportsCameraAccess,
    
    // Wallet integration
    supportsOnchainKit,
    supportsWagmi,
    supportsWindowEthereum,
    
    // Navigation support
    supportsOpenUrl,
    supportsComposeCast,
    supportsViewProfile,
    
    // Chain support
    supportedChains: SUPPORTED_CHAINS,
    
    // Development info
    environment,
    userAgent,
    hostname,
  };
}

/**
 * Check if a specific feature is supported in Base App
 */
export function isFeatureSupported(feature: keyof BaseAppCompatibilityInfo): boolean {
  const compatibility = useBaseAppCompatibility();
  return compatibility[feature] as boolean;
}

/**
 * Get recommended wallet integration method for Base App
 */
export function getRecommendedWalletMethod(): 'onchainkit' | 'wagmi' | 'window' {
  const compatibility = useBaseAppCompatibility();
  
  if (compatibility.isBaseApp) {
    // In Base App, OnchainKit is recommended
    return 'onchainkit';
  } else {
    // In web browser, any method works
    return 'wagmi';
  }
}

/**
 * Get recommended navigation method for Base App
 */
export function getRecommendedNavigationMethod(): 'minikit' | 'manual' {
  const compatibility = useBaseAppCompatibility();
  
  if (compatibility.isBaseApp) {
    // In Base App, use MiniKit hooks
    return 'minikit';
  } else {
    // In web browser, manual navigation works
    return 'manual';
  }
}

/**
 * Check if current chain is supported in Base App
 */
export function isChainSupported(chainId: string | number): boolean {
  const chainName = typeof chainId === 'number' ? getChainName(chainId) : chainId;
  return SUPPORTED_CHAINS.includes(chainName.toLowerCase());
}

/**
 * Get chain name from chain ID
 */
function getChainName(chainId: number): string {
  const chainMap: Record<number, string> = {
    1: 'mainnet',
    10: 'optimism',
    137: 'polygon',
    8453: 'base',
    7777777: 'zora',
    56: 'bnb',
    43114: 'avalanche',
    42161: 'arbitrum',
  };
  
  return chainMap[chainId] || 'unknown';
}

/**
 * Development logging for Base App compatibility
 */
export function logBaseAppCompatibility(): void {
  if (process.env.NODE_ENV === 'development') {
    const compatibility = useBaseAppCompatibility();
    
    console.log('🔍 Base App Compatibility Check:', {
      isBaseApp: compatibility.isBaseApp,
      clientFid: compatibility.clientFid,
      environment: compatibility.environment,
      hostname: compatibility.hostname,
      supportedFeatures: {
        notifications: compatibility.supportsNotifications,
        miniAppActions: compatibility.supportsMiniAppActions,
        cameraAccess: compatibility.supportsCameraAccess,
        openUrl: compatibility.supportsOpenUrl,
        composeCast: compatibility.supportsComposeCast,
        viewProfile: compatibility.supportsViewProfile,
      },
      walletMethods: {
        onchainkit: compatibility.supportsOnchainKit,
        wagmi: compatibility.supportsWagmi,
        windowEthereum: compatibility.supportsWindowEthereum,
      },
      recommendedWallet: getRecommendedWalletMethod(),
      recommendedNavigation: getRecommendedNavigationMethod(),
    });
  }
}

/**
 * Utility for conditional feature rendering based on Base App support
 */
export function withBaseAppSupport<T>(
  baseAppComponent: T,
  webComponent: T,
  feature: keyof BaseAppCompatibilityInfo
): T {
  const compatibility = useBaseAppCompatibility();
  const isSupported = compatibility[feature] as boolean;
  
  return isSupported ? baseAppComponent : webComponent;
}

/**
 * Hook for Base App-specific wallet integration
 * Following official Base App wallet guidelines
 */
export function useBaseAppWallet() {
  const compatibility = useBaseAppCompatibility();
  
  const connectWallet = async () => {
    if (compatibility.isBaseApp) {
      // In Base App, use the recommended method
      if (compatibility.supportsOnchainKit) {
        // Use OnchainKit ConnectWallet component
        console.log('Using OnchainKit wallet connection in Base App');
      } else if (compatibility.supportsWagmi) {
        // Use Wagmi hooks with Base App's injected provider
        console.log('Using Wagmi wallet connection in Base App');
      } else if (compatibility.supportsWindowEthereum) {
        // Direct access to Base App's provider
        if (typeof window !== 'undefined' && window.ethereum) {
          await window.ethereum.request({
            method: 'eth_requestAccounts'
          });
        }
      }
    } else {
      // In web browser, use standard wallet connection
      console.log('Using standard wallet connection in web browser');
    }
  };
  
  return {
    connectWallet,
    isBaseApp: compatibility.isBaseApp,
    recommendedMethod: getRecommendedWalletMethod(),
  };
}

/**
 * Hook for Base App-specific navigation
 * Following official Base App navigation guidelines
 */
export function useBaseAppNavigation() {
  const compatibility = useBaseAppCompatibility();
  
  const openUrl = (url: string) => {
    if (compatibility.isBaseApp && compatibility.supportsOpenUrl) {
      // Use MiniKit useOpenUrl() instead of manual deeplinks
      console.log('Using MiniKit openUrl in Base App:', url);
    } else {
      // Fallback to standard navigation
      if (typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }
  };
  
  const composeCast = (text: string, embeds?: string[]) => {
    if (compatibility.isBaseApp && compatibility.supportsComposeCast) {
      // Use MiniKit useComposeCast() instead of composer URLs
      console.log('Using MiniKit composeCast in Base App:', text);
    } else {
      // Fallback to manual cast composition
      console.log('Using manual cast composition:', text);
    }
  };
  
  const viewProfile = (fid: string) => {
    if (compatibility.isBaseApp && compatibility.supportsViewProfile) {
      // Use MiniKit useViewProfile() instead of profile deeplinks
      console.log('Using MiniKit viewProfile in Base App:', fid);
    } else {
      // Fallback to manual profile viewing
      console.log('Using manual profile viewing:', fid);
    }
  };
  
  return {
    openUrl,
    composeCast,
    viewProfile,
    isBaseApp: compatibility.isBaseApp,
    recommendedMethod: getRecommendedNavigationMethod(),
  };
}

/**
 * Development notes and best practices
 */
export const BASE_APP_DEVELOPMENT_NOTES = {
  // Navigation best practices
  navigation: {
    do: [
      'Use openUrl() for external navigation',
      'Use composeCast() instead of composer URLs',
      'Use MiniKit hooks for all navigation',
    ],
    dont: [
      'Don\'t use manual Farcaster deeplinks',
      'Don\'t rely on location context for core flows',
      'Don\'t use direct HTML links',
    ],
  },
  
  // Wallet integration best practices
  wallet: {
    do: [
      'Use OnchainKit ConnectWallet component',
      'Use Wagmi hooks with Base App\'s injected provider',
      'Provide alternatives for haptic feedback',
    ],
    dont: [
      'Don\'t force immediate wallet connection',
      'Don\'t rely on unsupported features',
    ],
  },
  
  // Feature support timeline
  timeline: {
    'notifications': 'Coming soon',
    'addMiniApp': 'ETA 8/28',
    'requestCameraAndMicrophoneAccess': 'ETA 8/28',
  },
  
  // Detection methods
  detection: {
    primary: 'Check context.client.clientFid === 309857',
    fallback: 'Check hostname, user agent, or URL parameters',
  },
};

export default useBaseAppCompatibility;
