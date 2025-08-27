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
  const [verificationStatus, setVerificationStatus] = useState<'none' | 'verifying' | 'verified' | 'denied' | 'used'>('none');

  const formatCode = useCallback((input: string): string => {
    // Remove spaces and convert to uppercase, but keep dashes for formatting
    const cleaned = input.replace(/\s/g, '').toUpperCase();
    
    // If it already starts with DTD, don't add another prefix
    if (cleaned.startsWith('DTD')) {
      return cleaned;
    }
    
    // Remove any existing dashes and format properly
    const normalized = cleaned.replace(/-/g, '');
    
    // Format as DTD-XXXX-XXXX
    if (normalized.length >= 8) {
      // Full format: DTD-XXXX-XXXX
      return `DTD-${normalized.slice(0, 4)}-${normalized.slice(4, 8)}`;
    } else if (normalized.length >= 4) {
      // Partial format: DTD-XXXX-...
      return `DTD-${normalized.slice(0, 4)}-${normalized.slice(4)}`;
    } else {
      // Don't add DTD prefix until we have at least 4 characters
      return normalized;
    }
  }, []);

  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Just store the raw input, don't format it
    setCode(input);
  }, []);

  const verifyCode = useCallback(async () => {
    if (!code || isVerifying || disabled) return;

    // Rate limiting: Prevent multiple attempts within 1 second
    const now = Date.now();
    if (now - lastAttempt < 1000) {
      return;
    }
    setLastAttempt(now);

    setIsVerifying(true);
    setVerificationStatus('verifying');

    try {
      // Clean and normalize the code for API
      const cleaned = code.replace(/\s/g, '').toUpperCase();
      const normalized = cleaned.replace(/-/g, '');
      
      // Ensure we send the full code with DTD prefix to the API
      const fullCode = cleaned.startsWith('DTD') ? cleaned : `DTD-${normalized}`;
      
      // Call the API to verify and reserve the code
      const response = await fetch('/api/alpha/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: fullCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setVerificationStatus('denied');
          onError('Too many attempts. Please wait a moment.');
        } else {
          setVerificationStatus('denied');
          // Show debug info if available
          if (data.debug) {
            console.log('Alpha code debug info:', data.debug);
            onError(`alpha code invalid - Check console for debug info`);
          } else {
            onError(data.error || 'alpha code invalid');
          }
        }
        return;
      }

      if (data.reserved_token && data.reserved_until) {
        setVerificationStatus('verified');
        onCodeVerified(data.reserved_token, data.reserved_until);
      } else {
        setVerificationStatus('denied');
        onError('alpha code invalid');
      }

    } catch (error) {
      console.error('Alpha code verification error:', error);
      setVerificationStatus('denied');
      onError('alpha code invalid');
    } finally {
      setIsVerifying(false);
    }
  }, [code, isVerifying, disabled, lastAttempt, onCodeVerified, onError]);

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
        Alpha access code (DTD-XXXX-XXXX)
      </label>
      <div className="flex space-x-1">
        <input
          id="alpha-code"
          type="text"
          value={code}
          onChange={handleCodeChange}
          onKeyPress={handleKeyPress}
          placeholder="DTD-XXXX-XXXX"
          maxLength={12} // Full DTD-XXXX-XXXX format
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
       
       {/* Verification Status */}
       {verificationStatus !== 'none' && (
         <div className={`text-xs p-1 rounded ${
           verificationStatus === 'verified' ? 'bg-green-100 text-green-700 border border-green-300' :
           verificationStatus === 'denied' ? 'bg-red-100 text-red-700 border border-red-300' :
           verificationStatus === 'verifying' ? 'bg-blue-100 text-blue-700 border border-blue-300' :
           'bg-gray-100 text-gray-700 border border-gray-300'
         }`}>
           {verificationStatus === 'verified' && '✅ Alpha code verified successfully!'}
           {verificationStatus === 'denied' && '❌ Alpha code invalid or already used'}
           {verificationStatus === 'verifying' && '⏳ Verifying alpha code...'}
         </div>
       )}
    </div>
  );
}
