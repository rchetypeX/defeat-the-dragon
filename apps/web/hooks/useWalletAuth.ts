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

  // Check if MetaMask is available
  const checkIfWalletIsConnected = async () => {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        setAvailableAccounts(accounts);
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
        console.log('Accounts changed:', accounts);
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
      
      console.log('Wallet disconnected - all state cleared');
      
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
    
    try {
      // First disconnect current wallet
      await disconnectWallet();
      
      // Then request new accounts (this will prompt user to switch accounts in MetaMask)
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAvailableAccounts(accounts);
      
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
        await checkAccountExists(accounts[0]);
        console.log('Switched to new wallet:', accounts[0]);
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

      // For wallet authentication, the session is now created server-side
      if (result.walletAuth) {
        // Store wallet user data in localStorage for client-side access
        localStorage.setItem('walletUser', JSON.stringify(result.user));
        
        // Set a cookie for server-side access
        document.cookie = `wallet-user=${JSON.stringify(result.user)}; path=/; max-age=86400; SameSite=Lax`;
        
        // The session cookies are set by the server, so we can redirect to the app
        window.location.href = '/';
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

      // For wallet authentication, the session is now created server-side
      if (result.walletAuth) {
        // Store wallet user data in localStorage for client-side access
        localStorage.setItem('walletUser', JSON.stringify(result.user));
        
        // Set a cookie for server-side access
        document.cookie = `wallet-user=${JSON.stringify(result.user)}; path=/; max-age=86400; SameSite=Lax`;
        
        // Update account status
        setHasAccount(true);
        // The session cookies are set by the server, so we can redirect to the app
        window.location.href = '/';
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
    connectWallet,
    disconnectWallet,
    switchWallet,
    switchToSpecificAccount,
    signInWithWallet,
    signUpWithWallet,
  };
}
