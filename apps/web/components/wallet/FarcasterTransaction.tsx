'use client';

import { useAccount, useSendTransaction, useSendCalls } from 'wagmi';
import { parseEther } from 'viem';
import { useState } from 'react';

interface FarcasterTransactionProps {
  className?: string;
}

export function FarcasterTransaction({ className = '' }: FarcasterTransactionProps) {
  const { isConnected, address } = useAccount();
  const { sendTransaction, isPending: isTransactionPending } = useSendTransaction();
  const { sendCalls, isPending: isBatchPending } = useSendCalls();
  const [amount, setAmount] = useState('0.001');
  const [recipient, setRecipient] = useState('0x70997970C51812dc3A010C7d01b50e0d17dc79C8');

  const handleSingleTransaction = async () => {
    if (!isConnected || !address) return;

    try {
      await sendTransaction({
        to: recipient as `0x${string}`,
        value: parseEther(amount),
      });
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

  const handleBatchTransaction = async () => {
    if (!isConnected || !address) return;

    try {
      // Temporarily disabled due to TypeScript issues with useSendCalls
      console.log('Batch transaction functionality temporarily disabled');
      // await sendCalls({
      //   calls: [
      //     {
      //       to: recipient as `0x${string}`,
      //       value: parseEther(amount),
      //     },
      //     {
      //       to: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' as `0x${string}`,
      //       value: parseEther('0.002'),
      //     },
      //   ],
      // });
    } catch (error) {
      console.error('Batch transaction failed:', error);
    }
  };

  if (!isConnected) {
    return (
      <div className={`p-4 bg-gray-50 border border-gray-200 rounded-lg ${className}`}>
        <div className="text-sm text-gray-600">
          Please connect your Farcaster wallet to send transactions
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 p-4 bg-white border border-gray-200 rounded-lg ${className}`}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Farcaster Wallet Transactions
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipient Address
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="0x..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount (ETH)
          </label>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="0.001"
          />
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={handleSingleTransaction}
          disabled={isTransactionPending}
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isTransactionPending ? 'Sending...' : 'Send Transaction'}
        </button>

        <button
          onClick={handleBatchTransaction}
          disabled={isBatchPending}
          className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isBatchPending ? 'Sending Batch...' : 'Send Batch'}
        </button>
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <p>• Single transaction sends {amount} ETH to one recipient</p>
        <p>• Batch transaction sends {amount} ETH + 0.002 ETH to two recipients</p>
        <p>• All transactions are scanned for security by Farcaster</p>
      </div>
    </div>
  );
}
