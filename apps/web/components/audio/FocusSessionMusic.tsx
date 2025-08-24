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
  }, [src, loop, onLoad, onError, isMounted, focusSessionVolume]);

  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current && isMounted) {
      audioRef.current.volume = focusSessionVolume;
    }
  }, [focusSessionVolume, isMounted]);

  // Single consolidated effect for play/pause control
  useEffect(() => {
    if (!isMounted || !isLoaded) return;
    
    const audio = audioRef.current;
    if (!audio) return;

    // Focus session music should only play when session is active AND focus session music is enabled
    const shouldPlay = isSessionActive && isFocusSessionPlaying;

    console.log('FocusSessionMusic: State changed - isFocusSessionPlaying:', isFocusSessionPlaying, 'isSessionActive:', isSessionActive, 'shouldPlay:', shouldPlay);

    if (shouldPlay && !isPlaying) {
      console.log('FocusSessionMusic: Attempting to play audio');
      audio.play().catch((error) => {
        console.log('Focus session music play was blocked:', error.message);
        // Don't retry if autoplay is blocked
        if (error.name === 'NotAllowedError') {
          console.log('Focus session autoplay blocked - waiting for user interaction');
        }
      });
    } else if (!shouldPlay && isPlaying) {
      console.log('FocusSessionMusic: Pausing audio');
      audio.pause();
      // Don't reset currentTime to allow resuming from where it left off
    }
  }, [isSessionActive, isFocusSessionPlaying, isLoaded, isMounted, isPlaying]);

  return (
    <div className="focus-session-audio-controls">
      <audio ref={audioRef} src={src} preload="metadata" />
    </div>
  );
};

export default FocusSessionMusic;
