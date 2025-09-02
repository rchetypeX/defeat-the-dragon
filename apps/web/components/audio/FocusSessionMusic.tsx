'use client';

import { useEffect, useRef, useState } from 'react';
import { useAudio } from '../../contexts/AudioContext';

interface FocusSessionMusicProps {
  src: string;
  volume?: number;
  loop?: boolean;
  autoPlay?: boolean;
  isSessionActive?: boolean;
  onLoad?: () => void;
  onError?: (error: string) => void;
}

export const FocusSessionMusic: React.FC<FocusSessionMusicProps> = ({
  src,
  volume = 0.4,
  loop = true,
  autoPlay = false,
  isSessionActive = false,
  onLoad,
  onError
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { focusSessionVolume, isFocusSessionPlaying, setSessionActive, isBaseApp } = useAudio();

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize audio element
  useEffect(() => {
    if (!isMounted) return;
    
    const audio = audioRef.current;
    if (!audio) return;

    // Set initial properties
    audio.volume = focusSessionVolume;
    audio.loop = loop;

    // Event listeners
    const handleLoad = () => {
      setIsLoaded(true);
      setIsPlaying(false);
      onLoad?.();
      console.log('FocusSessionMusic: Audio loaded successfully', { isBaseApp });
    };

    const handlePlay = () => {
      console.log('FocusSessionMusic: Audio started playing', { isBaseApp });
      setIsPlaying(true);
      setRetryCount(0); // Reset retry count on successful play
    };
    
    const handlePause = () => {
      console.log('FocusSessionMusic: Audio paused', { isBaseApp });
      setIsPlaying(false);
    };
    
    const handleError = (event: Event) => {
      const error = event.target as HTMLAudioElement;
      console.error('FocusSessionMusic: Audio error:', {
        error: error.error,
        networkState: error.networkState,
        readyState: error.readyState,
        isBaseApp
      });
      onError?.(`Failed to load focus session audio file: ${error.error?.message || 'Unknown error'}`);
    };

    audio.addEventListener('loadeddata', handleLoad);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadeddata', handleLoad);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
    };
  }, [src, loop, onLoad, onError, isMounted, focusSessionVolume, isBaseApp]);

  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current && isMounted) {
      audioRef.current.volume = focusSessionVolume;
    }
  }, [focusSessionVolume, isMounted]);

  // Enhanced play function with Base App compatibility
  const attemptPlay = async (audio: HTMLAudioElement) => {
    try {
      console.log('FocusSessionMusic: Attempting to play audio', { isBaseApp, retryCount });
      
      // For Base App, we need to ensure audio context is ready
      if (isBaseApp) {
        // Try to create a new audio context to unlock audio system
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          if (audioContext.state === 'suspended') {
            console.log('FocusSessionMusic: Resuming suspended audio context for Base App');
            await audioContext.resume();
          }
          console.log('FocusSessionMusic: Base App audio context ready:', audioContext.state);
        } catch (contextError) {
          console.warn('FocusSessionMusic: Could not create audio context for Base App:', contextError);
        }
      }
      
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        await playPromise;
        console.log('FocusSessionMusic: Audio play successful', { isBaseApp });
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('FocusSessionMusic: Audio play failed:', error, { isBaseApp, retryCount });
      
      // Handle specific Base App audio errors
      if (isBaseApp) {
        if (error.name === 'NotAllowedError') {
          console.log('FocusSessionMusic: Base App autoplay blocked - user interaction required');
          // For Base App, we might need to wait for more user interaction
          return false;
        } else if (error.name === 'NotSupportedError') {
          console.log('FocusSessionMusic: Base App audio format not supported');
          onError?.('Audio format not supported in Base App');
          return false;
        }
      }
      
      // Handle general audio errors
      if (error.name === 'NotAllowedError') {
        console.log('FocusSessionMusic: Autoplay blocked - waiting for user interaction');
        return false;
      } else if (error.name === 'AbortError') {
        console.log('FocusSessionMusic: Audio play aborted');
        return false;
      }
      
      return false;
    }
  };

  // Single consolidated effect for play/pause control
  useEffect(() => {
    if (!isMounted || !isLoaded) return;
    
    const audio = audioRef.current;
    if (!audio) return;

    // Focus session music should only play when session is active AND focus session music is enabled
    const shouldPlay = isSessionActive && isFocusSessionPlaying;

    console.log('FocusSessionMusic: State changed', {
      isFocusSessionPlaying,
      isSessionActive,
      shouldPlay,
      isBaseApp,
      retryCount
    });

    if (shouldPlay && !isPlaying) {
      console.log('FocusSessionMusic: Attempting to play audio');
      
      // Attempt to play with retry logic for Base App
      const playAudio = async () => {
        const success = await attemptPlay(audio);
        
        if (!success && isBaseApp && retryCount < 3) {
          // Retry for Base App with exponential backoff
          const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
          console.log(`FocusSessionMusic: Retrying play in ${delay}ms for Base App (attempt ${retryCount + 1})`);
          
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, delay);
        }
      };
      
      playAudio();
    } else if (!shouldPlay && isPlaying) {
      console.log('FocusSessionMusic: Pausing audio');
      audio.pause();
      // Don't reset currentTime to allow resuming from where it left off
    }
  }, [isSessionActive, isFocusSessionPlaying, isLoaded, isMounted, isPlaying, isBaseApp, retryCount]);

  return (
    <div className="focus-session-audio-controls">
      <audio ref={audioRef} src={src} preload="metadata" />
      {/* Debug info for Base App */}
      {isBaseApp && (
        <div className="hidden">
          <p>Base App Audio Status: {isPlaying ? 'Playing' : 'Paused'}</p>
          <p>Retry Count: {retryCount}</p>
          <p>Loaded: {isLoaded ? 'Yes' : 'No'}</p>
        </div>
      )}
    </div>
  );
};

export default FocusSessionMusic;
