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
import { useBaseAppAuth } from '../hooks/useBaseAppAuth';
import { useContextAware } from '../hooks/useContextAware';
import { AddMiniAppPrompt } from '../components/AddMiniAppPrompt';
import { ContextAwareLayout } from '../components/layout/ContextAwareLayout';
import { SocialAcknowledgment } from '../components/social/SocialAcknowledgment';
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
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'wallet'>('wallet');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState(0);
  const [walletKey, setWalletKey] = useState(0); // Key to force remount of WalletLoginForm
  const { setFrameReady, isFrameReady } = useMiniKit();
  
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

  // Log authentication status for development
  useEffect(() => {
    console.log('🔐 Authentication Status:', {
      user: !!user,
      loading,
      verifiedUser: !!verifiedUser,
      isBaseAppAuthenticated,
      isBaseApp,
    });
  }, [user, loading, verifiedUser, isBaseAppAuthenticated, isBaseApp]);

  // Log context information for development
  useEffect(() => {
    console.log('🌍 Context Information:', {
      entryType,
      isViralEntry,
      isReturningUser,
      platformType,
      isContextAvailable,
    });
  }, [entryType, isViralEntry, isReturningUser, platformType, isContextAvailable]);

  // Show loading state while authentication is being determined
  if (loading || isBaseAppLoading) {
    return <HomePageLoading />;
  }

  // User is not authenticated - show authentication options
  if (!user && !verifiedUser) {
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
                      src="/logo.svg" 
                      alt="Defeat the Dragon Logo" 
                      className="h-16 w-16"
                    />
                  </div>
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
