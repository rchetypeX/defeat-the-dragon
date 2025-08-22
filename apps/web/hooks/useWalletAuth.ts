'use client';

import { useState, useEffect } from 'react';
import { createWalletClient, custom } from 'viem';
import { mainnet } from 'wagmi/chains';
import { supabase } from '../lib/supabase';

export function useWalletAuth() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Check if MetaMask is available
  const checkIfWalletIsConnected = async () => {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
        }
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
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
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      setAuthError('Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
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
      // Create wallet client for signing
      const client = createWalletClient({
        chain: mainnet,
        transport: custom(window.ethereum),
      });

      // Create a message to sign
      const message = `Sign in to Defeat the Dragon\n\nWallet: ${address}\nTimestamp: ${Date.now()}`;
      
      // Sign the message
      const signature = await client.request({
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
      // Create wallet client for signing
      const client = createWalletClient({
        chain: mainnet,
        transport: custom(window.ethereum),
      });

      // Create a message to sign
      const message = `Sign up for Defeat the Dragon\n\nWallet: ${address}\nDisplay Name: ${displayName}\nTimestamp: ${Date.now()}`;
      
      // Sign the message
      const signature = await client.request({
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

  const disconnectWallet = async () => {
    try {
      await supabase.auth.signOut();
      setAddress(null);
      setIsConnected(false);
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  return {
    address,
    isConnected,
    isConnecting,
    authError,
    connectWallet,
    signInWithWallet,
    signUpWithWallet,
    disconnectWallet,
  };
}
