'use client';

import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { createWalletClient, custom, getAddress } from 'viem';
import { mainnet } from 'wagmi/chains';
import { supabase } from '../lib/supabase';

export function useWalletAuth() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  // Get the injected connector (MetaMask, etc.)
  const injectedConnector = connectors.find(connector => connector.id === 'injected');

  const connectWallet = async () => {
    if (!injectedConnector) {
      setAuthError('No wallet connector found. Please install MetaMask or another Web3 wallet.');
      return;
    }

    setIsConnecting(true);
    setAuthError(null);

    try {
      await connect({ connector: injectedConnector });
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

      // The API will handle Supabase auth and return session data
      if (result.session) {
        // Update Supabase session
        await supabase.auth.setSession(result.session);
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

      // The API will handle Supabase auth and return session data
      if (result.session) {
        // Update Supabase session
        await supabase.auth.setSession(result.session);
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
      disconnect();
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
