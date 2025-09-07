'use client';

import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { FarcasterWalletConnect } from './FarcasterWalletConnect';
import { TransactionExample } from './TransactionExample';

export function WalletIntegration() {
  const { isConnected, address, connector } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [isBaseApp, setIsBaseApp] = useState(false);

  // Detect if we're in Base App/Farcaster environment
  useEffect(() => {
    const checkEnvironment = () => {
      // Check for Farcaster Mini App environment
      const isInFarcaster = typeof window !== 'undefined' && 
        (window.location.hostname.includes('farcaster.xyz') || 
         window.location.search.includes('farcaster') ||
         document.referrer.includes('farcaster'));
      
      // Check for Base App environment
      const isInBaseApp = typeof window !== 'undefined' && 
        (window.location.hostname.includes('base.org') ||
         window.location.search.includes('base') ||
         document.referrer.includes('base'));
      
      setIsBaseApp(isInFarcaster || isInBaseApp);
    };

    checkEnvironment();
  }, []);

  const handleConnect = async () => {
    try {
      // Find the appropriate connector
      let selectedConnector = connectors[0]; // Default to first connector
      
      if (isBaseApp) {
        // In Base App, prefer Farcaster Mini App connector
        const miniAppConnector = connectors.find(c => c.id === 'farcasterMiniApp');
        if (miniAppConnector) {
          selectedConnector = miniAppConnector;
        }
      }
      
      await connect({ connector: selectedConnector });
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Environment Detection */}
      <div className="pixel-card p-3 text-center">
        <div className="text-sm">
          <span className="text-gray-300">Environment: </span>
          <span className={isBaseApp ? 'text-green-400' : 'text-blue-400'}>
            {isBaseApp ? 'Base App/Farcaster' : 'Web Browser'}
          </span>
        </div>
        {connector && (
          <div className="text-xs text-gray-400 mt-1">
            Connector: {connector.name}
          </div>
        )}
      </div>

      {/* Wallet Connection */}
      <FarcasterWalletConnect 
        onConnected={(address) => console.log('Wallet connected:', address)}
        onError={(error) => console.error('Connection error:', error)}
      />

      {/* Transaction Examples */}
      {isConnected && (
        <TransactionExample
          onTransactionSuccess={(hash) => console.log('Transaction successful:', hash)}
          onTransactionError={(error) => console.error('Transaction error:', error)}
        />
      )}

      {/* Connection Status */}
      {isConnected && (
        <div className="pixel-card p-4">
          <h3 className="text-lg font-bold text-white mb-3">Connection Status</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-300">Status: </span>
              <span className="text-green-400">Connected</span>
            </div>
            <div>
              <span className="text-gray-300">Address: </span>
              <span className="text-white break-all">{address}</span>
            </div>
            <div>
              <span className="text-gray-300">Connector: </span>
              <span className="text-white">{connector?.name}</span>
            </div>
            <div>
              <span className="text-gray-300">Environment: </span>
              <span className={isBaseApp ? 'text-green-400' : 'text-blue-400'}>
                {isBaseApp ? 'Base App/Farcaster' : 'Web Browser'}
              </span>
            </div>
          </div>
          
          <button
            onClick={handleDisconnect}
            className="pixel-button w-full mt-4 py-2 px-4 bg-red-600 hover:bg-red-700"
          >
            Disconnect Wallet
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="pixel-card p-4">
        <h3 className="text-lg font-bold text-white mb-3">How to Use</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p>1. <strong>Connect:</strong> Click "Connect Wallet" to connect your wallet</p>
          <p>2. <strong>Sign:</strong> Approve the connection in your wallet</p>
          <p>3. <strong>Transact:</strong> Use the transaction examples to test signing</p>
          <p>4. <strong>Batch:</strong> Try batch transactions for multiple operations</p>
        </div>
        
        {isBaseApp && (
          <div className="mt-3 p-3 bg-green-900/30 border border-green-500 rounded">
            <p className="text-green-200 text-xs">
              🎉 <strong>Base App Mode:</strong> You're using the optimized Farcaster Mini App wallet integration!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
