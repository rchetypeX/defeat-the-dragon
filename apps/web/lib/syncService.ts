import { useGameStore } from './store';
import { useCharacterStore } from './characterStore';
import { useBackgroundStore } from './backgroundStore';
import { supabase } from './supabase';

// Import the apiRequest function for proper authentication
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  console.log('SyncService: Making API request to:', endpoint);
  
  // Get auth token
  let token: string | null = null;
  
  // Check if we have a wallet user in localStorage
  if (typeof window !== 'undefined') {
    const walletUserStr = localStorage.getItem('walletUser');
    if (walletUserStr) {
      try {
        const walletUser = JSON.parse(walletUserStr);
        token = `wallet:${JSON.stringify(walletUser)}`;
        console.log('SyncService: Found wallet user token');
      } catch (e) {
        console.error('SyncService: Error parsing wallet user:', e);
      }
    }
  }
  
  // Check if we have a Base App user in localStorage
  if (!token && typeof window !== 'undefined') {
    const baseAppUserStr = localStorage.getItem('baseAppUser');
    if (baseAppUserStr) {
      try {
        const baseAppUser = JSON.parse(baseAppUserStr);
        token = `baseapp:${JSON.stringify(baseAppUser)}`;
        console.log('SyncService: Found Base App user token');
      } catch (e) {
        console.error('SyncService: Error parsing Base App user:', e);
      }
    }
  }
  
  // If no wallet token, try to get Supabase session
  if (!token && typeof window !== 'undefined') {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      token = session.access_token;
      console.log('SyncService: Found Supabase session token');
    } else {
      console.log('SyncService: No Supabase session found');
    }
  }

  console.log('SyncService: Token available:', !!token);
  console.log('SyncService: Token type:', token ? (token.startsWith('wallet:') ? 'wallet' : token.startsWith('baseapp:') ? 'baseapp' : 'supabase') : 'none');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    // For Supabase tokens, use 'Bearer' prefix
    if (!token.startsWith('wallet:') && !token.startsWith('baseapp:')) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      // For wallet and Base App tokens, use the custom format
      headers['Authorization'] = token;
    }
  }

  console.log('SyncService: Making fetch request with headers:', Object.keys(headers));

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  console.log('SyncService: Response status:', response.status);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('SyncService: Request failed:', errorData);
    throw new Error(errorData.error || `API request failed: ${response.status}`);
  }

  const data = await response.json();
  console.log('SyncService: Request successful');
  return data;
}

export interface SyncData {
  player?: {
    display_name?: string;
    level?: number;
    xp?: number;
    coins?: number;
    sparks?: number;
  };
  settings?: {
    sound_enabled?: boolean;
    notifications_enabled?: boolean;
    accessibility?: {
      highContrast: boolean;
      dyslexiaFont: boolean;
      ttsEnabled: boolean;
    };
    equipped_character?: string;
    equipped_background?: string;
  };
  inventory?: Array<{
    item_id: string;
    item_type: 'cosmetic' | 'pet' | 'trinket' | 'character' | 'background';
    quantity: number;
    equipped: boolean;
  }>;
}

export interface FocusSessionData {
  duration: number; // in seconds
  completed: boolean;
  xp_earned: number;
  coins_earned: number;
  sparks_earned: number;
  session_type: 'focus' | 'break';
  completed_at: string;
}

export interface SyncResult {
  success: boolean;
  data?: {
    player: any;
    settings: any;
    inventory: any[];
  };
  results?: any;
  error?: string;
}

