'use client';

import { useState } from 'react';
import { useWalletAuth } from '../../hooks/useWalletAuth';
import { useDisplayNameCheck } from '../../hooks/useDisplayNameCheck';

export function WalletLoginForm() {
  const [displayName, setDisplayName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  
  const {
    address,
    isConnected,
    isConnecting,
    isCheckingAccount,
    hasAccount,
    authError,
    connectWallet,
    disconnectWallet,
    switchWallet,
    signInWithWallet,
    signUpWithWallet,
  } = useWalletAuth();

  const { isAvailable, isChecking: isCheckingName, error: nameError } = useDisplayNameCheck(displayName);

  const handleConnect = async () => {
    await connectWallet();
  };

  const handleDisconnect = async () => {
    await disconnectWallet();
  };

  const handleSwitchWallet = async () => {
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
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm text-[#fbbf24]">Connected Wallet:</p>
                <div className="flex space-x-2">
                  <button
                    onClick={handleSwitchWallet}
                    disabled={isConnecting}
                    className="text-xs text-[#f2751a] hover:text-[#fbbf24] underline disabled:opacity-50"
                  >
                    Switch
                  </button>
                  <button
                    onClick={handleDisconnect}
                    disabled={isConnecting}
                    className="text-xs text-[#ef4444] hover:text-[#fbbf24] underline disabled:opacity-50"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
              <p className="text-xs text-white font-mono break-all">
                {address}
              </p>
              
              {/* Account Status Indicator */}
              {isCheckingAccount ? (
                <div className="flex items-center mt-2">
                  <div className="w-3 h-3 border border-[#fbbf24] border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span className="text-xs text-[#fbbf24]">Checking account...</span>
                </div>
              ) : hasAccount !== null ? (
                <div className="mt-2">
                  {hasAccount ? (
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-[#10b981] rounded-full mr-2"></div>
                      <span className="text-xs text-[#10b981]">Account found</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-[#f59e0b] rounded-full mr-2"></div>
                      <span className="text-xs text-[#f59e0b]">New wallet - create account</span>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
            
            {/* Show appropriate action based on account status */}
            {!isCheckingAccount && hasAccount !== null && (
              <>
                {shouldShowSignUp && (
                  <div>
                    <label htmlFor="displayName" className="block text-sm font-medium mb-2 text-[#fbbf24]">
                      Adventurer Name
                    </label>
                    <input
                      id="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      className={`w-full pixel-input ${
                        displayName.trim().length >= 2 && isAvailable === false ? 'border-[#ef4444]' : 
                        displayName.trim().length >= 2 && isAvailable === true ? 'border-[#10b981]' : ''
                      }`}
                      placeholder="Enter your adventurer name"
                      maxLength={20}
                    />
                    
                    {/* Name availability indicator */}
                    {displayName.trim().length >= 2 && (
                      <div className="mt-1">
                        {isCheckingName ? (
                          <div className="flex items-center">
                            <div className="w-3 h-3 border border-[#fbbf24] border-t-transparent rounded-full animate-spin mr-2"></div>
                            <span className="text-xs text-[#fbbf24]">Checking availability...</span>
                          </div>
                        ) : isAvailable === true ? (
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-[#10b981] rounded-full mr-2"></div>
                            <span className="text-xs text-[#10b981]">Name available!</span>
                          </div>
                        ) : isAvailable === false ? (
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-[#ef4444] rounded-full mr-2"></div>
                            <span className="text-xs text-[#ef4444]">Name already taken</span>
                          </div>
                        ) : null}
                      </div>
                    )}
                    
                    <p className="text-xs text-[#fbbf24] mt-1">
                      Choose a unique name for your character (2-20 characters)
                    </p>
                  </div>
                )}
                
                <button
                  onClick={shouldShowSignUp ? handleSignUp : handleSignIn}
                  disabled={isConnecting || !isFormValid}
                  className="w-full pixel-button disabled:opacity-50"
                >
                  {isConnecting ? 'Processing...' : (shouldShowSignUp ? 'Create Adventurer' : 'Sign In')}
                </button>
                
                {/* Only show toggle if we have account info */}
                {hasAccount !== null && (
                  <div className="text-center">
                    <button
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="text-[#fbbf24] hover:text-[#f2751a] text-sm underline"
                    >
                      {isSignUp ? 'Already have an account? Sign in' : 'New user? Create account'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
