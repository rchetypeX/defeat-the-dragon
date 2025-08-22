'use client';

import { useEffect, useRef, useState } from 'react';

interface AudioTrack {
  id: string;
  src: string;
  volume: number;
  loop: boolean;
}

interface AudioManagerProps {
  tracks: AudioTrack[];
  currentTrackId?: string;
  onTrackChange?: (trackId: string) => void;
  globalVolume?: number;
  isMuted?: boolean;
}

export const AudioManager: React.FC<AudioManagerProps> = ({
  tracks,
  currentTrackId,
  onTrackChange,
  globalVolume = 1.0,
  isMuted = false
}) => {
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
  const [currentTrack, setCurrentTrack] = useState<string | undefined>(currentTrackId);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize audio elements for all tracks
  useEffect(() => {
    if (!isMounted) return;
    
    tracks.forEach(track => {
      if (!audioRefs.current[track.id]) {
        const audio = new Audio(track.src);
        audio.loop = track.loop;
        audio.volume = track.volume * globalVolume * (isMuted ? 0 : 1);
        audio.preload = 'metadata';
        audioRefs.current[track.id] = audio;
      }
    });

    return () => {
      // Cleanup audio elements
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
      });
      audioRefs.current = {};
    };
  }, [tracks, isMounted]);

  // Handle track changes
  useEffect(() => {
    if (!isMounted) return;
    
    if (currentTrackId && currentTrackId !== currentTrack) {
      // Stop current track
      if (currentTrack && audioRefs.current[currentTrack]) {
        audioRefs.current[currentTrack]?.pause();
      }

      // Start new track
      if (audioRefs.current[currentTrackId]) {
        audioRefs.current[currentTrackId]?.play().catch(() => {
          console.log('Auto-play was blocked by browser');
        });
        setCurrentTrack(currentTrackId);
        setIsPlaying(true);
        onTrackChange?.(currentTrackId);
      }
    }
  }, [currentTrackId, currentTrack, onTrackChange, isMounted]);

  // Handle global volume changes
  useEffect(() => {
    if (!isMounted) return;
    
    Object.values(audioRefs.current).forEach(audio => {
      if (audio) {
        const track = tracks.find(t => t.src === audio.src);
        if (track) {
          audio.volume = track.volume * globalVolume * (isMuted ? 0 : 1);
        }
      }
    });
  }, [globalVolume, isMuted, tracks, isMounted]);

  // Play a specific track
  const playTrack = (trackId: string) => {
    if (audioRefs.current[trackId]) {
      // Stop all other tracks
      Object.entries(audioRefs.current).forEach(([id, audio]) => {
        if (id !== trackId && audio) {
          audio.pause();
        }
      });

      // Start the selected track
      audioRefs.current[trackId]?.play().catch(() => {
        console.log('Play was blocked by browser');
      });
      setCurrentTrack(trackId);
      setIsPlaying(true);
      onTrackChange?.(trackId);
    }
  };

  // Stop all tracks
  const stopAll = () => {
    Object.values(audioRefs.current).forEach(audio => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    setCurrentTrack(undefined);
    setIsPlaying(false);
  };

  // Pause current track
  const pause = () => {
    if (currentTrack && audioRefs.current[currentTrack]) {
      audioRefs.current[currentTrack]?.pause();
      setIsPlaying(false);
    }
  };

  // Resume current track
  const resume = () => {
    if (currentTrack && audioRefs.current[currentTrack]) {
      audioRefs.current[currentTrack]?.play().catch(() => {
        console.log('Resume was blocked by browser');
      });
      setIsPlaying(true);
    }
  };

  return (
    <div className="audio-manager">
      {/* Hidden audio elements */}
      {tracks.map(track => (
        <audio
          key={track.id}
          ref={(el) => {
            if (el) audioRefs.current[track.id] = el;
          }}
          src={track.src}
          preload="metadata"
        />
      ))}
      
      {/* Development controls */}
      {process.env.NODE_ENV === 'development' && isMounted && (
        <div className="fixed top-4 right-4 bg-black/80 text-white p-3 rounded-lg text-sm border border-gray-600">
          <div className="font-semibold mb-2">🎵 Audio Manager</div>
          
          <div className="space-y-2">
            {tracks.map(track => (
              <button
                key={track.id}
                onClick={() => playTrack(track.id)}
                className={`block w-full text-left px-2 py-1 rounded text-xs ${
                  currentTrack === track.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
              >
                {track.id} {currentTrack === track.id && isPlaying ? '▶️' : ''}
              </button>
            ))}
          </div>
          
          <div className="flex gap-2 mt-3">
            <button
              onClick={isPlaying ? pause : resume}
              className="px-2 py-1 bg-green-600 rounded hover:bg-green-700 text-xs"
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            <button
              onClick={stopAll}
              className="px-2 py-1 bg-red-600 rounded hover:bg-red-700 text-xs"
            >
              ⏹️
            </button>
          </div>
          
          <div className="text-xs text-gray-300 mt-2">
            Current: {currentTrack || 'None'} | Playing: {isPlaying ? 'Yes' : 'No'}
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioManager;
