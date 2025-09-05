'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAccount, useConnect } from 'wagmi';

// Base App integration - conditional imports to prevent SSR issues
let useAuthenticate: any = null;
let useMiniKit: any = null;

if (typeof window !== 'undefined') {
  try {
    const minikit = require('@coinbase/onchainkit/minikit');
    useAuthenticate = minikit.useAuthenticate;
    useMiniKit = minikit.useMiniKit;
  } catch (error) {
    console.warn('MiniKit not available:', error);
  }
}

export function useWalletAuth() {
  // Use wagmi hooks for wallet connection
  const { address: wagmiAddress, isConnected: wagmiIsConnected } = useAccount();
  const { connect, connectors } = useConnect();
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [hasAccount, setHasAccount] = useState<boolean | null>(null);
  const [isCheckingAccount, setIsCheckingAccount] = useState(false);
  const [availableAccounts, setAvailableAccounts] = useState<string[]>([]);
  const [isSwitchingWallet, setIsSwitchingWallet] = useState(false);
  const [manualDisconnect, setManualDisconnect] = useState(false); // Flag to prevent auto-reconnection
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [showProviderSelection, setShowProviderSelection] = useState(false);
  
  // Base App integration
  const [isBaseApp, setIsBaseApp] = useState(false);
  const [baseAppUser, setBaseAppUser] = useState<any>(null);
  
  // Use MiniKit hooks safely for SSR
  let miniKitResult: any = null;
  let baseAppContext: any = null;
  
  if (useMiniKit) {
    try {
      miniKitResult = useMiniKit();
      baseAppContext = miniKitResult?.context || null;
    } catch (error) {
      // MiniKit not available during SSR/SSG
      console.warn('MiniKit not available during build:', error);
    }
  }

  // Sync wagmi state with local state
  useEffect(() => {
    if (wagmiAddress && wagmiIsConnected) {
      setAddress(wagmiAddress);
      setIsConnected(true);
      setAvailableAccounts([wagmiAddress]);
      checkAccountExists(wagmiAddress);
    } else if (!wagmiIsConnected && !manualDisconnect) {
      // Only reset if not manually disconnected
      setAddress(null);
      setIsConnected(false);
      setAvailableAccounts([]);
      setHasAccount(null);
    }
  }, [wagmiAddress, wagmiIsConnected, manualDisconnect]);

  // Check if we're in Base App environment
  const detectBaseApp = () => {
    if (typeof window === 'undefined') return;
    
    try {
      // Check for Base App specific indicators
      const hasBaseAppContext = window.location.hostname.includes('base.org') || 
                               window.navigator.userAgent.includes('BaseApp') ||
                               window.location.search.includes('base_app=true');
      
      if (hasBaseAppContext || baseAppContext) {
        setIsBaseApp(true);
        console.log('🔍 Base App environment detected');
        
        // Use proper clientFid detection as per documentation
        const isBaseAppClient = baseAppContext?.client?.clientFid === 309857;
        if (isBaseAppClient) {
          console.log('✅ Confirmed Base App via clientFid:', baseAppContext.client.clientFid);
          
          if (baseAppContext?.user) {
            setBaseAppUser(baseAppContext.user);
            console.log('🔐 Base App user detected:', baseAppContext.user);
            
            // For Base App users, we'll use the user's FID as the identifier
            // The wallet connection will be handled by the Base App itself
            console.log('🔐 Base App user authenticated:', baseAppContext.user.fid);
          }
        } else {
          // Not actually Base App despite having MiniKit
          setIsBaseApp(false);
          console.log('⚠️ MiniKit available but not Base App, clientFid:', baseAppContext?.client?.clientFid);
        }
      } else {
        // Regular browser environment
        setIsBaseApp(false);
        console.log('🌐 Browser environment detected');
      }
    } catch (error) {
      console.warn('Error detecting Base App:', error);
      setIsBaseApp(false);
    }
  };

  // Initialize Base App detection on mount
  useEffect(() => {
    detectBaseApp();
  }, []);

  // Watch for Base App context changes
  useEffect(() => {
    if (baseAppContext?.user && !baseAppUser) {
      setBaseAppUser(baseAppContext.user);
      console.log('🔐 Base App user updated:', baseAppContext.user);
      
      // If we have a Base App user, check if they have an account
      if (baseAppContext.user.fid) {
        checkAccountExistsForBaseApp(baseAppContext.user.fid.toString());
      }
    }
  }, [baseAppContext?.user, baseAppUser]);

  // Check if MetaMask is available
  const checkIfWalletIsConnected = async () => {
    try {
      if (typeof window !== 'undefined') {
        // For Base App users, we don't need to check external wallets
        if (isBaseApp && baseAppContext?.user) {
          console.log('🔐 Base App user already authenticated:', baseAppContext.user.fid);
          setIsConnected(true);
          // Check if this Base App user has an account
          if (baseAppContext.user?.fid) {
            await checkAccountExistsForBaseApp(baseAppContext.user.fid.toString());
          }
          return;
        }
        
        // For regular browser users, detect available wallet providers
        const providers = [];
        if (window.ethereum) {
          providers.push('MetaMask');
        }
        if (window.coinbaseWalletExtension) {
          providers.push('Coinbase Wallet');
        }
        if (window.phantom?.ethereum) {
          providers.push('Phantom');
        }
        if (window.trustwallet) {
          providers.push('Trust Wallet');
        }
        
        setAvailableProviders(providers);
        console.log('Available wallet providers:', providers);

        // If only one provider, auto-select it
        if (providers.length === 1) {
          setSelectedProvider(providers[0]);
        }

        // Use the selected provider or default to ethereum
        const provider = getProvider();
        if (provider) {
          const accounts = await provider.request({ method: 'eth_accounts' });
          setAvailableAccounts(accounts);
          
          // Only auto-connect if user hasn't manually disconnected
          if (accounts.length > 0 && !manualDisconnect) {
            setAddress(accounts[0]);
            setIsConnected(true);
            // Check if this wallet has an account
            await checkAccountExists(accounts[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  // Get the selected provider
  const getProvider = () => {
    console.log('getProvider called with selectedProvider:', selectedProvider);
    
    // If we're in Base App, prioritize the Base App wallet
    if (isBaseApp) {
      const baseAppProvider = getBaseAppWalletProvider();
      if (baseAppProvider) {
        console.log('🔐 Using Base App wallet provider');
        return baseAppProvider;
      }
    }
    
    if (!selectedProvider) {
      console.log('No selectedProvider, returning window.ethereum');
      return window.ethereum;
    }
    
    let provider: any = null;
    switch (selectedProvider) {
      case 'MetaMask':
        provider = window.ethereum;
        break;
      case 'Coinbase Wallet':
        provider = window.coinbaseWalletExtension;
        break;
      case 'Phantom':
        provider = window.phantom?.ethereum;
        break;
      case 'Trust Wallet':
        provider = window.trustwallet;
        break;
      default:
        provider = window.ethereum;
    }
    
    console.log(`getProvider returning ${selectedProvider}:`, provider);
    return provider;
  };

  // Base App authentication
  const authenticateWithBaseApp = async () => {
    if (!useAuthenticate) {
      throw new Error('Base App authentication not available');
    }
    
    try {
      setIsConnecting(true);
      setAuthError(null);
      
      console.log('🔐 Starting Base App authentication...');
      
      // Use MiniKit's authenticate method
      const { signIn } = useAuthenticate();
      await signIn();
      
      console.log('✅ Base App authentication successful');
      
      // The context will be updated automatically by MiniKit
      // We'll handle the user data in the useEffect that watches baseAppContext
      
    } catch (error) {
      console.error('❌ Base App authentication failed:', error);
      setAuthError(error instanceof Error ? error.message : 'Base App authentication failed');
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  // Get Base App wallet provider for signing transactions
  const getBaseAppWalletProvider = () => {
    if (!isBaseApp || !baseAppContext?.user) {
      return null;
    }
    
    // Return the Base App wallet provider
    return {
      request: async (method: string, params: any[]) => {
        console.log('🔐 Base App wallet request:', method, params);
        
        // For Base App, signing is handled by the Base App itself
        // We'll return a mock signature for now since Base App handles this internally
        console.log('Base App signing request:', method, params);
        return '0x' + '0'.repeat(130); // Mock signature
      }
    };
  };

  // Helper function to check if an address is a Base App identifier
  const isBaseAppIdentifier = (addr: string | null): boolean => {
    return addr ? addr.startsWith('baseapp:') : false;
  };

  // Helper function to extract FID from Base App identifier
  const extractFidFromBaseAppIdentifier = (addr: string | null): string | null => {
    if (!addr || !addr.startsWith('baseapp:')) return null;
    return addr.replace('baseapp:', '');
  };

  // Check if a Base App user has an existing account
  const checkAccountExistsForBaseApp = async (fid: string) => {
    try {
      setIsCheckingAccount(true);
      
      console.log('🔍 Checking if Base App user has account, FID:', fid);
      
      // Check if there's a player record with this Farcaster ID
      const { data: player, error } = await supabase
        .from('players')
        .select('id, user_id, display_name, farcaster_fid')
        .eq('farcaster_fid', fid)
        .maybeSingle();
      
      if (error) {
        console.error('Error checking Base App account:', error);
        return;
      }
      
      if (player) {
        console.log('✅ Base App user has existing account:', player);
        setHasAccount(true);
        // For Base App users, use a special identifier format to prevent UUID mismatches
        // This will be used for UI purposes but won't be used in database queries
        setAddress(`baseapp:${fid}`);
        setIsConnected(true);
      } else {
        console.log('❌ Base App user has no existing account, FID:', fid);
        setHasAccount(false);
        setIsConnected(false);
        // For new Base App users, set a temporary identifier
        setAddress(`baseapp:${fid}`);
      }
    } catch (error) {
      console.error('Error checking Base App account:', error);
    } finally {
      setIsCheckingAccount(false);
    }
  };

  // Check if a wallet address has an existing account
  const checkAccountExists = async (walletAddress: string) => {
    if (!walletAddress) return;
    
    setIsCheckingAccount(true);
    try {
      const response = await fetch('/api/auth/check-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: walletAddress }),
      });

      const result = await response.json();
      setHasAccount(result.hasAccount);
    } catch (error) {
      console.error('Error checking account:', error);
      setHasAccount(null);
    } finally {
      setIsCheckingAccount(false);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [manualDisconnect]); // Re-run when manualDisconnect changes

  // Reset manual disconnect flag when component mounts (e.g., when switching tabs)
  useEffect(() => {
    setManualDisconnect(false);
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const provider = getProvider();
      if (!provider) return;

      const handleAccountsChanged = async (accounts: string[]) => {
        console.log('Accounts changed:', accounts, 'manualDisconnect:', manualDisconnect);
        
        // If we manually disconnected, don't auto-reconnect
        if (manualDisconnect) {
          console.log('Ignoring accountsChanged due to manual disconnect');
          return;
        }
        
        setAvailableAccounts(accounts);
        if (accounts.length === 0) {
          // User disconnected wallet
          setAddress(null);
          setIsConnected(false);
          setHasAccount(null);
          setAuthError(null);
        } else {
          // User switched accounts
          setAddress(accounts[0]);
          setIsConnected(true);
          setAuthError(null);
          await checkAccountExists(accounts[0]);
        }
      };

      const handleDisconnect = () => {
        console.log('Wallet disconnected by user');
        setAddress(null);
        setIsConnected(false);
        setHasAccount(null);
        setAuthError(null);
        setAvailableAccounts([]);
        setManualDisconnect(true); // Set flag when MetaMask disconnects
      };

      provider.on('accountsChanged', handleAccountsChanged);
      provider.on('disconnect', handleDisconnect);

      return () => {
        provider.removeListener('accountsChanged', handleAccountsChanged);
        provider.removeListener('disconnect', handleDisconnect);
      };
    }
  }, [manualDisconnect, selectedProvider]); // Add selectedProvider to dependency array

  const selectProvider = async (providerName: string) => {
    setSelectedProvider(providerName);
    setShowProviderSelection(false);
    setAuthError(null);
    
    // Immediately start the connection process with the selected provider
    setIsConnecting(true);
    
    try {
      // Get the provider directly based on the selected name, not from state
      let provider: any = null;
      switch (providerName) {
        case 'MetaMask':
          provider = window.ethereum;
          break;
        case 'Coinbase Wallet':
          provider = window.coinbaseWalletExtension;
          break;
        case 'Phantom':
          provider = window.phantom?.ethereum;
          break;
        case 'Trust Wallet':
          provider = window.trustwallet;
          break;
        default:
          provider = window.ethereum;
      }

      if (!provider) {
        throw new Error(`No ${providerName} provider available`);
      }

      console.log(`Connecting to ${providerName}...`);
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      setAvailableAccounts(accounts);
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
        await checkAccountExists(accounts[0]);
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      setAuthError('Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const cancelProviderSelection = () => {
    setShowProviderSelection(false);
    setAuthError(null);
  };

  const connectWallet = async () => {
    if (typeof window === 'undefined') {
      setAuthError('No wallet found. Please install a Web3 wallet.');
      return;
    }

    // For Base App users, use wagmi with injected connector
    if (isBaseApp) {
      console.log('🔐 Base App user detected, using wagmi with injected connector');
      setIsConnecting(true);
      setAuthError(null);
      setManualDisconnect(false);

      try {
        // In Base App, the wallet is automatically connected via injected provider
        // We just need to connect using wagmi's injected connector
        const injectedConnector = connectors.find(connector => connector.id === 'injected');
        if (injectedConnector) {
          await connect({ connector: injectedConnector });
        } else {
          throw new Error('Injected connector not found');
        }
      } catch (error) {
        console.error('Base App wallet connection failed:', error);
        setAuthError('Failed to connect wallet in Base App. Please try again.');
      } finally {
        setIsConnecting(false);
      }
      return;
    }

    // Check for available providers (only for regular browser users)
    const providers = [];
    console.log('Checking for wallet providers...');
    console.log('window.ethereum:', !!window.ethereum);
    console.log('window.coinbaseWalletExtension:', !!window.coinbaseWalletExtension);
    console.log('window.phantom?.ethereum:', !!window.phantom?.ethereum);
    console.log('window.trustwallet:', !!window.trustwallet);
    
    if (window.ethereum) {
      providers.push('MetaMask');
    }
    if (window.coinbaseWalletExtension) {
      providers.push('Coinbase Wallet');
    }
    if (window.phantom?.ethereum) {
      providers.push('Phantom');
    }
    if (window.trustwallet) {
      providers.push('Trust Wallet');
    }
    
    console.log('Available providers:', providers);

    if (providers.length === 0) {
      setAuthError('No wallet found. Please install MetaMask or another Web3 wallet.');
      return;
    }

    // If a provider is already selected, connect immediately
    if (selectedProvider) {
      setIsConnecting(true);
      setAuthError(null);
      setManualDisconnect(false); // Reset flag when user explicitly connects

      try {
        const provider = getProvider();
        if (!provider) {
          throw new Error('No wallet provider available');
        }

        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        setAvailableAccounts(accounts);
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
          await checkAccountExists(accounts[0]);
        }
      } catch (error) {
        console.error('Wallet connection error:', error);
        setAuthError('Failed to connect wallet. Please try again.');
      } finally {
        setIsConnecting(false);
      }
      return;
    }

    // If multiple providers and none selected, show selection
    if (providers.length > 1) {
      setAvailableProviders(providers);
      setShowProviderSelection(true);
      return;
    }

    // If only one provider, auto-select it and connect
    if (providers.length === 1) {
      setSelectedProvider(providers[0]);
      setIsConnecting(true);
      setAuthError(null);
      setManualDisconnect(false); // Reset flag when user explicitly connects

      try {
        const provider = getProvider();
        if (!provider) {
          throw new Error('No wallet provider available');
        }

        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        setAvailableAccounts(accounts);
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
          await checkAccountExists(accounts[0]);
        }
      } catch (error) {
        console.error('Wallet connection error:', error);
        setAuthError('Failed to connect wallet. Please try again.');
      } finally {
        setIsConnecting(false);
      }
    }
  };

  const disconnectWallet = async () => {
    try {
      // Clear local storage
      localStorage.removeItem('walletUser');
      
      // Clear the cookie
      document.cookie = 'wallet-user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      // Reset all state
      setAddress(null);
      setIsConnected(false);
      setHasAccount(null);
      setAuthError(null);
      setAvailableAccounts([]);
      setIsConnecting(false);
      setIsSwitchingWallet(false);
      setIsCheckingAccount(false);
      setManualDisconnect(true); // Set flag to prevent auto-reconnection
      setSelectedProvider(null); // Clear selected provider so wallet selection shows again
      
      console.log('Wallet disconnected - all state cleared, selectedProvider reset');
      
      // Note: We can't programmatically disconnect MetaMask
      // The user needs to disconnect manually from their wallet
      // But we can clear our local state
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  const switchWallet = async () => {
    setIsSwitchingWallet(true);
    setAuthError(null);
    setManualDisconnect(false); // Reset flag when switching wallets
    
    try {
      // First disconnect current wallet
      await disconnectWallet();
      
      // Show wallet selection instead of auto-connecting
      // This allows user to choose a different provider
      const providers = [];
      if (window.ethereum) providers.push('MetaMask');
      if (window.coinbaseWalletExtension) providers.push('Coinbase Wallet');
      if (window.phantom?.ethereum) providers.push('Phantom');
      if (window.trustwallet) providers.push('Trust Wallet');
      
      if (providers.length > 1) {
        setAvailableProviders(providers);
        setShowProviderSelection(true);
      } else if (providers.length === 1) {
        // Auto-select the only available provider
        setSelectedProvider(providers[0]);
        const provider = getProvider();
        if (provider) {
          const accounts = await provider.request({ method: 'eth_requestAccounts' });
          setAvailableAccounts(accounts);
          if (accounts.length > 0) {
            setAddress(accounts[0]);
            setIsConnected(true);
            await checkAccountExists(accounts[0]);
            console.log('Switched to new wallet:', accounts[0]);
          }
        }
      }
    } catch (error) {
      console.error('Wallet switching error:', error);
      setAuthError('Failed to switch wallet. Please try again.');
    } finally {
      setIsSwitchingWallet(false);
    }
  };

  const switchToSpecificAccount = async (targetAddress: string) => {
    setIsSwitchingWallet(true);
    setAuthError(null);
    setManualDisconnect(false); // Reset flag when switching accounts
    
    try {
      // Check if the target address is in available accounts
      if (availableAccounts.includes(targetAddress)) {
        setAddress(targetAddress);
        setIsConnected(true);
        await checkAccountExists(targetAddress);
        console.log('Switched to specific account:', targetAddress);
      } else {
        // If the target address is not in available accounts, 
        // we need to request new accounts from MetaMask
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAvailableAccounts(accounts);
        
        if (accounts.includes(targetAddress)) {
          setAddress(targetAddress);
          setIsConnected(true);
          await checkAccountExists(targetAddress);
          console.log('Switched to specific account after request:', targetAddress);
        } else {
          setAuthError('Selected wallet not found. Please make sure it\'s connected in MetaMask.');
        }
      }
    } catch (error) {
      console.error('Account switching error:', error);
      setAuthError('Failed to switch to selected wallet.');
    } finally {
      setIsSwitchingWallet(false);
    }
  };

  const signInWithWallet = async () => {
    if (!address) {
      setAuthError('Please connect your wallet first.');
      return;
    }

    setIsConnecting(true);
    setAuthError(null);

    try {
      // Create a message to sign
      const message = `Sign in to Defeat the Dragon\n\nWallet: ${address}\nTimestamp: ${Date.now()}`;
      
      // Sign the message using the selected provider
      const provider = getProvider();
      if (!provider) {
        throw new Error('No wallet provider available');
      }
      
            console.log('Requesting signature from wallet...');
      console.log('Provider type:', isBaseApp ? 'Base App Wallet' : 'External Wallet');
      
      let signature;
      try {
        // Try the standard personal_sign method first
        signature = await provider.request({
          method: 'personal_sign',
          params: [message, address],
        });
        console.log('Signature received using personal_sign:', signature);
      } catch (signError) {
        console.log('personal_sign failed, trying alternative methods...', signError);
        
        try {
          // Fallback to eth_sign for some wallets
          signature = await provider.request({
            method: 'eth_sign',
            params: [address, message],
          });
          console.log('Signature received using eth_sign:', signature);
        } catch (ethSignError) {
          console.log('eth_sign also failed, trying eth_personalSign...', ethSignError);
          
          try {
            // Another fallback method
            signature = await provider.request({
              method: 'eth_personalSign',
              params: [message, address],
            });
            console.log('Signature received using eth_personalSign:', signature);
        } catch (finalError) {
            console.error('All signature methods failed:', finalError);
            throw new Error('Wallet signature failed. Please try a different wallet or contact support.');
          }
        }
      }
      
      if (!signature) {
        throw new Error('Failed to get wallet signature');
      }

      // Send to our API for verification and Supabase auth
      console.log('Sending signin request to API...');
      const response = await fetch('/api/auth/wallet-signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          message,
          signature,
        }),
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      console.log('API response status:', response.status);
      console.log('API response headers:', Object.fromEntries(response.headers.entries()));

      const result = await response.json();
      console.log('API response body:', result);

      if (!response.ok) {
        // Handle specific error types
        if (response.status === 408) {
          throw new Error('Request timed out - please try again');
        } else if (response.status === 503) {
          throw new Error('Connection error - please check your internet and try again');
        } else {
          throw new Error(result.error || 'Authentication failed');
        }
      }

      // For wallet authentication, the session is now created server-side
      if (result.walletAuth) {
        // Store wallet user data in localStorage for client-side access
        localStorage.setItem('walletUser', JSON.stringify(result.user));
        
        // Set a cookie for server-side access
        document.cookie = `wallet-user=${JSON.stringify(result.user)}; path=/; max-age=86400; SameSite=Lax`;
        
        console.log('Wallet sign-in successful, reloading page in 500ms...');
        
        // Add a longer delay to ensure localStorage is set before reload
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }

    } catch (error) {
      console.error('Wallet sign-in error:', error);
      setAuthError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const signUpWithWallet = async (email: string, displayName: string, retryCount = 0) => {
    if (!address) {
      setAuthError('Please connect your wallet first.');
      return;
    }

    if (!email || !email.includes('@')) {
      setAuthError('Please provide a valid email address.');
      return;
    }

    if (!displayName || displayName.trim().length < 2) {
      setAuthError('Please provide a valid display name (at least 2 characters).');
      return;
    }

    setIsConnecting(true);
    setAuthError(null);

    // Maximum retry attempts
    const maxRetries = 2;

    try {
      console.log('Starting wallet signup process...', { address, email, displayName });
      
      // Create a message to sign
      const message = `Sign up for Defeat the Dragon\n\nWallet: ${address}\nEmail: ${email}\nDisplay Name: ${displayName}\nTimestamp: ${Date.now()}`;
      
      // Sign the message using the selected provider
      const provider = getProvider();
      if (!provider) {
        throw new Error('No wallet provider available');
      }
      
      console.log('Requesting signature from wallet...');
      console.log('Provider type:', isBaseApp ? 'Base App Wallet' : 'External Wallet');
      
      let signature;
      try {
        // Try the standard personal_sign method first
        signature = await provider.request({
          method: 'personal_sign',
          params: [message, address],
        });
        console.log('Signature received using personal_sign:', signature);
      } catch (signError) {
        console.log('personal_sign failed, trying alternative methods...', signError);
        
        try {
          // Fallback to eth_sign for some wallets
          signature = await provider.request({
            method: 'eth_sign',
            params: [address, message],
          });
          console.log('Signature received using eth_sign:', signature);
        } catch (ethSignError) {
          console.log('eth_sign also failed, trying eth_personalSign...', ethSignError);
          
          try {
            // Another fallback method
            signature = await provider.request({
              method: 'eth_personalSign',
              params: [message, address],
            });
            console.log('Signature received using eth_personalSign:', signature);
          } catch (finalError) {
            console.error('All signature methods failed:', finalError);
            throw new Error('Wallet signature failed. Please try a different wallet or contact support.');
          }
        }
      }
      
      if (!signature) {
        throw new Error('Failed to get wallet signature');
      }

      // Send to our API for verification and Supabase auth
      console.log('Sending signup request to API...');
      
      // Prepare headers with potential Farcaster metadata for Base App users
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add Farcaster metadata if available for Base App users
      if (isBaseApp && baseAppUser) {
        if (baseAppUser.fid) {
          headers['x-farcaster-fid'] = baseAppUser.fid.toString();
          console.log('🔐 Adding Farcaster FID to signup request:', baseAppUser.fid);
        }
        if (baseAppUser.username) {
          headers['x-farcaster-username'] = baseAppUser.username;
          console.log('🔐 Adding Farcaster username to signup request:', baseAppUser.username);
        }
        if (baseAppUser.avatarUrl) {
          headers['x-farcaster-avatar-url'] = baseAppUser.avatarUrl;
          console.log('🔐 Adding Farcaster avatar URL to signup request:', baseAppUser.avatarUrl);
        }
      }
      
      const response = await fetch('/api/auth/wallet-signup', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          address,
          email,
          displayName,
          message,
          signature,
        }),
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      console.log('API response status:', response.status);
      console.log('API response headers:', Object.fromEntries(response.headers.entries()));

      const result = await response.json();
      console.log('API response body:', result);

      if (!response.ok) {
        // Handle specific error types
        if (response.status === 408) {
          throw new Error('Request timed out - please try again');
        } else if (response.status === 503) {
          throw new Error('Connection error - please check your internet and try again');
        } else if (response.status === 409) {
          // Handle conflict errors (email already exists, wallet already exists)
          const errorMessage = result.error || 'Account already exists';
          throw new Error(errorMessage);
        } else {
          // For other errors, try to extract the error message from the response
          const errorMessage = result.error || `Registration failed (${response.status})`;
          throw new Error(errorMessage);
        }
      }

      // For wallet authentication, the session is now created server-side
      if (result.walletAuth) {
        console.log('Wallet signup successful, storing user data...');
        
        // Store wallet user data in localStorage for client-side access
        localStorage.setItem('walletUser', JSON.stringify(result.user));
        
        // Set a cookie for server-side access
        document.cookie = `wallet-user=${JSON.stringify(result.user)}; path=/; max-age=86400; SameSite=Lax`;
        
        // Update account status
        setHasAccount(true);
        
        console.log('Wallet sign-up successful, reloading page in 500ms...');
        
        // Add a longer delay to ensure localStorage is set before reload
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        console.error('API returned success but no walletAuth flag');
        throw new Error('Invalid response from server');
      }

    } catch (error) {
      console.error('Wallet sign-up error:', error);
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.message.includes('timeout')) {
          setAuthError('Request timed out - please try again');
        } else if (error.message.includes('ECONNRESET') || error.message.includes('Connection error')) {
          setAuthError('Connection error - please check your internet and try again');
        } else if (error.message.includes('Failed to fetch')) {
          setAuthError('Network error - please check your connection and try again');
        } else if (error.message.includes('Account already exists') || error.message.includes('already exists')) {
          // Handle duplicate account errors
          setAuthError(error.message);
        } else {
          // For all other errors, display the actual error message
          setAuthError(error.message || 'Registration failed');
        }
      } else {
        setAuthError('Registration failed');
      }
      
      // Retry logic for network errors
      if (retryCount < maxRetries && (
        error instanceof Error && (
          error.name === 'AbortError' || 
          error.message.includes('timeout') ||
          error.message.includes('ECONNRESET') ||
          error.message.includes('Connection error') ||
          error.message.includes('Failed to fetch')
        )
      )) {
        console.log(`Retrying wallet signup (attempt ${retryCount + 1}/${maxRetries})...`);
        setTimeout(() => {
          // Retry logic removed since email and displayName are now required
          // This fallback is no longer needed
          throw new Error('Signup failed - email and display name are required');
        }, 1000 * (retryCount + 1)); // Exponential backoff
        return;
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const shouldShowExternalWallets = () => {
    // Only show external wallets if not in Base App environment
    return !isBaseApp;
  };

  return {
    address,
    isConnected,
    isConnecting,
    isCheckingAccount,
    hasAccount,
    authError,
    availableAccounts,
    isSwitchingWallet,
    availableProviders,
    selectedProvider,
    showProviderSelection,
    connectWallet,
    disconnectWallet,
    switchWallet,
    switchToSpecificAccount,
    signInWithWallet,
    signUpWithWallet,
    selectProvider,
    cancelProviderSelection,
    
    // Base App integration
    isBaseApp,
    baseAppUser,
    baseAppContext,
    authenticateWithBaseApp,
    shouldShowExternalWallets,
    
    // Base App helper functions
    isBaseAppIdentifier,
    extractFidFromBaseAppIdentifier,
  };
}

