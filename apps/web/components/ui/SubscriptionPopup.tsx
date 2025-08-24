'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface SubscriptionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const SUBSCRIPTION_PRICE = '0.0001'; // ETH
const SUBSCRIPTION_DURATION = 30; // days
const MERCHANT_WALLET = process.env.NEXT_PUBLIC_MERCHANT_WALLET || '0x1234567890123456789012345678901234567890'; // Set NEXT_PUBLIC_MERCHANT_WALLET in your .env.local

export function SubscriptionPopup({ isOpen, onClose, onSuccess }: SubscriptionPopupProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setTransactionHash(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleSubscribe = async () => {
    if (!user) {
      setError('Please connect your wallet first');
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

      // Convert ETH to Wei (1 ETH = 10^18 Wei)
      const valueInWei = BigInt(Math.floor(parseFloat(SUBSCRIPTION_PRICE) * 10**18));
      const valueInHex = '0x' + valueInWei.toString(16);

      // Get current gas price
      const gasPrice = await window.ethereum.request({
        method: 'eth_gasPrice',
      });

      // Estimate gas for the transaction
      const gasEstimate = await window.ethereum.request({
        method: 'eth_estimateGas',
        params: [{
          from: account,
          to: MERCHANT_WALLET,
          value: valueInHex,
        }],
      });

      // Send transaction
      const transactionParameters = {
        to: MERCHANT_WALLET,
        from: account,
        value: valueInHex,
        gas: '0x' + Math.floor(Number(gasEstimate) * 1.1).toString(16), // Add 10% buffer
        gasPrice: gasPrice,
      };

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      });

      setTransactionHash(txHash);

      // Wait for transaction confirmation
      const receipt = await waitForTransaction(txHash);
      
      if (receipt.status === '0x1') {
        // Transaction successful, update user subscription in Supabase
        await updateUserSubscription();
        onSuccess?.();
        onClose();
      } else {
        setError('Transaction failed');
      }

    } catch (err: any) {
      console.error('Subscription error:', err);
      setError(err.message || 'Failed to process subscription');
    } finally {
      setIsLoading(false);
    }
  };

  interface TransactionReceipt {
    status: string;
    transactionHash: string;
    blockNumber: string;
    gasUsed: string;
  }

  const waitForTransaction = async (hash: string): Promise<TransactionReceipt> => {
    return new Promise((resolve, reject) => {
      const checkTransaction = async () => {
        try {
          const receipt = await window.ethereum.request({
            method: 'eth_getTransactionReceipt',
            params: [hash],
          });
          
          if (receipt) {
            resolve(receipt as TransactionReceipt);
          } else {
            setTimeout(checkTransaction, 2000); // Check again in 2 seconds
          }
        } catch (error) {
          reject(error);
        }
      };
      
      checkTransaction();
    });
  };

  const updateUserSubscription = async () => {
    try {
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionType: 'inspiration_boon',
          duration: SUBSCRIPTION_DURATION,
          transactionHash,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update subscription status');
      }

      console.log('Subscription updated successfully');
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#f5f5dc] border-4 border-[#8B4513] rounded-lg p-6 w-full max-w-md pixel-art">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-2xl mb-2">✨</div>
          <h2 className="text-xl font-bold text-[#8B4513] mb-2">Inspiration Boon</h2>
          <p className="text-[#654321] text-sm">
            Unlock Sparks rewards from your focus sessions!
          </p>
        </div>

        {/* Subscription Details */}
        <div className="bg-[#e8e8d0] border-2 border-[#8B4513] rounded-lg p-4 mb-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-[#8B4513] font-bold">Duration:</span>
              <span className="text-[#654321]">{SUBSCRIPTION_DURATION} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8B4513] font-bold">Price:</span>
              <span className="text-[#654321] font-bold">{SUBSCRIPTION_PRICE} ETH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8B4513] font-bold">Network:</span>
              <span className="text-[#654321]">Base</span>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="mb-6">
          <h3 className="text-[#8B4513] font-bold mb-3">✨ What you get:</h3>
          <ul className="space-y-2 text-sm text-[#654321]">
            <li>• Earn Sparks from successful focus sessions</li>
            <li>• Access to exclusive shop items</li>
            <li>• Enhanced character progression</li>
            <li>• Premium support and features</li>
          </ul>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        {/* Transaction Hash */}
        {transactionHash && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
            <div className="font-bold">Transaction submitted!</div>
            <div className="text-xs break-all">
              Hash: {transactionHash}
            </div>
            <div className="text-xs mt-1">
              <button
                onClick={() => {
                  try {
                    // Use proper external navigation following Base App guidelines
                    if (typeof window !== 'undefined') {
                      window.open(`https://basescan.org/tx/${transactionHash}`, '_blank', 'noopener,noreferrer');
                    }
                  } catch (error) {
                    console.error('Failed to open transaction link:', error);
                  }
                }}
                className="underline hover:no-underline cursor-pointer"
              >
                View on BaseScan →
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 pixel-button bg-[#6b7280] hover:bg-[#4b5563] text-white px-4 py-3 font-bold disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="flex-1 pixel-button bg-[#8B4513] hover:bg-[#654321] text-white px-4 py-3 font-bold disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Subscribe Now'}
          </button>
        </div>

        {/* Network Info */}
        <div className="mt-4 text-center">
          <p className="text-xs text-[#654321]">
            Make sure you're connected to Base Network
          </p>
        </div>
      </div>
    </div>
  );
}
