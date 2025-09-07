'use client';

import { useAccount, useConnect } from 'wagmi';

interface FarcasterWalletConnectProps {
  onConnected?: (address: string) => void;
  onError?: (error: string) => void;
}

export function FarcasterWalletConnect({ onConnected, onError }: FarcasterWalletConnectProps) {
  const { isConnected, address } = useAccount();
  const { connect, connectors, isPending } = useConnect();

  const handleConnect = async () => {
    try {
      // Find the Farcaster Mini App connector
      const miniAppConnector = connectors.find(connector => connector.id === 'farcasterMiniApp');
      
      if (miniAppConnector) {
        await connect({ connector: miniAppConnector });
      } else {
        // Fallback to first available connector
        await connect({ connector: connectors[0] });
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to connect wallet');
    }
  };

  if (isConnected && address) {
    return (
      <div className="pixel-card p-4 text-center">
        <div className="text-green-400 mb-2">✅ Connected!</div>
        <div className="text-sm text-gray-300 break-all">
          Address: {address}
        </div>
        {onConnected && onConnected(address)}
      </div>
    );
  }

  return (
    <div className="pixel-card p-4 text-center">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white mb-2">Connect Wallet</h3>
        <p className="text-sm text-gray-300">
          Connect your wallet to start playing and make transactions
        </p>
      </div>
      
      <button
        type="button"
        onClick={handleConnect}
        disabled={isPending}
        className="pixel-button w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
      >
        {isPending ? 'Connecting...' : 'Connect Wallet'}
      </button>
      
      <p className="text-xs text-gray-400 mt-2">
        Your wallet will be used for in-game transactions and rewards
      </p>
    </div>
  );
}
