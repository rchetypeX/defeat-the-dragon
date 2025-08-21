'use client';

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LoginForm } from '../components/auth/LoginForm';
import { SignUpForm } from '../components/auth/SignUpForm';
import { GameDashboard } from '../components/game/GameDashboard';

export default function HomePage() {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  if (loading) {
    return (
      <main className="min-h-screen pixel-container flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#f2751a] mx-auto mb-4"></div>
          <p className="text-lg">Loading...</p>
        </div>
      </main>
    );
  }

  if (!user) {
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
        
        {/* Content */}
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
          {/* Sign In Form */}
          <div className="w-full max-w-md">
            {authMode === 'login' ? <LoginForm /> : <SignUpForm />}
          </div>
          
          {/* Create Account Option */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="text-[#fbbf24] hover:text-white transition-colors text-sm underline"
            >
              {authMode === 'login' ? "Don't have an account? Create Account" : "Already have an account? Sign In"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // User is authenticated - show game dashboard
  return <GameDashboard />;
}
