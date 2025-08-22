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
      // Don't automatically set background playing to true here
      // Let the user control it through the UI
    };
    const handlePause = () => {
      console.log('BackgroundMusic: Audio paused');
      setIsPlaying(false);
      // Don't automatically set background playing to false here
      // Let the user control it through the UI
    };
    const handleError = () => {
      onError?.('Failed to load audio file');
    };

    audio.addEventListener('loadeddata', handleLoad);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    // Auto-play if requested (only on client side)
    if (autoPlay && isMounted) {
      audio.play().catch(() => {
        // Auto-play might be blocked by browser
        console.log('Auto-play was blocked by browser');
      });
    }

    return () => {
      audio.removeEventListener('loadeddata', handleLoad);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
    };
  }, [src, loop, autoPlay, onLoad, onError, isMounted, backgroundVolume, setBackgroundPlaying]);

  useEffect(() => {
    if (audioRef.current && isMounted) {
      audioRef.current.volume = backgroundVolume;
    }
  }, [backgroundVolume, isMounted]);

  // Handle play/pause from context and session state
  useEffect(() => {
    if (!isMounted) return;
    
    const audio = audioRef.current;
    if (!audio) return;

    // Background music should only play when not in an active session AND background music is enabled
    const shouldPlay = isBackgroundPlaying && !isSessionActive;

    if (shouldPlay && !isPlaying) {
      audio.play().catch(() => {
        console.log('Background music play was blocked by browser');
      });
    } else if (!shouldPlay && isPlaying) {
      audio.pause();
    }
  }, [isBackgroundPlaying, isSessionActive, isPlaying, isMounted]);

  // Handle manual play/pause controls
  useEffect(() => {
    if (!isMounted) return;
    
    const audio = audioRef.current;
    if (!audio) return;

    console.log('BackgroundMusic: State changed - isBackgroundPlaying:', isBackgroundPlaying, 'isSessionActive:', isSessionActive);

    // If background music is disabled, pause the audio
    if (!isBackgroundPlaying) {
      console.log('BackgroundMusic: Pausing audio (background music disabled)');
      audio.pause();
    } else if (!isSessionActive) {
      // If background music is enabled and no session is active, play the audio
      console.log('BackgroundMusic: Playing audio (background music enabled, no session)');
      audio.play().catch(() => {
        console.log('Background music play was blocked by browser');
      });
    }
  }, [isBackgroundPlaying, isSessionActive, isMounted]);

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
    console.log('Background volume change requested:', newVolume);
  };

  return (
    <div className="audio-controls">
      <audio ref={audioRef} src={src} preload="metadata" />
    </div>
  );
};

export default BackgroundMusic;


