'use client';

import { useState } from 'react';
import { useAccount, useSendTransaction } from 'wagmi';
import { parseEther } from 'viem';

interface TransactionExampleProps {
  onTransactionSuccess?: (hash: string) => void;
  onTransactionError?: (error: string) => void;
}

export function TransactionExample({ onTransactionSuccess, onTransactionError }: TransactionExampleProps) {
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Single transaction hook
  const { sendTransaction } = useSendTransaction();

  const handleSingleTransaction = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      sendTransaction({
        to: '0x1a9Fce96e04ba06D9190339DF817b43837fa0eA9', // Your merchant wallet
        value: parseEther('0.001'), // 0.001 ETH
      }, {
        onSuccess: (hash) => {
          console.log('Transaction sent:', hash);
          onTransactionSuccess?.(hash);
          setIsLoading(false);
        },
        onError: (err) => {
          const errorMessage = err.message || 'Transaction failed';
          console.error('Transaction error:', err);
          setError(errorMessage);
          onTransactionError?.(errorMessage);
          setIsLoading(false);
        }
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
      console.error('Transaction error:', err);
      setError(errorMessage);
      onTransactionError?.(errorMessage);
      setIsLoading(false);
    }
  };

  const handleTestTransaction = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      sendTransaction({
        to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Test address
        value: parseEther('0.0001'), // Small test amount
      }, {
        onSuccess: (hash) => {
          console.log('Test transaction sent:', hash);
          onTransactionSuccess?.(hash);
          setIsLoading(false);
        },
        onError: (err) => {
          const errorMessage = err.message || 'Test transaction failed';
          console.error('Test transaction error:', err);
          setError(errorMessage);
          onTransactionError?.(errorMessage);
          setIsLoading(false);
        }
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Test transaction failed';
      console.error('Test transaction error:', err);
      setError(errorMessage);
      onTransactionError?.(errorMessage);
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="pixel-card p-4 text-center">
        <p className="text-gray-300">Please connect your wallet to send transactions</p>
      </div>
    );
  }

  return (
    <div className="pixel-card p-4">
      <h3 className="text-lg font-bold text-white mb-4">Transaction Examples</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-200">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={handleSingleTransaction}
          disabled={isLoading}
          className="pixel-button w-full py-2 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Sending...' : 'Send Transaction (0.001 ETH)'}
        </button>

        <button
          onClick={handleTestTransaction}
          disabled={isLoading}
          className="pixel-button w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Sending...' : 'Send Test Transaction (0.0001 ETH)'}
        </button>
      </div>

      <div className="mt-4 text-xs text-gray-400">
        <p>Connected to: {address}</p>
        <p>Network: Base Mainnet</p>
      </div>
    </div>
  );
}
