'use client';

import { useBaseAccountCapabilities } from '../../hooks/useBaseAccountCapabilities';
import { useSponsoredTransaction } from '../../hooks/useSponsoredTransaction';
import { useAccount } from 'wagmi';

export function BaseAccountFeatures() {
  const { address } = useAccount();
  const capabilities = useBaseAccountCapabilities();
  const { executeSponsoredTransaction, isSponsoredTransactionSupported } = useSponsoredTransaction();

  if (!address) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <p className="text-gray-600">Connect your wallet to see Base Account features</p>
      </div>
    );
  }

  if (capabilities.isLoading) {
    return (
      <div className="p-4 bg-blue-50 rounded-lg">
        <p className="text-blue-600">Detecting Base Account capabilities...</p>
      </div>
    );
  }

  if (capabilities.error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <p className="text-red-600">Error detecting capabilities: {capabilities.error}</p>
      </div>
    );
  }

  const handleSponsoredMint = async () => {
    if (!isSponsoredTransactionSupported) {
      alert('Sponsored transactions not supported by this wallet');
      return;
    }

    try {
      // Example: Simple ETH transfer (this would be sponsored)
      // In a real app, you'd use your actual contract
      const contracts = [{
        address: '0x0000000000000000000000000000000000000000', // ETH transfer
        abi: [{
          name: 'transfer',
          type: 'function',
          inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' }
          ],
          outputs: [{ name: '', type: 'bool' }]
        }],
        functionName: 'transfer',
        args: [address, '1000000000000000'], // 0.001 ETH
      }];

      await executeSponsoredTransaction(contracts);
      alert('Sponsored transaction successful! Gas fees were covered by the app.');
    } catch (error) {
      console.error('Sponsored transaction failed:', error);
      alert('Sponsored transaction failed: ' + (error as Error).message);
    }
  };

  const handleBatchTransaction = async () => {
    if (!capabilities.atomicBatch) {
      alert('Atomic batch transactions not supported by this wallet');
      return;
    }

    try {
      // Example: Batch multiple operations into one transaction
      const contracts = [
        {
          address: '0x...', // Contract 1
          abi: [],
          functionName: 'approve',
          args: ['0x...', '1000000000000000000'], // Approve 1 token
        },
        {
          address: '0x...', // Contract 2
          abi: [],
          functionName: 'transfer',
          args: [address, '1000000000000000000'], // Transfer 1 token
        }
      ];

      // This would use wallet_sendCalls for atomic batch
      alert('Atomic batch transaction would combine multiple operations into one confirmation!');
    } catch (error) {
      console.error('Batch transaction failed:', error);
      alert('Batch transaction failed: ' + (error as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-green-50 rounded-lg">
        <h3 className="text-lg font-semibold text-green-800 mb-2">Base Account Capabilities</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-green-700">Atomic Batch Transactions:</span>
            <span className={`px-2 py-1 rounded text-sm ${
              capabilities.atomicBatch 
                ? 'bg-green-200 text-green-800' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              {capabilities.atomicBatch ? 'Supported' : 'Not Supported'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-green-700">Sponsored Gas Transactions:</span>
            <span className={`px-2 py-1 rounded text-sm ${
              capabilities.paymasterService 
                ? 'bg-green-200 text-green-800' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              {capabilities.paymasterService ? 'Supported' : 'Not Supported'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-green-700">Auxiliary Funds:</span>
            <span className={`px-2 py-1 rounded text-sm ${
              capabilities.auxiliaryFunds 
                ? 'bg-green-200 text-green-800' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              {capabilities.auxiliaryFunds ? 'Supported' : 'Not Supported'}
            </span>
          </div>
        </div>
      </div>

      {capabilities.paymasterService && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Sponsored Transactions</h3>
          <p className="text-blue-700 mb-3">
            Your wallet supports sponsored gas transactions! You can transact without owning ETH.
          </p>
          <button
            onClick={handleSponsoredMint}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Mint NFT (Gas Free)
          </button>
        </div>
      )}

      {capabilities.atomicBatch && (
        <div className="p-4 bg-purple-50 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-800 mb-2">Atomic Batch Transactions</h3>
          <p className="text-purple-700 mb-3">
            Your wallet supports atomic batch transactions! Multiple operations can be combined into a single transaction.
          </p>
          <button
            onClick={handleBatchTransaction}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
          >
            Try Batch Transaction
          </button>
        </div>
      )}

      {!capabilities.atomicBatch && !capabilities.paymasterService && !capabilities.auxiliaryFunds && (
        <div className="p-4 bg-yellow-50 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Traditional Wallet</h3>
          <p className="text-yellow-700">
            You're using a traditional wallet. Consider upgrading to a Base Account for enhanced features like sponsored gas and atomic batch transactions.
          </p>
        </div>
      )}
    </div>
  );
}
