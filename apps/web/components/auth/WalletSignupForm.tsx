'use client';

import { useState, useEffect } from 'react';
import { useWalletAuth } from '../../hooks/useWalletAuth';

interface WalletSignupFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function WalletSignupForm({ onSuccess, onCancel }: WalletSignupFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmailValid, setIsEmailValid] = useState(false);
  
  const {
    address,
    isConnected,
    signUpWithWallet,
    authError: walletAuthError,
    isBaseApp,
    baseAppUser,
    authenticateWithBaseApp
  } = useWalletAuth();

  // Auto-generate display name from wallet address
  const displayName = `Player_${address?.slice(2, 8) || '000000'}`;

  // Validate email format
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsEmailValid(emailRegex.test(email));
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }

    if (!email || !isEmailValid) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call the enhanced signup function with email
      await signUpWithWallet(email, displayName);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBaseAppAuth = async () => {
    if (!isBaseApp) {
      setError('Base App authentication not available');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔐 Starting Base App authentication...');
      await authenticateWithBaseApp();
      console.log('✅ Base App authentication successful');
      
      // If we have a baseAppUser after authentication, proceed with signup
      if (baseAppUser) {
        console.log('🔐 Base App user authenticated, proceeding with signup...');
        // For Base App users, we'll use their Farcaster ID as the identifier
        // The email will be used for the account creation
        await signUpWithWallet(email, displayName);
        // Only call onSuccess if signup was actually successful
        // The signUpWithWallet function will handle errors and throw if failed
        console.log('✅ Base App signup successful');
        onSuccess?.();
      } else {
        setError('Base App authentication completed but no user data received');
      }
    } catch (err: any) {
      console.error('❌ Base App authentication or signup failed:', err);
      // Don't close the modal on error - let the user see the error and try again
      setError(err.message || 'Base App authentication or signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
  };

  if (!isConnected) {
    return (
      <div className="text-center p-4">
        <p className="text-[#fbbf24] mb-4">Please connect your wallet first to continue with signup.</p>
        <button
          onClick={handleCancel}
          className="px-4 py-2 bg-[#654321] text-white rounded hover:bg-[#543210] transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 wallet-signup-form">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-[#fbbf24] mb-2">
          {isBaseApp ? '🔐 Base App Signup' : '🔗 Wallet Signup'}
        </h3>
        {isBaseApp && (
          <p className="text-sm text-[#f5f5dc] mb-3">
            You're using Base App. Click "Authenticate with Base App" to continue.
          </p>
        )}
        
        {/* Connected Wallet Display */}
        <div className="bg-[#2d1b0e] p-3 border-2 border-[#8b4513] rounded mb-3">
          <p className="text-sm text-[#fbbf24] mb-2 font-medium">Connected Wallet:</p>
          <p className="text-sm text-[#f5f5dc] font-mono break-all font-semibold bg-[#1a1a2e] p-2 rounded border border-[#654321]">{address}</p>
          <p className="text-sm text-[#f5f5dc] mt-2 font-medium">Display Name: <span className="text-[#fbbf24] font-semibold">{displayName}</span></p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-[#fbbf24] mb-2">
            Email Address <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full px-3 py-2 bg-[#2d1b0e] border-2 rounded text-[#f5f5dc] placeholder-[#a0a0a0] focus:outline-none focus:border-[#f2751a] focus:ring-2 focus:ring-[#f2751a] focus:ring-opacity-50 ${
              email && !isEmailValid ? 'border-red-500' : 'border-[#8b4513]'
            }`}
            placeholder="Enter your email address"
            required
            disabled={isLoading}
          />
          {email && !isEmailValid && (
            <p className="text-xs text-red-400 mt-1 font-medium">Please enter a valid email address</p>
          )}
        </div>

        {error && (
          <div className="bg-[#ef4444] text-white p-3 border-2 border-white text-sm rounded font-semibold">
            {error}
          </div>
        )}

        {walletAuthError && (
          <div className="bg-[#ef4444] text-white p-3 border-2 border-white text-sm rounded font-semibold">
            {walletAuthError}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-[#6b7280] text-white rounded hover:bg-[#4b5563] disabled:opacity-50 transition-colors font-semibold"
          >
            Cancel
          </button>
          {isBaseApp ? (
            // Base App users get a special authentication flow
            <button
              type="button"
              onClick={handleBaseAppAuth}
              disabled={isLoading || !isEmailValid}
              className="flex-1 px-4 py-2 bg-[#f2751a] text-white rounded hover:bg-[#e0650a] disabled:opacity-50 transition-colors font-semibold"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Authenticating...
                </span>
              ) : (
                'Authenticate with Base App'
              )}
            </button>
          ) : (
            // Regular wallet users use the standard flow
            <button
              type="submit"
              disabled={isLoading || !isEmailValid}
              className="flex-1 px-4 py-2 bg-[#8B4513] text-white rounded hover:bg-[#654321] disabled:opacity-50 transition-colors font-semibold"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating Account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          )}
        </div>
      </form>

      {/* rchetypeX Logo */}
      <div className="mt-4 text-center">
        <a
          href="https://rchetype.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block hover:opacity-80 transition-opacity"
        >
          <img
            src="/rchetypex.png"
            alt="rchetypeX"
            className="mx-auto h-6 w-auto"
          />
        </a>
      </div>
    </div>
  );
}
