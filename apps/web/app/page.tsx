'use client';

// Force dynamic rendering to prevent static generation errors
export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSIWF } from '../contexts/SIWFContext';
import { useGameStore } from '../lib/store';
import { LoginForm } from '../components/auth/LoginForm';
import { SignUpForm } from '../components/auth/SignUpForm';
import { WalletLoginForm } from '../components/auth/WalletLoginForm';
import { GameDashboard } from '../components/game/GameDashboard';

import BackgroundMusic from '../components/audio/BackgroundMusic';
import FocusSessionMusic from '../components/audio/FocusSessionMusic';
import { AudioProvider } from '../contexts/AudioContext';
import { useBaseAppAuth } from '../hooks/useBaseAppAuth';
import { useContextAware } from '../hooks/useContextAware';
import { ContextAwareLayout } from '../components/layout/ContextAwareLayout';
import { sdk } from '@farcaster/miniapp-sdk';

import { EntryPointExperience } from '../components/context/EntryPointExperience';

// Loading component for Suspense fallback
function HomePageLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <h2 className="text-white text-xl font-bold">Loading...</h2>
      </div>
    </div>
  );
}

// Main component that uses useSearchParams
function HomePageContent() {
  // Mobile debugging setup with Eruda
  useEffect(() => {
    // Only load Eruda in development and not on localhost
    if (typeof window !== 'undefined' && 
        process.env.NODE_ENV === 'development' && 
        !window.location.hostname.includes('localhost')) {
      import('eruda').then((eruda) => {
        eruda.default.init();
        console.log('🔧 Eruda mobile console initialized for debugging');
      }).catch((error) => {
        console.error('Failed to load Eruda:', error);
      });
    }

    // Enhanced error logging for mobile debugging
    const handleError = (event: ErrorEvent) => {
      console.error('🚨 Unhandled Error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        stack: event.error?.stack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    };

          const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            console.error('🚨 Unhandled Promise Rejection:', {
              reason: event.reason,
              promise: event.promise,
              timestamp: new Date().toISOString(),
              userAgent: navigator.userAgent,
              url: window.location.href
            });
            
            // Prevent the default behavior (which would show an error in console)
            event.preventDefault();
            
            // Log additional details for debugging
            if (event.reason instanceof Error) {
              console.error('🚨 Promise Rejection Error Details:', {
                message: event.reason.message,
                stack: event.reason.stack,
                name: event.reason.name
              });
            }
          };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const { user, loading } = useAuth();
  const { 
    isAuthenticated: isSIWFAuthenticated, 
    user: siwfUser, 
    isLoading: isSIWFLoading,
    isBaseApp: isSIWFBaseApp,
    isFarcaster: isSIWFFarcaster
  } = useSIWF();

  // Debug logging for authentication state
  useEffect(() => {
    console.log('🔍 Authentication State Debug:', {
      user: user ? { id: user.id, email: user.email } : null,
      loading,
      isSIWFAuthenticated,
      siwfUser: siwfUser ? { fid: siwfUser.fid, username: siwfUser.username, displayName: siwfUser.displayName } : null,
      isSIWFLoading,
      isSIWFBaseApp,
      isSIWFFarcaster,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  }, [user, loading, isSIWFAuthenticated, siwfUser, isSIWFLoading, isSIWFBaseApp, isSIWFFarcaster]);
  
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'wallet' | 'siwf'>('wallet');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState(0);
  const [walletKey, setWalletKey] = useState(0); // Key to force remount of WalletLoginForm
  
  // Call Farcaster SDK ready action with gesture disable for Base App compatibility
  useEffect(() => {
    const initializeFarcaster = async () => {
      try {
        // CRITICAL: Disable native gestures to prevent app dismissal conflicts
        // This is required for Base App compatibility as per documentation
        await sdk.actions.ready({ disableNativeGestures: true });
        console.log('✅ Farcaster Mini App ready with gesture conflicts disabled');
      } catch (error) {
        console.error('❌ Farcaster SDK ready failed:', error);
        // Don't throw the error - let the app continue to function
        // The SDK ready failure shouldn't break the entire app
        console.log('ℹ️ Continuing without Farcaster SDK ready (may be expected in some environments)');
      }
    };
    
    // Only initialize if we're in a browser environment
    if (typeof window !== 'undefined') {
      initializeFarcaster();
    }
  }, []);

  // Base App Authentication
  const {
    verifiedUser,
    isAuthenticated: isBaseAppAuthenticated,
    contextFid,
    isBaseApp,
    isLoading: isBaseAppLoading,
  } = useBaseAppAuth();

  // Context-aware features
  const {
    entryType,
    isViralEntry,
    isReturningUser,
    platformType,
    isAvailable: isContextAvailable,
  } = useContextAware();

  // Log authentication status for development
  useEffect(() => {
    console.log('🔐 Authentication Status:', {
      user: !!user,
      loading: loading || false,
      verifiedUser: !!verifiedUser,
      isBaseAppAuthenticated: isBaseAppAuthenticated || false,
      isBaseApp: isBaseApp || false,
    });
  }, [user, loading, verifiedUser, isBaseAppAuthenticated, isBaseApp]);

  // Add timeout mechanism to detect stuck authentication states
  useEffect(() => {
    const authTimeout = setTimeout(() => {
      // If we're still loading after 10 seconds, something might be wrong
      if (loading || isBaseAppLoading || isSIWFLoading) {
        console.warn('⚠️ Authentication loading timeout detected - possible stuck state');
        
        // Check for inconsistent authentication state
        const hasStaleAuthData = 
          localStorage.getItem('walletUser') || 
          localStorage.getItem('baseAppUser') || 
          localStorage.getItem('farcasterUser');
        
        if (hasStaleAuthData && !user && !verifiedUser) {
          console.warn('⚠️ Detected stale authentication data - clearing and redirecting');
          // Clear stale data and redirect
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = '/';
        }
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(authTimeout);
  }, [loading, isBaseAppLoading, isSIWFLoading, user, verifiedUser]);

  // Log context information for development
  useEffect(() => {
    console.log('🌍 Context Information:', {
      entryType: entryType || 'unknown',
      isViralEntry: isViralEntry || false,
      isReturningUser: isReturningUser || false,
      platformType: platformType || 'unknown',
      isContextAvailable: isContextAvailable || false,
    });
  }, [entryType, isViralEntry, isReturningUser, platformType, isContextAvailable]);

  // Handle Base App authentication
  useEffect(() => {
    console.log('🔐 Base App Auth Check:', {
      isBaseAppAuthenticated,
      verifiedUser: !!verifiedUser,
      user: !!user,
      isBaseApp,
      verifiedUserData: verifiedUser
    });
    
    if (isBaseAppAuthenticated && verifiedUser && !user) {
      console.log('🔐 Base App user detected, setting up user session:', verifiedUser);
      
      // Create a user session for the Base App user with safe FID access
      const baseAppUser = {
        id: verifiedUser?.fid?.toString() || 'unknown',
        email: `${verifiedUser?.username || 'user'}@baseapp.local`,
        username: verifiedUser?.username || 'user',
        displayName: verifiedUser?.displayName || 'Base App User',
        pfpUrl: verifiedUser?.pfpUrl || '',
        fid: verifiedUser?.fid || 0
      };
      
      // Store the Base App user in localStorage for consistency
      localStorage.setItem('baseAppUser', JSON.stringify(baseAppUser));
      
      // Set the user in the game store
      useGameStore.getState().setUser({
        id: baseAppUser.id,
        email: baseAppUser.email,
      });
      
      console.log('✅ Base App user session created:', baseAppUser);
    } else if (isBaseApp && !isBaseAppAuthenticated && !user) {
      console.log('🔐 Base App detected but not authenticated, user may need to sign in');
    } else if (!isBaseApp && !user) {
      console.log('ℹ️ Not in Base App environment, using standard authentication flow');
    }
  }, [isBaseAppAuthenticated, verifiedUser, user, isBaseApp]);

  // Auto-set auth mode based on environment
  useEffect(() => {
    if (isBaseApp) {
      console.log('🔐 Base App detected, setting auth mode to wallet');
      setAuthMode('wallet');
    } else if (isSIWFFarcaster) {
      console.log('🔮 Farcaster detected, setting auth mode to siwf');
      setAuthMode('siwf');
    }
  }, [isBaseApp || false, isSIWFFarcaster || false]);

  // Handle SIWF authentication and platform detection
  useEffect(() => {
    // Auto-detect platform and set auth mode
    if (isSIWFBaseApp || isSIWFFarcaster) {
      console.log('🔍 Platform detected:', { isSIWFBaseApp, isSIWFFarcaster });
      setAuthMode('siwf');
    }
  }, [isSIWFBaseApp || false, isSIWFFarcaster || false]);

  // Redirect SIWF users to dedicated auth page
  useEffect(() => {
    if ((isSIWFBaseApp || isSIWFFarcaster) && !isSIWFAuthenticated && !user) {
      console.log('🔄 Redirecting SIWF user to auth page');
      window.location.href = '/auth/siwf';
    }
  }, [isSIWFBaseApp || false, isSIWFFarcaster || false, isSIWFAuthenticated || false, user]);

  // Show loading state while authentication is being determined
  if (loading || isBaseAppLoading || isSIWFLoading) {
    return <HomePageLoading />;
  }

  // User is not authenticated - show authentication options
  if (!user && !verifiedUser && !isBaseAppAuthenticated && !isSIWFAuthenticated) {
    return (
      <ContextAwareLayout>
        <EntryPointExperience>
          <AudioProvider>
            <BackgroundMusic 
              src="/assets/audio/background-music.mp3"
              volume={0.3}
              loop={true}
              autoPlay={false}
              onLoad={() => console.log('Background music loaded')}
              onError={(error) => console.error('Background music error:', error)}
            />
            
            <main className="min-h-screen flex items-center justify-center p-4 relative">
              {/* Forest Background */}
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: 'url(/assets/images/forest-background.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              ></div>
              
              {/* Overlay for better text readability */}
              <div className="absolute inset-0 bg-black/30"></div>
              
              <div className="max-w-md w-full space-y-6 relative z-10">
                {/* Logo and Title */}
                <div className="text-center">
                  <div className="mb-4 flex justify-center">
                    <img 
                      src="/logo.png" 
                      alt="Defeat the Dragon Logo" 
                      className="h-32 w-32 logo-image"
                    />
                  </div>
                  <p className="text-gray-300">A Pomodoro-style Focus RPG</p>
                </div>

                {/* Authentication Tabs */}
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                  <div className="flex space-x-1 mb-6">
                    <button
                      onClick={() => setAuthMode('wallet')}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        authMode === 'wallet'
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      {isBaseApp ? '🔐 Base App' : 'Wallet'}
                    </button>
                    <button
                      onClick={() => setAuthMode('login')}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        authMode === 'login'
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      Email
                    </button>
                    <button
                      onClick={() => setAuthMode('signup')}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        authMode === 'signup'
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      Sign Up
                    </button>
                    {(isSIWFBaseApp || isSIWFFarcaster) && (
                      <button
                        onClick={() => setAuthMode('siwf')}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                          authMode === 'siwf'
                            ? 'bg-purple-500 text-white'
                            : 'text-gray-300 hover:text-white'
                        }`}
                      >
                        🔮 Farcaster
                      </button>
                    )}
                  </div>

                  {/* Authentication Forms */}
                  {authMode === 'wallet' && (
                    <WalletLoginForm 
                      key={walletKey}
                    />
                  )}
                  
                  {authMode === 'login' && (
                    <LoginForm />
                  )}
                  
                  {authMode === 'signup' && (
                    <SignUpForm />
                  )}

                  {authMode === 'siwf' && (
                    <div className="text-center py-8">
                      <div className="mb-4">
                        <div className="w-16 h-16 bg-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                          <span className="text-2xl">🔮</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">
                          Sign in with Farcaster
                        </h3>
                        <p className="text-gray-300 text-sm mb-6">
                          {isSIWFBaseApp ? 'Base App detected' : 'Farcaster detected'}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => window.location.href = '/auth/siwf'}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg"
                      >
                        Continue to Farcaster Auth
                      </button>
                      
                      <p className="text-gray-400 text-xs mt-3">
                        You'll be redirected to our dedicated Farcaster authentication page
                      </p>
                      
                    </div>
                  )}
                </div>



              </div>
            </main>
          </AudioProvider>
        </EntryPointExperience>
      </ContextAwareLayout>
    );
  }

  // User is authenticated - show game dashboard
  return (
    <ContextAwareLayout>
      <EntryPointExperience>
        <AudioProvider>
          <BackgroundMusic 
            src="/assets/audio/background-music.mp3"
            volume={0.3}
            loop={true}
            autoPlay={false}
            onLoad={() => console.log('Background music loaded')}
            onError={(error) => console.error('Background music error:', error)}
          />
          <FocusSessionMusic 
            src="/assets/audio/focus-session-music.mp3"
            volume={0.4}
            loop={true}
            autoPlay={false}
            onLoad={() => console.log('Focus session music loaded')}
            onError={(error) => console.error('Focus session music error:', error)}
          />
          <GameDashboard />
        </AudioProvider>
      </EntryPointExperience>
    </ContextAwareLayout>
  );
}

// Main export with Suspense boundary
export default function HomePage() {
  return (
    <Suspense fallback={<HomePageLoading />}>
      <HomePageContent />
    </Suspense>
  );
}
