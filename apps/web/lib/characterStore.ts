import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { syncService } from './syncService';

interface CharacterState {
  equippedCharacter: string;
  setEquippedCharacter: (characterId: string) => void;
  getCharacterImage: (characterId: string) => string;
}

export const useCharacterStore = create<CharacterState>()(
  persist(
    (set, get) => ({
      equippedCharacter: 'fighter',
      
      setEquippedCharacter: (characterId: string) => {
        set({ equippedCharacter: characterId });
        // Auto-sync character changes
        syncService.syncSettings();
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
