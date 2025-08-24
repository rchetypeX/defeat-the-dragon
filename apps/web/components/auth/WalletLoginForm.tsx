'use client';

import { useState } from 'react';
import { useWalletAuth } from '../../hooks/useWalletAuth';
import { useDisplayNameCheck } from '../../hooks/useDisplayNameCheck';

export function WalletLoginForm() {
  const [displayName, setDisplayName] = useState('');
  
  const {
    address,
    isConnected,
    isConnecting,
    isCheckingAccount,
    hasAccount,
    authError,
    availableAccounts,
    isSwitchingWallet,
    connectWallet,
    disconnectWallet,
    switchWallet,
    switchToSpecificAccount,
    signInWithWallet,
    signUpWithWallet,
  } = useWalletAuth();

  const { isAvailable, isChecking: isCheckingName, error: nameError } = useDisplayNameCheck(displayName);

  const handleConnect = async () => {
    await connectWallet();
  };

  const handleDisconnect = async () => {
    console.log('Disconnecting wallet...');
    await disconnectWallet();
  };

  const handleSwitchWallet = async () => {
    console.log('Switching wallet...');
    await switchWallet();
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

  // Auto-detect if user should sign up or sign in based on account existence
  const shouldShowSignUp = hasAccount === false;
  const shouldShowSignIn = hasAccount === true;
  
  // Check if the form is valid for submission
  const isFormValid = shouldShowSignUp ? 
    (displayName.trim().length >= 2 && isAvailable === true) : 
    true;

  return (
    <div className="max-w-md mx-auto pixel-card p-4">
      <h2 className="text-xl font-bold text-center mb-4 text-[#f2751a]">
        {shouldShowSignUp ? 'Create Account' : 'Sign In'}
      </h2>
      
      {authError && (
        <div className="bg-[#ef4444] text-white p-2 mb-3 border-2 border-[#654321] text-sm">
          {authError}
        </div>
      )}
      
      <div className="space-y-3">
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
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm6 0a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd" />
                  </svg>
                  <span>Connect your Web3 Wallet</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Enhanced wallet display with switching options */}
            <div className="bg-[#1a1a2e] p-3 border border-[#654321] rounded">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-[#fbbf24] font-medium">Connected Wallet</p>
                <button
                  onClick={handleDisconnect}
                  disabled={isConnecting}
                  className="px-2 py-1 bg-[#ef4444] text-white text-xs rounded hover:bg-[#dc2626] disabled:opacity-50"
                >
                  Disconnect
                </button>
              </div>
              
              {/* Current wallet address */}
              <div className="mb-3">
                <p className="text-xs text-white font-mono break-all">
                  {address}
                </p>
              </div>

              {/* Available accounts dropdown */}
              {availableAccounts.length > 1 && (
                <div className="mb-3">
                  <label className="block text-xs text-[#fbbf24] mb-1">
                    Switch to different wallet:
                  </label>
                  <select
                    value={address || ''}
                    onChange={(e) => {
                      if (e.target.value !== address) {
                        switchToSpecificAccount(e.target.value);
                      }
                    }}
                    disabled={isSwitchingWallet}
                    className="w-full bg-[#2d1b0e] border border-[#8b4513] rounded px-2 py-1 text-white text-xs"
                  >
                    {availableAccounts.map((acc) => (
                      <option key={acc} value={acc}>
                        {acc.slice(0, 6)}...{acc.slice(-4)} {acc === address ? '(Current)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Switch wallet button */}
              <button
                onClick={handleSwitchWallet}
                disabled={isSwitchingWallet || isConnecting}
                className="w-full px-3 py-1 bg-[#f2751a] text-white text-xs rounded hover:bg-[#e65a0a] disabled:opacity-50 flex items-center justify-center"
              >
                {isSwitchingWallet ? (
                  <>
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Switching...
                  </>
                ) : (
                  'Switch Wallet'
                )}
              </button>
            </div>
            
            {/* Show appropriate action based on account status */}
            {!isCheckingAccount && hasAccount !== null && (
              <>
                {shouldShowSignUp && (
                  <div>
                    <label htmlFor="displayName" className="block text-sm font-medium mb-1 text-[#fbbf24]">
                      Adventurer Name
                    </label>
                    <input
                      id="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      className={`w-full pixel-input text-sm ${
                        displayName.trim().length >= 2 && isAvailable === false ? 'border-[#ef4444]' : 
                        displayName.trim().length >= 2 && isAvailable === true ? 'border-[#10b981]' : ''
                      }`}
                      placeholder="Enter your adventure"
                      maxLength={20}
                    />
                    
                    {/* Name availability indicator */}
                    {displayName.trim().length >= 2 && (
                      <div className="mt-1">
                        {isCheckingName ? (
                          <div className="flex items-center">
                            <div className="w-3 h-3 border border-[#fbbf24] border-t-transparent rounded-full animate-spin mr-2"></div>
                            <span className="text-xs text-[#fbbf24]">Checking...</span>
                          </div>
                        ) : isAvailable === true ? (
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-[#10b981] rounded-full mr-2"></div>
                            <span className="text-xs text-[#10b981]">Available!</span>
                          </div>
                        ) : isAvailable === false ? (
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-[#ef4444] rounded-full mr-2"></div>
                            <span className="text-xs text-[#ef4444]">Taken</span>
                          </div>
                        ) : null}
                      </div>
                    )}
                    
                    <p className="text-xs text-white mt-1">
                      Choose a unique name for your character (2-20 characters)
                    </p>
                  </div>
                )}
                
                <button
                  onClick={shouldShowSignUp ? handleSignUp : handleSignIn}
                  disabled={isConnecting || !isFormValid}
                  className="w-full pixel-button disabled:opacity-50"
                >
                  {isConnecting ? 'Processing...' : (shouldShowSignUp ? 'START ADVENTURE' : 'Sign In')}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
