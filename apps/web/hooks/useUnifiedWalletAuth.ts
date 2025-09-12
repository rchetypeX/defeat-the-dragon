'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useAuth } from '../contexts/AuthContext';
import { useSIWF } from '../contexts/SIWFContext';
import { useMiniKitSafe } from './useMiniKitSafe';
import { checkUSDCBalance } from '../lib/usdcPayment';

export interface UnifiedWalletState {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  connector: any;
  
  // Platform detection
  platform: 'baseapp' | 'farcaster' | 'web' | 'unknown';
  isBaseApp: boolean;
  isFarcaster: boolean;
  
  // Authentication state
  isAuthenticated: boolean;
  user: any;
  userId: string | null;
  
  // Wallet capabilities
  hasWallet: boolean;
  canConnect: boolean;
  supportsUSDC: boolean;
  
  // USDC balance
  usdcBalance: number | null;
  isCheckingBalance: boolean;
  
  // Error handling
  error: string | null;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  clearError: () => void;
}

/**
 * Unified wallet authentication hook that works across all platforms:
 * - Base App (with MiniKit integration)
 * - Farcaster (with SIWF integration) 
 * - Web Browser (with standard wallet connection)
 * - Supabase (fallback authentication)
 */
export function useUnifiedWalletAuth(): UnifiedWalletState {
  // Wagmi hooks for wallet connection
  const { address: wagmiAddress, isConnected: wagmiIsConnected, connector } = useAccount();
  const { connect: wagmiConnect, connectors } = useConnect();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  
  // Authentication contexts
  const supabaseAuth = useAuth();
  const siwfAuth = useSIWF();
  const miniKitData = useMiniKitSafe();
  
  // Local state
  const [isConnecting, setIsConnecting] = useState(false);
  const [platform, setPlatform] = useState<'baseapp' | 'farcaster' | 'web' | 'unknown'>('unknown');
  const [isBaseApp, setIsBaseApp] = useState(false);
  const [isFarcaster, setIsFarcaster] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Detect platform and environment
  useEffect(() => {
    const detectPlatform = () => {
      if (typeof window === 'undefined') {
        setPlatform('unknown');
        return;
      }
      
      // Check for Base App environment
      const isBaseAppEnv = miniKitData.context?.client?.clientFid === 795246 ||
        window.location.hostname.includes('base.org') ||
        window.navigator.userAgent.includes('BaseApp') ||
        window.location.search.includes('base_app=true');
      
      // Check for Farcaster environment
      const isFarcasterEnv = window.location.hostname.includes('farcaster.xyz') ||
        window.location.search.includes('farcaster') ||
        document.referrer.includes('farcaster') ||
        siwfAuth.isFarcaster;
      
      if (isBaseAppEnv) {
        setPlatform('baseapp');
        setIsBaseApp(true);
        setIsFarcaster(false);
      } else if (isFarcasterEnv) {
        setPlatform('farcaster');
        setIsBaseApp(false);
        setIsFarcaster(true);
      } else {
        setPlatform('web');
        setIsBaseApp(false);
        setIsFarcaster(false);
      }
    };
    
    detectPlatform();
  }, [miniKitData.context?.client?.clientFid, siwfAuth.isFarcaster]);
  
  // Determine connection state based on platform
  const isConnected = (() => {
    if (platform === 'baseapp') {
      // In Base App, check both MiniKit and Wagmi
      return (miniKitData.isAvailable && miniKitData.user) || wagmiIsConnected;
    } else if (platform === 'farcaster') {
      // In Farcaster, check SIWF and Wagmi
      return siwfAuth.isAuthenticated || wagmiIsConnected;
    } else {
      // In web browser, check Wagmi and Supabase
      return wagmiIsConnected || !!supabaseAuth.user;
    }
  })();
  
  // Determine wallet address based on platform
  const address = (() => {
    if (platform === 'baseapp') {
      // In Base App, prioritize native SIWF user address, then wallet connection
      if (miniKitData.user?.address) {
        return miniKitData.user.address;
      }
      // Fallback to connected wallet address
      if (wagmiAddress) {
        return wagmiAddress;
      }
    } else if (platform === 'farcaster' && wagmiAddress) {
      // For Farcaster, use the connected wallet address from Wagmi
      return wagmiAddress;
    } else if (wagmiAddress) {
      return wagmiAddress;
    } else if (supabaseAuth.user?.user_metadata?.wallet_address) {
      return supabaseAuth.user.user_metadata.wallet_address;
    }
    return null;
  })();
  
  // Determine user data based on platform
  const user = (() => {
    if (platform === 'baseapp' && miniKitData.user) {
      // Use Base App's native SIWF user data (cryptographically verified)
      return {
        id: `baseapp-${miniKitData.user.fid || 'unknown'}`,
        email: `${miniKitData.user.username || 'user'}@baseapp.local`,
        username: miniKitData.user.username,
        displayName: miniKitData.user.displayName,
        fid: miniKitData.user.fid,
        address: miniKitData.user.address || wagmiAddress, // Use SIWF address or fallback to wallet
        platform: 'baseapp'
      };
    } else if (platform === 'farcaster' && siwfAuth.user) {
      return {
        id: `farcaster-${siwfAuth.user.fid}`,
        email: `${siwfAuth.user.username}@farcaster.local`,
        username: siwfAuth.user.username,
        displayName: siwfAuth.user.displayName,
        fid: siwfAuth.user.fid,
        address: wagmiAddress, // Use the connected wallet address
        platform: 'farcaster'
      };
    } else if (supabaseAuth.user) {
      return {
        ...supabaseAuth.user,
        platform: 'supabase'
      };
    }
    return null;
  })();
  
  const userId = user?.id || null;
  const isAuthenticated = isConnected && !!user;
  
  // Check wallet capabilities
  const hasWallet = typeof window !== 'undefined' && !!window.ethereum;
  const canConnect = hasWallet && !isConnecting;
  const supportsUSDC = isConnected && !!address;
  
  // Check USDC balance
  const refreshBalance = useCallback(async () => {
    if (!address || !supportsUSDC) {
      setUsdcBalance(null);
      return;
    }
    
    setIsCheckingBalance(true);
    setError(null);
    
    try {
      const balanceCheck = await checkUSDCBalance(address, 0);
      setUsdcBalance(balanceCheck.currentBalance);
      setError(null); // Clear any previous errors
    } catch (err: any) {
      console.error('Failed to check USDC balance:', err);
      setUsdcBalance(null);
      
      // Provide more specific error messages
      if (err.message?.includes('Invalid wallet address')) {
        setError('Invalid wallet address. Please reconnect your wallet.');
      } else if (err.message?.includes('Wallet not connected')) {
        setError('Wallet not connected. Please connect your wallet first.');
      } else if (err.message?.includes('Invalid response from blockchain')) {
        setError('Blockchain error. Please try again in a moment.');
      } else if (err.message?.includes('Ethereum provider not available')) {
        // Don't show error for missing provider - this is expected in some environments
        console.warn('Ethereum provider not available, skipping USDC balance check');
        setError(null);
      } else {
        setError(`Failed to check USDC balance: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setIsCheckingBalance(false);
    }
  }, [address, supportsUSDC]);
  
  // Auto-refresh balance when address changes
  useEffect(() => {
    if (address && supportsUSDC) {
      refreshBalance();
    } else {
      setUsdcBalance(null);
    }
  }, [address, supportsUSDC, refreshBalance]);
  
  // Connect wallet based on platform
  const connect = useCallback(async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    setError(null);
    
    try {
      if (platform === 'baseapp') {
        // In Base App, try MiniKit first, then fallback to Wagmi
        if (miniKitData.signIn) {
          await miniKitData.signIn();
        } else {
          // Fallback to Wagmi with appropriate connector
          const miniAppConnector = connectors.find(c => c.id === 'farcasterMiniApp');
          const selectedConnector = miniAppConnector || connectors.find(c => c.id === 'injected') || connectors[0];
          await wagmiConnect({ connector: selectedConnector });
        }
      } else if (platform === 'farcaster') {
        // In Farcaster, try SIWF first, then fallback to Wagmi
        if (siwfAuth.signIn) {
          await siwfAuth.signIn();
        } else {
          const miniAppConnector = connectors.find(c => c.id === 'farcasterMiniApp');
          const selectedConnector = miniAppConnector || connectors.find(c => c.id === 'injected') || connectors[0];
          await wagmiConnect({ connector: selectedConnector });
        }
      } else {
        // In web browser, use standard wallet connection
        const selectedConnector = connectors.find(c => c.id === 'injected') || 
                                 connectors.find(c => c.id === 'metaMask') || 
                                 connectors[0];
        await wagmiConnect({ connector: selectedConnector });
      }
    } catch (err: any) {
      console.error('Wallet connection failed:', err);
      
      // Provide more specific error messages
      if (err.message?.includes('User rejected')) {
        setError('Connection was rejected. Please try again and approve the connection in your wallet.');
      } else if (err.message?.includes('No suitable connector found')) {
        setError('No compatible wallet found. Please install a Web3 wallet like MetaMask.');
      } else if (err.message?.includes('Base App authentication not available')) {
        setError('Base App authentication is not available. Please try again or use a different method.');
      } else if (err.message?.includes('SIWF authentication not available')) {
        setError('Farcaster authentication is not available. Please try again or use a different method.');
      } else {
        setError(`Connection failed: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setIsConnecting(false);
    }
  }, [platform, miniKitData.signIn, siwfAuth.signIn, wagmiConnect, connectors, isConnecting]);
  
  // Disconnect wallet
  const disconnect = useCallback(async () => {
    try {
      // Disconnect from all platforms
      if (wagmiIsConnected) {
        await wagmiDisconnect();
      }
      if (siwfAuth.signOut) {
        await siwfAuth.signOut();
      }
      if (supabaseAuth.signOut) {
        await supabaseAuth.signOut();
      }
      
      // Clear local state
      setUsdcBalance(null);
      setError(null);
    } catch (err: any) {
      console.error('Disconnect failed:', err);
      setError(`Disconnect failed: ${err.message}`);
    }
  }, [wagmiIsConnected, wagmiDisconnect, siwfAuth.signOut, supabaseAuth.signOut]);
  
  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  return {
    // Connection state
    isConnected,
    isConnecting,
    address,
    connector,
    
    // Platform detection
    platform,
    isBaseApp,
    isFarcaster,
    
    // Authentication state
    isAuthenticated,
    user,
    userId,
    
    // Wallet capabilities
    hasWallet,
    canConnect,
    supportsUSDC,
    
    // USDC balance
    usdcBalance,
    isCheckingBalance,
    
    // Error handling
    error,
    
    // Actions
    connect,
    disconnect,
    refreshBalance,
    clearError,
  };
}
