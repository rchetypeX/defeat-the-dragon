'use client';

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Don't submit if email already exists
    if (emailExists) {
      setError('An account with this email already exists. Please sign in instead.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);

    const { error } = await signUp(email, password, displayName);
    
    if (error) {
      setError(error.message);
      setSuccess(false);
    } else {
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
    <div className="max-w-md mx-auto pixel-card p-6">
      <h2 className="text-2xl font-bold text-center mb-6 text-[#f2751a]">Join the Adventure</h2>
      
      {error && (
        <div className="bg-[#ef4444] text-white p-3 mb-4 border-2 border-[#654321]">
          {error}
        </div>
      )}
      
             <form onSubmit={handleSubmit} className="space-y-4">
         <div>
           <label htmlFor="displayName" className="block text-sm font-medium mb-2 text-[#fbbf24]">
             Adventurer Name
           </label>
                       <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              maxLength={20}
              className="w-full pixel-input text-xs placeholder:text-xs"
              placeholder="Enter adventurer name"
            />
         </div>
        
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
              />
             <button
               type="button"
               onClick={() => setShowPassword(!showPassword)}
               className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#8B4513] hover:text-[#654321]"
             >
               {showPassword ? "🙈" : "👁️"}
             </button>
           </div>
         </div>
        
        <button
          type="submit"
          disabled={loading || emailExists || emailChecking}
          className="w-full pixel-button disabled:opacity-50"
        >
          {loading ? 'Creating Account...' : emailExists ? 'Email Already Exists' : 'Start Adventure'}
        </button>
      </form>
    </div>
  );
}
