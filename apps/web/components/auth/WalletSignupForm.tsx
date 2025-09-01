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
    authError: walletAuthError
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
    <div className="space-y-3">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-[#fbbf24] mb-2">🔗 Wallet Signup</h3>
        
        {/* Connected Wallet Display */}
        <div className="bg-[#1a1a2e] p-2 border border-[#654321] rounded mb-3">
          <p className="text-xs text-[#fbbf24] mb-1">Connected Wallet:</p>
          <p className="text-xs text-white font-mono break-all font-medium">{address}</p>
          <p className="text-xs text-white mt-1">Display Name: {displayName}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
            Email Address <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full px-3 py-2 bg-[#1a1a2e] border rounded text-white placeholder-gray-200 focus:outline-none focus:border-[#f2751a] ${
              email && !isEmailValid ? 'border-red-500' : 'border-[#8b4513]'
            }`}
            placeholder="Enter your email address"
            required
            disabled={isLoading}
          />
          {email && !isEmailValid && (
            <p className="text-xs text-red-400 mt-1">Please enter a valid email address</p>
          )}
        </div>

        {error && (
          <div className="bg-[#ef4444] text-white p-2 border-2 border-white text-sm rounded font-medium">
            {error}
          </div>
        )}

        {walletAuthError && (
          <div className="bg-[#ef4444] text-white p-2 border-2 border-white text-sm rounded font-medium">
            {walletAuthError}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-[#6b7280] text-white rounded hover:bg-[#4b5563] disabled:opacity-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !isEmailValid}
            className="flex-1 px-4 py-2 bg-[#8B4513] text-white rounded hover:bg-[#654321] disabled:opacity-50 transition-colors font-medium"
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
    </div>
  );
}
