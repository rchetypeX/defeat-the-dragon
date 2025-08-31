import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { syncService } from './syncService';

interface BackgroundState {
  equippedBackground: string;
  setEquippedBackground: (backgroundId: string) => void;
  getBackgroundImage: (backgroundId: string) => string;
}

export const useBackgroundStore = create<BackgroundState>()(
  persist(
    (set, get) => ({
      equippedBackground: 'forest',
      
      setEquippedBackground: (backgroundId: string) => {
        set({ equippedBackground: backgroundId });
        // Removed auto-sync to prevent excessive API calls
        // Sync will be handled explicitly when needed
      },
      
      getBackgroundImage: (backgroundId: string) => {
        const backgroundImages = {
          forest: '/assets/images/forest-background.png?v=2',
          tundra: '/assets/images/tundra-background.png?v=2',
          underdark: '/assets/images/underdark-background.png?v=2',
          dungeon: '/assets/images/dungeon-background.png?v=2'
        };
        return backgroundImages[backgroundId as keyof typeof backgroundImages] || backgroundImages.forest;
      }
    }),
    {
      name: 'background-store'
    }
  )
);
