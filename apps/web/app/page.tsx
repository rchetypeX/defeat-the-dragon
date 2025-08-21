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
      <main className="min-h-screen pixel-container">
        <div className="container mx-auto px-4 py-8">
          {/* Header with Title and Currency Display */}
          <div className="text-center mb-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-[#f2751a]">🐉 Defeat the Dragon</h1>
              <div className="flex space-x-4">
                <div className="currency-display">
                  <span className="mr-2">🪙</span>
                  <span>870</span>
                </div>
                <div className="currency-display">
                  <span className="mr-2">💎</span>
                  <span>Sparks</span>
                </div>
              </div>
            </div>
            <p className="text-lg mb-2">
              A Pomodoro-style Focus RPG
            </p>
            <p className="text-sm text-[#fbbf24]">
              Transform your focus sessions into an epic adventure
            </p>
          </div>
          
          {/* Auth Mode Toggle */}
          <div className="max-w-md mx-auto mb-6">
            <div className="pixel-card p-1 flex">
              <button
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                  authMode === 'login'
                    ? 'bg-[#f2751a] text-white'
                    : 'text-[#fbbf24] hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setAuthMode('signup')}
                className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                  authMode === 'signup'
                    ? 'bg-[#f2751a] text-white'
                    : 'text-[#fbbf24] hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>
          </div>
          
          {/* Auth Forms */}
          {authMode === 'login' ? <LoginForm /> : <SignUpForm />}
          
          {/* Features Preview */}
          <div className="max-w-4xl mx-auto mt-12">
            <h2 className="text-2xl font-bold text-center mb-6 text-[#f2751a]">Game Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="pixel-card p-6 text-center">
                <div className="text-3xl mb-4">⏱️</div>
                <h3 className="text-lg font-bold mb-2">Focus Timer</h3>
                <p className="text-sm text-[#fbbf24]">
                  Set focus sessions from 5-120 minutes and help your tiny adventurer defeat the dragon!
                </p>
              </div>
              <div className="pixel-card p-6 text-center">
                <div className="text-3xl mb-4">⚔️</div>
                <h3 className="text-lg font-bold mb-2">RPG Elements</h3>
                <p className="text-sm text-[#fbbf24]">
                  Earn XP, coins, and level up your tiny adventurer as you complete sessions!
                </p>
              </div>
              <div className="pixel-card p-6 text-center">
                <div className="text-3xl mb-4">🎁</div>
                <h3 className="text-lg font-bold mb-2">Loot System</h3>
                <p className="text-sm text-[#fbbf24]">
                  Collect equipments and trinkets by having your tiny adventurer do quests!
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // User is authenticated - show game dashboard
  return <GameDashboard />;
}
