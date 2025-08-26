'use client';

import { useAccount, useConnect } from 'wagmi';
import { useState } from 'react';

interface FarcasterWalletConnectProps {
  onConnect?: (address: string) => void;
  onError?: (error: Error) => void;
  className?: string;
}

export function FarcasterWalletConnect({ 
  onConnect, 
  onError, 
  className = '' 
}: FarcasterWalletConnectProps) {
  const { isConnected, address } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      setError(null);
      await connect({ connector: connectors[0] });
      
      // If we get here, the connection was successful
      if (address) {
        onConnect?.(address);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMessage);
      onError?.(err as Error);
    }
  };

  if (isConnected && address) {
    return (
      <div className={`flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg ${className}`}>
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <div className="flex-1">
          <div className="text-sm font-medium text-green-800">Connected to Farcaster Wallet</div>
          <div className="text-xs text-green-600 font-mono">
            {address.slice(0, 6)}...{address.slice(-4)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <button
        type="button"
        onClick={handleConnect}
        disabled={isPending}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? 'Connecting...' : 'Connect Farcaster Wallet'}
      </button>
      
      {error && (
        <div className="p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
          {error}
        </div>
      )}
      
      <div className="text-xs text-gray-500 text-center">
        No wallet selection dialog needed - Farcaster handles this automatically
      </div>
    </div>
  );
}
