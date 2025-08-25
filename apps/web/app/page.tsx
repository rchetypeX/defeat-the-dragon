'use client';

import { useState, useEffect } from 'react';
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
import { ContextAwareLayout } from '../components/layout/ContextAwareLayout';
import { SocialAcknowledgment } from '../components/social/SocialAcknowledgment';
import { EntryPointExperience } from '../components/context/EntryPointExperience';
import { SoundToggle } from '../components/ui/SoundToggle';
import { AudioInfo } from '../components/ui/AudioInfo';

export default function HomePage() {
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

  // Check if this is the user's first visit
  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisitedBefore');
    if (!hasVisited && !user) {
      setShowOnboarding(true);
    }
  }, [user]);

  // Log Base App authentication status for development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Base App Auth Status:', {
        isBaseApp,
        isBaseAppAuthenticated,
        contextFid,
        verifiedUser: !!verifiedUser,
        entryType,
        isViralEntry,
        isReturningUser,
        platformType,
      });
    }
  }, [isBaseApp, isBaseAppAuthenticated, contextFid, verifiedUser, entryType, isViralEntry, isReturningUser, platformType]);

  // Debug user authentication state
  useEffect(() => {
    console.log('🔐 User Auth State:', {
      user: !!user,
      loading,
      userDetails: user ? {
        id: user.id,
        email: user.email,
        wallet_address: (user as any).wallet_address,
      } : null,
    });
  }, [user, loading]);

  const onboardingSteps = [
    {
      title: "Welcome to Defeat the Dragon!",
      description: "Transform your focus sessions into an epic adventure. Level up your productivity while training to defeat the ultimate dragon!",
      image: "/assets/images/onboarding-1.png"
    },
    {
      title: "Complete Focus Sessions",
      description: "Start focus sessions and earn XP, coins, and sparks. The longer you focus, the more rewards you gain!",
      image: "/assets/images/onboarding-2.png"
    },
    {
      title: "Level Up & Unlock Features",
      description: "Gain levels, unlock new characters, backgrounds, and special abilities as you progress in your focus journey.",
      image: "/assets/images/onboarding-3.png"
    },

  ];

  const handleOnboardingNext = () => {
    if (currentOnboardingStep < onboardingSteps.length - 1) {
      setCurrentOnboardingStep(currentOnboardingStep + 1);
    } else {
      setShowOnboarding(false);
      localStorage.setItem('hasVisitedBefore', 'true');
    }
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
    localStorage.setItem('hasVisitedBefore', 'true');
  };

  const handleSignUp = () => {
    setAuthMode('wallet');
  };

  // Primary Button Configuration for Onboarding
  const getOnboardingPrimaryButtonConfig = () => {
    if (showOnboarding) {
      if (currentOnboardingStep < onboardingSteps.length - 1) {
        return {
          text: 'NEXT',
          action: handleOnboardingNext
        };
      } else {
        return {
          text: 'GET STARTED',
          action: handleOnboardingNext
        };
      }
    } else if (!user && !loading) {
      return {
        text: 'CONNECT WALLET',
        action: () => {
          // This will be handled by the wallet connection flow
          console.log('Primary button: Connect wallet clicked');
        }
      };
    } else {
      return {
        text: 'START FOCUSING',
        action: () => {
          // This will be handled by the game dashboard
          console.log('Primary button: Start focusing clicked');
        }
      };
    }
  };

  const onboardingPrimaryButtonConfig = getOnboardingPrimaryButtonConfig();

  // Configure primary button for onboarding and authentication
  usePrimaryButton(
    { text: onboardingPrimaryButtonConfig.text },
    onboardingPrimaryButtonConfig.action
  );

  // Reset wallet key when authMode changes away from 'wallet'
  useEffect(() => {
    if (authMode !== 'wallet') {
      setWalletKey(prev => prev + 1);
    }
  }, [authMode]);

  if (loading) {
    return (
      <ContextAwareLayout>
        <main className="relative overflow-hidden">
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
          
          {/* Loading Content */}
          <div className="relative z-10 min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#f2751a] mx-auto mb-4"></div>
              <p className="text-lg text-white drop-shadow-lg">Loading...</p>
            </div>
          </div>
        </main>
      </ContextAwareLayout>
    );
  }

  // Onboarding Modal
  if (showOnboarding) {
    const step = onboardingSteps[currentOnboardingStep];
    
    return (
      <ContextAwareLayout>
        <AudioProvider>
          <main className="relative overflow-hidden">
            {/* Background Music */}
            <BackgroundMusic 
              src="/assets/audio/background-music.mp3"
              volume={0.2}
              loop={true}
              autoPlay={false}
              onLoad={() => console.log('Background music loaded')}
              onError={(error) => console.error('Background music error:', error)}
            />
            {/* Focus Session Music */}
            <FocusSessionMusic 
              src="/assets/audio/focus-session-music.mp3"
              volume={0.4}
              loop={true}
              autoPlay={false}
              onLoad={() => console.log('Focus session music loaded')}
              onError={(error) => console.error('Focus session music error:', error)}
            />
          
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
            
            {/* Sound Toggle */}
            <SoundToggle />
            
            {/* Audio Info */}
            <AudioInfo />
            
            {/* Onboarding Content */}
            <div className="relative z-20 min-h-screen flex flex-col items-center justify-center p-2 sm:p-4">
              {/* Large Logo - Outside the card */}
              <div className="text-center mb-4 sm:mb-8">
                <div className="w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 mx-auto mb-2 sm:mb-4">
                  <img 
                    src="/logo.svg"
                    alt="Defeat the Dragon Logo" 
                    className="w-full h-full object-contain"
                    onLoad={() => {
                      console.log('Logo.svg loaded successfully on onboarding');
                    }}
                  />
                </div>
              </div>

              <div className="bg-[#1a1a2e] border-2 border-[#654321] rounded-lg p-3 sm:p-6 max-w-sm w-full text-center">
                {/* Progress Indicator */}
                <div className="flex justify-center mb-3 sm:mb-6">
                  {onboardingSteps.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full mx-1 ${
                        index <= currentOnboardingStep ? 'bg-[#f2751a]' : 'bg-[#654321]'
                      }`}
                    />
                  ))}
                </div>

                {/* Step Content */}
                <div className="mb-3 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-bold text-[#f2751a] mb-2 sm:mb-3">{step.title}</h2>
                  <p className="text-[#fbbf24] text-xs sm:text-sm leading-relaxed">{step.description}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 sm:space-x-3">
                  <button
                    onClick={handleOnboardingSkip}
                    className="flex-1 py-2 px-3 sm:px-4 bg-[#654321] text-[#fbbf24] rounded hover:bg-[#543210] transition-colors text-xs sm:text-sm"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleOnboardingNext}
                    className="flex-1 py-2 px-3 sm:px-4 bg-[#f2751a] text-white rounded hover:bg-[#e65a0a] transition-colors text-xs sm:text-sm"
                  >
                    {currentOnboardingStep === onboardingSteps.length - 1 ? 'Get Started' : 'Next'}
                  </button>
                </div>
              </div>
            </div>
          </main>
        </AudioProvider>
      </ContextAwareLayout>
    );
  }

  if (!user) {
    return (
      <ContextAwareLayout>
        <SocialAcknowledgment />
        <EntryPointExperience>
          <AudioProvider>
            <main className="relative overflow-hidden">
          {/* Background Music */}
          <BackgroundMusic 
            src="/assets/audio/background-music.mp3"
            volume={0.2}
            loop={true}
            autoPlay={true}
            onLoad={() => console.log('Background music loaded')}
            onError={(error) => console.error('Background music error:', error)}
          />
          {/* Focus Session Music */}
          <FocusSessionMusic 
            src="/assets/audio/focus-session-music.mp3"
            volume={0.4}
            loop={true}
            autoPlay={false}
            onLoad={() => console.log('Focus session music loaded')}
            onError={(error) => console.error('Focus session music error:', error)}
          />
        
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
          
          {/* Sound Toggle */}
          <SoundToggle />
          
          {/* Audio Info */}
          <AudioInfo />
          
          {/* Content */}
          <div className="relative z-10 min-h-screen flex flex-col items-center justify-start px-2 sm:px-4 pt-4 sm:pt-8">
            {/* App Logo */}
            <div className="text-center mb-2 sm:mb-4">
              <div className="w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 mx-auto mb-2 sm:mb-4">
                <img 
                  src="/logo.svg"
                  alt="Defeat the Dragon Logo" 
                  className="w-full h-full object-contain"
                  onLoad={() => {
                    console.log('Logo.svg loaded successfully');
                  }}
                />
              </div>
            </div>

            {/* Authentication Tabs */}
            <div className="w-full max-w-sm mb-2">
              <div className="flex bg-[#1a1a2e] border-2 border-[#654321] rounded-lg p-1">
                <button
                  onClick={() => setAuthMode('wallet')}
                  className={`flex-1 py-2 px-3 rounded text-xs font-medium transition-colors flex items-center justify-center space-x-1 ${
                    authMode === 'wallet'
                      ? 'bg-[#f2751a] text-white'
                      : 'text-[#fbbf24] hover:text-white'
                  }`}
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm6 0a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd" />
                  </svg>
                  <span>Wallet</span>
                </button>
                <button
                  onClick={() => setAuthMode('login')}
                  className={`flex-1 py-2 px-3 rounded text-xs font-medium transition-colors flex items-center justify-center space-x-1 ${
                    authMode === 'login'
                      ? 'bg-[#f2751a] text-white'
                      : 'text-[#fbbf24] hover:text-white'
                  }`}
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <span>Email</span>
                </button>
              </div>
            </div>
            
            {/* Authentication Form */}
            <div className="w-full max-w-sm mb-2">
              {authMode === 'wallet' && <WalletLoginForm key={walletKey} />}
              {authMode === 'login' && <LoginForm />}
              {authMode === 'signup' && <SignUpForm />}
            </div>
            
            {/* Email Auth Toggle (only show when not in wallet mode) */}
            {authMode !== 'wallet' && (
              <div className="mt-2 sm:mt-3 text-center">
                <button
                  onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                  className="text-[#fbbf24] hover:text-white transition-colors text-xs underline"
                >
                  {authMode === 'login' ? "Don't have an account? Create Account" : "Already have an account? Sign In"}
                </button>
              </div>
            )}


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
