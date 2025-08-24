'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface WalletLinkFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function WalletLinkForm({ onSuccess, onCancel }: WalletLinkFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [availableAccounts, setAvailableAccounts] = useState<string[]>([]);
  const [isSwitchingWallet, setIsSwitchingWallet] = useState(false);
  const { user } = useAuth();

  // Check current wallet connection on component mount
  const checkCurrentWallet = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        setAvailableAccounts(accounts);
        if (accounts.length > 0) {
          setCurrentAddress(accounts[0]);
        }
      } catch (error) {
        console.error('Error checking wallet:', error);
      }
    }
  };

  // Listen for account changes
  useEffect(() => {
    checkCurrentWallet();
    
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        setAvailableAccounts(accounts);
        if (accounts.length > 0) {
          setCurrentAddress(accounts[0]);
        } else {
          setCurrentAddress(null);
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  const switchWallet = async () => {
    setIsSwitchingWallet(true);
    setError(null);
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAvailableAccounts(accounts);
      if (accounts.length > 0) {
        setCurrentAddress(accounts[0]);
      }
    } catch (error) {
      console.error('Wallet switching error:', error);
      setError('Failed to switch wallet. Please try again.');
    } finally {
      setIsSwitchingWallet(false);
    }
  };

  const switchToSpecificAccount = async (targetAddress: string) => {
    setIsSwitchingWallet(true);
    setError(null);
    
    try {
      if (availableAccounts.includes(targetAddress)) {
        setCurrentAddress(targetAddress);
      } else {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAvailableAccounts(accounts);
        
        if (accounts.includes(targetAddress)) {
          setCurrentAddress(targetAddress);
        } else {
          setError('Selected wallet not found. Please make sure it\'s connected in MetaMask.');
        }
      }
    } catch (error) {
      console.error('Account switching error:', error);
      setError('Failed to switch to selected wallet.');
    } finally {
      setIsSwitchingWallet(false);
    }
  };

  const handleLinkWallet = async () => {
    if (!user) {
      setError('Please log in first');
      return;
    }

    if (!window.ethereum) {
      setError('MetaMask or another Web3 wallet is required');
      return;
    }

    if (!currentAddress) {
      setError('Please connect a wallet first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the current address instead of requesting new accounts
      const account = currentAddress;

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

      {/* Wallet Connection Status */}
      {currentAddress ? (
        <div className="bg-[#1a1a2e] p-3 border border-[#8b4513] rounded">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-[#fbbf24] font-medium">Connected Wallet</p>
          </div>
          
          {/* Current wallet address */}
          <div className="mb-3">
            <p className="text-xs text-white font-mono break-all">
              {currentAddress}
            </p>
          </div>

          {/* Available accounts dropdown */}
          {availableAccounts.length > 1 && (
            <div className="mb-3">
              <label className="block text-xs text-[#fbbf24] mb-1">
                Switch to different wallet:
              </label>
              <select
                value={currentAddress || ''}
                onChange={(e) => {
                  if (e.target.value !== currentAddress) {
                    switchToSpecificAccount(e.target.value);
                  }
                }}
                disabled={isSwitchingWallet}
                className="w-full bg-[#2d1b0e] border border-[#8b4513] rounded px-2 py-1 text-white text-xs"
              >
                {availableAccounts.map((acc) => (
                  <option key={acc} value={acc}>
                    {acc.slice(0, 6)}...{acc.slice(-4)} {acc === currentAddress ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Switch wallet button */}
          <button
            onClick={switchWallet}
            disabled={isSwitchingWallet}
            className="w-full px-3 py-1 bg-[#f2751a] text-white text-xs rounded hover:bg-[#e65a0a] disabled:opacity-50 flex items-center justify-center mb-3"
          >
            {isSwitchingWallet ? (
              <>
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Switching...
              </>
            ) : (
              'Switch Wallet'
            )}
          </button>
        </div>
      ) : (
        <div className="bg-[#1a1a2e] p-3 border border-[#8b4513] rounded text-center">
          <p className="text-sm text-gray-300 mb-2">No wallet connected</p>
          <button
            onClick={switchWallet}
            disabled={isSwitchingWallet}
            className="px-4 py-2 bg-[#f2751a] text-white text-sm rounded hover:bg-[#e65a0a] disabled:opacity-50"
          >
            {isSwitchingWallet ? 'Connecting...' : 'Connect Wallet'}
          </button>
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
          disabled={isLoading || !currentAddress}
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
