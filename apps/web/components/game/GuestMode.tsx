'use client';

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface GuestModeProps {
  onSignUp: () => void;
}

export function GuestMode({ onSignUp }: GuestModeProps) {
  const [currentDemo, setCurrentDemo] = useState<'overview' | 'session' | 'rewards'>('overview');
  const [demoSessionTime, setDemoSessionTime] = useState(0);
  const [isDemoSessionActive, setIsDemoSessionActive] = useState(false);
  const { signInWithWallet } = useAuth();

  const demoPlayer = {
    name: 'Guest Adventurer',
    level: 3,
    xp: 1250,
    coins: 450,
    sparks: 25,
    streak: 2
  };

  const startDemoSession = () => {
    setIsDemoSessionActive(true);
    setDemoSessionTime(0);
    
    const interval = setInterval(() => {
      setDemoSessionTime(prev => {
        if (prev >= 300) { // 5 minutes demo
          setIsDemoSessionActive(false);
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopDemoSession = () => {
    setIsDemoSessionActive(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateDemoRewards = (time: number) => {
    const baseXP = Math.floor(time / 30) * 10; // 10 XP per 30 seconds
    const baseCoins = Math.floor(time / 60) * 5; // 5 coins per minute
    const baseSparks = Math.floor(time / 120) * 2; // 2 sparks per 2 minutes
    return { xp: baseXP, coins: baseCoins, sparks: baseSparks };
  };

  const rewards = calculateDemoRewards(demoSessionTime);

  return (
    <div className="min-h-screen relative overflow-hidden">
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
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="bg-[#1a1a2e] border-b-2 border-[#654321] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-[#f2751a] rounded-lg flex items-center justify-center mr-3">
                <span className="text-lg">🐉</span>
              </div>
              <div>
                <h1 className="text-[#f2751a] font-bold">Guest Mode</h1>
                <p className="text-[#fbbf24] text-xs">Explore the game</p>
              </div>
            </div>
            <button
              onClick={onSignUp}
              className="px-4 py-2 bg-[#f2751a] text-white rounded-lg hover:bg-[#e65a0a] transition-colors text-sm"
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Demo Navigation */}
        <div className="bg-[#1a1a2e] border-b border-[#654321] p-2">
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentDemo('overview')}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                currentDemo === 'overview'
                  ? 'bg-[#f2751a] text-white'
                  : 'text-[#fbbf24] hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setCurrentDemo('session')}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                currentDemo === 'session'
                  ? 'bg-[#f2751a] text-white'
                  : 'text-[#fbbf24] hover:text-white'
              }`}
            >
              Focus Session
            </button>
            <button
              onClick={() => setCurrentDemo('rewards')}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                currentDemo === 'rewards'
                  ? 'bg-[#f2751a] text-white'
                  : 'text-[#fbbf24] hover:text-white'
              }`}
            >
              Rewards
            </button>
          </div>
        </div>

        {/* Demo Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          {currentDemo === 'overview' && (
            <div className="space-y-4">
              <div className="bg-[#1a1a2e] border border-[#654321] rounded-lg p-4">
                <h2 className="text-[#f2751a] font-bold mb-3">🎮 Game Overview</h2>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <span className="text-[#f2751a] mr-2">⚔️</span>
                    <span className="text-[#fbbf24] text-sm">Start focus sessions to earn XP and coins</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-[#f2751a] mr-2">🎯</span>
                    <span className="text-[#fbbf24] text-sm">Level up to unlock new characters and abilities</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-[#f2751a] mr-2">🔥</span>
                    <span className="text-[#fbbf24] text-sm">Build streaks for bonus rewards</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-[#f2751a] mr-2">🏆</span>
                    <span className="text-[#fbbf24] text-sm">Compete with friends and earn achievements</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#1a1a2e] border border-[#654321] rounded-lg p-4">
                <h3 className="text-[#f2751a] font-bold mb-3">👤 Demo Player Stats</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-400">Name:</span>
                    <span className="text-[#fbbf24] ml-2">{demoPlayer.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Level:</span>
                    <span className="text-[#f2751a] ml-2">{demoPlayer.level}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">XP:</span>
                    <span className="text-[#fbbf24] ml-2">{demoPlayer.xp}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Coins:</span>
                    <span className="text-[#fbbf24] ml-2">{demoPlayer.coins}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Sparks:</span>
                    <span className="text-[#f2751a] ml-2">{demoPlayer.sparks}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Streak:</span>
                    <span className="text-[#f2751a] ml-2">{demoPlayer.streak} days</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#1a1a2e] border border-[#654321] rounded-lg p-4">
                <h3 className="text-[#f2751a] font-bold mb-3">🚀 Base App Features</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    <span className="text-[#fbbf24]">Gasless transactions</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    <span className="text-[#fbbf24]">ENS/Basenames support</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    <span className="text-[#fbbf24]">Mobile-optimized design</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    <span className="text-[#fbbf24]">Social features & sharing</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentDemo === 'session' && (
            <div className="space-y-4">
              <div className="bg-[#1a1a2e] border border-[#654321] rounded-lg p-4">
                <h2 className="text-[#f2751a] font-bold mb-3">⏱️ Focus Session Demo</h2>
                <p className="text-[#fbbf24] text-sm mb-4">
                  Try a 5-minute focus session to see how the game works!
                </p>
                
                {!isDemoSessionActive ? (
                  <button
                    onClick={startDemoSession}
                    className="w-full py-3 bg-[#f2751a] text-white rounded-lg hover:bg-[#e65a0a] transition-colors font-medium"
                  >
                    🎯 Start Demo Session
                  </button>
                ) : (
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#f2751a] mb-2">
                      {formatTime(demoSessionTime)}
                    </div>
                    <div className="text-[#fbbf24] text-sm mb-4">
                      Stay focused! Don't switch tabs or apps.
                    </div>
                    <button
                      onClick={stopDemoSession}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Stop Session
                    </button>
                  </div>
                )}
              </div>

              {isDemoSessionActive && (
                <div className="bg-[#1a1a2e] border border-[#654321] rounded-lg p-4">
                  <h3 className="text-[#f2751a] font-bold mb-3">🎮 Live Rewards</h3>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-2xl font-bold text-[#fbbf24]">{rewards.xp}</div>
                      <div className="text-xs text-gray-400">XP</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[#fbbf24]">{rewards.coins}</div>
                      <div className="text-xs text-gray-400">Coins</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[#f2751a]">{rewards.sparks}</div>
                      <div className="text-xs text-gray-400">Sparks</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-[#1a1a2e] border border-[#654321] rounded-lg p-4">
                <h3 className="text-[#f2751a] font-bold mb-3">💡 Tips for Success</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start">
                    <span className="text-[#f2751a] mr-2">•</span>
                    <span className="text-[#fbbf24]">Find a quiet space to minimize distractions</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-[#f2751a] mr-2">•</span>
                    <span className="text-[#fbbf24]">Set clear goals for each session</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-[#f2751a] mr-2">•</span>
                    <span className="text-[#fbbf24]">Use the soft shield to stay accountable</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-[#f2751a] mr-2">•</span>
                    <span className="text-[#fbbf24]">Build daily streaks for bonus rewards</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentDemo === 'rewards' && (
            <div className="space-y-4">
              <div className="bg-[#1a1a2e] border border-[#654321] rounded-lg p-4">
                <h2 className="text-[#f2751a] font-bold mb-3">🏆 Rewards System</h2>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">⭐</span>
                    <div>
                      <div className="text-[#fbbf24] font-medium">XP (Experience Points)</div>
                      <div className="text-gray-400 text-sm">Earn XP to level up and unlock new features</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">🪙</span>
                    <div>
                      <div className="text-[#fbbf24] font-medium">Coins</div>
                      <div className="text-gray-400 text-sm">Spend coins on characters, backgrounds, and items</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">⚡</span>
                    <div>
                      <div className="text-[#fbbf24] font-medium">Sparks</div>
                      <div className="text-gray-400 text-sm">Rare currency for special items and abilities</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#1a1a2e] border border-[#654321] rounded-lg p-4">
                <h3 className="text-[#f2751a] font-bold mb-3">🎁 Unlockables</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-[#2a2a3e] p-3 rounded border border-[#654321]">
                    <div className="text-[#f2751a] font-medium">Characters</div>
                    <div className="text-gray-400 text-xs">Unlock new adventurers</div>
                  </div>
                  <div className="bg-[#2a2a3e] p-3 rounded border border-[#654321]">
                    <div className="text-[#f2751a] font-medium">Backgrounds</div>
                    <div className="text-gray-400 text-xs">Change your game theme</div>
                  </div>
                  <div className="bg-[#2a2a3e] p-3 rounded border border-[#654321]">
                    <div className="text-[#f2751a] font-medium">Abilities</div>
                    <div className="text-gray-400 text-xs">Special powers and skills</div>
                  </div>
                  <div className="bg-[#2a2a3e] p-3 rounded border border-[#654321]">
                    <div className="text-[#f2751a] font-medium">Achievements</div>
                    <div className="text-gray-400 text-xs">Complete challenges</div>
                  </div>
                </div>
              </div>

              <div className="bg-[#1a1a2e] border border-[#654321] rounded-lg p-4">
                <h3 className="text-[#f2751a] font-bold mb-3">🔥 Streak Bonuses</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#fbbf24]">3-day streak:</span>
                    <span className="text-[#f2751a]">+10% XP bonus</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#fbbf24]">7-day streak:</span>
                    <span className="text-[#f2751a]">+25% XP bonus</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#fbbf24]">30-day streak:</span>
                    <span className="text-[#f2751a]">+50% XP bonus + rare items</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="bg-[#1a1a2e] border-t-2 border-[#654321] p-4">
          <div className="text-center">
            <p className="text-[#fbbf24] text-sm mb-3">
              Ready to start your focus adventure?
            </p>
            <button
              onClick={onSignUp}
              className="w-full py-3 bg-[#f2751a] text-white rounded-lg hover:bg-[#e65a0a] transition-colors font-medium"
            >
              🚀 Create Account & Start Playing
            </button>
            <p className="text-gray-400 text-xs mt-2">
              Free to play • No gas fees • Mobile optimized
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
