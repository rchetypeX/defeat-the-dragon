'use client';

import { useState } from 'react';
import { useWalletAuth } from '../../hooks/useWalletAuth';
import { AlphaCodeInput } from './AlphaCodeInput';

export function WalletLoginForm() {
  const [displayName, setDisplayName] = useState('');
  const [alphaCodeVerified, setAlphaCodeVerified] = useState(false);
  const [reservedToken, setReservedToken] = useState<string | null>(null);
  const [reservedUntil, setReservedUntil] = useState<string | null>(null);
  
  const {
    address,
    isConnected,
    isConnecting,
    isCheckingAccount,
    hasAccount,
    authError,
    availableAccounts,
    isSwitchingWallet,
    availableProviders,
    selectedProvider,
    showProviderSelection,
    connectWallet,
    disconnectWallet,
    switchWallet,
    switchToSpecificAccount,
    signInWithWallet,
    signUpWithWallet,
    selectProvider,
    cancelProviderSelection,
  } = useWalletAuth();

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
    
    // Require alpha code verification for new users
    if (!alphaCodeVerified || !reservedToken) {
      return;
    }

    // Check if reservation is still valid
    if (reservedUntil && new Date(reservedUntil) < new Date()) {
      setAlphaCodeVerified(false);
      setReservedToken(null);
      setReservedUntil(null);
      return;
    }
    
    await signUpWithWallet(displayName.trim(), reservedToken);
  };

  const handleAlphaCodeVerified = (token: string, until: string) => {
    setReservedToken(token);
    setReservedUntil(until);
    setAlphaCodeVerified(true);
  };

  const handleAlphaCodeError = (message: string) => {
    setAlphaCodeVerified(false);
    setReservedToken(null);
    setReservedUntil(null);
  };

  // Auto-detect if user should sign up or sign in based on account existence
  const shouldShowSignUp = hasAccount === false;
  const shouldShowSignIn = hasAccount === true;
  
  // Check if the form is valid for submission - no uniqueness requirement
  const isFormValid = shouldShowSignUp ? 
    (displayName.trim().length >= 2 && displayName.trim().length <= 20 && alphaCodeVerified) : 
    true;

  return (
    <div className="max-w-md mx-auto pixel-card p-1 sm:p-2 wallet-login-form">
      <h2 className="text-sm sm:text-base font-bold text-center mb-1 sm:mb-2 text-[#f2751a]">
        {shouldShowSignUp ? 'Create Account' : 'Sign In'}
      </h2>
      
      {authError && (
        <div className="bg-[#ef4444] text-white p-1 mb-2 border-2 border-[#654321] text-xs">
          {authError}
        </div>
      )}

      {/* Wallet Provider Selection Modal */}
      {showProviderSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] border-2 border-[#654321] rounded-lg p-4 sm:p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-base sm:text-lg font-bold text-center mb-4 text-[#f2751a]">
              Select Wallet Provider
            </h3>
            <p className="text-[#fbbf24] text-xs sm:text-sm mb-4 text-center">
              Multiple wallet extensions detected. Please choose which one to use:
            </p>
            <div className="space-y-3">
              {availableProviders.map((provider) => (
                <button
                  key={provider}
                  onClick={() => selectProvider(provider)}
                  className="w-full py-3 px-4 bg-[#2d1b0e] border border-[#654321] rounded hover:bg-[#3d2b1e] transition-colors text-[#fbbf24] text-sm"
                >
                  {provider}
                </button>
              ))}
              <button
                onClick={cancelProviderSelection}
                className="w-full py-3 px-4 bg-[#654321] text-[#fbbf24] rounded hover:bg-[#543210] transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
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
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm6 0a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd" />
                  </svg>
                  <span>
                    {selectedProvider 
                      ? `Connect ${selectedProvider}` 
                      : 'Connect your Web3 Wallet'
                    }
                  </span>
                </>
              )}
            </button>
            {selectedProvider && (
              <p className="text-xs text-[#fbbf24] mt-2 text-center">
                Selected: {selectedProvider}
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
                <p className="text-xs text-white font-mono break-all wallet-address">
                  {address}
                </p>
              </div>

              {/* Available accounts dropdown - only show if multiple accounts */}
              {availableAccounts.length > 1 && (
                <div className="mb-1">
                  <label className="block text-xs text-[#fbbf24] mb-0.5">
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
                    className="w-full bg-[#2d1b0e] border border-[#8b4513] rounded px-1 py-0.5 text-white text-xs wallet-address"
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
                className="w-full px-2 py-1 bg-[#f2751a] text-white text-xs rounded hover:bg-[#e65a0a] disabled:opacity-50 flex items-center justify-center"
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
                  <>
                    {/* Alpha Code Input - Required for new users */}
                    <AlphaCodeInput
                      onCodeVerified={handleAlphaCodeVerified}
                      onError={handleAlphaCodeError}
                      disabled={isConnecting}
                    />
                    
                    <div>
                      <label htmlFor="displayName" className="block text-xs font-medium mb-1 text-[#fbbf24]">
                        Adventurer Name
                      </label>
                      <input
                        id="displayName"
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        required
                        className="w-full pixel-input text-xs"
                        placeholder="Enter your name"
                        maxLength={20}
                      />
                      
                      {/* Character count indicator */}
                      <div className="mt-0.5 flex justify-between items-center">
                        <p className="text-xs text-[#8B4513] font-medium">
                          Choose a name for your character (2-20 characters)
                        </p>
                        <span className="text-xs text-[#8B4513] font-medium">
                          {displayName.length}/20
                        </span>
                      </div>
                    </div>
                  </>
                )}
                
                <button
                  onClick={shouldShowSignUp ? handleSignUp : handleSignIn}
                  disabled={isConnecting || !isFormValid}
                  className="w-full pixel-button disabled:opacity-50"
                >
                  {isConnecting ? 'Processing...' : 
                   (shouldShowSignUp ? 
                     (!alphaCodeVerified ? 'Verify Alpha Code First' : 'START ADVENTURE') : 
                     'Sign In')}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
