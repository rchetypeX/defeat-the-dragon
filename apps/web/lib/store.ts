import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Player, Session, Inventory, Class, Action } from '@defeat-the-dragon/engine';
import { startSession, completeSession, getCurrentSession, getPlayerData } from './api';

interface GameState {
  // User state
  user: {
    id: string | null;
    email: string | null;
    isAuthenticated: boolean;
  };
  
  // Player data
  player: Player | null;
  
  // Current session
  currentSession: Session | null;
  
  // Game data
  inventory: Inventory[];
  classes: Class[];
  
  // Settings
  settings: {
    soundEnabled: boolean;
    notificationsEnabled: boolean;
    accessibility: {
      highContrast: boolean;
      dyslexiaFont: boolean;
      ttsEnabled: boolean;
    };
  };
  
  // Session progress (client-side only)
  sessionProgress: {
    sessionId: string | null;
    startTime: number | null;
    durationMinutes: number | null;
    elapsedSeconds: number;
    isActive: boolean;
    isDisturbed: boolean;
    disturbedSeconds: number;
  };
}

interface GameActions {
  // Authentication
  setUser: (user: { id: string; email: string } | null) => void;
  
  // Player data
  setPlayer: (player: Player) => void;
  updatePlayer: (updates: Partial<Player>) => void;
  loadPlayerData: () => Promise<void>;
  
  // Sessions
  setCurrentSession: (session: Session | null) => void;
  startSession: (action: Action, durationMinutes: number) => Promise<void>;
  completeSession: (outcome: 'success' | 'fail' | 'early_stop') => Promise<any>;
  stopSession: () => void;
  updateSessionProgress: (updates: Partial<GameState['sessionProgress']>) => void;
  
  // Inventory
  setInventory: (inventory: Inventory[]) => void;
  addToInventory: (item: Inventory) => void;
  updateInventoryItem: (id: string, updates: Partial<Inventory>) => void;
  
  // Classes
  setClasses: (classes: Class[]) => void;
  unlockClass: (classId: string) => void;
  
  // Settings
  updateSettings: (updates: Partial<GameState['settings']>) => void;
  
  // Reset
  resetGame: () => void;
}

const initialState: GameState = {
  user: {
    id: null,
    email: null,
    isAuthenticated: false,
  },
  player: null,
  currentSession: null,
  inventory: [],
  classes: [],
  settings: {
    soundEnabled: true,
    notificationsEnabled: true,
    accessibility: {
      highContrast: false,
      dyslexiaFont: false,
      ttsEnabled: false,
    },
  },
  sessionProgress: {
    sessionId: null,
    startTime: null,
    durationMinutes: null,
    elapsedSeconds: 0,
    isActive: false,
    isDisturbed: false,
    disturbedSeconds: 0,
  },
};

export const useGameStore = create<GameState & GameActions>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        setUser: (user) => set((state) => ({
          user: user ? {
            id: user.id,
            email: user.email,
            isAuthenticated: true,
          } : {
            id: null,
            email: null,
            isAuthenticated: false,
          },
        })),
        
        setPlayer: (player) => set({ player }),
        
        updatePlayer: (updates) => set((state) => ({
          player: state.player ? { ...state.player, ...updates } : null,
        })),
        
        loadPlayerData: async () => {
          try {
            console.log('Store: Loading player data...');
            const playerData = await getPlayerData();
            console.log('Store: Player data loaded:', playerData);
            if (playerData) {
              set({ player: playerData });
            }
          } catch (error) {
            console.error('Store: Failed to load player data:', error);
          }
        },
        
        setCurrentSession: (session) => set({ currentSession: session }),
        
        startSession: async (action: Action, durationMinutes: number) => {
          try {
            console.log('Store: Starting session with:', { action, durationMinutes });
            const response = await startSession({ action, duration_minutes: durationMinutes });
            console.log('Store: API response:', response);
            
            // Create a session object for the store
            const session: Session = {
              id: response.session_id,
              user_id: get().user.id!,
              action,
              started_at: new Date().toISOString(),
              disturbed_seconds: 0,
              dungeon_floor: 0,
              boss_tier: 'none'
            };
            
            console.log('Store: Created session object:', session);
            
            set({
              currentSession: session,
              sessionProgress: {
                sessionId: response.session_id,
                startTime: Date.now(),
                durationMinutes,
                elapsedSeconds: 0,
                isActive: true,
                isDisturbed: false,
                disturbedSeconds: 0,
              },
            });
            
            console.log('Store: Session state updated');
          } catch (error) {
            console.error('Store: Failed to start session:', error);
            throw error;
          }
        },
        
        stopSession: () => set((state) => ({
          currentSession: null,
          sessionProgress: {
            ...state.sessionProgress,
            isActive: false,
          },
        })),
        
        completeSession: async (outcome: 'success' | 'fail' | 'early_stop') => {
          try {
            const state = get();
            if (!state.currentSession || !state.sessionProgress.sessionId) {
              throw new Error('No active session to complete');
            }
            
            const actualDurationMinutes = Math.floor((Date.now() - state.sessionProgress.startTime!) / (1000 * 60));
            
            console.log('Completing session with:', {
              sessionId: state.currentSession.id,
              actualDurationMinutes,
              disturbedSeconds: state.sessionProgress.disturbedSeconds,
              outcome
            });
            
            const response = await completeSession({
              session_id: state.currentSession.id,
              actual_duration_minutes: actualDurationMinutes,
              disturbed_seconds: state.sessionProgress.disturbedSeconds,
              outcome
            });
            
            console.log('Session completion response:', response);
            
            // Update player data with rewards
            if (state.player) {
              console.log('Store: Updating player data with rewards:', {
                oldPlayer: state.player,
                rewards: {
                  xp_gained: response.xp_gained,
                  coins_gained: response.coins_gained,
                  sparks_gained: response.sparks_gained,
                  new_level: response.new_level,
                  new_streak: response.new_streak,
                }
              });
              
              set({
                player: {
                  ...state.player,
                  xp: state.player.xp + response.xp_gained,
                  coins: state.player.coins + response.coins_gained,
                  sparks: state.player.sparks + response.sparks_gained,
                  level: response.new_level,
                  day_streak: response.new_streak,
                },
                currentSession: null,
                sessionProgress: {
                  ...state.sessionProgress,
                  isActive: false,
                },
              });
              
              console.log('Store: Player data and session state updated');
            }
            
            return response;
          } catch (error) {
            console.error('Failed to complete session:', error);
            throw error;
          }
        },
        
        updateSessionProgress: (updates) => set((state) => ({
          sessionProgress: { ...state.sessionProgress, ...updates },
        })),
        
        setInventory: (inventory) => set({ inventory }),
        
        addToInventory: (item) => set((state) => ({
          inventory: [...state.inventory, item],
        })),
        
        updateInventoryItem: (id, updates) => set((state) => ({
          inventory: state.inventory.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        })),
        
        setClasses: (classes) => set({ classes }),
        
        unlockClass: (classId) => set((state) => ({
          classes: state.classes.map((cls) =>
            cls.class_id === classId ? { ...cls, unlocked: true } : cls
          ),
        })),
        
        updateSettings: (updates) => set((state) => ({
          settings: { ...state.settings, ...updates },
        })),
        
        resetGame: () => set(initialState),
      }),
      {
        name: 'defeat-the-dragon-storage',
        partialize: (state) => ({
          settings: state.settings,
          user: state.user,
        }),
      }
    ),
    {
      name: 'defeat-the-dragon-store',
    }
  )
);
