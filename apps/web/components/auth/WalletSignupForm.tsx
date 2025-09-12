'use client';

import { useState, useEffect } from 'react';
import { useUnifiedWalletAuth } from '../../hooks/useUnifiedWalletAuth';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';

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
    platform,
    isBaseApp,
    error: walletAuthError
  } = useUnifiedWalletAuth();
  
  const {
    user,
    isAuthenticated,
    signIn
  } = useUnifiedAuth();

  // Auto-generate display name from wallet address
  const displayName = `Player_${address?.slice(2, 8) || '000000'}`;

  // Validate email format
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmedEmail = email?.trim() || '';
    const isValid = trimmedEmail.length > 0 && emailRegex.test(trimmedEmail);
    
    console.log('📧 Email validation:', {
      email,
      trimmedEmail,
      isValid,
      length: trimmedEmail.length
    });
    
    setIsEmailValid(isValid);
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }

    if (!email || !email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!isEmailValid) {
      setError('Please enter a valid email address (e.g., user@example.com)');
      return;
    }

    // Additional validation for common issues
    if (email.includes('..') || email.startsWith('.') || email.endsWith('.')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // For Base App, ensure we're authenticated with native SIWF
      if (isBaseApp && !isAuthenticated) {
        console.log('🔐 Base App: Authenticating with native SIWF...');
        await signIn();
      }
      
      // Call the API to create the account
      const response = await fetch('/api/auth/wallet-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          displayName,
          walletAddress: address,
          platform: platform,
          fid: user?.fid || null,
          username: user?.username || null,
          userDisplayName: user?.displayName || displayName
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Signup failed');
      }

      console.log('✅ Account created successfully');
      onSuccess?.();
    } catch (err: any) {
      console.error('❌ Signup failed:', err);
      setError(err.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Base App authentication is now handled by the unified auth system
  // No need for separate Base App auth function

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
          <button
            type="submit"
            disabled={isLoading || !isEmailValid}
            className={`flex-1 px-4 py-2 text-white rounded disabled:opacity-50 transition-colors font-semibold ${
              isBaseApp 
                ? 'bg-[#f2751a] hover:bg-[#e0650a]' 
                : 'bg-[#8B4513] hover:bg-[#654321]'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {isBaseApp ? 'Authenticating...' : 'Creating Account...'}
              </span>
            ) : (
              isBaseApp ? 'Authenticate & Create Account' : 'Create Account'
            )}
          </button>
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
