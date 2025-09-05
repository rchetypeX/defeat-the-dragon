'use client';

import { useState } from 'react';
import { useWalletAuth } from '../../hooks/useWalletAuth';
import { WalletSignupForm } from './WalletSignupForm';
import { BaseAccountFeatures } from '../wallet/BaseAccountFeatures';

export function WalletLoginForm() {
  const [showSignupForm, setShowSignupForm] = useState(false);
  
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
    isBaseApp,
    baseAccountCapabilities,
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
    // This function is no longer used since we show the signup form modal
    // The actual signup is handled by WalletSignupForm component
    setShowSignupForm(true);
  };

  // Auto-detect if user should sign up or sign in based on account existence
  const shouldShowSignUp = hasAccount === false;
  const shouldShowSignIn = hasAccount === true;
  
  // Check if the form is valid for submission
  const isFormValid = true;

  const shouldShowExternalWallets = () => {
    return !isBaseApp;
  };

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

      {/* Wallet Provider Selection Modal - Only show for external wallets */}
      {showProviderSelection && shouldShowExternalWallets() && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] border-2 border-[#654321] rounded-lg p-4 max-w-xs w-full pixel-card">
            <h3 className="text-[#f2751a] font-bold text-sm mb-2 text-center">
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
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd" />
                  </svg>
                  <span>
                    {isBaseApp 
                      ? 'Connect Base App Wallet'
                      : selectedProvider 
                        ? `Connect ${selectedProvider}` 
                        : 'Connect your Web3 Wallet'
                    }
                  </span>
                </>
              )}
            </button>
            {selectedProvider && shouldShowExternalWallets() && (
              <p className="text-xs text-[#fbbf24] mt-2 text-center">
                Selected: {selectedProvider}
              </p>
            )}
            {isBaseApp && (
              <p className="text-xs text-[#fbbf24] mt-2 text-center">
                Using Base App's built-in wallet
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
                    className="w-full bg-[#2d1b0e] border border-[#8b4513] rounded px-1 py-0.5 text-[#f5f5dc] text-xs wallet-address font-medium"
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
                {shouldShowSignUp ? (
                  <button
                    onClick={() => setShowSignupForm(true)}
                    disabled={isConnecting}
                    className="w-full pixel-button disabled:opacity-50"
                  >
                    START ADVENTURE
                  </button>
                ) : (
                  <button
                    onClick={handleSignIn}
                    disabled={isConnecting || !isFormValid}
                    className="w-full pixel-button disabled:opacity-50"
                  >
                    Sign In
                  </button>
                )}
              </>
            )}
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

      {/* Base Account Features */}
      {isConnected && baseAccountCapabilities && (
        <div className="mt-6">
          <BaseAccountFeatures />
        </div>
      )}

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
