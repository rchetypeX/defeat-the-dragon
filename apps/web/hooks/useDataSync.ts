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

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const initializeData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('Initializing data for user:', user.id);

        // Clean up any old cached sync data that might contain removed fields
        syncService.cleanupOldSyncData();

        // Load data from database
        const syncResult = await syncService.loadUserData();
        
        if (syncResult.success && syncResult.data) {
          console.log('Data loaded from database:', syncResult.data);
        } else {
          console.log('No data in database, loading from API');
          // Fallback to API if no database data
          await loadPlayerData();
        }

        setLastSyncTime(new Date());
        console.log('Data initialization complete');
      } catch (err) {
        console.error('Failed to initialize data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
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
    }, 2000); // 2 second delay
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
      setIsLoading(true);
      setError(null);
      
      const result = await syncService.loadUserData();
      if (result.success) {
        setLastSyncTime(new Date());
      } else {
        setError(result.error || 'Failed to refresh data');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh data';
      setError(errorMessage);
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
