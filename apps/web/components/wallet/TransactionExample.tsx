'use client';

import { useState } from 'react';
import { useAccount, useSendTransaction, useSendCalls } from 'wagmi';
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
  
  // Batch transactions hook (EIP-5792)
  const { sendCalls } = useSendCalls();

  const handleSingleTransaction = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const hash = await sendTransaction({
        to: '0x1a9Fce96e04ba06D9190339DF817b43837fa0eA9', // Your merchant wallet
        value: parseEther('0.001'), // 0.001 ETH
      });

      console.log('Transaction sent:', hash);
      onTransactionSuccess?.(hash);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
      console.error('Transaction error:', err);
      setError(errorMessage);
      onTransactionError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchTransaction = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Example batch transaction: send to multiple addresses
      const hash = await sendCalls({
        calls: [
          {
            to: '0x1a9Fce96e04ba06D9190339DF817b43837fa0eA9',
            value: parseEther('0.001')
          },
          {
            to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
            value: parseEther('0.0005')
          }
        ]
      });

      console.log('Batch transaction sent:', hash);
      onTransactionSuccess?.(hash);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Batch transaction failed';
      console.error('Batch transaction error:', err);
      setError(errorMessage);
      onTransactionError?.(errorMessage);
    } finally {
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
          {isLoading ? 'Sending...' : 'Send Single Transaction (0.001 ETH)'}
        </button>

        <button
          onClick={handleBatchTransaction}
          disabled={isLoading}
          className="pixel-button w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Sending...' : 'Send Batch Transaction (2 transfers)'}
        </button>
      </div>

      <div className="mt-4 text-xs text-gray-400">
        <p>Connected to: {address}</p>
        <p>Network: Base Mainnet</p>
      </div>
    </div>
  );
}
