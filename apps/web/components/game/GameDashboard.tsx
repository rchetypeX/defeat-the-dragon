'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '../../lib/store';
import { SessionTimer } from './SessionTimer';
import { SessionProgress } from './SessionProgress';
import { SuccessMessage } from '../ui/SuccessMessage';
import { requestNotificationPermission, showSessionCompleteNotification } from '../../lib/notifications';
import { Action } from '@defeat-the-dragon/engine';

interface SessionResult {
  xp_gained: number;
  coins_gained: number;
  sparks_gained: number;
  level_up: boolean;
  new_level: number;
}

export function GameDashboard() {
  const { 
    player, 
    sessionProgress, 
    startSession, 
    completeSession,
    loadPlayerData
  } = useGameStore();

  const [showSessionTimer, setShowSessionTimer] = useState(false);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);

  useEffect(() => {
    requestNotificationPermission();
    loadPlayerData();
  }, [loadPlayerData]);

  const handleSessionStart = async (action: Action, durationMinutes: number) => {
    console.log('GameDashboard: handleSessionStart called');
    try {
      await startSession(action, durationMinutes);
      console.log('GameDashboard: Session started successfully');
      setShowSessionTimer(true);
    } catch (error) {
      console.error('GameDashboard: Failed to start session:', error);
    }
  };

  const handleSessionComplete = async () => {
    console.log('GameDashboard: handleSessionComplete called');
    try {
      console.log('GameDashboard: About to call completeSession...');
      const result = await completeSession('success');
      console.log('GameDashboard: Session completed successfully');
      console.log('GameDashboard: Setting session result');
      setSessionResult(result);
      setShowSessionTimer(false);
      
      // Show browser notification
      showSessionCompleteNotification(result.xp_gained, result.coins_gained);
      
      console.log('GameDashboard: handleSessionComplete finished successfully');
    } catch (error) {
      console.error('GameDashboard: Failed to complete session:', error);
    }
  };

  const handleSessionCancel = () => {
    setShowSessionTimer(false);
  };

  const handleDismissSuccess = () => {
    setSessionResult(null);
  };

  if (!player) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
        <div className="pixel-card p-8 text-center">
          <div className="text-2xl mb-4">⚔️</div>
          <h2 className="text-xl font-bold text-[#f2751a] mb-2">Loading Character...</h2>
          <p className="text-[#fbbf24]">Preparing your adventure...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] relative overflow-hidden">
      {/* Background Forest Scene */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f1419] via-[#1a2e1a] to-[#2e1a1a] opacity-80"></div>
      
      {/* Main Game Interface */}
      <div className="relative z-10 min-h-screen flex flex-col">
        
        {/* Top Bar - Player Stats and Menu Icons */}
        <div className="flex justify-between items-start p-3 sm:p-4">
          
                     {/* Player Stats (Top-Left) */}
           <div className="flex flex-col space-y-1 sm:space-y-2">
             {/* Level and Name */}
             <div className="relative">
               <img 
                 src="/assets/ui/level-name-card.png" 
                 alt="Level and Name" 
                 className="w-24 h-8 sm:w-28 sm:h-10 pixel-art"
                 onError={(e) => {
                   e.currentTarget.style.display = 'none';
                   e.currentTarget.nextElementSibling?.classList.remove('hidden');
                 }}
               />
               <div className="w-24 h-8 sm:w-28 sm:h-10 bg-[#f5f5dc] border-2 border-[#8B4513] flex items-center justify-between px-2 sm:px-3 hidden">
                 <span className="text-[#8B4513] font-bold text-xs sm:text-sm">{player.level}</span>
                 <div className="flex-1 mx-1 sm:mx-2 flex justify-center">
                   <div className="w-full h-px bg-[#8B4513] opacity-50"></div>
                 </div>
                 <span className="text-[#8B4513] font-bold text-xs sm:text-sm">NAME</span>
               </div>
             </div>
             
             {/* Coins */}
             <div className="relative">
               <img 
                 src="/assets/ui/gold-card.png" 
                 alt="Gold" 
                 className="w-24 h-8 sm:w-28 sm:h-10 pixel-art"
                 onError={(e) => {
                   e.currentTarget.style.display = 'none';
                   e.currentTarget.nextElementSibling?.classList.remove('hidden');
                 }}
               />
               <div className="w-24 h-8 sm:w-28 sm:h-10 bg-[#f5f5dc] border-2 border-[#8B4513] flex items-center justify-between px-2 sm:px-3 hidden">
                 <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-yellow-400 to-yellow-600 border border-yellow-700 rounded-full flex items-center justify-center">
                   <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-200 rounded-full"></div>
                 </div>
                 <div className="flex-1 mx-1 sm:mx-2 flex justify-center">
                   <div className="w-full h-px bg-[#8B4513] opacity-50"></div>
                 </div>
                 <span className="text-[#8B4513] font-bold text-xs sm:text-sm">{player.coins}</span>
               </div>
             </div>
             
             {/* XP/Sparks */}
             <div className="relative">
               <img 
                 src="/assets/ui/sparks-card.png" 
                 alt="Sparks" 
                 className="w-24 h-8 sm:w-28 sm:h-10 pixel-art"
                 onError={(e) => {
                   e.currentTarget.style.display = 'none';
                   e.currentTarget.nextElementSibling?.classList.remove('hidden');
                 }}
               />
               <div className="w-24 h-8 sm:w-28 sm:h-10 bg-[#f5f5dc] border-2 border-[#8B4513] flex items-center justify-between px-2 sm:px-3 hidden">
                 <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-yellow-300 to-yellow-500 border border-yellow-600 flex items-center justify-center">
                   <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-100 rounded-sm transform rotate-45"></div>
                 </div>
                 <div className="flex-1 mx-1 sm:mx-2 flex justify-center">
                   <div className="w-full h-px bg-[#8B4513] opacity-50"></div>
                 </div>
                 <span className="text-[#8B4513] font-bold text-xs sm:text-sm">{player.xp}</span>
               </div>
             </div>
           </div>
          
                     {/* Menu Icons (Top-Right) */}
           <div className="flex flex-col space-y-1 sm:space-y-2">
             {/* Settings */}
             <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#f5f5dc] border-2 border-[#8B4513] flex items-center justify-center cursor-pointer hover:bg-[#e8e8d0] transition-colors">
               <img 
                 src="/assets/icons/settings.png" 
                 alt="Settings" 
                 className="w-4 h-4 sm:w-5 sm:h-5 pixel-art"
                 onError={(e) => {
                   // Fallback to CSS shape if image fails to load
                   e.currentTarget.style.display = 'none';
                   e.currentTarget.nextElementSibling?.classList.remove('hidden');
                 }}
               />
               <div className="w-4 h-4 sm:w-5 sm:h-5 bg-[#8B4513] rounded-full flex items-center justify-center hidden">
                 <div className="w-2 h-2 sm:w-3 sm:h-3 bg-[#f5f5dc] rounded-full"></div>
               </div>
             </div>
             
             {/* Sound */}
             <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#f5f5dc] border-2 border-[#8B4513] flex items-center justify-center cursor-pointer hover:bg-[#e8e8d0] transition-colors">
               <img 
                 src="/assets/icons/sound.png" 
                 alt="Sound" 
                 className="w-4 h-4 sm:w-5 sm:h-5 pixel-art"
                 onError={(e) => {
                   e.currentTarget.style.display = 'none';
                   e.currentTarget.nextElementSibling?.classList.remove('hidden');
                 }}
               />
               <div className="w-4 h-4 sm:w-5 sm:h-5 bg-[#8B4513] flex items-center justify-center hidden">
                 <div className="w-2 h-2 sm:w-3 sm:h-3 bg-[#f5f5dc] transform rotate-45"></div>
               </div>
             </div>
             
             {/* Shop */}
             <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#f5f5dc] border-2 border-[#8B4513] flex items-center justify-center cursor-pointer hover:bg-[#e8e8d0] transition-colors">
               <img 
                 src="/assets/icons/shop.png" 
                 alt="Shop" 
                 className="w-4 h-4 sm:w-5 sm:h-5 pixel-art"
                 onError={(e) => {
                   e.currentTarget.style.display = 'none';
                   e.currentTarget.nextElementSibling?.classList.remove('hidden');
                 }}
               />
               <div className="w-4 h-4 sm:w-5 sm:h-5 bg-[#8B4513] flex items-center justify-center hidden">
                 <div className="w-2 h-2 sm:w-3 sm:h-3 bg-[#f5f5dc] rounded-sm"></div>
               </div>
             </div>
             
             {/* Inventory */}
             <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#f5f5dc] border-2 border-[#8B4513] flex items-center justify-center cursor-pointer hover:bg-[#e8e8d0] transition-colors">
               <img 
                 src="/assets/icons/inventory.png" 
                 alt="Inventory" 
                 className="w-4 h-4 sm:w-5 sm:h-5 pixel-art"
                 onError={(e) => {
                   e.currentTarget.style.display = 'none';
                   e.currentTarget.nextElementSibling?.classList.remove('hidden');
                 }}
               />
               <div className="w-4 h-4 sm:w-5 sm:h-5 bg-[#8B4513] flex items-center justify-center hidden">
                 <div className="w-2 h-2 sm:w-3 sm:h-3 bg-[#f5f5dc] rounded-sm"></div>
               </div>
             </div>
           </div>
        </div>
        
        {/* Central Character Area */}
        <div className="flex-1 flex items-center justify-center relative px-4">
          
          {/* Forest Background Elements */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Trees */}
            <div className="absolute top-0 left-1/4 w-12 h-24 sm:w-16 sm:h-32 bg-[#2d5016] border-2 border-[#1a2e1a]"></div>
            <div className="absolute top-0 right-1/4 w-12 h-24 sm:w-16 sm:h-32 bg-[#2d5016] border-2 border-[#1a2e1a]"></div>
            <div className="absolute top-0 left-1/2 w-12 h-24 sm:w-16 sm:h-32 bg-[#2d5016] border-2 border-[#1a2e1a]"></div>
            
            {/* Tree Stumps */}
            <div className="absolute bottom-16 sm:bottom-20 left-1/3 w-6 h-4 sm:w-8 sm:h-6 bg-[#8B4513] border-2 border-[#654321]"></div>
            <div className="absolute bottom-16 sm:bottom-20 right-1/3 w-6 h-4 sm:w-8 sm:h-6 bg-[#8B4513] border-2 border-[#654321]"></div>
            
            {/* Signpost */}
            <div className="absolute bottom-24 sm:bottom-32 left-1/2 transform -translate-x-1/2 w-3 h-8 sm:w-4 sm:h-12 bg-[#8B4513] border-2 border-[#654321]">
              <div className="absolute top-1 sm:top-2 left-1/2 transform -translate-x-1/2 w-6 h-1 sm:w-8 sm:h-2 bg-[#8B4513] border-2 border-[#654321]"></div>
            </div>
            
            {/* Lantern */}
            <div className="absolute top-1/4 right-1/4 w-4 h-6 sm:w-6 sm:h-8 bg-[#fbbf24] border-2 border-[#d97706] rounded-full"></div>
          </div>
          
                     {/* Character */}
           <div className="relative z-10">
             <img 
               src="/assets/sprites/character.png" 
               alt="Tiny Adventurer" 
               className="w-16 h-20 sm:w-20 sm:h-24 pixel-art"
               onError={(e) => {
                 // Fallback to CSS character if image fails to load
                 e.currentTarget.style.display = 'none';
                 e.currentTarget.nextElementSibling?.classList.remove('hidden');
               }}
             />
             
             {/* Fallback CSS Character */}
             <div className="w-12 h-16 sm:w-16 sm:h-20 bg-[#f5f5dc] border-2 border-[#8B4513] flex items-center justify-center relative hidden">
               {/* Head */}
               <div className="absolute -top-2 sm:-top-3 w-8 h-8 sm:w-10 sm:h-10 bg-[#f5f5dc] border-2 border-[#8B4513] rounded-full flex items-center justify-center">
                 {/* Eyes */}
                 <div className="absolute top-2 sm:top-3 left-1 sm:left-2 w-1 h-1 sm:w-2 sm:h-2 bg-[#8B4513]"></div>
                 <div className="absolute top-2 sm:top-3 right-1 sm:right-2 w-1 h-1 sm:w-2 sm:h-2 bg-[#8B4513]"></div>
                 {/* Mouth */}
                 <div className="absolute bottom-1 sm:bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-0.5 sm:w-3 sm:h-1 bg-[#8B4513]"></div>
               </div>
               
               {/* Scarf */}
               <div className="absolute top-4 sm:top-6 w-6 h-2 sm:w-8 sm:h-3 bg-[#4a5568] border border-[#2d3748]"></div>
               
               {/* Belt */}
               <div className="absolute bottom-4 sm:bottom-6 w-8 h-1 sm:w-10 sm:h-2 bg-[#8B4513] border border-[#654321]"></div>
             </div>
           </div>
        </div>
        
        {/* Bottom Action Area */}
        <div className="p-3 sm:p-4">
          {showSessionTimer ? (
            <SessionProgress
              onSessionComplete={handleSessionComplete}
              onSessionFail={() => console.log('Session failed')}
            />
          ) : (
            <div className="text-center">
              {/* Success Message */}
              {sessionResult && (
                <SuccessMessage
                  xpGained={sessionResult.xp_gained}
                  coinsGained={sessionResult.coins_gained}
                  sparksGained={sessionResult.sparks_gained}
                  levelUp={sessionResult.level_up}
                  newLevel={sessionResult.new_level}
                  onDismiss={handleDismissSuccess}
                />
              )}
              
                             {/* Main FOCUS Button */}
               <div className="w-full max-w-xs sm:max-w-md mx-auto">
                 <img 
                   src="/assets/ui/focus-button.png" 
                   alt="FOCUS" 
                   className="w-full h-auto pixel-art cursor-pointer hover:opacity-90 transition-opacity"
                   onClick={() => setShowSessionTimer(true)}
                   onError={(e) => {
                     e.currentTarget.style.display = 'none';
                     e.currentTarget.nextElementSibling?.classList.remove('hidden');
                   }}
                 />
                 <button
                   onClick={() => setShowSessionTimer(true)}
                   className="w-full max-w-xs sm:max-w-md mx-auto bg-[#f5f5dc] border-4 border-[#8B4513] text-[#8B4513] font-bold text-lg sm:text-xl py-3 sm:py-4 px-6 sm:px-8 hover:bg-[#e8e8d0] transition-colors shadow-lg hidden"
                 >
                   FOCUS
                 </button>
               </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Session Timer Modal */}
      {showSessionTimer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md">
            <SessionTimer
              onSessionStart={handleSessionStart}
              onSessionCancel={handleSessionCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
}
