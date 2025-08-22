'use client';

import { useState } from 'react';
import { useWalletAuth } from '../../hooks/useWalletAuth';

export function WalletLoginForm() {
  const [displayName, setDisplayName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  
  const {
    address,
    isConnected,
    isConnecting,
    authError,
    connectWallet,
    signInWithWallet,
    signUpWithWallet,
  } = useWalletAuth();

  const handleConnect = async () => {
    await connectWallet();
  };

  const handleSignIn = async () => {
    await signInWithWallet();
  };

  const handleSignUp = async () => {
    if (!displayName.trim()) {
      return;
    }
    await signUpWithWallet(displayName.trim());
  };

  return (
    <div className="max-w-md mx-auto pixel-card p-6">
      <h2 className="text-2xl font-bold text-center mb-6 text-[#f2751a]">
        {isSignUp ? 'Create Account' : 'Sign In'}
      </h2>
      
      {authError && (
        <div className="bg-[#ef4444] text-white p-3 mb-4 border-2 border-[#654321]">
          {authError}
        </div>
      )}
      
      <div className="space-y-4">
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
                    <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8.5 12.5l7-4.5-7-4.5v9z"/>
                  </svg>
                  <span>Connect Wallet</span>
                </>
              )}
            </button>
            <p className="text-sm text-center mt-2 text-[#fbbf24]">
              Connect your MetaMask or other Web3 wallet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-[#1a1a2e] p-3 border-2 border-[#654321] rounded">
              <p className="text-sm text-[#fbbf24] mb-1">Connected Wallet:</p>
              <p className="text-xs text-white font-mono break-all">
                {address}
              </p>
            </div>
            
            {isSignUp && (
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium mb-2 text-[#fbbf24]">
                  Display Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="w-full pixel-input"
                  placeholder="Enter your display name"
                  maxLength={20}
                />
              </div>
            )}
            
            <button
              onClick={isSignUp ? handleSignUp : handleSignIn}
              disabled={isConnecting || (isSignUp && !displayName.trim())}
              className="w-full pixel-button disabled:opacity-50"
            >
              {isConnecting ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
            
            <div className="text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-[#fbbf24] hover:text-[#f2751a] text-sm underline"
              >
                {isSignUp ? 'Already have an account? Sign in' : 'New user? Create account'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
