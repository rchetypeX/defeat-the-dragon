'use client';

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface WalletLinkFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function WalletLinkForm({ onSuccess, onCancel }: WalletLinkFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const handleLinkWallet = async () => {
    if (!user) {
      setError('Please log in first');
      return;
    }

    if (!window.ethereum) {
      setError('MetaMask or another Web3 wallet is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];

      // Switch to Base Network (Chain ID 8453)
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x2105' }], // Base Mainnet
        });
      } catch (switchError: any) {
        // If Base Network is not added, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x2105',
              chainName: 'Base',
              nativeCurrency: {
                name: 'Ether',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: ['https://mainnet.base.org'],
              blockExplorerUrls: ['https://basescan.org'],
            }],
          });
        } else {
          throw switchError;
        }
      }

      // Create a message to sign
      const message = `Link wallet to Defeat the Dragon account\n\nAccount: ${user.email}\nWallet: ${account}\nTimestamp: ${Date.now()}`;

      // Request signature
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, account],
      });

      // Send to our API
      const response = await fetch('/api/auth/link-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: account,
          message,
          signature,
          userId: user.id,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        onSuccess();
      } else {
        setError(result.error || 'Failed to link wallet');
      }
    } catch (err: any) {
      console.error('Wallet linking error:', err);
      setError(err.message || 'Failed to link wallet');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-[#fbbf24] mb-2">🔗 Link Wallet</h3>
        <p className="text-sm text-gray-300">
          Connect your wallet to link it with your email account
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-[#6b7280] hover:bg-[#4b5563] disabled:opacity-50 transition-colors rounded text-white font-semibold"
        >
          Cancel
        </button>
        <button
          onClick={handleLinkWallet}
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-[#f2751a] hover:bg-[#e65a0a] disabled:opacity-50 transition-colors rounded text-white font-semibold"
        >
          {isLoading ? 'Linking...' : 'Link Wallet'}
        </button>
      </div>

      <div className="text-xs text-gray-400 text-center">
        <p>This will link your wallet to your current email account</p>
        <p>You'll be able to sign in with either method</p>
      </div>
    </div>
  );
}
