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

  // Check if MetaMask is available
  const checkIfWalletIsConnected = async () => {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
          // Check if this wallet has an account
          await checkAccountExists(accounts[0]);
        }
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
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
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected wallet
          setAddress(null);
          setIsConnected(false);
          setHasAccount(null);
        } else {
          // User switched accounts
          setAddress(accounts[0]);
          setIsConnected(true);
          await checkAccountExists(accounts[0]);
        }
      };

      const handleDisconnect = () => {
        setAddress(null);
        setIsConnected(false);
        setHasAccount(null);
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('disconnect', handleDisconnect);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      };
    }
  }, []);

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setAuthError('No wallet found. Please install MetaMask or another Web3 wallet.');
      return;
    }

    setIsConnecting(true);
    setAuthError(null);

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
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

  const disconnectWallet = async () => {
    try {
      // Clear local storage
      localStorage.removeItem('walletUser');
      
      // Reset state
      setAddress(null);
      setIsConnected(false);
      setHasAccount(null);
      setAuthError(null);
      
      // Note: We can't programmatically disconnect MetaMask
      // The user needs to disconnect manually from their wallet
      // But we can clear our local state
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  const switchWallet = async () => {
    await disconnectWallet();
    await connectWallet();
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
      
      // Sign the message using MetaMask directly
      const signature = await window.ethereum.request({
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

      // For wallet authentication, we'll handle it differently
      if (result.walletAuth) {
        // Store wallet user data in localStorage or state
        localStorage.setItem('walletUser', JSON.stringify(result.user));
        // Trigger a page reload to update the auth state
        window.location.reload();
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
      
      // Sign the message using MetaMask directly
      const signature = await window.ethereum.request({
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

      // For wallet authentication, we'll handle it differently
      if (result.walletAuth) {
        // Store wallet user data in localStorage or state
        localStorage.setItem('walletUser', JSON.stringify(result.user));
        // Update account status
        setHasAccount(true);
        // Trigger a page reload to update the auth state
        window.location.reload();
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
    connectWallet,
    disconnectWallet,
    switchWallet,
    signInWithWallet,
    signUpWithWallet,
  };
}
