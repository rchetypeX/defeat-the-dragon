import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { syncService } from './syncService';
import { createClient } from '@supabase/supabase-js';

// Supabase client for SIWF users
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface CharacterState {
  equippedCharacter: string;
  setEquippedCharacter: (characterId: string) => void;
  getCharacterImage: (characterId: string) => string;
}

export const useCharacterStore = create<CharacterState>()(
  persist(
    (set, get) => ({
      equippedCharacter: 'fighter',
      
      setEquippedCharacter: async (characterId: string) => {
        set({ equippedCharacter: characterId });
        
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
                equipped_character: characterId,
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'user_id'
              });
            
            console.log('✅ Character equipped and synced to database:', characterId);
          }
        } catch (error) {
          console.warn('⚠️ Could not sync character to database (may be wallet user):', error);
        }
      },
      
      getCharacterImage: (characterId: string) => {
        const characterImages = {
            fighter: '/assets/sprites/fighter.png',
  wizard: '/assets/sprites/wizard.png',
  paladin: '/assets/sprites/paladin.png',
  rogue: '/assets/sprites/rogue.png'
        };
        return characterImages[characterId as keyof typeof characterImages] || characterImages.fighter;
      }
    }),
    {
      name: 'defeat-the-dragon-character-storage',
    }
  )
);
