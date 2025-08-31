'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

function ResetPasswordContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    // Check if we have a valid session from the email link
    const checkSession = async () => {
      try {
        console.log('Checking session for password reset...');
        console.log('Current URL:', window.location.href);
        
        // For password reset, we need to check URL parameters first
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        
        console.log('URL params - access_token:', !!accessToken, 'refresh_token:', !!refreshToken);
        
        if (accessToken && refreshToken) {
          console.log('Setting session from URL parameters...');
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (!sessionError) {
            console.log('Session set successfully from URL parameters');
            setIsValidSession(true);
            return;
          } else {
            console.error('Session error from URL parameters:', sessionError);
          }
        }
        
        // Also check for hash parameters (alternative format)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hashAccessToken = hashParams.get('access_token');
        const hashRefreshToken = hashParams.get('refresh_token');
        
        if (hashAccessToken && hashRefreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: hashAccessToken,
            refresh_token: hashRefreshToken,
          });
          
          if (!sessionError) {
            setIsValidSession(true);
            return;
          }
        }
        
        // Fallback: check if we already have a session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session && !error) {
          setIsValidSession(true);
        } else {
          setError('Invalid or expired reset link. Please request a new password reset.');
        }
      } catch (error) {
        console.error('Session check error:', error);
        setError('Invalid or expired reset link. Please request a new password reset.');
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting to update password...');
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        console.error('Password update error:', error);
        setError(error.message);
      } else {
        console.log('Password updated successfully');
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/');
        }, 3000);
      }
    } catch (err: any) {
      console.error('Unexpected error during password update:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isValidSession && !error) {
    return (
      <main className="relative overflow-hidden min-h-screen">
        {/* Background Forest Scene */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/assets/images/forest-background.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        ></div>
        
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#f2751a] mx-auto mb-4"></div>
            <p className="text-lg text-white drop-shadow-lg">Verifying reset link...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative overflow-hidden min-h-screen">
      {/* Background Forest Scene */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/assets/images/forest-background.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      ></div>
      
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-start px-4 pt-16">
        <div className="w-full max-w-sm">
          {/* App Logo */}
          <div className="text-center mb-8">
            <div className="w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 mx-auto mb-4">
              <img 
                src="/logo.png"
                alt="Defeat the Dragon Logo" 
                className="w-full h-full logo-image"
                onLoad={() => {
                  console.log('Logo.png loaded successfully');
                }}
              />
            </div>
          </div>

          <div className="pixel-card p-6">
            {success ? (
              <div className="text-center">
                <div className="mb-4">
                  <svg className="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-[#f2751a] mb-2">
                  Password Reset Successful!
                </h2>
                <p className="text-[#fbbf24] text-sm mb-4">
                  Your password has been updated successfully. You will be redirected to the login page in a few seconds.
                </p>
                <button
                  onClick={() => router.push('/')}
                  className="pixel-button"
                >
                  Go to Login
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-center mb-6 text-[#f2751a]">
                  Set New Password
                </h2>

                {error && (
                  <div className="bg-[#ef4444] text-white p-3 mb-4 border-2 border-[#654321] rounded">
                    {error}
                  </div>
                )}

                {isValidSession ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium mb-2 text-[#fbbf24]">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="w-full pixel-input pr-10"
                          placeholder="Enter new password"
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#fbbf24] hover:text-[#f2751a] transition-colors"
                        >
                          {showPassword ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-[#fbbf24] mt-1">
                        Password must be at least 6 characters long
                      </p>
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2 text-[#fbbf24]">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="w-full pixel-input pr-10"
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#fbbf24] hover:text-[#f2751a] transition-colors"
                        >
                          {showConfirmPassword ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !password || !confirmPassword}
                      className="w-full pixel-button disabled:opacity-50"
                    >
                      {loading ? 'Updating Password...' : 'Update Password'}
                    </button>
                  </form>
                ) : (
                  <div className="text-center">
                    <p className="text-[#fbbf24] mb-4">
                      This password reset link is invalid or has expired.
                    </p>
                    <button
                      onClick={() => router.push('/')}
                      className="pixel-button"
                    >
                      Back to Login
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <main className="relative overflow-hidden min-h-screen">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/assets/images/forest-background.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        ></div>
        
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#f2751a] mx-auto mb-4"></div>
            <p className="text-lg text-white drop-shadow-lg">Loading...</p>
          </div>
        </div>
      </main>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
