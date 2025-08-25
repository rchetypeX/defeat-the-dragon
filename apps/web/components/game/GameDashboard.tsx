'use client';

import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../../lib/store';
import { SessionTimer } from './SessionTimer';
import { SessionProgress } from './SessionProgress';
import { SuccessMessage } from '../ui/SuccessMessage';
import { useBaseAppNotifications } from '../../hooks/useBaseAppNotifications';
import { Action } from '@defeat-the-dragon/engine';
import FocusSessionMusic from '../audio/FocusSessionMusic';
import AudioControlsPopup from '../audio/AudioControlsPopup';
import { SettingsPopup } from '../ui/SettingsPopup';
import { ShopPopup } from '../ui/ShopPopup';
import { InventoryPopup } from '../ui/InventoryPopup';
import { useAudio } from '../../contexts/AudioContext';
import { useCharacterStore } from '../../lib/characterStore';
import { useBackgroundStore } from '../../lib/backgroundStore';
import { CharacterDialogue } from './CharacterDialogue';
import { useDataSync } from '../../hooks/useDataSync';
import { usePrimaryButton } from '@coinbase/onchainkit/minikit';

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
    completeSession
  } = useGameStore();
  
  const { isLoading, error, lastSyncTime, syncFocusSession, refreshData } = useDataSync();
  
  // Enhanced notification system
  const {
    showSessionComplete,
    showSessionFailed,
    showLevelUp,
    showAchievement,
    showBossDefeated,
    isBaseApp,
    isEnabled
  } = useBaseAppNotifications({
    enableReEngagement: true,
    enableDailyReminders: true,
    enableSocialNotifications: true
  });
  
  const {
    backgroundVolume,
    isBackgroundPlaying,
    isSessionActive,
    setBackgroundVolume,
    toggleBackgroundPlayPause,
    setSessionActive
  } = useAudio();
  
  const [showAudioControls, setShowAudioControls] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showInventory, setShowInventory] = useState(false);

  const [showSessionTimer, setShowSessionTimer] = useState(false);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const [quoteTriggerCount, setQuoteTriggerCount] = useState(0);
  
  const { equippedCharacter, getCharacterImage } = useCharacterStore();
  const { equippedBackground, getBackgroundImage } = useBackgroundStore();

  // Primary Button Configuration
  const getPrimaryButtonConfig = useCallback(() => {
    if (sessionProgress.isActive) {
      return {
        text: 'PAUSE SESSION',
        action: () => {
          // Handle pause session logic
          console.log('Primary button: Pause session clicked');
          // TODO: Implement pause session functionality
        }
      };
    } else if (sessionResult) {
      return {
        text: 'CONTINUE FOCUSING',
        action: () => {
          console.log('Primary button: Continue focusing clicked');
          handleDismissSuccess();
        }
      };
    } else if (showSessionTimer) {
      return {
        text: 'START FOCUS SESSION',
        action: () => {
          console.log('Primary button: Start focus session clicked');
          // This will be handled by the SessionTimer component
        }
      };
    } else {
      return {
        text: 'START FOCUSING',
        action: () => {
          console.log('Primary button: Start focusing clicked');
          setShowSessionTimer(true);
        }
      };
    }
  }, [sessionProgress.isActive, sessionResult, showSessionTimer]);

  const primaryButtonConfig = getPrimaryButtonConfig();

  // Configure primary button based on game state
  usePrimaryButton(
    { text: primaryButtonConfig.text },
    primaryButtonConfig.action
  );

  useEffect(() => {
    // Notification system is now handled by useBaseAppNotifications hook
    console.log('🔔 Notification system initialized:', { isBaseApp, isEnabled });
  }, [isBaseApp, isEnabled]);

  // Update session active state when session progress changes
  useEffect(() => {
    if (isSessionActive !== sessionProgress.isActive) {
      setSessionActive(sessionProgress.isActive);
    }
  }, [sessionProgress.isActive, isSessionActive, setSessionActive]);

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
      
      // Note: Session completion already syncs data via the existing session system
      // No additional sync needed to prevent redundant API calls
      console.log('GameDashboard: Session completed - data already synced via session system');
      
      // Show enhanced notification
      await showSessionComplete(
        result.xp_gained, 
        result.coins_gained, 
        result.sparks_gained,
        result.level_up,
        result.new_level
      );
      
      // Show level up notification if applicable
      if (result.level_up && result.new_level) {
        await showLevelUp(result.new_level, ['New character class', 'Enhanced abilities']);
      }
      
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
      // Don't sync failed sessions to database (online-first approach)
      // Failed sessions are not saved, only successful ones are
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

  const handleCharacterClick = () => {
    setQuoteTriggerCount(prev => prev + 1);
  };

  if (!player) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Background Scene */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${getBackgroundImage(equippedBackground)})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        ></div>
        
        {/* Loading Content */}
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="pixel-card p-8 text-center">
            <div className="text-2xl mb-4">⚔️</div>
            <h2 className="text-xl font-bold text-[#f2751a] mb-2">Loading Character...</h2>
            <p className="text-[#fbbf24]">Preparing your adventure...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Focus Session Music */}
      <FocusSessionMusic 
        src="/assets/audio/focus-session-music.mp3"
        volume={0.4}
        loop={true}
        isSessionActive={sessionProgress.isActive}
        onLoad={() => console.log('Focus session music loaded')}
        onError={(error) => console.error('Focus session music error:', error)}
      />
      
      {/* Background Scene */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${getBackgroundImage(equippedBackground)})`,
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
                                                             {/* Level and Name Cards */}
                  <div className="flex space-x-1 sm:space-x-2">
                    {/* Level Card */}
                    <div className="relative">
                      <img 
                        src="/assets/ui/level-card.png" 
                        alt="Level" 
                        className="w-8 h-8 sm:w-10 sm:h-10 pixel-art"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      {/* Level text overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-[#8B4513] font-bold text-xs sm:text-sm drop-shadow-sm">{player.level}</span>
                      </div>
                    </div>
                    
                                                                                                        {/* Name Card */}
                     <div className="relative">
                       <img 
                         src="/assets/ui/name-card.png" 
                         alt="Name" 
                         className="w-36 h-8 sm:w-40 sm:h-10 pixel-art"
                         onError={(e) => {
                           e.currentTarget.style.display = 'none';
                           e.currentTarget.nextElementSibling?.classList.remove('hidden');
                         }}
                       />
                       {/* Name text overlay */}
                       <div className="absolute inset-0 flex items-center justify-start px-2 sm:px-3 pointer-events-none overflow-hidden">
                         <span className="text-[#8B4513] font-bold text-[9px] sm:text-[11px] drop-shadow-sm whitespace-nowrap truncate">
                           {(player.display_name || 'Adventurer').substring(0, 20)}
                         </span>
                       </div>
                     </div>
                  </div>
                
                                                                                                                                                            {/* Coins */}
                   <div className="flex space-x-1 sm:space-x-2">
                     {/* Gold Icon */}
                     <div className="relative">
                       <img 
                         src="/assets/ui/gold-icon.png" 
                         alt="Gold Icon" 
                         className="w-8 h-8 sm:w-10 sm:h-10 pixel-art"
                         onError={(e) => {
                           e.currentTarget.style.display = 'none';
                           e.currentTarget.nextElementSibling?.classList.remove('hidden');
                         }}
                       />
                     </div>
                     
                     {/* Gold Card */}
                     <div className="relative">
                       <img 
                         src="/assets/ui/gold-card.png" 
                         alt="Gold" 
                         className="w-16 h-8 sm:w-18 sm:h-10 pixel-art"
                         onError={(e) => {
                           e.currentTarget.style.display = 'none';
                           e.currentTarget.nextElementSibling?.classList.remove('hidden');
                         }}
                       />
                       {/* Gold text overlay */}
                       <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                         <span className="text-[#8B4513] font-bold text-[10px] sm:text-[12px] drop-shadow-sm truncate">{player.coins.toString().padStart(4, '0')}</span>
                       </div>
                     </div>
                   </div>
                
                                                                                                                                                            {/* XP/Sparks */}
                   <div className="flex space-x-1 sm:space-x-2">
                     {/* Sparks Icon */}
                     <div className="relative">
                       <img 
                         src="/assets/ui/sparks-icon.png" 
                         alt="Sparks Icon" 
                         className="w-8 h-8 sm:w-10 sm:h-10 pixel-art"
                         onError={(e) => {
                           e.currentTarget.style.display = 'none';
                           e.currentTarget.nextElementSibling?.classList.remove('hidden');
                         }}
                       />
                     </div>
                     
                     {/* Sparks Card */}
                     <div className="relative">
                       <img 
                         src="/assets/ui/sparks-card.png" 
                         alt="Sparks" 
                         className="w-16 h-8 sm:w-18 sm:h-10 pixel-art"
                         onError={(e) => {
                           e.currentTarget.style.display = 'none';
                           e.currentTarget.nextElementSibling?.classList.remove('hidden');
                         }}
                       />
                       {/* Sparks text overlay */}
                       <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                         <span className="text-[#8B4513] font-bold text-[10px] sm:text-[12px] drop-shadow-sm truncate">{player.sparks.toString().padStart(4, '0')}</span>
                       </div>
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
                   onClick={() => setShowSettings(true)}
                 />
                 
                 {/* Sound */}
                 <img 
                   src="/assets/icons/sound.png" 
                   alt="Sound" 
                   className="w-8 h-8 sm:w-10 sm:h-10 pixel-art cursor-pointer hover:opacity-80 transition-opacity drop-shadow-lg"
                   onClick={() => setShowAudioControls(true)}
                 />
                 
                                   {/* Shop */}
                  <img 
                    src="/assets/icons/shop.png" 
                    alt="Shop" 
                    className="w-8 h-8 sm:w-10 sm:h-10 pixel-art cursor-pointer hover:opacity-80 transition-opacity drop-shadow-lg"
                    onClick={() => setShowShop(true)}
                  />
                 
                                   {/* Inventory */}
                  <img 
                    src="/assets/icons/inventory.png" 
                    alt="Inventory" 
                    className="w-8 h-8 sm:w-10 sm:h-10 pixel-art cursor-pointer hover:opacity-80 transition-opacity drop-shadow-lg"
                    onClick={() => setShowInventory(true)}
                  />
               </div>
           </div>
         )}
        
        {/* Central Character Area - Hidden during Focus Session */}
        {!sessionProgress.isActive && !showSessionTimer && !sessionResult && !showSettings && !showShop && !showInventory && !showAudioControls && (
          <div className="flex-1 flex items-center justify-center relative px-4">
            {/* Character positioned just below center with dynamic scaling */}
            <div className="relative z-5 transform translate-y-4 sm:translate-y-6">
              <img 
                src={getCharacterImage(equippedCharacter)} 
                alt="Tiny Adventurer" 
                className="character-dynamic pixel-art drop-shadow-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={handleCharacterClick}
                onError={(e) => {
                  // Fallback to CSS character if image fails to load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              
              {/* Character Dialogue - Positioned above character with padding */}
              <CharacterDialogue 
                isVisible={true}
                triggerQuoteChangeCount={quoteTriggerCount}
              />
            </div>
          </div>
        )}
        
                         {/* Bottom Action Area - Positioned higher up */}
        <div className={`focus-button-container ${showSessionTimer || sessionResult || showSettings || showShop || showInventory || showAudioControls ? 'hidden' : ''}`}>
          {sessionProgress.isActive ? (
            <SessionProgress
              onSessionComplete={handleSessionComplete}
              onSessionFail={handleSessionFail}
            />
          ) : (
            <div className="text-center">
              {/* Main FOCUS Button - Smaller and positioned higher */}
              <div className="w-full focus-button-small mx-auto">
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
                   className="w-full focus-button-small mx-auto bg-[#f5f5dc] border-4 border-[#8B4513] text-[#8B4513] font-bold text-sm sm:text-base py-2 px-4 hover:bg-[#e8e8d0] transition-colors shadow-lg hidden"
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
      
      {/* Audio Controls Popup */}
              <AudioControlsPopup
          isOpen={showAudioControls}
          onClose={() => setShowAudioControls(false)}
          backgroundVolume={backgroundVolume}
          onBackgroundVolumeChange={setBackgroundVolume}
          isBackgroundPlaying={isBackgroundPlaying}
          onBackgroundPlayPause={toggleBackgroundPlayPause}
          isSessionActive={isSessionActive}
        />

             {/* Settings Popup */}
       <SettingsPopup
         isOpen={showSettings}
         onClose={() => setShowSettings(false)}
       />

               {/* Shop Popup */}
        <ShopPopup
          isOpen={showShop}
          onClose={() => setShowShop(false)}
        />

        {/* Inventory Popup */}
        <InventoryPopup
          isOpen={showInventory}
          onClose={() => setShowInventory(false)}
        />
    </div>
  );
}
