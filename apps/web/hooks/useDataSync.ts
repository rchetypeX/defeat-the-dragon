'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { syncService } from '../lib/syncService';
import { useGameStore } from '../lib/store';

export function useDataSync() {
  const { user } = useAuth();
  const { loadPlayerData } = useGameStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const initializeData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('Initializing data sync for user:', user.id);

        // Load data from Supabase first
        const syncResult = await syncService.loadUserData();
        
        if (syncResult.success && syncResult.data) {
          console.log('Data loaded from Supabase:', syncResult.data);
        } else {
          console.log('No data in Supabase, loading from API');
          // Fallback to API if no Supabase data
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

  // Auto-sync on page visibility change (user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        console.log('Page became visible, syncing data...');
        syncService.loadUserData().then((result) => {
          if (result.success) {
            setLastSyncTime(new Date());
          }
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  // Auto-sync on window focus (user switches back to window)
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        console.log('Window focused, syncing data...');
        syncService.loadUserData().then((result) => {
          if (result.success) {
            setLastSyncTime(new Date());
          }
        });
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);

  // Periodic sync every 5 minutes
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      console.log('Periodic sync...');
      syncService.saveUserData().then((result) => {
        if (result.success) {
          setLastSyncTime(new Date());
        }
      });
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user]);

  // Sync before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user) {
        console.log('Page unloading, syncing data...');
        
        // Check if this is a wallet user
        const walletUserStr = localStorage.getItem('walletUser');
        if (walletUserStr) {
          // For wallet users, use syncService instead of sendBeacon
          // since sendBeacon doesn't support custom headers
          try {
            syncService.saveUserData();
          } catch (error) {
            console.error('Failed to sync wallet user data on unload:', error);
          }
        } else {
          // For regular Supabase users, use sendBeacon for reliable sync
          const syncData = syncService.collectLocalData();
          navigator.sendBeacon('/api/user/sync', JSON.stringify(syncData));
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);

  const forceSync = async () => {
    try {
      setError(null);
      const result = await syncService.forceSync();
      if (result.success) {
        setLastSyncTime(new Date());
      } else {
        setError(result.error || 'Sync failed');
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sync failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

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

  return {
    isLoading,
    error,
    lastSyncTime,
    forceSync,
    refreshData,
    isSyncing: isLoading
  };
}
