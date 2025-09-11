'use client';

import { useState } from 'react';
import { useUnifiedWalletAuth } from '../../hooks/useUnifiedWalletAuth';
import { WalletSignupForm } from './WalletSignupForm';

export function WalletLoginForm() {
  const [showSignupForm, setShowSignupForm] = useState(false);
  
  const {
    address,
    isConnected,
    isConnecting,
    platform,
    isBaseApp,
    isFarcaster,
    hasWallet,
    canConnect,
    error: authError,
    connect,
    disconnect,
  } = useUnifiedWalletAuth();

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleDisconnect = async () => {
    console.log('Disconnecting wallet...');
    await disconnect();
  };

  const handleSignUp = async () => {
    // This function is no longer used since we show the signup form modal
    // The actual signup is handled by WalletSignupForm component
    setShowSignupForm(true);
  };

  // Check if the form is valid for submission
  const isFormValid = true;

  const shouldShowExternalWallets = () => {
    return !isBaseApp;
  };

  return (
    <div className="max-w-md mx-auto pixel-card p-1 sm:p-2 wallet-login-form">
      <h2 className="text-sm sm:text-base font-bold text-center mb-1 sm:mb-2 text-[#f2751a]">
        {isConnected ? 'Wallet Connected' : 'Connect Wallet'}
      </h2>
      
      {authError && (
        <div className="bg-[#ef4444] text-white p-1 mb-2 border-2 border-[#654321] text-xs">
          {authError}
        </div>
      )}

      
      <div className="space-y-1">
        {!isConnected ? (
          <div>
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full pixel-button disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isConnecting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd" />
                  </svg>
                  <span>
                    {isBaseApp 
                      ? 'Connect Base App Wallet'
                      : isFarcaster
                        ? 'Connect Farcaster Wallet'
                        : 'Connect your Web3 Wallet'
                    }
                  </span>
                </>
              )}
            </button>
            {isBaseApp && (
              <p className="text-xs text-[#fbbf24] mt-2 text-center">
                Using Base App's built-in wallet
              </p>
            )}
            {isFarcaster && (
              <p className="text-xs text-[#fbbf24] mt-2 text-center">
                Using Farcaster's built-in wallet
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {/* Compact wallet display for mobile */}
            <div className="bg-[#1a1a2e] p-1 border border-[#654321] rounded">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-[#fbbf24] font-medium">Connected Wallet</p>
                <button
                  onClick={handleDisconnect}
                  disabled={isConnecting}
                  className="px-1 py-0.5 bg-[#ef4444] text-white text-xs rounded hover:bg-[#dc2626] disabled:opacity-50"
                >
                  Disconnect
                </button>
              </div>
              
              {/* Current wallet address - more compact */}
              <div className="mb-2">
                <p className="text-xs text-[#f5f5dc] font-mono break-all wallet-address font-semibold bg-[#2d1b0e] p-1 rounded border border-[#654321]">
                  {address}
                </p>
              </div>


            </div>
            
            {/* Show signup option for connected wallets */}
            <button
              onClick={() => setShowSignupForm(true)}
              disabled={isConnecting}
              className="w-full pixel-button disabled:opacity-50"
            >
              START ADVENTURE
            </button>
          </div>
        )}
      </div>

      {/* rchetypeX Logo */}
      <div className="mt-6 text-center">
        <a
          href="https://rchetype.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block hover:opacity-80 transition-opacity"
        >
          <img
            src="/rchetypex.png"
            alt="rchetypeX"
            className="mx-auto h-8 w-auto"
          />
        </a>
      </div>

      {/* Wallet Signup Modal */}
      {showSignupForm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2d1b0e] border-2 border-[#8b4513] rounded-lg p-6 max-w-md w-full shadow-2xl">
            <WalletSignupForm
              onSuccess={() => {
                setShowSignupForm(false);
                // The useWalletAuth hook will handle the page reload after setting localStorage
                // No need to reload here as it can cause race conditions
              }}
              onCancel={() => setShowSignupForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
