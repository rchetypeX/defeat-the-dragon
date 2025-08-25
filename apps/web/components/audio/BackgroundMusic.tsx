'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAudio } from '../../contexts/AudioContext';

interface BackgroundMusicProps {
  src: string;
  volume?: number;
  loop?: boolean;
  autoPlay?: boolean;
  onLoad?: () => void;
  onError?: (error: string) => void;
}

export const BackgroundMusic: React.FC<BackgroundMusicProps> = ({
  src,
  volume = 0.5,
  loop = true,
  autoPlay = false,
  onLoad,
  onError
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { backgroundVolume, isBackgroundPlaying, setBackgroundPlaying, isSessionActive } = useAudio();

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
    audio.volume = backgroundVolume;
    audio.loop = loop;

    // Event listeners
    const handleLoad = () => {
      setIsPlaying(false);
      setBackgroundPlaying(false);
      onLoad?.();
    };

    const handlePlay = () => {
      console.log('BackgroundMusic: Audio started playing');
      setIsPlaying(true);
    };
    
    const handlePause = () => {
      console.log('BackgroundMusic: Audio paused');
      setIsPlaying(false);
    };
    
    const handleError = () => {
      onError?.('Failed to load audio file');
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
  }, [src, loop, onLoad, onError, isMounted, backgroundVolume, setBackgroundPlaying]);

  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current && isMounted) {
      audioRef.current.volume = backgroundVolume;
    }
  }, [backgroundVolume, isMounted]);

  // Single consolidated effect for play/pause control
  useEffect(() => {
    if (!isMounted) return;
    
    const audio = audioRef.current;
    if (!audio) return;

    // Background music should only play when:
    // 1. Background music is enabled (user clicked the toggle)
    // 2. No session is active
    const shouldPlay = isBackgroundPlaying && !isSessionActive;

    console.log('BackgroundMusic: State changed - isBackgroundPlaying:', isBackgroundPlaying, 'isSessionActive:', isSessionActive, 'shouldPlay:', shouldPlay);

    if (shouldPlay && !isPlaying) {
      console.log('BackgroundMusic: Attempting to play audio (user enabled via toggle)');
      audio.play().catch((error) => {
        console.log('Background music play was blocked:', error.message);
        // If autoplay is blocked, update the state to reflect that it's not playing
        if (error.name === 'NotAllowedError') {
          console.log('Autoplay blocked - user needs to click sound toggle');
          setBackgroundPlaying(false);
        }
      });
    } else if (!shouldPlay && isPlaying) {
      console.log('BackgroundMusic: Pausing audio');
      audio.pause();
    }
  }, [isBackgroundPlaying, isSessionActive, isPlaying, isMounted, setBackgroundPlaying]);

  return (
    <div className="audio-controls">
      <audio ref={audioRef} src={src} preload="metadata" />
    </div>
  );
};

export default BackgroundMusic;


