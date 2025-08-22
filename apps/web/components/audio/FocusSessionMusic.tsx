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
  const { focusSessionVolume, isFocusSessionPlaying, setSessionActive } = useAudio();

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

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
    };

    const handlePlay = () => {
      console.log('FocusSessionMusic: Audio started playing');
      setIsPlaying(true);
    };
    const handlePause = () => {
      console.log('FocusSessionMusic: Audio paused');
      setIsPlaying(false);
    };
    const handleError = () => {
      onError?.('Failed to load focus session audio file');
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
  }, [src, loop, onLoad, onError, isMounted]);

  // Handle session state changes and focus session music state
  useEffect(() => {
    if (!isMounted) return;
    
    const audio = audioRef.current;
    if (!audio || !isLoaded) return;

    // Focus session music should only play when session is active AND focus session music is enabled
    const shouldPlay = isSessionActive && isFocusSessionPlaying;

    if (shouldPlay && !isPlaying) {
      // Start playing when session becomes active and focus session music is enabled
      audio.play().catch(() => {
        console.log('Focus session music auto-play was blocked by browser');
      });
    } else if (!shouldPlay && isPlaying) {
      // Stop playing when session ends or focus session music is disabled
      audio.pause();
      // Don't reset currentTime to allow resuming from where it left off
    }
  }, [isSessionActive, isFocusSessionPlaying, isLoaded, isMounted]);

  // Handle manual play/pause controls for focus session music
  useEffect(() => {
    if (!isMounted) return;
    
    const audio = audioRef.current;
    if (!audio || !isLoaded) return;

    console.log('FocusSessionMusic: State changed - isFocusSessionPlaying:', isFocusSessionPlaying, 'isSessionActive:', isSessionActive);

    // If focus session music is disabled, pause the audio
    if (!isFocusSessionPlaying) {
      console.log('FocusSessionMusic: Pausing audio (focus session music disabled)');
      audio.pause();
    } else if (isSessionActive) {
      // If focus session music is enabled and session is active, play the audio
      console.log('FocusSessionMusic: Playing audio (focus session music enabled, session active)');
      audio.play().catch(() => {
        console.log('Focus session music play was blocked by browser');
      });
    }
  }, [isFocusSessionPlaying, isSessionActive, isLoaded, isMounted]);

  useEffect(() => {
    if (audioRef.current && isMounted) {
      audioRef.current.volume = focusSessionVolume;
    }
  }, [focusSessionVolume, isMounted]);

  const play = () => {
    audioRef.current?.play();
  };

  const pause = () => {
    audioRef.current?.pause();
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const setVolume = (newVolume: number) => {
    // This function is kept for compatibility but volume is now managed by context
    console.log('Focus session volume change requested:', newVolume);
  };

  return (
    <div className="focus-session-audio-controls">
      <audio ref={audioRef} src={src} preload="metadata" />
    </div>
  );
};

export default FocusSessionMusic;
