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
  const { setFrameReady, isFrameReady } = useMiniKit();

  useEffect(() => {
    if (!isFrameReady) setFrameReady();
  }, [isFrameReady, setFrameReady]);

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
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
          {/* Authentication Tabs */}
          <div className="w-full max-w-md mb-6">
            <div className="flex bg-[#1a1a2e] border-2 border-[#654321] rounded-lg p-1">
              <button
                onClick={() => setAuthMode('wallet')}
                className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${
                  authMode === 'wallet'
                    ? 'bg-[#f2751a] text-white'
                    : 'text-[#fbbf24] hover:text-white'
                }`}
              >
                🟦 Wallet
              </button>
              <button
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${
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
          <div className="w-full max-w-md">
            {authMode === 'wallet' && <WalletLoginForm />}
            {authMode === 'login' && <LoginForm />}
            {authMode === 'signup' && <SignUpForm />}
          </div>
          
          {/* Email Auth Toggle (only show when not in wallet mode) */}
          {authMode !== 'wallet' && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                className="text-[#fbbf24] hover:text-white transition-colors text-sm underline"
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
