'use client';

import { useBaseAccountCapabilities } from '../../hooks/useBaseAccountCapabilities';
import { useSponsoredTransaction } from '../../hooks/useSponsoredTransaction';
import { useAccount } from 'wagmi';
import { useState } from 'react';

export function BaseAccountGameExample() {
  const { address } = useAccount();
  const capabilities = useBaseAccountCapabilities();
  const { executeSponsoredTransaction, isSponsoredTransactionSupported } = useSponsoredTransaction();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!address) {
    return null;
  }

  const handlePurchaseItem = async () => {
    if (!isSponsoredTransactionSupported) {
      alert('This feature requires a Base Account with sponsored transactions');
      return;
    }

    setIsProcessing(true);
    try {
      // Example: Purchase a game item with sponsored gas
      const contracts = [{
        address: '0x...', // Your game contract address
        abi: [{
          name: 'purchaseItem',
          type: 'function',
          inputs: [
            { name: 'itemId', type: 'uint256' },
            { name: 'quantity', type: 'uint256' }
          ],
          outputs: [{ name: '', type: 'bool' }]
        }],
        functionName: 'purchaseItem',
        args: [1, 1], // Item ID 1, quantity 1
      }];

      await executeSponsoredTransaction(contracts);
      alert('Item purchased successfully! Gas fees were covered by the game.');
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Purchase failed: ' + (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchUpgrade = async () => {
    if (!capabilities.atomicBatch) {
      alert('This feature requires a Base Account with atomic batch support');
      return;
    }

    setIsProcessing(true);
    try {
      // Example: Batch multiple game actions into one transaction
      const contracts = [
        {
          address: '0x...', // Game contract
          abi: [],
          functionName: 'upgradeWeapon',
          args: [1], // Weapon ID
        },
        {
          address: '0x...', // Game contract
          abi: [],
          functionName: 'upgradeArmor',
          args: [2], // Armor ID
        },
        {
          address: '0x...', // Game contract
          abi: [],
          functionName: 'learnSkill',
          args: [3], // Skill ID
        }
      ];

      // This would use wallet_sendCalls for atomic batch
      alert('Batch upgrade would combine weapon, armor, and skill upgrades into one transaction!');
    } catch (error) {
      console.error('Batch upgrade failed:', error);
      alert('Batch upgrade failed: ' + (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">🎮 Base Account Game Features</h3>
        <p className="text-blue-700 mb-4">
          Experience enhanced gameplay with Base Account capabilities!
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sponsored Transactions */}
          <div className="p-3 bg-white rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">💎 Sponsored Transactions</h4>
            <p className="text-sm text-blue-600 mb-3">
              Purchase items without paying gas fees
            </p>
            <button
              onClick={handlePurchaseItem}
              disabled={!isSponsoredTransactionSupported || isProcessing}
              className={`w-full px-3 py-2 rounded text-sm font-medium transition-colors ${
                isSponsoredTransactionSupported && !isProcessing
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isProcessing ? 'Processing...' : 'Buy Magic Sword (Gas Free)'}
            </button>
          </div>

          {/* Atomic Batch */}
          <div className="p-3 bg-white rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-800 mb-2">⚡ Atomic Batch</h4>
            <p className="text-sm text-purple-600 mb-3">
              Upgrade multiple items in one transaction
            </p>
            <button
              onClick={handleBatchUpgrade}
              disabled={!capabilities.atomicBatch || isProcessing}
              className={`w-full px-3 py-2 rounded text-sm font-medium transition-colors ${
                capabilities.atomicBatch && !isProcessing
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isProcessing ? 'Processing...' : 'Batch Upgrade Equipment'}
            </button>
          </div>
        </div>

        {/* Feature Status */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2">Feature Status</h4>
          <div className="flex flex-wrap gap-2">
            <span className={`px-2 py-1 rounded text-xs ${
              capabilities.paymasterService 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              Sponsored Gas: {capabilities.paymasterService ? '✅' : '❌'}
            </span>
            <span className={`px-2 py-1 rounded text-xs ${
              capabilities.atomicBatch 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              Atomic Batch: {capabilities.atomicBatch ? '✅' : '❌'}
            </span>
            <span className={`px-2 py-1 rounded text-xs ${
              capabilities.auxiliaryFunds 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              Auxiliary Funds: {capabilities.auxiliaryFunds ? '✅' : '❌'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
