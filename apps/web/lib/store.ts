import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Player, Session, Inventory, Class, Action } from '@defeat-the-dragon/engine';
import { startSession, completeSession, getCurrentSession, getPlayerData } from './api';
import { syncService } from './syncService';

// Helper function to calculate fallback rewards based on session rewards table
function calculateFallbackRewards(durationMinutes: number, currentLevel: number) {
  // Session type mapping based on duration
  let sessionType: string;
  if (durationMinutes >= 5 && durationMinutes <= 15) sessionType = 'Train';
  else if (durationMinutes >= 16 && durationMinutes <= 30) sessionType = 'Eat';
  else if (durationMinutes >= 31 && durationMinutes <= 45) sessionType = 'Learn';
  else if (durationMinutes >= 46 && durationMinutes <= 60) sessionType = 'Bathe';
  else if (durationMinutes >= 61 && durationMinutes <= 75) sessionType = 'Sleep';
  else if (durationMinutes >= 76 && durationMinutes <= 90) sessionType = 'Maintain';
  else if (durationMinutes >= 91 && durationMinutes <= 105) sessionType = 'Fight';
  else if (durationMinutes >= 106 && durationMinutes <= 120) sessionType = 'Adventure';
  else sessionType = 'Train'; // Fallback

  // Find the closest duration match (equal or next lower duration)
  const durationRanges = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120];
  const closestDuration = durationRanges
    .filter(d => d <= durationMinutes)
    .sort((a, b) => b - a)[0] || 5;

  // Session rewards table (matching the database)
  const rewardsTable: Record<string, Record<number, {xp: number, coins: number, sparks: number}>> = {
    'Train': {
      5: {xp: 5, coins: 3, sparks: 0},
      10: {xp: 10, coins: 6, sparks: 0},
      15: {xp: 16, coins: 9, sparks: 1}
    },
    'Eat': {
      20: {xp: 22, coins: 13, sparks: 1},
      25: {xp: 28, coins: 16, sparks: 1},
      30: {xp: 34, coins: 20, sparks: 2}
    },
    'Learn': {
      35: {xp: 41, coins: 24, sparks: 2},
      40: {xp: 48, coins: 28, sparks: 2},
      45: {xp: 55, coins: 33, sparks: 3}
    },
    'Bathe': {
      50: {xp: 62, coins: 37, sparks: 3},
      55: {xp: 70, coins: 42, sparks: 3},
      60: {xp: 78, coins: 46, sparks: 4}
    },
    'Sleep': {
      65: {xp: 86, coins: 51, sparks: 4},
      70: {xp: 94, coins: 56, sparks: 4},
      75: {xp: 103, coins: 61, sparks: 5}
    },
    'Maintain': {
      80: {xp: 112, coins: 67, sparks: 5},
      85: {xp: 121, coins: 72, sparks: 5},
      90: {xp: 130, coins: 78, sparks: 6}
    },
    'Fight': {
      95: {xp: 140, coins: 84, sparks: 6},
      100: {xp: 150, coins: 90, sparks: 6},
      105: {xp: 158, coins: 94, sparks: 7}
    },
    'Adventure': {
      110: {xp: 165, coins: 99, sparks: 7},
      115: {xp: 172, coins: 103, sparks: 7},
      120: {xp: 180, coins: 108, sparks: 8}
    }
  };

  const rewards = rewardsTable[sessionType]?.[closestDuration] || {xp: 5, coins: 3, sparks: 0};
  
  return {
    xp_gained: rewards.xp,
    coins_gained: rewards.coins,
    sparks_gained: rewards.sparks,
    level_up: false,
    new_level: currentLevel,
  };
}

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
  
  // Force refresh player data from database
  refreshPlayerData: () => Promise<void>;
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
          
          // Online-first: Sync critical player data changes immediately
          if (updatedPlayer) {
            console.log('Store: Player data updated locally - sync will be handled explicitly');
            // Removed auto-sync to prevent excessive API calls
            // Sync will be handled by components when explicitly needed
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
              started_at: new Date().toISOString()
              // disturbed_seconds, dungeon_floor, boss_tier removed as part of database cleanup
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
              started_at: new Date().toISOString()
              // disturbed_seconds, dungeon_floor, boss_tier removed as part of database cleanup
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
            
            console.log('Store: Completing session with:', {
              sessionId: state.currentSession.id,
              actualDurationMinutes,
              disturbedSeconds: state.sessionProgress.disturbedSeconds,
              outcome,
              playerExists: !!state.player
            });
            
            // Try to complete session via API first
            let response;
            try {
              response = await completeSession({
                session_id: state.currentSession.id,
                actual_duration_minutes: actualDurationMinutes,
                outcome
              });
              console.log('Store: Session completion API response:', response);
            } catch (apiError) {
              console.warn('Store: API call failed, using fallback completion:', apiError);
              
              // Create fallback response using the correct session rewards table
              const fallbackResponse = calculateFallbackRewards(actualDurationMinutes, state.player?.level || 1);
              
              response = fallbackResponse;
              console.log('Store: Using fallback completion response:', fallbackResponse);
            }
            
            // Update player data with rewards
            if (state.player) {
              console.log('Store: Updating player data with rewards:', {
                oldPlayer: {
                  xp: state.player.xp,
                  coins: state.player.coins,
                  sparks: state.player.sparks,
                  level: state.player.level
                },
                rewards: {
                  xp_gained: response.xp_gained,
                  coins_gained: response.coins_gained,
                  sparks_gained: response.sparks_gained,
                  new_level: response.new_level,
                }
              });
              
              const updatedPlayer = {
                ...state.player,
                xp: state.player.xp + response.xp_gained,
                coins: state.player.coins + response.coins_gained,
                sparks: state.player.sparks + response.sparks_gained,
                level: response.new_level,
              };
              
              console.log('Store: New player data:', updatedPlayer);
              
              // Update state with new player data and clear session
              set({
                player: updatedPlayer,
                currentSession: null,
                sessionProgress: {
                  ...state.sessionProgress,
                  isActive: false,
                  sessionId: null,
                  startTime: null,
                  durationMinutes: 0,
                  elapsedSeconds: 0,
                  isDisturbed: false,
                  disturbedSeconds: 0,
                },
              });
              
              console.log('Store: Player data and session state updated successfully');
              
              // Try to sync updated player data to database
              try {
                if (typeof window !== 'undefined') {
                  // Store updated player data in localStorage for persistence
                  const playerData = {
                    ...updatedPlayer,
                    updated_at: new Date().toISOString()
                  };
                  localStorage.setItem('playerData', JSON.stringify(playerData));
                  console.log('Store: Player data saved to localStorage');
                }
              } catch (syncError) {
                console.warn('Store: Failed to sync player data to localStorage:', syncError);
              }
            } else {
              console.warn('Store: No player data available, only clearing session state');
            }
            
            // Always clear session state regardless of player update success
            set((state) => ({
              currentSession: null,
              sessionProgress: {
                ...state.sessionProgress,
                isActive: false,
                sessionId: null,
                startTime: null,
                durationMinutes: 0,
                elapsedSeconds: 0,
                isDisturbed: false,
                disturbedSeconds: 0,
              },
            }));
            
            console.log('Store: Session completion finished successfully');
            return response;
          } catch (error) {
            console.error('Store: Failed to complete session:', error);
            
            // Force cleanup on error to prevent stuck state
            const currentState = get();
            set({
              currentSession: null,
              sessionProgress: {
                ...currentState.sessionProgress,
                isActive: false,
                sessionId: null,
                startTime: null,
                durationMinutes: 0,
                elapsedSeconds: 0,
                isDisturbed: false,
                disturbedSeconds: 0,
              },
            });
            
            // Create mock response for development
            const mockResponse = {
              xp_gained: 10,
              coins_gained: 5,
              sparks_gained: 0,
              level_up: false,
              new_level: currentState.player?.level || 1,
            };
            
            console.log('Store: Using mock completion response due to error:', mockResponse);
            return mockResponse;
          }
        },
        
        updateSessionProgress: (updates) => set((state) => ({
          sessionProgress: { ...state.sessionProgress, ...updates },
        })),
        
        setInventory: (inventory) => set({ inventory }),
        
        addToInventory: (item) => set((state) => {
          const updatedInventory = [...state.inventory, item];
          
          // Removed auto-sync to prevent excessive API calls
          // Sync will be handled explicitly when needed
          
          return { inventory: updatedInventory };
        }),
        
        updateInventoryItem: (id, updates) => set((state) => {
          const updatedInventory = state.inventory.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          );
          
          // Removed auto-sync to prevent excessive API calls
          // Sync will be handled explicitly when needed
          
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
          
          // Removed auto-sync to prevent excessive API calls
          // Sync will be handled explicitly when needed
          
          return { settings: updatedSettings };
        }),
        
        resetGame: () => set(initialState),
        
        refreshPlayerData: async () => {
          try {
            console.log('Store: Force refreshing player data from database...');
            // Clear current player data to force reload
            set({ player: null });
            
            // Load fresh data from database
            await get().loadPlayerData();
            console.log('Store: Player data refreshed successfully');
          } catch (error) {
            console.error('Store: Failed to refresh player data:', error);
            throw error;
          }
        },
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
