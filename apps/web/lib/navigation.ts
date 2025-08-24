'use client';

/**
 * Base App compliant navigation utilities
 * Following the official "Links" documentation guidelines
 */

// Types for navigation actions
export interface NavigationContext {
  isBaseApp: boolean;
  clientSupportsOpenUrl: boolean;
  clientSupportsComposeCast: boolean;
}

// Navigation utilities following Base App best practices
export class BaseAppNavigation {
  private context: NavigationContext;

  constructor(context: NavigationContext) {
    this.context = context;
  }

  /**
   * Open external URL using SDK action (recommended approach)
   * Follows: "Always use official SDK functions instead of static URLs"
   */
  async openExternalUrl(url: string): Promise<boolean> {
    try {
      // Import dynamically to avoid SSR issues
      const { useOpenUrl } = await import('@coinbase/onchainkit/minikit');
      
      // Use SDK action for cross-client compatibility
      const openUrl = useOpenUrl();
      openUrl(url);
      
      return true;
    } catch (error) {
      console.warn('SDK openUrl failed, using fallback:', error);
      
      // Fallback behavior for unsupported clients
      if (typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
        return true;
      }
      
      return false;
    }
  }

  /**
   * Compose cast using SDK action (recommended approach)
   * Follows: "Use sdk.actions.composeCast() instead of composer intent URLs"
   */
  async composeCast(options: {
    text: string;
    embeds?: [string] | [string, string] | [];
    parent?: { type: 'cast'; hash: string };
  }): Promise<boolean> {
    try {
      // Import dynamically to avoid SSR issues
      const { useComposeCast } = await import('@coinbase/onchainkit/minikit');
      
      // Use SDK action for cross-client compatibility
      const { composeCast } = useComposeCast();
      await composeCast(options);
      
      return true;
    } catch (error) {
      console.warn('SDK composeCast failed:', error);
      
      // No reliable fallback for cast composition
      // Following guidelines: "Don't hardcode URLs specific to particular clients"
      return false;
    }
  }

  /**
   * Handle conditional navigation based on client capabilities
   * Follows: "Adapt behavior based on client capabilities"
   */
  async handleConditionalNavigation(
    primaryUrl: string,
    fallbackUrl?: string
  ): Promise<boolean> {
    if (this.context.isBaseApp && this.context.clientSupportsOpenUrl) {
      // Use Base App's native navigation
      return await this.openExternalUrl(primaryUrl);
    } else if (fallbackUrl) {
      // Use fallback for other clients
      return await this.openExternalUrl(fallbackUrl);
    } else {
      // Use primary URL as fallback
      return await this.openExternalUrl(primaryUrl);
    }
  }

  /**
   * Safe link handler that prevents direct HTML links
   * Follows: "Avoid using direct HTML links (<a href="">, <Link href="">)"
   */
  createSafeLinkHandler(url: string, onClick?: () => void) {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      
      // Call custom onClick if provided
      onClick?.();
      
      // Use SDK action instead of direct navigation
      this.openExternalUrl(url);
    };
  }

  /**
   * Share content with proper embed handling
   * Follows Base App sharing best practices
   */
  async shareContent(options: {
    text: string;
    embedUrl?: string;
    customEmbed?: string;
  }): Promise<boolean> {
    const { text, embedUrl, customEmbed } = options;
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://dtd.rchetype.xyz';
    
    let embeds: [string] | [] = [];
    if (customEmbed) {
      embeds = [customEmbed];
    } else if (embedUrl) {
      embeds = [embedUrl];
    } else {
      embeds = [baseUrl];
    }

    return await this.composeCast({
      text,
      embeds
    });
  }
}

// Utility functions for common navigation patterns
export const navigationPatterns = {
  /**
   * Documentation link handler
   */
  openDocumentation: (navigation: BaseAppNavigation) => {
    return () => navigation.openExternalUrl('https://docs.base.org/mini-apps');
  },

  /**
   * Share app handler
   */
  shareApp: (navigation: BaseAppNavigation, customText?: string) => {
    return () => navigation.shareContent({
      text: customText || 'Check out this amazing focus game! 🐉⚡ #DefeatTheDragon',
    });
  },

  /**
   * View transaction handler
   */
  viewTransaction: (navigation: BaseAppNavigation, txHash: string) => {
    return () => navigation.openExternalUrl(`https://basescan.org/tx/${txHash}`);
  },

  /**
   * Social profile handler (when available)
   */
  viewProfile: (navigation: BaseAppNavigation, profileUrl: string) => {
    return () => navigation.openExternalUrl(profileUrl);
  }
};

// Hook for using Base App navigation
export function useBaseAppNavigation(): BaseAppNavigation {
  // Detect Base App environment
  const isBaseApp = typeof window !== 'undefined' && 
    (window.location.hostname.includes('base.org') || 
     window.navigator.userAgent.includes('BaseApp') ||
     window.location.search.includes('base_app=true'));

  // Assume SDK support in Base App environment
  const context: NavigationContext = {
    isBaseApp,
    clientSupportsOpenUrl: isBaseApp,
    clientSupportsComposeCast: isBaseApp,
  };

  return new BaseAppNavigation(context);
}

// Migration helpers for updating existing code
export const migrationHelpers = {
  /**
   * Replace direct HTML links with SDK actions
   */
  replaceLinkWithAction: (url: string, navigation: BaseAppNavigation) => {
    // Instead of: <a href="https://external.com">Visit Site</a>
    // Use: <button onClick={migrationHelpers.replaceLinkWithAction(url, navigation)}>Visit Site</button>
    return navigation.createSafeLinkHandler(url);
  },

  /**
   * Replace composer intent URLs with SDK actions
   */
  replaceComposerIntent: (text: string, navigation: BaseAppNavigation) => {
    // Instead of: window.open('https://farcaster.com/~/compose?text=...')
    // Use: migrationHelpers.replaceComposerIntent(text, navigation)
    return () => navigation.composeCast({ text });
  },

  /**
   * Replace Farcaster-specific deeplinks with SDK actions
   */
  replaceFarcasterDeeplink: (navigation: BaseAppNavigation) => {
    // Use appropriate SDK action when available
    console.warn('Farcaster deeplinks should be replaced with SDK actions when available');
    return () => console.log('SDK action not yet available for this use case');
  }
};

export default BaseAppNavigation;
