// Force dynamic rendering to prevent static generation errors
export const dynamic = 'force-dynamic';

'use client';

import React, { useState, useEffect } from 'react';
import { useSIWF } from '../../../contexts/SIWFContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function SIWFPage() {
  const router = useRouter();
  const { 
    isAuthenticated, 
    user, 
    isLoading, 
    error, 
    signIn, 
    signOut, 
    isBaseApp, 
    isFarcaster,
    linkSupabaseAccount 
  } = useSIWF();
  
  const [email, setEmail] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Small delay to show success state
      setTimeout(() => {
        router.push('/');
      }, 1500);
    }
  }, [isAuthenticated, user, router]);

  // Handle successful authentication
  useEffect(() => {
    if (isAuthenticated && user && !showEmailForm) {
      setShowEmailForm(true);
    }
  }, [isAuthenticated, user, showEmailForm]);

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch (err) {
      console.error('Sign in failed:', err);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLinking(true);
    try {
      await linkSupabaseAccount(email, user?.displayName);
      // Success - redirect will happen automatically
    } catch (err) {
      console.error('Failed to link account:', err);
    } finally {
      setIsLinking(false);
    }
  };

  const handleSkipEmail = async () => {
    setIsLinking(true);
    try {
      await linkSupabaseAccount('', user?.displayName);
      // Success - redirect will happen automatically
    } catch (err) {
      console.error('Failed to link account:', err);
    } finally {
      setIsLinking(false);
    }
  };

  if (isAuthenticated && user && !showEmailForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-green-400 rounded-full mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome, {user.displayName || user.username}!</h2>
            <p className="text-blue-200">Setting up your account...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user && showEmailForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            {user.pfpUrl && (
              <Image
                src={user.pfpUrl}
                alt={user.displayName || user.username}
                width={64}
                height={64}
                className="rounded-full mx-auto mb-4 border-2 border-white/20"
              />
            )}
            <h2 className="text-2xl font-bold text-white mb-2">
              Welcome, {user.displayName || user.username}!
            </h2>
            <p className="text-blue-200 text-sm">
              Complete your account setup
            </p>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-blue-200 mb-2">
                Email Address (Optional)
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
              <p className="text-xs text-blue-300 mt-1">
                We'll use this for important updates and account recovery
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isLinking}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                {isLinking ? 'Setting up...' : 'Complete Setup'}
              </button>
              
              <button
                type="button"
                onClick={handleSkipEmail}
                disabled={isLinking}
                className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                {isLinking ? 'Setting up...' : 'Skip for Now'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={signOut}
              className="text-blue-300 hover:text-blue-200 text-sm underline"
            >
              Sign out and try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center">
        {/* App Logo */}
        <div className="mb-8">
          <Image
            src="/icon.png"
            alt="Defeat the Dragon"
            width={80}
            height={80}
            className="mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-white mb-2">
            Defeat the Dragon
          </h1>
          <p className="text-blue-200 text-lg">
            Focus RPG
          </p>
        </div>

        {/* Platform Detection */}
        <div className="mb-6 p-4 bg-white/5 rounded-lg">
          {isBaseApp && (
            <div className="flex items-center justify-center space-x-2 text-blue-300">
              <span className="text-lg">⚡</span>
              <span>Opening in Base App</span>
            </div>
          )}
          {isFarcaster && (
            <div className="flex items-center justify-center space-x-2 text-purple-300">
              <span className="text-lg">🔮</span>
              <span>Opening in Farcaster</span>
            </div>
          )}
          {!isBaseApp && !isFarcaster && (
            <div className="text-gray-300 text-sm">
              Web Browser
            </div>
          )}
        </div>

        {/* Sign In Button */}
        <div className="mb-6">
          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-blue-800 disabled:to-purple-800 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Connecting...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <span className="text-xl">🔮</span>
                <span>Sign in with Farcaster</span>
              </div>
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="text-left text-sm text-blue-200 space-y-2">
          <p className="font-medium">How it works:</p>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>Click "Sign in with Farcaster"</li>
            <li>Scan the QR code with your Warpcast app</li>
            <li>Approve the sign-in request</li>
            <li>Complete your account setup</li>
          </ol>
        </div>

                 {/* Back to Home */}
         <div className="mt-6">
           <button
             onClick={() => router.push('/')}
             className="text-blue-300 hover:text-blue-200 text-sm underline"
           >
             ← Back to Home
           </button>
         </div>

         {/* rchetypeX Logo */}
         <div className="mt-8 text-center">
           <a
             href="https://rchetype.xyz"
             target="_blank"
             rel="noopener noreferrer"
             className="inline-block hover:opacity-80 transition-opacity"
           >
             <Image
               src="/rchetypex.png"
               alt="rchetypeX"
               width={120}
               height={40}
               className="mx-auto"
             />
           </a>
         </div>
       </div>
     </div>
   );
 }
