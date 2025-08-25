'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useWalletAuth() {
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

  // Check if MetaMask is available
  const checkIfWalletIsConnected = async () => {
    try {
      if (typeof window !== 'undefined') {
        // Detect available wallet providers
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
        // Remove automatic modal display - only show when user clicks connect

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

    // Check for available providers
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
      
      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, address],
      });

      // Send to our API for verification and Supabase auth
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
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Authentication failed');
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

  const signUpWithWallet = async (displayName: string) => {
    if (!address) {
      setAuthError('Please connect your wallet first.');
      return;
    }

    setIsConnecting(true);
    setAuthError(null);

    try {
      // Create a message to sign
      const message = `Sign up for Defeat the Dragon\n\nWallet: ${address}\nDisplay Name: ${displayName}\nTimestamp: ${Date.now()}`;
      
      // Sign the message using the selected provider
      const provider = getProvider();
      if (!provider) {
        throw new Error('No wallet provider available');
      }
      
      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, address],
      });

      // Send to our API for verification and Supabase auth
      const response = await fetch('/api/auth/wallet-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          displayName,
          message,
          signature,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      // For wallet authentication, the session is now created server-side
      if (result.walletAuth) {
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
      }

    } catch (error) {
      console.error('Wallet sign-up error:', error);
      setAuthError(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsConnecting(false);
    }
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
  };
}
