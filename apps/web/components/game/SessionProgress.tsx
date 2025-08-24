'use client';

import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../lib/store';
import { actionMetadata } from '@defeat-the-dragon/engine';
import { Action } from '@defeat-the-dragon/engine';
import { createSoftShield } from '../../lib/softShield';
import { SoftShieldWarning } from '../ui/SoftShieldWarning';
import { useBaseAppNotifications } from '../../hooks/useBaseAppNotifications';
import { useAudio } from '../../contexts/AudioContext';
import { useCharacterStore } from '../../lib/characterStore';
import FocusSessionAudioControls from '../audio/FocusSessionAudioControls';

interface SessionProgressProps {
  onSessionComplete: () => void;
  onSessionFail: () => void;
}

export function SessionProgress({ onSessionComplete, onSessionFail }: SessionProgressProps) {
  const { currentSession, sessionProgress, updateSessionProgress, player } = useGameStore();
  const { isBackgroundPlaying, toggleBackgroundPlayPause } = useAudio();
  const { equippedCharacter, getCharacterImage } = useCharacterStore();
  
  // Enhanced notification system
  const { showSoftShieldWarning, showSessionFailed } = useBaseAppNotifications();
  const [timeLeft, setTimeLeft] = useState(0);
  const [isDisturbed, setIsDisturbed] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningTimeLeft, setWarningTimeLeft] = useState(0);
  const [warningStartTime, setWarningStartTime] = useState<number | null>(null);
  const [showStopConfirmation, setShowStopConfirmation] = useState(false);
  const [showAudioControls, setShowAudioControls] = useState(false);
  const [currentDialogMessage, setCurrentDialogMessage] = useState<string>("");
  const softShieldRef = useRef<any>(null);

  // Get action info from currentSession or use a default
  const action = currentSession?.action as Action || 'Train';
  const actionInfo = actionMetadata[action];

  // Define subtext phrases for each action
  const getActionSubtext = (action: Action): string => {
    const subtextMap: Record<Action, string> = {
      'Train': 'I finish training.',
      'Eat': 'I\'m done eating',
      'Learn': 'I finish reading',
      'Bathe': 'I\'m done bathing',
      'Sleep': 'I wake up',
      'Maintain': 'I finish maintaining my equipment',
      'Fight': 'I\'m done fighting these mobs',
      'Adventure': 'I\'m back from my adventure'
    };
    return subtextMap[action] || 'I finish training.';
  };

  // Define dialog balloon messages for each action based on progress
  const getDialogMessage = (action: Action, elapsedSeconds: number, totalSeconds: number): string => {
    const progress = elapsedSeconds / totalSeconds;
    const messageIndex = Math.min(Math.floor(progress * 9), 8); // 9 messages, 0-8 index
    
    const dialogMessages: Record<Action, string[]> = {
      'Train': [
        "Quick drills! Let the screen nap for me.",
        "Stretch… stance… no peeks yet.",
        "Counting reps—guard the quiet.",
        "Form's getting tidy; keep hands off.",
        "Mid-set focus—thank you for the stillness.",
        "Sweat sparkle—no taps, I'm in rhythm.",
        "Almost there—hold the calm a little longer.",
        "Final reps; keep the phone snoozy.",
        "Done in a blink—stay steady till the bell!"
      ],
      'Eat': [
        "Snack time—silence makes food tastier.",
        "Nibble, nibble—no scrolling, promise?",
        "Chewing thoughtfully; keep the screen asleep.",
        "Savoring bites—thanks for not poking.",
        "Halfway plate—hands-off teamwork!",
        "Crunch-crunch—don't wake the phone.",
        "Last bites coming up—hold the quiet.",
        "Sip and finish—nearly done.",
        "Clean plate soon—stay still with me."
      ],
      'Learn': [
        "Opening the tome—shhh.",
        "Tracing lines—no peeks, please.",
        "Notes in the margins; keep things calm.",
        "Mid-chapter focus—guard the silence.",
        "Idea spark! Don't break the bubble.",
        "Turning a page—no taps while I think.",
        "Nearly through this lesson—hold steady.",
        "Reviewing highlights—screen stays sleepy.",
        "Closing the book—one more quiet moment."
      ],
      'Bathe': [
        "Steam rising—I'm bathing.",
        "Soapy whiskers—don't jostle me.",
        "Rinse cycle; keep the phone dozy.",
        "Scrub-scrub—thank you for the stillness.",
        "Warm fog focus—no taps.",
        "Towel ready—almost squeaky.",
        "Final rinse; let the screen snooze.",
        "Drying off—hold the calm.",
        "All clean soon—stay hands-off till I sparkle."
      ],
      'Sleep': [
        "Curling up—tiny nap mode.",
        "Zzz… quiet helps me dream.",
        "Breathing slow; keep the phone resting.",
        "Dozing deeper—no peeks.",
        "Half-nap checkpoint—thank you for stillness.",
        "Soft snores—don't wake the screen.",
        "Stirring soon—hold the hush.",
        "Almost refreshed—one more quiet minute.",
        "Waking stretch—keep it calm till the chime."
      ],
      'Maintain': [
        "Gear check—maintaining my equipment.",
        "Oiling hinges; no taps while I focus.",
        "Sharpening edges—thanks for the calm.",
        "Polish pass; keep hands off.",
        "Tightening straps—screen stays sleepy.",
        "Details, details—don't break my groove.",
        "Final polish—hold the quiet.",
        "Everything gleams—almost done.",
        "Toolkit closing—stay steady till the tick."
      ],
      'Fight': [
        "Stance set—I'm fighting these mobs.",
        "First wave—no peeks, I've got this.",
        "Combo time—keep the phone still.",
        "Dodging neatly; thanks for the hush.",
        "Mid-battle—don't wake the screen.",
        "Special ready—hold the calm.",
        "Last few foes—hands off till I finish.",
        "Boss staggered—nearly there.",
        "Victory incoming—stay steady for the win!"
      ],
      'Adventure': [
        "Lantern lit—I'm going on an adventure.",
        "Path forks ahead—no distractions.",
        "Tracking footprints; keep the phone sleepy.",
        "Torch high—thanks for the stillness.",
        "Deeper in—don't jostle my map.",
        "Treasure glint—hold the calm.",
        "Gate in sight—hands off, brave friend.",
        "Chest unlocked—almost done.",
        "Loot secured—keep it quiet till I return!"
      ]
    };
    
    return dialogMessages[action]?.[messageIndex] || dialogMessages['Train'][messageIndex] || "Focusing...";
  };

  // Debug logging
  console.log('SessionProgress render:', {
    currentSession: !!currentSession,
    sessionProgress: {
      isActive: sessionProgress.isActive,
      startTime: sessionProgress.startTime,
      durationMinutes: sessionProgress.durationMinutes,
      isDisturbed: sessionProgress.isDisturbed
    },
    timeLeft
  });

  // Initialize Soft Shield
  useEffect(() => {
    if (sessionProgress.isActive && !softShieldRef.current) {
      console.log('SessionProgress: Creating SoftShield...');
      softShieldRef.current = createSoftShield(
        {
          maxAwayTime: 15, // 15 seconds
          warningTime: 10, // 10 seconds
          awayStartDelay: 3000, // 3 second delay for mobile screen timeout protection
        },
        {
          onDisturbance: (awayTime: number) => {
            console.log(`SoftShield: Disturbed for ${awayTime}s`);
            updateSessionProgress({
              isDisturbed: true,
              disturbedSeconds: sessionProgress.disturbedSeconds + awayTime
            });
          },
                     onWarning: (remainingTime: number) => {
             console.log(`SoftShield: Warning triggered - ${remainingTime}s remaining`);
             if (!showWarning) {
               setShowWarning(true);
               setWarningStartTime(Date.now());
               showSoftShieldWarning(remainingTime);
               console.log('SessionProgress: Warning state set to true');
             }
             setWarningTimeLeft(remainingTime);
           },
          onFail: (totalAwayTime: number) => {
            console.log(`SoftShield: Failed after ${totalAwayTime}s away`);
            onSessionFail();
          }
        }
      );
      
      console.log('SessionProgress: Starting SoftShield...');
      softShieldRef.current.start();
    }

    return () => {
      if (softShieldRef.current) {
        softShieldRef.current.stop();
        softShieldRef.current = null;
      }
    };
  }, [sessionProgress.isActive, updateSessionProgress, sessionProgress.disturbedSeconds, onSessionFail]);

  // Handle SoftShield state changes
  useEffect(() => {
    if (softShieldRef.current && sessionProgress.isActive) {
      const shieldState = softShieldRef.current.getState();
      
      // Update disturbed state based on SoftShield
      if (shieldState.isDisturbed !== isDisturbed) {
        setIsDisturbed(shieldState.isDisturbed);
        if (!shieldState.isDisturbed) {
          // Clear disturbed state when user returns
          updateSessionProgress({
            isDisturbed: false
          });
        }
      }
      
      // Clear warning when user returns and warning is active
      if (showWarning && !shieldState.lastWarningTime) {
        console.log('SessionProgress: User returned, clearing warning');
        setShowWarning(false);
        setWarningTimeLeft(0);
        setWarningStartTime(null);
      }
    }
  }, [sessionProgress.isActive, isDisturbed, updateSessionProgress, showWarning]);

  useEffect(() => {
    if (!sessionProgress.isActive || !sessionProgress.startTime) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionProgress.startTime) / 1000);
      const remaining = sessionProgress.durationMinutes * 60 - elapsed;
      
      setTimeLeft(Math.max(0, remaining));
      setIsDisturbed(sessionProgress.isDisturbed);

      // Update dialog message based on progress
      const totalSeconds = sessionProgress.durationMinutes * 60;
      const newDialogMessage = getDialogMessage(action, elapsed, totalSeconds);
      setCurrentDialogMessage(newDialogMessage);

      if (remaining <= 0) {
        clearInterval(interval);
        if (softShieldRef.current) {
          softShieldRef.current.stop();
        }
        
        // Check if session was disturbed
        if (sessionProgress.isDisturbed) {
          console.log('SessionProgress: Timer reached zero but session was disturbed, calling onSessionFail');
          onSessionFail();
        } else {
          console.log('SessionProgress: Timer reached zero, calling onSessionComplete');
          onSessionComplete();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionProgress.isActive, sessionProgress.startTime, sessionProgress.durationMinutes, sessionProgress.isDisturbed, onSessionComplete, onSessionFail, action]);

  // Clean up when session becomes inactive
  useEffect(() => {
    if (!sessionProgress.isActive) {
      if (softShieldRef.current) {
        softShieldRef.current.stop();
        softShieldRef.current = null;
      }
      setShowWarning(false);
      setWarningTimeLeft(0);
      setIsDisturbed(false);
      setShowStopConfirmation(false);
      setCurrentDialogMessage("");
    }
  }, [sessionProgress.isActive]);

  // Handle warning dismissal when time reaches 0
  useEffect(() => {
    if (showWarning && warningTimeLeft <= 0) {
      console.log('SessionProgress: Warning time expired, dismissing warning');
      setShowWarning(false);
      setWarningTimeLeft(0);
      setWarningStartTime(null);
      // Small delay to ensure UI updates before potential session failure
      setTimeout(() => {
        if (softShieldRef.current) {
          const shieldState = softShieldRef.current.getState();
          if (shieldState.isDisturbed) {
            console.log('SessionProgress: Session was disturbed, calling onSessionFail');
            onSessionFail();
          }
        }
      }, 200);
    }
  }, [showWarning, warningTimeLeft, onSessionFail]);

  if (!sessionProgress.isActive || !actionInfo) {
    return null;
  }

  // Debug logging for character rendering (commented out to reduce console spam)
  // console.log('SessionProgress: Rendering character:', {
  //   equippedCharacter,
  //   characterImage: getCharacterImage(equippedCharacter),
  //   isActive: sessionProgress.isActive
  // });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Soft Shield Warning */}
      {showWarning && (
        <SoftShieldWarning
          remainingTime={warningTimeLeft}
          onDismiss={() => setShowWarning(false)}
        />
      )}
      
      {/* Vignette Overlay */}
      <div className="fixed inset-0 pointer-events-none z-20">
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at center, transparent 0%, transparent 30%, rgba(0, 0, 0, 0.7) 70%, rgba(0, 0, 0, 0.9) 100%)`,
            backgroundSize: '100% 100%',
            backgroundPosition: 'center'
          }}
        />
      </div>

       {/* Character - Positioned in the center */}
       <div className="fixed left-1/2 transform -translate-x-1/2 top-1/2 transform -translate-y-1/2 z-50 overflow-hidden" style={{ pointerEvents: 'none' }}>
         <img 
           src={getCharacterImage(equippedCharacter)} 
           alt="Tiny Adventurer" 
           className="w-32 h-36 sm:w-36 sm:h-40 pixel-art drop-shadow-lg object-contain"
           style={{
             imageRendering: 'pixelated',
             objectPosition: 'center bottom',
             objectFit: 'cover',
             height: '100%',
             width: '100%'
           }}
           onError={(e) => {
             console.log('Character image failed to load:', getCharacterImage(equippedCharacter));
             e.currentTarget.style.display = 'none';
           }}
           onLoad={() => {
             console.log('Character image loaded successfully:', getCharacterImage(equippedCharacter));
           }}
         />
       </div>

       {/* Dialog Balloon - Positioned higher above the character */}
       <div key={currentDialogMessage} className="focus-session-dialogue">
         <div className="pixel-card">
           <div className="text-content">
             {currentDialogMessage}
           </div>
         </div>
       </div>

      {/* Timer Display */}
      <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-30 text-center">
        <div className="text-4xl sm:text-5xl font-bold text-white drop-shadow-lg mb-2">
          {formatTime(timeLeft)}
        </div>
        <div className="text-sm sm:text-base text-[#fbbf24] drop-shadow-lg">
          to go until {getActionSubtext(action)}
        </div>
      </div>

      {/* Sound Button - Top Right */}
      <div className="fixed top-4 right-4 z-30">
        <img 
          src="/assets/icons/sound.png" 
          alt="Sound" 
          className="w-8 h-8 sm:w-10 sm:h-10 pixel-art cursor-pointer hover:opacity-80 transition-opacity drop-shadow-lg"
          onClick={() => setShowAudioControls(true)}
        />
      </div>

             {/* Stop Button */}
       <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-30">
         <button
           onClick={() => setShowStopConfirmation(true)}
           className="pixel-button bg-[#ef4444] hover:bg-[#dc2626] text-white px-6 py-3 text-base sm:text-lg"
         >
           STOP FOCUSING
         </button>
       </div>

       {/* Stop Confirmation Modal */}
       {showStopConfirmation && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="pixel-card p-6 sm:p-8 border-2 border-[#ef4444] bg-white max-w-md w-full mx-4">
             <div className="text-center mb-6">
               <div className="text-gray-800 text-lg sm:text-xl font-bold mb-2">
                 Are you sure?
               </div>
               <div className="text-gray-600 text-sm sm:text-base">
                 {player?.display_name || 'Adventurer'} still needs to focus...
               </div>
             </div>
             
             <div className="flex gap-3 justify-center">
               <button
                 onClick={onSessionFail}
                 className="pixel-button bg-[#ef4444] hover:bg-[#dc2626] text-white px-6 py-2 text-sm flex-1 max-w-[100px]"
               >
                 Yes
               </button>
               <button
                 onClick={() => setShowStopConfirmation(false)}
                 className="pixel-button bg-[#6b7280] hover:bg-[#4b5563] text-white px-6 py-2 text-sm flex-1 max-w-[100px]"
               >
                 No
               </button>
             </div>
           </div>
         </div>
       )}

       {/* Focus Session Audio Controls */}
       <FocusSessionAudioControls
         isOpen={showAudioControls}
         onClose={() => setShowAudioControls(false)}
       />
    </>
  );
}
