'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';

interface AudioState {
  backgroundVolume: number;
  focusSessionVolume: number;
  isBackgroundPlaying: boolean;
  isFocusSessionPlaying: boolean;
  isSessionActive: boolean;
}

interface AudioContextType extends AudioState {
  setBackgroundVolume: (volume: number) => void;
  setFocusSessionVolume: (volume: number) => void;
  setBackgroundPlaying: (playing: boolean) => void;
  setFocusSessionPlaying: (playing: boolean) => void;
  setSessionActive: (active: boolean) => void;
  toggleBackgroundPlayPause: () => void;
  toggleFocusSessionPlayPause: () => void;
  hasUserInteracted: boolean;
  isBaseApp: boolean;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

interface AudioProviderProps {
  children: ReactNode;
}

export const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
  const [audioState, setAudioState] = useState<AudioState>({
    backgroundVolume: 0.3,
    focusSessionVolume: 0.4,
    isBackgroundPlaying: false,
    isFocusSessionPlaying: false,
    isSessionActive: false,
  });
  const [isMounted, setIsMounted] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [isBaseApp, setIsBaseApp] = useState(false);

  // Detect Base App environment
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const detectBaseApp = () => {
      try {
        // Check for MiniKit hooks availability (Base App indicator)
        const hasMiniKit = typeof window !== 'undefined' && 
          (window as any).__MINIKIT_AVAILABLE__ || 
          (window as any).__BASE_APP_CONTEXT__;
        
        // Check for Base App specific indicators
        const hasBaseAppContext = typeof window !== 'undefined' && 
          (window as any).__BASE_APP_CONTEXT__ ||
          window.location.hostname.includes('base.org') ||
          window.navigator.userAgent.includes('BaseApp') ||
          window.location.search.includes('base_app=true');
        
        const baseAppDetected = hasMiniKit || hasBaseAppContext;
        setIsBaseApp(baseAppDetected);
        
        console.log('AudioContext: Base App detection:', {
          hasMiniKit,
          hasBaseAppContext,
          baseAppDetected,
          hostname: window.location.hostname,
          userAgent: window.navigator.userAgent
        });
        
        return baseAppDetected;
      } catch (error) {
        console.warn('AudioContext: Error detecting Base App:', error);
        return false;
      }
    };
    
    detectBaseApp();
  }, []);

  // Handle client-side mounting and user interaction detection
  useEffect(() => {
    setIsMounted(true);
    
    // Load audio settings from localStorage on mount
    if (typeof window !== 'undefined') {
      const savedBackgroundVolume = localStorage.getItem('backgroundVolume');
      const savedFocusSessionVolume = localStorage.getItem('focusSessionVolume');
      const savedBackgroundPlaying = localStorage.getItem('backgroundPlaying');
      
      if (savedBackgroundVolume || savedFocusSessionVolume || savedBackgroundPlaying) {
        setAudioState(prev => ({
          ...prev,
          backgroundVolume: savedBackgroundVolume ? parseFloat(savedBackgroundVolume) : prev.backgroundVolume,
          focusSessionVolume: savedFocusSessionVolume ? parseFloat(savedFocusSessionVolume) : prev.focusSessionVolume,
          isBackgroundPlaying: savedBackgroundPlaying ? JSON.parse(savedBackgroundPlaying) : prev.isBackgroundPlaying,
        }));
      }
    }

    // Enhanced user interaction detection for Base App
    const handleUserInteraction = (event: Event) => {
      if (!hasUserInteracted) {
        console.log('AudioContext: User interaction detected - audio system ready', {
          eventType: event.type,
          isBaseApp,
          target: event.target
        });
        
        setHasUserInteracted(true);
        
        // For Base App, we need to be more aggressive about enabling audio
        if (isBaseApp) {
          console.log('AudioContext: Base App user interaction - enabling audio system');
          
          // Try to create and play a silent audio context to unlock audio
          try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Set volume to 0 (silent)
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            
            // Start and immediately stop to unlock audio
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.001);
            
            console.log('AudioContext: Base App audio context unlocked successfully');
          } catch (error) {
            console.warn('AudioContext: Failed to unlock Base App audio context:', error);
          }
        }
        
        // Remove listeners after first interaction
        document.removeEventListener('click', handleUserInteraction);
        document.removeEventListener('touchstart', handleUserInteraction);
        document.removeEventListener('keydown', handleUserInteraction);
        document.removeEventListener('mousedown', handleUserInteraction);
        document.removeEventListener('pointerdown', handleUserInteraction);
      }
    };
    
    // Add more comprehensive event listeners for Base App
    const events = ['click', 'touchstart', 'keydown', 'mousedown', 'pointerdown'];
    events.forEach(eventType => {
      document.addEventListener(eventType, handleUserInteraction, { passive: true });
    });
    
    return () => {
      events.forEach(eventType => {
        document.removeEventListener(eventType, handleUserInteraction);
      });
    };
  }, [hasUserInteracted, isBaseApp]);

  // Save audio settings to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined' && isMounted) {
      localStorage.setItem('backgroundVolume', audioState.backgroundVolume.toString());
      localStorage.setItem('focusSessionVolume', audioState.focusSessionVolume.toString());
      localStorage.setItem('backgroundPlaying', JSON.stringify(audioState.isBackgroundPlaying));
    }
  }, [audioState.backgroundVolume, audioState.focusSessionVolume, audioState.isBackgroundPlaying, isMounted]);

  const setBackgroundVolume = useCallback((volume: number) => {
    setAudioState(prev => ({ ...prev, backgroundVolume: volume }));
  }, []);

  const setFocusSessionVolume = useCallback((volume: number) => {
    setAudioState(prev => ({ ...prev, focusSessionVolume: volume }));
  }, []);

  const setBackgroundPlaying = useCallback((playing: boolean) => {
    setAudioState(prev => ({ ...prev, isBackgroundPlaying: playing }));
  }, []);

  const setFocusSessionPlaying = useCallback((playing: boolean) => {
    setAudioState(prev => ({ ...prev, isFocusSessionPlaying: playing }));
  }, []);

  const setSessionActive = useCallback((active: boolean) => {
    setAudioState(prev => ({ ...prev, isSessionActive: active }));
  }, []);

  const toggleBackgroundPlayPause = useCallback(() => {
    setAudioState(prev => {
      const newState = { 
        ...prev, 
        isBackgroundPlaying: !prev.isBackgroundPlaying 
      };
      console.log('AudioContext: Background play/pause toggled:', newState.isBackgroundPlaying, 'isBaseApp:', isBaseApp);
      return newState;
    });
  }, [isBaseApp]);

  const toggleFocusSessionPlayPause = useCallback(() => {
    setAudioState(prev => {
      const newState = { 
        ...prev, 
        isFocusSessionPlaying: !prev.isFocusSessionPlaying 
      };
      console.log('AudioContext: Focus session play/pause toggled:', newState.isFocusSessionPlaying, 'isBaseApp:', isBaseApp);
      return newState;
    });
  }, [isBaseApp]);

  const value: AudioContextType = useMemo(() => ({
    ...audioState,
    setBackgroundVolume,
    setFocusSessionVolume,
    setBackgroundPlaying,
    setFocusSessionPlaying,
    setSessionActive,
    toggleBackgroundPlayPause,
    toggleFocusSessionPlayPause,
    hasUserInteracted,
    isBaseApp,
  }), [audioState, setBackgroundVolume, setFocusSessionVolume, setBackgroundPlaying, setFocusSessionPlaying, setSessionActive, toggleBackgroundPlayPause, toggleFocusSessionPlayPause, hasUserInteracted, isBaseApp]);

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};
