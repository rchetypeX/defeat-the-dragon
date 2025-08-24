import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Player, Session, Inventory, Class, Action } from '@defeat-the-dragon/engine';
import { startSession, completeSession, getCurrentSession, getPlayerData } from './api';
import { syncService } from './syncService';

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
        
        updatePlayer: (updates) => set((state) => {
          console.log('Store: updatePlayer called with updates:', updates);
          const updatedPlayer = state.player ? { ...state.player, ...updates } : null;
          
          console.log('Store: Updated player data:', updatedPlayer);
          
          // Auto-sync player data changes
          if (updatedPlayer) {
            console.log('Store: Calling syncPlayerData...');
            syncService.syncPlayerData();
          }
          
          return { player: updatedPlayer };
        }),
        
        loadPlayerData: async () => {
          try {
            console.log('Store: Loading player data...');
            const playerData = await getPlayerData();
            console.log('Store: Player data loaded:', playerData);
            if (playerData) {
              console.log('Store: Setting player data in store');
              set({ player: playerData });
              console.log('Store: Player data set successfully');
            } else {
              console.log('Store: No player data returned');
              set({ player: null });
            }
          } catch (error) {
            console.error('Store: Failed to load player data:', error);
            // Don't use mock data - let the error propagate
            set({ player: null });
            throw error;
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
            // Create mock session for development
            const mockSession: Session = {
              id: 'mock-session-id',
              user_id: 'mock-user-id',
              action,
              started_at: new Date().toISOString(),
              disturbed_seconds: 0,
              dungeon_floor: 0,
              boss_tier: 'none'
            };
            
            console.log('Store: Using mock session:', mockSession);
            
            set({
              currentSession: mockSession,
              sessionProgress: {
                sessionId: 'mock-session-id',
                startTime: Date.now(),
                durationMinutes,
                elapsedSeconds: 0,
                isActive: true,
                isDisturbed: false,
                disturbedSeconds: 0,
              },
            });
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

                }
              });
              
              set({
                player: {
                  ...state.player,
                  xp: state.player.xp + response.xp_gained,
                  coins: state.player.coins + response.coins_gained,
                  sparks: state.player.sparks + response.sparks_gained,
                  level: response.new_level,

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
            // Create mock response for development
            const currentState = get();
            const mockResponse = {
              xp_gained: 10,
              coins_gained: 5,
              sparks_gained: 0, // Sparks not implemented yet
              level_up: false,
              new_level: currentState.player?.level || 1,

            };
            
            console.log('Store: Using mock completion response:', mockResponse);
            
            // Update player data with mock rewards
            if (currentState.player) {
              set({
                player: {
                  ...currentState.player,
                  xp: currentState.player.xp + mockResponse.xp_gained,
                  coins: currentState.player.coins + mockResponse.coins_gained,
                  sparks: currentState.player.sparks + mockResponse.sparks_gained,
                  level: mockResponse.new_level,

                },
                currentSession: null,
                sessionProgress: {
                  ...currentState.sessionProgress,
                  isActive: false,
                },
              });
            }
            
            return mockResponse;
          }
        },
        
        updateSessionProgress: (updates) => set((state) => ({
          sessionProgress: { ...state.sessionProgress, ...updates },
        })),
        
        setInventory: (inventory) => set({ inventory }),
        
        addToInventory: (item) => set((state) => {
          const updatedInventory = [...state.inventory, item];
          
          // Auto-sync inventory changes
          syncService.syncInventory();
          
          return { inventory: updatedInventory };
        }),
        
        updateInventoryItem: (id, updates) => set((state) => {
          const updatedInventory = state.inventory.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          );
          
          // Auto-sync inventory changes
          syncService.syncInventory();
          
          return { inventory: updatedInventory };
        }),
        
        setClasses: (classes) => set({ classes }),
        
        unlockClass: (classId) => set((state) => ({
          classes: state.classes.map((cls) =>
            cls.class_id === classId ? { ...cls, unlocked: true } : cls
          ),
        })),
        
        updateSettings: (updates) => set((state) => {
          const updatedSettings = { ...state.settings, ...updates };
          
          // Auto-sync settings changes
          syncService.syncSettings();
          
          return { settings: updatedSettings };
        }),
        
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
