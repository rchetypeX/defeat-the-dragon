import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { syncService } from './syncService';
import { createClient } from '@supabase/supabase-js';

// Supabase client for SIWF users
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface BackgroundState {
  equippedBackground: string;
  setEquippedBackground: (backgroundId: string) => void;
  getBackgroundImage: (backgroundId: string) => string;
}

export const useBackgroundStore = create<BackgroundState>()(
  persist(
    (set, get) => ({
      equippedBackground: 'forest',
      
      setEquippedBackground: async (backgroundId: string) => {
        set({ equippedBackground: backgroundId });
        
        // Try to sync with database for SIWF users
        try {
          // Check if we have a SIWF user session
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            // Update user settings in database
            await supabase
              .from('user_settings')
              .upsert({
                user_id: user.id,
                equipped_background: backgroundId,
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'user_id'
              });
            
            console.log('✅ Background equipped and synced to database:', backgroundId);
          }
        } catch (error) {
          console.warn('⚠️ Could not sync background to database (may be wallet user):', error);
        }
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
