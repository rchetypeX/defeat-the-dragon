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

    // Listen for user interaction to enable audio
    const handleUserInteraction = () => {
      if (!hasUserInteracted) {
        console.log('AudioContext: User interaction detected - audio system ready');
        setHasUserInteracted(true);
        
        // Don't automatically enable background music - let user choose
        // This complies with browser autoplay policies
        
        // Remove listeners after first interaction
        document.removeEventListener('click', handleUserInteraction);
        document.removeEventListener('touchstart', handleUserInteraction);
        document.removeEventListener('keydown', handleUserInteraction);
      }
    };
    
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    
    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, [hasUserInteracted]);

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
      console.log('AudioContext: Background play/pause toggled:', newState.isBackgroundPlaying);
      return newState;
    });
  }, []);

  const toggleFocusSessionPlayPause = useCallback(() => {
    setAudioState(prev => {
      const newState = { 
        ...prev, 
        isFocusSessionPlaying: !prev.isFocusSessionPlaying 
      };
      console.log('AudioContext: Focus session play/pause toggled:', newState.isFocusSessionPlaying);
      return newState;
    });
  }, []);

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
  }), [audioState, setBackgroundVolume, setFocusSessionVolume, setBackgroundPlaying, setFocusSessionPlaying, setSessionActive, toggleBackgroundPlayPause, toggleFocusSessionPlayPause, hasUserInteracted]);

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};
