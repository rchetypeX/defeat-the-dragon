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
import { useMiniKit } from '@coinbase/onchainkit/minikit';

export default function HomePage() {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'wallet'>('wallet');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState(0);
  const { setFrameReady, isFrameReady } = useMiniKit();

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

  const onboardingSteps = [
    {
      title: "🐉 Welcome to Defeat the Dragon!",
      description: "Transform your focus sessions into an epic adventure. Level up your productivity while training to defeat the ultimate dragon!",
      image: "/assets/images/onboarding-1.png"
    },
    {
      title: "⚔️ Complete Focus Sessions",
      description: "Start focus sessions and earn XP, coins, and sparks. The longer you focus, the more rewards you gain!",
      image: "/assets/images/onboarding-2.png"
    },
    {
      title: "🎮 Level Up & Unlock Features",
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

  if (loading) {
    return (
      <main className="min-h-screen relative overflow-hidden">
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
    );
  }

  // Onboarding Modal
  if (showOnboarding) {
    const step = onboardingSteps[currentOnboardingStep];
    return (
      <main className="min-h-screen relative overflow-hidden">
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
        
        {/* Onboarding Overlay */}
        <div className="relative z-20 min-h-screen flex items-center justify-center p-4">
          <div className="bg-[#1a1a2e] border-2 border-[#654321] rounded-lg p-6 max-w-sm w-full text-center">
            {/* Progress Indicator */}
            <div className="flex justify-center mb-6">
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
            <div className="mb-6">
              <h2 className="text-xl font-bold text-[#f2751a] mb-3">{step.title}</h2>
              <p className="text-[#fbbf24] text-sm leading-relaxed">{step.description}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleOnboardingSkip}
                className="flex-1 py-2 px-4 bg-[#654321] text-[#fbbf24] rounded hover:bg-[#543210] transition-colors text-sm"
              >
                Skip
              </button>
              <button
                onClick={handleOnboardingNext}
                className="flex-1 py-2 px-4 bg-[#f2751a] text-white rounded hover:bg-[#e65a0a] transition-colors text-sm"
              >
                {currentOnboardingStep === onboardingSteps.length - 1 ? 'Get Started' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <AudioProvider>
        <main className="min-h-screen relative overflow-hidden">
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
          
          {/* Content */}
          <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-4">
            {/* App Logo */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-3">
                <img 
                  src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'><rect width='64' height='64' rx='8' fill='%23f2751a'/><text x='32' y='42' font-family='Arial' font-size='24' font-weight='bold' text-anchor='middle' fill='white'>DTD</text></svg>"
                  alt="Defeat the Dragon Logo" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    console.log('Primary logo failed, trying logo.svg');
                    // Try the uploaded logo.svg first
                    e.currentTarget.src = '/logo.svg';
                    e.currentTarget.onerror = () => {
                      console.log('Logo.svg also failed, showing final fallback');
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    };
                  }}
                  onLoad={() => {
                    console.log('Logo image loaded successfully');
                  }}
                />
                <div className="w-full h-full bg-[#f2751a] rounded-lg flex items-center justify-center hidden">
                  <span className="text-2xl">🐉</span>
                </div>
              </div>
            </div>

            {/* Authentication Tabs */}
            <div className="w-full max-w-sm mb-3">
              <div className="flex bg-[#1a1a2e] border-2 border-[#654321] rounded-lg p-1">
                <button
                  onClick={() => setAuthMode('wallet')}
                  className={`flex-1 py-2 px-3 rounded text-xs font-medium transition-colors ${
                    authMode === 'wallet'
                      ? 'bg-[#f2751a] text-white'
                      : 'text-[#fbbf24] hover:text-white'
                  }`}
                >
                  🟦 Wallet
                </button>
                <button
                  onClick={() => setAuthMode('login')}
                  className={`flex-1 py-2 px-3 rounded text-xs font-medium transition-colors ${
                    authMode === 'login'
                      ? 'bg-[#f2751a] text-white'
                      : 'text-[#fbbf24] hover:text-white'
                  }`}
                >
                  📧 Email
                </button>
              </div>
            </div>
            
            {/* Authentication Form */}
            <div className="w-full max-w-sm mb-3">
              {authMode === 'wallet' && <WalletLoginForm />}
              {authMode === 'login' && <LoginForm />}
              {authMode === 'signup' && <SignUpForm />}
            </div>
            
            {/* Email Auth Toggle (only show when not in wallet mode) */}
            {authMode !== 'wallet' && (
              <div className="mt-3 text-center">
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
    );
  }

  // User is authenticated - show game dashboard
  return (
    <AudioProvider>
      <BackgroundMusic 
        src="/assets/audio/background-music.mp3"
        volume={0.3}
        loop={true}
        autoPlay={true}
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
  );
}
