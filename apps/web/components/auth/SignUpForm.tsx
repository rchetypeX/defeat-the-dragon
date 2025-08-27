'use client';

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AlphaCodeInput } from './AlphaCodeInput';

export function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [alphaCodeVerified, setAlphaCodeVerified] = useState(false);
  const [reservedToken, setReservedToken] = useState<string | null>(null);
  const [reservedUntil, setReservedUntil] = useState<string | null>(null);
  
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Don't submit if email already exists
    if (emailExists) {
      setError('An account with this email already exists. Please sign in instead.');
      return;
    }

    // Require alpha code verification
    if (!alphaCodeVerified || !reservedToken) {
      setError('Please verify your alpha access code first.');
      return;
    }

    // Check if reservation is still valid
    if (reservedUntil && new Date(reservedUntil) < new Date()) {
      setError('Alpha code reservation expired. Please verify your code again.');
      setAlphaCodeVerified(false);
      setReservedToken(null);
      setReservedUntil(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);

    const { error } = await signUp(email, password, '');
    
    if (error) {
      setError(error.message);
      setSuccess(false);
    } else {
      // Finalize the alpha code
      try {
        const response = await fetch('/api/alpha/finalize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reserved_token: reservedToken }),
        });

        if (!response.ok) {
          console.error('Failed to finalize alpha code');
          // Don't block the user if finalization fails, but log it
        }
      } catch (finalizeError) {
        console.error('Error finalizing alpha code:', finalizeError);
      }

      setSuccess(true);
      setError(null);
    }
    
    setLoading(false);
  };

  const checkEmail = async (emailToCheck: string) => {
    if (!emailToCheck || !emailToCheck.includes('@')) {
      setEmailExists(false);
      return;
    }

    setEmailChecking(true);
    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailToCheck }),
      });

      if (response.ok) {
        const result = await response.json();
        setEmailExists(result.exists);
        if (result.exists) {
          setError('An account with this email already exists. Please sign in instead.');
        } else {
          setError(null);
        }
      } else {
        // If the API fails, we can't determine if email exists
        // Show a warning but don't block signup
        console.warn('Email check API failed, proceeding with signup');
        setError('Email availability check failed. Please try again or proceed with signup.');
      }
    } catch (error) {
      console.error('Error checking email:', error);
      // Show a warning but don't block signup
      setError('Email availability check failed. Please try again or proceed with signup.');
    } finally {
      setEmailChecking(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setError(null);
    setEmailExists(false); // Reset email exists state when email changes
    
    // Debounce email checking
    const timeoutId = setTimeout(() => {
      checkEmail(newEmail);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handleAlphaCodeVerified = (token: string, until: string) => {
    setReservedToken(token);
    setReservedUntil(until);
    setAlphaCodeVerified(true);
    setError(null);
  };

  const handleAlphaCodeError = (message: string) => {
    setError(message);
    setAlphaCodeVerified(false);
    setReservedToken(null);
    setReservedUntil(null);
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto pixel-card p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-[#f2751a]">🎉 Welcome, Adventurer!</h2>
          <p className="text-[#fbbf24] mb-4">
            Check your email to confirm your account and begin your journey!
          </p>
          <div className="bg-[#22c55e] text-white p-3 border-2 border-[#654321]">
            Account created successfully!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pixel-card p-2">
      <h2 className="text-lg font-bold text-center mb-3 text-[#f2751a]">Join the Adventure</h2>
      
      {error && (
        <div className="bg-[#ef4444] text-white p-3 mb-4 border-2 border-[#654321]">
          {error}
        </div>
      )}
      
             <form onSubmit={handleSubmit} className="space-y-4">
         {/* Alpha Code Input */}
         <AlphaCodeInput
           onCodeVerified={handleAlphaCodeVerified}
           onError={handleAlphaCodeError}
           disabled={loading}
         />
         
         <div>
           <label htmlFor="email" className="block text-sm font-medium mb-2 text-[#fbbf24]">
             Email
           </label>
           <div className="relative">
                           <input
                id="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                required
                className={`w-full pixel-input text-xs placeholder:text-xs ${emailExists ? 'border-red-500' : ''}`}
                placeholder="Enter email"
              />
             {emailChecking && (
               <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#f2751a]"></div>
               </div>
             )}
             {emailExists && (
               <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
                 ❌
               </div>
             )}
           </div>
           {emailExists && (
             <p className="text-red-500 text-xs mt-1">This email is already registered. Please sign in instead.</p>
           )}
         </div>
        
                 <div>
           <label htmlFor="password" className="block text-sm font-medium mb-2 text-[#fbbf24]">
             Password
           </label>
           <div className="relative">
                           <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pixel-input text-xs placeholder:text-xs pr-10"
                placeholder="Enter password"
                autoComplete="new-password"
              />
             <button
               type="button"
               onClick={() => setShowPassword(!showPassword)}
               className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#fbbf24] hover:text-[#f2751a] transition-colors"
             >
               {showPassword ? (
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                 </svg>
               ) : (
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                 </svg>
               )}
             </button>
           </div>
         </div>
        
        <button
          type="submit"
          disabled={loading || emailExists || emailChecking || !alphaCodeVerified}
          className="w-full pixel-button disabled:opacity-50"
        >
          {loading ? 'Creating Account...' : 
           emailExists ? 'Email Already Exists' : 
           !alphaCodeVerified ? 'Verify Alpha Code First' : 
           'Start Adventure'}
        </button>
      </form>
    </div>
  );
}
