'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LoginForm } from '../components/auth/LoginForm';
import { SignUpForm } from '../components/auth/SignUpForm';
import { WalletLoginForm } from '../components/auth/WalletLoginForm';
import { GameDashboard } from '../components/game/GameDashboard';

import BackgroundMusic from '../components/audio/BackgroundMusic';
import FocusSessionMusic from '../components/audio/FocusSessionMusic';
import { AudioProvider } from '../contexts/AudioContext';
import { useMiniKit, usePrimaryButton } from '@coinbase/onchainkit/minikit';
import { ExternalLink } from '../components/ui/ExternalLink';
import { useBaseAppAuth } from '../hooks/useBaseAppAuth';
import { useContextAware } from '../hooks/useContextAware';
import { useFarcasterSDK } from '../hooks/useFarcasterSDK';
import { useFarcasterAuth } from '../hooks/useFarcasterAuth';
import { useUniversalLinks } from '../hooks/useUniversalLinks';
import { AddMiniAppPrompt } from '../components/AddMiniAppPrompt';
import { FarcasterAuth } from '../components/auth/FarcasterAuth';
import { MiniAppOpener, CopyUniversalLink, PopularMiniApps } from '../components/MiniAppOpener';
import { ContextAwareLayout } from '../components/layout/ContextAwareLayout';
import { SocialAcknowledgment } from '../components/social/SocialAcknowledgment';
import { EntryPointExperience } from '../components/context/EntryPointExperience';
import { SoundToggle } from '../components/ui/SoundToggle';

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
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'wallet'>('wallet');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState(0);
  const [walletKey, setWalletKey] = useState(0); // Key to force remount of WalletLoginForm
  const { setFrameReady, isFrameReady } = useMiniKit();
  
  // Farcaster SDK Integration (Required for Mini Apps)
  const {
    isReady: isFarcasterReady,
    isLoading: isFarcasterLoading,
    error: farcasterError,
    ready: farcasterReady,
  } = useFarcasterSDK();
  
  // Farcaster Authentication
  const {
    user: farcasterUser,
    isAuthenticated: isFarcasterAuthenticated,
    isLoading: isFarcasterAuthLoading,
    error: farcasterAuthError,
    quickAuth: farcasterQuickAuth,
    signIn: farcasterSignIn,
    signOut: farcasterSignOut,
  } = useFarcasterAuth();
  
  // Universal Links
  const {
    appId,
    appSlug,
    subPath,
    queryParams,
    universalLink,
    isUniversalLink,
    navigateToSubPath,
    generateUniversalLink,
    copyUniversalLink,
  } = useUniversalLinks();
  
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

  useEffect(() => {
    // Optimize for Base App - only set frame ready once
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [isFrameReady, setFrameReady]);

  // Log Farcaster SDK status for development
  useEffect(() => {
    console.log('🔧 Farcaster SDK Status:', {
      isReady: isFarcasterReady,
      isLoading: isFarcasterLoading,
      error: farcasterError,
    });
  }, [isFarcasterReady, isFarcasterLoading, farcasterError]);

  // Log authentication status for development
  useEffect(() => {
    console.log('🔐 Authentication Status:', {
      user: !!user,
      loading,
      farcasterUser: !!farcasterUser,
      isFarcasterAuthenticated,
      verifiedUser: !!verifiedUser,
      isBaseAppAuthenticated,
      isBaseApp,
    });
  }, [user, loading, farcasterUser, isFarcasterAuthenticated, verifiedUser, isBaseAppAuthenticated, isBaseApp]);

  // Log context information for development
  useEffect(() => {
    console.log('🌍 Context Information:', {
      entryType,
      isViralEntry,
      isReturningUser,
      platformType,
      isContextAvailable,
      subPath,
      queryParams,
    });
  }, [entryType, isViralEntry, isReturningUser, platformType, isContextAvailable, subPath, queryParams]);

  // Show loading state while authentication is being determined
  if (loading || isFarcasterLoading || isFarcasterAuthLoading || isBaseAppLoading) {
    return <HomePageLoading />;
  }

  // User is not authenticated - show authentication options
  if (!user && !farcasterUser && !verifiedUser) {
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
            
            <main className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center p-4">
              <div className="max-w-md w-full space-y-6">
                {/* Logo and Title */}
                <div className="text-center">
                  <div className="text-6xl mb-4">🐉</div>
                  <h1 className="text-3xl font-bold text-white mb-2">Defeat the Dragon</h1>
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
                      Wallet
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
                </div>

                {/* Farcaster Authentication */}
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                  <h3 className="text-white font-semibold mb-4 text-center">Or connect with Farcaster</h3>
                  <FarcasterAuth 
                    onSuccess={() => {
                      console.log('✅ Farcaster authentication successful');
                    }}
                    onError={(error) => {
                      console.error('❌ Farcaster authentication failed:', error);
                    }}
                  />
                </div>

                {/* Universal Links Demo */}
                {universalLink && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                    <h3 className="text-white font-semibold mb-4">Universal Link Demo</h3>
                    <div className="space-y-2">
                      <p className="text-gray-300 text-sm">App ID: {appId}</p>
                      <p className="text-gray-300 text-sm">App Slug: {appSlug}</p>
                      <p className="text-gray-300 text-sm">Universal Link: {universalLink}</p>
                      <div className="flex space-x-2">
                        <CopyUniversalLink
                          appId={appId || 'demo'}
                          appSlug={appSlug || 'demo'}
                          className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors"
                          onSuccess={() => console.log('✅ Universal link copied')}
                          onError={(error) => console.error('❌ Failed to copy link:', error)}
                        />
                        <MiniAppOpener
                          appId={appId || 'demo'}
                          appSlug={appSlug || 'demo'}
                          className="flex-1 px-3 py-2 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 transition-colors"
                          onSuccess={() => console.log('✅ Mini app opened')}
                          onError={(error) => console.error('❌ Failed to open mini app:', error)}
                        >
                          Open Demo
                        </MiniAppOpener>
                      </div>
                    </div>
                  </div>
                )}

                {/* Popular Mini Apps */}
                <PopularMiniApps className="bg-white/10 backdrop-blur-sm rounded-lg p-6" />

                {/* External Links */}
                <div className="text-center space-y-2">
                  <ExternalLink 
                    href="https://github.com/rchetypeX/defeat-the-dragon"
                    className="text-gray-300 hover:text-white text-sm"
                  >
                    View on GitHub
                  </ExternalLink>
                  <div className="text-gray-400 text-xs">
                    Built with Next.js, Supabase, and Farcaster
                  </div>
                </div>

                {/* Add Mini App Prompt */}
                <AddMiniAppPrompt 
                  showAfterDelay={10000} // Show after 10 seconds
                  onSuccess={() => console.log('✅ Mini App added successfully')}
                  onError={(error) => console.error('❌ Failed to add Mini App:', error)}
                />

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
      <SocialAcknowledgment />
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
