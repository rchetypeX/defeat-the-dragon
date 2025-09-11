'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { syncService } from '../lib/syncService';
import { useGameStore } from '../lib/store';

export function useDataSync() {
  const { user } = useAuth();
  const { loadPlayerData } = useGameStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  // Debounce sync calls to prevent excessive API usage
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSyncRef = useRef<boolean>(false);
  const initializedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      initializedRef.current = false;
      return;
    }

    // Prevent multiple initializations
    if (initializedRef.current) {
      return;
    }

    const initializeData = async () => {
      try {
        // Check if we already have player data to avoid unnecessary loading state
        const existingPlayer = useGameStore.getState().player;
        if (!existingPlayer) {
          setIsLoading(true);
        }
        setError(null);

        console.log('Initializing data for user:', user.id);

        // Clean up any old cached sync data that might contain removed fields
        syncService.cleanupOldSyncData();

        // Try to load data from database with timeout
        let syncResult;
        try {
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Bootstrap API timeout')), 8000)
          );
          
          syncResult = await Promise.race([
            syncService.loadUserData(),
            timeoutPromise
          ]);
        } catch (timeoutError) {
          console.warn('Bootstrap API timed out, trying fallback:', timeoutError);
          syncResult = { success: false, error: 'Bootstrap API timeout' };
        }
        
        if (syncResult.success && syncResult.data) {
          console.log('Data loaded from database:', syncResult.data);
        } else {
          console.log('No data in database or bootstrap failed, trying direct API call...');
          // Fallback to direct API call
          try {
            await loadPlayerData();
          } catch (apiError) {
            console.error('Direct API call also failed:', apiError);
            throw new Error(`Failed to load player data: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`);
          }
        }

        // Double-check that player data is loaded
        const currentPlayer = useGameStore.getState().player;
        if (!currentPlayer) {
          console.error('Player data still not loaded after all attempts');
          throw new Error('Unable to load player data. Please try refreshing the page.');
        }

        setLastSyncTime(new Date());
        console.log('Data initialization complete');
        initializedRef.current = true;
      } catch (err) {
        console.error('Failed to initialize data:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
        setError(errorMessage);
        
        // If it's a timeout or network error, suggest retry
        if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
          console.log('Network/timeout error detected, suggesting retry');
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [user, loadPlayerData]);

  // Debounced sync function to prevent excessive API calls
  const debouncedSync = useCallback((syncFunction: () => Promise<any>, delay: number = 2000) => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    pendingSyncRef.current = true;
    
    syncTimeoutRef.current = setTimeout(async () => {
      if (pendingSyncRef.current) {
        try {
          await syncFunction();
          setLastSyncTime(new Date());
        } catch (error) {
          console.error('Debounced sync failed:', error);
        } finally {
          pendingSyncRef.current = false;
        }
      }
    }, delay);
  }, []);

  // Sync critical data changes immediately (online-first)
  const syncCriticalData = async (data: any) => {
    try {
      console.log('Syncing critical data:', data);
      const result = await syncService.saveUserData(data);
      if (result.success) {
        setLastSyncTime(new Date());
      }
      return result;
    } catch (err) {
      console.error('Critical data sync failed:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Sync failed' };
    }
  };

  // Debounced sync for non-critical changes (cost-effective)
  const syncNonCriticalData = useCallback((data: any) => {
    debouncedSync(async () => {
      console.log('Syncing non-critical data (debounced):', data);
      return await syncService.saveUserData(data);
    }, 5000); // 5 second delay (increased from 2 seconds)
  }, [debouncedSync]);

  // Sync focus session completion (successful sessions only)
  const syncFocusSession = async (sessionData: any) => {
    try {
      console.log('Syncing successful focus session:', sessionData);
      const result = await syncService.saveFocusSession(sessionData);
      if (result.success) {
        setLastSyncTime(new Date());
      }
      return result;
    } catch (err) {
      console.error('Focus session sync failed:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Session sync failed' };
    }
  };

  // Force refresh data from database
  const refreshData = async () => {
    try {
      // Only set loading to true if we don't already have player data
      const currentPlayer = useGameStore.getState().player;
      if (!currentPlayer) {
        setIsLoading(true);
      }
      setError(null);
      
      // Try bootstrap API with timeout
      let result;
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Bootstrap API timeout')), 8000)
        );
        
        result = await Promise.race([
          syncService.loadUserData(),
          timeoutPromise
        ]);
      } catch (timeoutError) {
        console.warn('Bootstrap API timed out during refresh, trying direct API call...');
        // Fallback to direct API call
        try {
          await loadPlayerData();
          result = { success: true };
        } catch (apiError) {
          throw new Error(`Both bootstrap and direct API failed: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`);
        }
      }
      
      if (result.success) {
        setLastSyncTime(new Date());
        console.log('Data refresh successful');
      } else {
        const errorMsg = result.error || 'Failed to refresh data';
        setError(errorMsg);
        console.error('Data refresh failed:', errorMsg);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh data';
      setError(errorMessage);
      console.error('Data refresh error:', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  return {
    isLoading,
    error,
    lastSyncTime,
    syncCriticalData,
    syncNonCriticalData,
    syncFocusSession,
    refreshData,
    isSyncing: isLoading
  };
}
