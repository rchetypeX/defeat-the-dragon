import { useGameStore } from './store';
import { useCharacterStore } from './characterStore';
import { useBackgroundStore } from './backgroundStore';

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
  
  // If no wallet token, try to get Supabase session
  if (!token && typeof window !== 'undefined') {
    const { supabase } = await import('./supabase');
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      token = session.access_token;
      console.log('SyncService: Found Supabase session token');
    }
  }

  console.log('SyncService: Token available:', !!token);

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
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
  subscriptions?: Array<{
    subscription_type: string;
    status: string;
    provider?: string;
    external_id?: string;
    started_at?: string;
    expires_at?: string;
  }>;
  purchases?: Array<{
    item_id: string;
    item_type: string;
    price_coins: number;
    price_sparks: number;
  }>;
  achievements?: Array<{
    achievement_id: string;
    progress: number;
    completed: boolean;
    completed_at?: string;
  }>;
}

export interface SyncResult {
  success: boolean;
  data?: {
    player: any;
    settings: any;
    inventory: any[];
    subscriptions: any[];
    purchases: any[];
    achievements: any[];
  };
  results?: any;
  error?: string;
}

class SyncService {
  private syncInProgress = false;
  private syncQueue: (() => Promise<void>)[] = [];
  private lastSyncTime = 0;
  private readonly SYNC_COOLDOWN = 5000; // 5 seconds between syncs

  /**
   * Load all user data from Supabase
   */
  async loadUserData(): Promise<SyncResult> {
    try {
      const response = await apiRequest<SyncResult>('/user/sync');
      
      if (response.success && response.data) {
        // Update local stores with data from Supabase
        this.updateLocalStores(response.data);
      }

      return response;
    } catch (error) {
      console.error('Failed to load user data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Save all user data to Supabase
   */
  async saveUserData(): Promise<SyncResult> {
    // Prevent multiple simultaneous syncs
    if (this.syncInProgress) {
      return new Promise((resolve) => {
        this.syncQueue.push(async () => {
          const result = await this.performSave();
          resolve(result);
        });
      });
    }

    // Check cooldown
    const now = Date.now();
    if (now - this.lastSyncTime < this.SYNC_COOLDOWN) {
      console.log('Sync cooldown active, skipping sync');
      return { success: true };
    }

    return this.performSave();
  }

  private async performSave(): Promise<SyncResult> {
    this.syncInProgress = true;
    this.lastSyncTime = Date.now();

    try {
      const syncData = this.collectLocalData();
      
      const response = await apiRequest<SyncResult>('/user/sync', {
        method: 'POST',
        body: JSON.stringify(syncData),
      });

      // Process any sync results
      if (response.success && response.results) {
        this.handleSyncResults(response.results);
      }

      return response;
    } catch (error) {
      console.error('Failed to save user data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      this.syncInProgress = false;
      
      // Process queued syncs
      if (this.syncQueue.length > 0) {
        const nextSync = this.syncQueue.shift();
        if (nextSync) {
          nextSync();
        }
      }
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

    // Player data
    if (gameStore.player) {
      syncData.player = {
        display_name: gameStore.player.display_name,
        level: gameStore.player.level,
        xp: gameStore.player.xp,
        coins: gameStore.player.coins,
        sparks: gameStore.player.sparks,
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

    // Note: Subscriptions, purchases, and achievements would be collected
    // from their respective stores when implemented

    return syncData;
  }

  /**
   * Update local stores with data from Supabase
   */
  private updateLocalStores(data: any) {
    const gameStore = useGameStore.getState();
    const characterStore = useCharacterStore.getState();
    const backgroundStore = useBackgroundStore.getState();

    // Update player data
    if (data.player) {
      gameStore.setPlayer({
        ...gameStore.player,
        ...data.player,
      });
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

    // Note: Subscriptions, purchases, and achievements would be updated
    // in their respective stores when implemented
  }

  /**
   * Handle sync results and resolve any conflicts
   */
  private handleSyncResults(results: any) {
    // Handle any conflicts or errors from the sync
    if (results.player?.error) {
      console.error('Player sync error:', results.player.error);
    }
    if (results.settings?.error) {
      console.error('Settings sync error:', results.settings.error);
    }
    if (results.inventory?.error) {
      console.error('Inventory sync error:', results.inventory.error);
    }
    // Add more error handling as needed
  }

  /**
   * Force a sync regardless of cooldown
   */
  async forceSync(): Promise<SyncResult> {
    this.lastSyncTime = 0; // Reset cooldown
    return this.saveUserData();
  }

  /**
   * Sync specific data types
   */
  async syncPlayerData(): Promise<SyncResult> {
    const gameStore = useGameStore.getState();
    if (!gameStore.player) return { success: true };

    console.log('SyncService: syncPlayerData called with player:', gameStore.player);

    const syncData: SyncData = {
      player: {
        display_name: gameStore.player.display_name,
        level: gameStore.player.level,
        xp: gameStore.player.xp,
        coins: gameStore.player.coins,
        sparks: gameStore.player.sparks,
      }
    };

    console.log('SyncService: Sending sync data:', syncData);

    return this.performPartialSync(syncData);
  }

  async syncSettings(): Promise<SyncResult> {
    const gameStore = useGameStore.getState();
    const characterStore = useCharacterStore.getState();
    const backgroundStore = useBackgroundStore.getState();

    const syncData: SyncData = {
      settings: {
        sound_enabled: gameStore.settings.soundEnabled,
        notifications_enabled: gameStore.settings.notificationsEnabled,
        accessibility: gameStore.settings.accessibility,
        equipped_character: characterStore.equippedCharacter,
        equipped_background: backgroundStore.equippedBackground,
      }
    };

    return this.performPartialSync(syncData);
  }

  async syncInventory(): Promise<SyncResult> {
    const gameStore = useGameStore.getState();
    if (gameStore.inventory.length === 0) return { success: true };

    const syncData: SyncData = {
      inventory: gameStore.inventory.map(item => ({
        item_id: item.sku,
        item_type: item.type as any,
        quantity: item.qty,
        equipped: item.equipped,
      }))
    };

    return this.performPartialSync(syncData);
  }

  private async performPartialSync(syncData: SyncData): Promise<SyncResult> {
    try {
      const response = await apiRequest<SyncResult>('/user/sync', {
        method: 'POST',
        body: JSON.stringify(syncData),
      });

      return response;
    } catch (error) {
      console.error('Partial sync failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const syncService = new SyncService();

// Auto-sync on store changes
export function setupAutoSync() {
  const gameStore = useGameStore.getState();
  const characterStore = useCharacterStore.getState();
  const backgroundStore = useBackgroundStore.getState();

  // Subscribe to store changes and auto-sync
  useGameStore.subscribe((state) => {
    // Sync when player data changes
    if (state.player) {
      syncService.syncPlayerData();
    }
  });

  useCharacterStore.subscribe((state) => {
    // Sync when character changes
    syncService.syncSettings();
  });

  useBackgroundStore.subscribe((state) => {
    // Sync when background changes
    syncService.syncSettings();
  });
}
