'use client';

import { useState, useEffect } from 'react';
import { useWalletAuth } from '../../hooks/useWalletAuth';

interface WalletSignupFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function WalletSignupForm({ onSuccess, onCancel }: WalletSignupFormProps) {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmailValid, setIsEmailValid] = useState(false);
  
  const {
    address,
    isConnected,
    signUpWithWallet,
    authError: walletAuthError
  } = useWalletAuth();

  // Auto-generate display name from wallet address
  useEffect(() => {
    if (address && !displayName) {
      setDisplayName(`Player_${address.slice(2, 8)}`);
    }
  }, [address, displayName]);

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

    if (!displayName || displayName.trim().length < 2) {
      setError('Display name must be at least 2 characters long');
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
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-[#fbbf24] mb-2">🔗 Wallet Signup</h3>
        <p className="text-sm text-gray-300 mb-4">
          Complete your account setup by providing an email address
        </p>
        
        {/* Connected Wallet Display */}
        <div className="bg-[#1a1a2e] p-3 border border-[#654321] rounded mb-4">
          <p className="text-xs text-[#fbbf24] mb-1">Connected Wallet:</p>
          <p className="text-xs text-white font-mono break-all">{address}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
            Email Address <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full px-3 py-2 bg-[#1a1a2e] border rounded text-white placeholder-gray-400 focus:outline-none focus:border-[#f2751a] ${
              email && !isEmailValid ? 'border-red-500' : 'border-[#8b4513]'
            }`}
            placeholder="Enter your email address"
            required
            disabled={isLoading}
          />
          {email && !isEmailValid && (
            <p className="text-xs text-red-400 mt-1">Please enter a valid email address</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            This email will be linked to your wallet for account recovery and notifications
          </p>
        </div>

        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-1">
            Display Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3 py-2 bg-[#1a1a2e] border border-[#8b4513] rounded text-white placeholder-gray-400 focus:outline-none focus:border-[#f2751a]"
            placeholder="Enter your display name"
            maxLength={20}
            required
            disabled={isLoading}
          />
          <p className="text-xs text-gray-400 mt-1">
            This will be your in-game character name (2-20 characters)
          </p>
        </div>

        {error && (
          <div className="bg-[#ef4444] text-white p-3 border border-[#654321] text-sm rounded">
            {error}
          </div>
        )}

        {walletAuthError && (
          <div className="bg-[#ef4444] text-white p-3 border border-[#654321] text-sm rounded">
            {walletAuthError}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-[#6b7280] text-white rounded hover:bg-[#4b5563] disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !isEmailValid || !displayName.trim()}
            className="flex-1 px-4 py-2 bg-[#8B4513] text-white rounded hover:bg-[#654321] disabled:opacity-50 transition-colors"
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
        </div>
      </form>

      <div className="text-xs text-gray-400 text-center p-3 bg-[#1a1a2e] rounded border border-[#654321]">
        <p className="mb-2">📧 <strong>Why do we need your email?</strong></p>
        <ul className="text-left space-y-1">
          <li>• Account recovery if you lose access to your wallet</li>
          <li>• Important game notifications and updates</li>
          <li>• Cross-device access to your account</li>
          <li>• Support and customer service</li>
        </ul>
      </div>
    </div>
  );
}
