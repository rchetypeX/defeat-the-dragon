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
      setShowSessionTimer(false);
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

  const handleSessionFail = async () => {
    console.log('GameDashboard: handleSessionFail called');
    try {
      console.log('GameDashboard: About to call completeSession with fail...');
      await completeSession('fail');
      console.log('GameDashboard: Session failed');
      setShowSessionTimer(false);
      // Don't set sessionResult for failed sessions
    } catch (error) {
      console.error('GameDashboard: Failed to fail session:', error);
    }
  };

  const handleSessionCancel = () => {
    setShowSessionTimer(false);
  };

  const handleDismissSuccess = () => {
    setSessionResult(null);
  };

  const handleKeepFocusing = () => {
    setSessionResult(null);
    setShowSessionTimer(true);
  };

  const handleGoHome = () => {
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
      
      {/* Main Game Interface */}
      <div className="relative z-10 min-h-screen flex flex-col">
        
                 {/* Top Bar - Player Stats and Menu Icons */}
         {!sessionProgress.isActive && !showSessionTimer && !sessionResult && (
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
                                       {/* Text overlays on the card */}
                    <div className="absolute inset-0 pointer-events-none">
                                                                    {/* Level text - centered in the left square area */}
                                               <div className="absolute left-1/4 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                          <span className="text-[#8B4513] font-bold text-xs sm:text-sm drop-shadow-sm">{player.level}</span>
                        </div>
                                                                                                                                            {/* Name text - positioned only in the right rectangular area with proper constraints */}
                                                     <div className="absolute left-1/2 right-2 top-1/2 transform -translate-y-1/2 w-1/2 flex items-center justify-center overflow-hidden">
                              <span className="text-[#8B4513] font-bold text-[12px] drop-shadow-sm truncate">{player.display_name || 'Adventurer'}</span>
                            </div>
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
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               {/* Text overlay on the card */}
                        <div className="absolute inset-0 flex items-center justify-end px-2 sm:px-2 pointer-events-none">
                          <span className="text-[#8B4513] font-bold text-xs sm:text-sm drop-shadow-sm">{player.coins.toString().padStart(4, '0')}</span>
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
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               {/* Text overlay on the card */}
                        <div className="absolute inset-0 flex items-center justify-end px-2 sm:px-2 pointer-events-none">
                          <span className="text-[#8B4513] font-bold text-xs sm:text-sm drop-shadow-sm">{player.sparks.toString().padStart(4, '0')}</span>
                        </div>
                 </div>
              </div>
             
                                              {/* Menu Icons (Top-Right) */}
               <div className="flex flex-col space-y-1 sm:space-y-2">
                 {/* Settings */}
                 <img 
                   src="/assets/icons/settings.png" 
                   alt="Settings" 
                   className="w-8 h-8 sm:w-10 sm:h-10 pixel-art cursor-pointer hover:opacity-80 transition-opacity drop-shadow-lg"
                 />
                 
                 {/* Sound */}
                 <img 
                   src="/assets/icons/sound.png" 
                   alt="Sound" 
                   className="w-8 h-8 sm:w-10 sm:h-10 pixel-art cursor-pointer hover:opacity-80 transition-opacity drop-shadow-lg"
                 />
                 
                 {/* Shop */}
                 <img 
                   src="/assets/icons/shop.png" 
                   alt="Shop" 
                   className="w-8 h-8 sm:w-10 sm:h-10 pixel-art cursor-pointer hover:opacity-80 transition-opacity drop-shadow-lg"
                 />
                 
                 {/* Inventory */}
                 <img 
                   src="/assets/icons/inventory.png" 
                   alt="Inventory" 
                   className="w-8 h-8 sm:w-10 sm:h-10 pixel-art cursor-pointer hover:opacity-80 transition-opacity drop-shadow-lg"
                 />
               </div>
           </div>
         )}
        
                                  {/* Central Character Area */}
         <div className={`flex-1 flex items-center justify-center relative px-4 ${showSessionTimer || sessionProgress.isActive || sessionResult ? 'hidden' : ''}`}>
                                                {/* Character positioned higher */}
            <div className="relative z-10 transform translate-y-4 sm:translate-y-6">
             <img 
               src="/assets/sprites/character.png" 
               alt="Tiny Adventurer" 
               className="w-16 h-20 sm:w-20 sm:h-24 pixel-art drop-shadow-lg"
               onError={(e) => {
                 // Fallback to CSS character if image fails to load
                 e.currentTarget.style.display = 'none';
                 e.currentTarget.nextElementSibling?.classList.remove('hidden');
               }}
             />
             
 
           </div>
        </div>
        
                 {/* Bottom Action Area */}
         <div className={`p-3 sm:p-4 ${showSessionTimer || sessionResult ? 'hidden' : ''}`}>
                       {sessionProgress.isActive ? (
              <SessionProgress
                onSessionComplete={handleSessionComplete}
                onSessionFail={handleSessionFail}
              />
            ) : (
             <div className="text-center">
               {/* Main FOCUS Button */}
               <div className="w-full max-w-[280px] sm:max-w-[320px] mx-auto -mt-4 sm:-mt-6">
                 <img 
                   src="/assets/ui/focus-button.png" 
                   alt="FOCUS" 
                   className="w-full h-auto pixel-art cursor-pointer hover:opacity-90 transition-opacity drop-shadow-lg"
                   onClick={() => setShowSessionTimer(true)}
                   onError={(e) => {
                     e.currentTarget.style.display = 'none';
                     e.currentTarget.nextElementSibling?.classList.remove('hidden');
                   }}
                 />
                 <button
                   onClick={() => setShowSessionTimer(true)}
                   className="w-full max-w-[280px] sm:max-w-[320px] mx-auto bg-[#f5f5dc] border-4 border-[#8B4513] text-[#8B4513] font-bold text-base sm:text-lg py-2 sm:py-3 px-4 sm:px-6 hover:bg-[#e8e8d0] transition-colors shadow-lg hidden"
                 >
                   FOCUS
                 </button>
               </div>
             </div>
           )}
         </div>

         {/* Success Message - Full Screen Overlay */}
         {sessionResult && (
           <SuccessMessage
             xpGained={sessionResult.xp_gained}
             coinsGained={sessionResult.coins_gained}
             sparksGained={sessionResult.sparks_gained}
             levelUp={sessionResult.level_up}
             newLevel={sessionResult.new_level}
             onDismiss={handleDismissSuccess}
             onKeepFocusing={handleKeepFocusing}
             onGoHome={handleGoHome}
           />
         )}
      </div>
      
             {/* Session Timer Modal */}
       {showSessionTimer && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6 sm:p-8">
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
