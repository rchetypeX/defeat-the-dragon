'use client';

import { useState, useCallback } from 'react';

interface AlphaCodeInputProps {
  onCodeVerified: (reservedToken: string, reservedUntil: string) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}

export function AlphaCodeInput({ onCodeVerified, onError, disabled = false }: AlphaCodeInputProps) {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [lastAttempt, setLastAttempt] = useState(0);

  const normalizeCode = useCallback((input: string): string => {
    // Remove spaces, dashes, and convert to uppercase
    return input.replace(/[\s-]/g, '').toUpperCase();
  }, []);

  const formatCode = useCallback((input: string): string => {
    const normalized = normalizeCode(input);
    // Format as DTD-XXXX-XXXX
    if (normalized.length <= 4) {
      return normalized;
    } else if (normalized.length <= 8) {
      return `${normalized.slice(0, 4)}-${normalized.slice(4)}`;
    } else {
      return `${normalized.slice(0, 4)}-${normalized.slice(4, 8)}`;
    }
  }, [normalizeCode]);

  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const formatted = formatCode(input);
    setCode(formatted);
  }, [formatCode]);

  const verifyCode = useCallback(async () => {
    if (!code || isVerifying || disabled) return;

    // Rate limiting: Prevent multiple attempts within 1 second
    const now = Date.now();
    if (now - lastAttempt < 1000) {
      return;
    }
    setLastAttempt(now);

    setIsVerifying(true);

    try {
      const normalizedCode = normalizeCode(code);
      
      // Call the API to verify and reserve the code
      const response = await fetch('/api/alpha/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: normalizedCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          onError('Too many attempts. Please wait a moment.');
        } else {
          onError('alpha code invalid');
        }
        return;
      }

      if (data.reserved_token && data.reserved_until) {
        onCodeVerified(data.reserved_token, data.reserved_until);
      } else {
        onError('alpha code invalid');
      }

    } catch (error) {
      console.error('Alpha code verification error:', error);
      onError('alpha code invalid');
    } finally {
      setIsVerifying(false);
    }
  }, [code, isVerifying, disabled, lastAttempt, normalizeCode, onCodeVerified, onError]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    verifyCode();
  }, [verifyCode]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      verifyCode();
    }
  }, [verifyCode]);

  return (
    <div className="space-y-1">
      <label htmlFor="alpha-code" className="block text-xs font-medium mb-0.5 text-[#fbbf24]">
        Alpha access code
      </label>
      <div className="flex space-x-1">
        <input
          id="alpha-code"
          type="text"
          value={code}
          onChange={handleCodeChange}
          onKeyPress={handleKeyPress}
          placeholder="DTD-XXXX-XXXX"
          maxLength={12} // DTD-XXXX-XXXX
          className="flex-1 pixel-input text-xs placeholder:text-xs"
          disabled={disabled || isVerifying}
        />
        <button
          type="button"
          onClick={verifyCode}
          disabled={!code || isVerifying || disabled}
          className="px-2 py-1 bg-[#f2751a] text-white rounded hover:bg-[#e65a0a] focus:outline-none focus:ring-2 focus:ring-[#f2751a] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
        >
          {isVerifying ? 'Verifying...' : 'Verify'}
        </button>
      </div>
      <p className="text-xs text-[#8B4513]">
        Enter your alpha access code to join the alpha test
      </p>
    </div>
  );
}
