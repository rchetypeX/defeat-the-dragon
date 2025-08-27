'use client';

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface EmailLinkFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function EmailLinkForm({ onSuccess, onCancel }: EmailLinkFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const handleLinkEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('Please log in first');
      return;
    }

    if (!email || !password || !displayName) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/link-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          displayName,
          userId: user.id,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        onSuccess();
      } else {
        setError(result.error || 'Failed to link email');
      }
    } catch (err: any) {
      console.error('Email linking error:', err);
      setError(err.message || 'Failed to link email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-[#fbbf24] mb-2">📧 Link Email</h3>
        <p className="text-sm text-gray-300">
          Add an email to your wallet account for easier sign-in
        </p>
      </div>

      <form onSubmit={handleLinkEmail} className="space-y-3">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 bg-[#1a1a2e] border border-[#8b4513] rounded text-white placeholder-gray-400 focus:outline-none focus:border-[#f2751a]"
            placeholder="Enter your email"
            required
          />
        </div>

        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-1">
            Display Name
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
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 bg-[#1a1a2e] border border-[#8b4513] rounded text-white placeholder-gray-400 focus:outline-none focus:border-[#f2751a]"
            placeholder="Create a password (min 6 characters)"
            minLength={6}
            required
            autoComplete="new-password"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-[#6b7280] hover:bg-[#4b5563] disabled:opacity-50 transition-colors rounded text-white font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-[#f2751a] hover:bg-[#e65a0a] disabled:opacity-50 transition-colors rounded text-white font-semibold"
          >
            {isLoading ? 'Linking...' : 'Link Email'}
          </button>
        </div>
      </form>

      <div className="text-xs text-gray-400 text-center">
        <p>This will add an email to your current wallet account</p>
        <p>You'll be able to sign in with either method</p>
      </div>
    </div>
  );
}
