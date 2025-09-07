'use client';

import { WalletIntegration } from '../../components/wallet/WalletIntegration';

export default function WalletTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🐉 Defeat the Dragon - Wallet Integration Test
          </h1>
          <p className="text-xl text-gray-300">
            Test Farcaster Mini App wallet connection and transaction signing
          </p>
        </div>

        <WalletIntegration />

        <div className="mt-8 pixel-card p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Integration Details</h2>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="text-lg font-semibold text-blue-400 mb-2">Farcaster Mini App</h3>
              <ul className="space-y-1 text-gray-300">
                <li>• Uses @farcaster/miniapp-wagmi-connector</li>
                <li>• Automatic wallet connection in Base App</li>
                <li>• No wallet selection dialog needed</li>
                <li>• Optimized for Farcaster environment</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-2">Transaction Features</h3>
              <ul className="space-y-1 text-gray-300">
                <li>• Single transaction signing</li>
                <li>• Batch transactions (EIP-5792)</li>
                <li>• Base Network integration</li>
                <li>• Error handling and user feedback</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 pixel-card p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Testing Instructions</h2>
          <div className="space-y-3 text-gray-300">
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <p>Open this page in Base App or Farcaster to test the Mini App integration</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <p>Click "Connect Wallet" - it should automatically connect without showing wallet selection</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <p>Try the transaction examples to test signing functionality</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
              <p>Test batch transactions for multiple operations in one confirmation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