class SyncService {
  /**
   * Load all user data from database using bootstrap endpoint
   */
  async loadUserData(): Promise<SyncResult> {
    try {
      console.log('SyncService: Loading user data from bootstrap endpoint...');
      const response = await apiRequest<any>('/bootstrap');
      
      if (response) {
        console.log('SyncService: Received bootstrap data:', response);
        
        // Don't override local changes that haven't been synced yet
        // BUT: If the user has set their name and it's in the database, use the database value
        const currentPlayer = useGameStore.getState().player;
        if (currentPlayer && currentPlayer.display_name && 
            response.player && response.player.display_name !== currentPlayer.display_name) {
          
          // Check if this is a case where the user has already set their name
          // If the database has a real name (not 'Adventurer' or 'Player_XXXXX'), use it
          const databaseName = response.player.display_name;
          const isDatabaseNameReal = databaseName && 
            databaseName !== 'Adventurer' && 
            !databaseName.startsWith('Player_') &&
            databaseName.length > 2;
          
          if (isDatabaseNameReal) {
            console.log('SyncService: Database has real name, using it:', databaseName);
            // Use the database name and update local store
            currentPlayer.display_name = databaseName;
            currentPlayer.needsAdventurerName = false;
            useGameStore.getState().setPlayer(currentPlayer);
          } else {
            console.log('SyncService: Preserving local display name change:', currentPlayer.display_name);
            response.player.display_name = currentPlayer.display_name;
          }
        }
        
        this.updateLocalStoresFromBootstrap(response);
        return {
          success: true,
          data: response
        };
      }

      return {
        success: false,
        error: 'No data received from bootstrap'
      };
    } catch (error) {
      console.error('Failed to load user data from bootstrap:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Save user data to database (online-first)
   */
  async saveUserData(syncData?: SyncData): Promise<SyncResult> {
    try {
      const dataToSync = syncData || this.collectLocalData();
      console.log('SyncService: Saving user data to database:', dataToSync);
      
      // Filter out any fields that might not exist in the database
      // This prevents errors with removed fields like current_streak, bond_score, etc.
      if (dataToSync.player) {
        const filteredPlayer: any = {};
        const validFields = ['display_name', 'level', 'xp', 'coins', 'sparks'];
        
        validFields.forEach(field => {
          if (dataToSync.player![field as keyof typeof dataToSync.player] !== undefined) {
            filteredPlayer[field] = dataToSync.player![field as keyof typeof dataToSync.player];
          }
        });
        
        dataToSync.player = filteredPlayer;
        console.log('SyncService: Filtered player data for sync:', filteredPlayer);
      }
      
      const response = await apiRequest<SyncResult>('/user/sync', {
        method: 'POST',
        body: JSON.stringify(dataToSync),
      });

      return response;
    } catch (error) {
      console.error('Failed to save user data:', error);
      
      // Provide more specific error messages for common issues
      if (error instanceof Error) {
        if (error.message.includes('current_streak') || 
            error.message.includes('bond_score') || 
            error.message.includes('mood_state') || 
            error.message.includes('day_streak')) {
          console.warn('SyncService: Attempted to sync removed fields, filtering them out');
          // Try again with filtered data
          return this.saveUserData(syncData);
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Save focus session completion (successful sessions only)
   * Note: This is a simplified sync for successful sessions only
   * The actual session completion is handled by the existing session system
   */
  async saveFocusSession(sessionData: FocusSessionData): Promise<SyncResult> {
    try {
      console.log('SyncService: Syncing successful focus session data:', sessionData);
      
      // For successful sessions, we just need to sync the updated player data
      // The session completion itself is already handled by the existing session system
      const gameStore = useGameStore.getState();
      if (gameStore.player) {
        // Sync the updated player data to database
        const result = await this.saveUserData();
        console.log('SyncService: Player data synced after successful session');
        return result;
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to sync focus session data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Collect all local data from stores
   */
  collectLocalData(): SyncData {
    const gameStore = useGameStore.getState();
    const characterStore = useCharacterStore.getState();
    const backgroundStore = useBackgroundStore.getState();

    const syncData: SyncData = {};

    // Player data - only include fields that exist in the current database schema
    if (gameStore.player) {
      syncData.player = {
        display_name: gameStore.player.display_name,
        level: gameStore.player.level,
        xp: gameStore.player.xp,
        coins: gameStore.player.coins,
        sparks: gameStore.player.sparks,
        // Explicitly exclude removed fields to prevent sync errors
        // bond_score, mood_state, day_streak, current_streak are removed
      };
    }

    // Settings data
    syncData.settings = {
      sound_enabled: gameStore.settings.soundEnabled,
      notifications_enabled: gameStore.settings.notificationsEnabled,
      accessibility: gameStore.settings.accessibility,
      equipped_character: characterStore.equippedCharacter,
      equipped_background: backgroundStore.equippedBackground,
    };

    // Inventory data
    if (gameStore.inventory.length > 0) {
      syncData.inventory = gameStore.inventory.map(item => ({
        item_id: item.sku,
        item_type: item.type as any,
        quantity: item.qty,
        equipped: item.equipped,
      }));
    }

    return syncData;
  }

  /**
   * Update local stores with data from bootstrap endpoint
   */
  private updateLocalStoresFromBootstrap(data: any) {
    const gameStore = useGameStore.getState();
    const characterStore = useCharacterStore.getState();
    const backgroundStore = useBackgroundStore.getState();

    // Update player data
    if (data.player) {
      console.log('SyncService: Updating local stores with bootstrap data:', data.player);
      
      gameStore.setPlayer(data.player);
      
      // Verify the player data was set correctly
      const updatedPlayer = useGameStore.getState().player;
      console.log('SyncService: Player data after setPlayer:', updatedPlayer);
    }

    // Update equipped character and background
    if (data.equipped) {
      if (data.equipped.character_sku) {
        characterStore.setEquippedCharacter(data.equipped.character_sku);
        console.log('SyncService: Updated equipped character to:', data.equipped.character_sku);
      }
      if (data.equipped.background_sku) {
        backgroundStore.setEquippedBackground(data.equipped.background_sku);
        console.log('SyncService: Updated equipped background to:', data.equipped.background_sku);
      }
    }

    // Update inventory (only IDs and equipped status)
    if (data.inventory_ids && Array.isArray(data.inventory_ids)) {
      const inventoryItems = data.inventory_ids.map((item: any) => ({
        sku: item.id,
        type: item.type,
        qty: 1, // Default quantity for owned items
        equipped: item.equipped,
      }));
      gameStore.setInventory(inventoryItems);
      console.log('SyncService: Updated inventory with', inventoryItems.length, 'items');
    }
  }

  /**
   * Update local stores with data from database
   */
  private updateLocalStores(data: any) {
    const gameStore = useGameStore.getState();
    const characterStore = useCharacterStore.getState();
    const backgroundStore = useBackgroundStore.getState();

    // Update player data - only include fields that exist in the current schema
    if (data.player) {
      console.log('SyncService: Updating local stores with data:', data.player);
      
      // Filter out any removed fields to prevent sync errors
      const filteredPlayerData: any = {};
      const validFields = ['display_name', 'level', 'xp', 'coins', 'sparks', 'wallet_address', 'is_inspired'];
      
      validFields.forEach(field => {
        if (data.player[field] !== undefined) {
          filteredPlayerData[field] = data.player[field];
        }
      });
      
      console.log('SyncService: Filtered player data for local update:', filteredPlayerData);
      
      gameStore.setPlayer(filteredPlayerData);
      
      // Verify the player data was set correctly
      const updatedPlayer = useGameStore.getState().player;
      console.log('SyncService: Player data after setPlayer:', updatedPlayer);
    }

    // Update settings
    if (data.settings) {
      gameStore.updateSettings({
        soundEnabled: data.settings.sound_enabled,
        notificationsEnabled: data.settings.notifications_enabled,
        accessibility: data.settings.accessibility,
      });

      // Update character and background
      if (data.settings.equipped_character) {
        characterStore.setEquippedCharacter(data.settings.equipped_character);
      }
      if (data.settings.equipped_background) {
        backgroundStore.setEquippedBackground(data.settings.equipped_background);
      }
    }

    // Update inventory
    if (data.inventory && Array.isArray(data.inventory)) {
      const inventoryItems = data.inventory.map((item: any) => ({
        sku: item.item_id,
        type: item.item_type,
        qty: item.quantity,
        equipped: item.equipped,
      }));
      gameStore.setInventory(inventoryItems);
    }
  }

  /**
   * Clean up any old cached sync data that might contain removed fields
   */
  cleanupOldSyncData() {
    try {
      // Clear any old localStorage data that might contain removed fields
      if (typeof window !== 'undefined') {
        const keysToCheck = [
          'defeat-the-dragon-storage',
          'defeat-the-dragon-store',
          'defeat-the-dragon-character-storage',
          'background-store'
        ];
        
        keysToCheck.forEach(key => {
          const data = localStorage.getItem(key);
          if (data) {
            try {
              const parsed = JSON.parse(data);
              // If the data contains removed fields, clear it
              if (parsed.state && parsed.state.player) {
                const player = parsed.state.player;
                if (player.bond_score !== undefined || 
                    player.mood_state !== undefined || 
                    player.day_streak !== undefined ||
                    player.current_streak !== undefined) {
                  console.log('SyncService: Clearing old sync data with removed fields:', key);
                  localStorage.removeItem(key);
                }
              }
            } catch (e) {
              console.warn('SyncService: Error parsing cached data:', e);
            }
          }
        });
      }
    } catch (error) {
      console.warn('SyncService: Error during cleanup:', error);
    }
  }
}

// Export singleton instance
export const syncService = new SyncService();

// Clean up any old cached sync data on initialization
if (typeof window !== 'undefined') {
  syncService.cleanupOldSyncData();
}
