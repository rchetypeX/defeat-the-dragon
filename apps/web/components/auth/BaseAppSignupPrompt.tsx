'use client';

import { useState } from 'react';
import { WalletSignupForm } from './WalletSignupForm';

interface BaseAppSignupPromptProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function BaseAppSignupPrompt({ onSuccess, onCancel }: BaseAppSignupPromptProps) {
  const [showSignupForm, setShowSignupForm] = useState(false);

  if (showSignupForm) {
    return (
      <WalletSignupForm
        onSuccess={() => {
          setShowSignupForm(false);
          onSuccess?.();
        }}
        onCancel={() => {
          setShowSignupForm(false);
          onCancel?.();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-4">
      <div className="pixel-card p-8 text-center max-w-md w-full">
        <div className="text-4xl mb-6">⚔️</div>
        
        <h1 className="text-2xl font-bold text-[#f2751a] mb-4">
          Welcome to Defeat the Dragon!
        </h1>
        
        <p className="text-[#fbbf24] mb-6">
          You're accessing this game through The Base App. To get started, you'll need to create an account by connecting your in-app wallet.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={() => setShowSignupForm(true)}
            className="w-full pixel-button bg-[#f2751a] hover:bg-[#e0661a] text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Connect Wallet & Sign Up
          </button>
          
          <button
            onClick={onCancel}
            className="w-full pixel-button bg-[#654321] hover:bg-[#543210] text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
        
        <div className="mt-6 text-sm text-gray-400">
          <p>By signing up, you agree to our terms of service.</p>
          <p>Your wallet connection is secure and private.</p>
        </div>
      </div>
    </div>
  );
}
