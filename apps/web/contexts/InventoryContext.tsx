'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

interface InventoryItem {
  id: string;
  user_id: string;
  item_id: string;
  item_type: 'character' | 'background';
  quantity: number;
  equipped: boolean;
  acquired_at: string;
}

interface InventoryContextType {
  inventory: InventoryItem[];
  isLoading: boolean;
  error: string | null;
  refreshInventory: () => Promise<void>;
  addItem: (item: Omit<InventoryItem, 'id' | 'user_id' | 'acquired_at'>) => Promise<void>;
  updateItem: (itemId: string, updates: Partial<InventoryItem>) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  isItemOwned: (itemId: string, itemType: string) => boolean;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Generate auth headers for API calls
  const generateAuthHeaders = useCallback(async () => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Check if we have a wallet user in localStorage
    const walletUserStr = localStorage.getItem('walletUser');
    if (walletUserStr) {
      try {
        const walletUser = JSON.parse(walletUserStr);
        headers.Authorization = `wallet:${JSON.stringify(walletUser)}`;
        return headers;
      } catch (e) {
        console.error('Error parsing wallet user:', e);
      }
    }

    // Check if we have a Base App user in localStorage
    const baseAppUserStr = localStorage.getItem('baseAppUser');
    if (baseAppUserStr) {
      try {
        const baseAppUser = JSON.parse(baseAppUserStr);
        headers.Authorization = `baseapp:${JSON.stringify(baseAppUser)}`;
        return headers;
      } catch (e) {
        console.error('Error parsing Base App user:', e);
      }
    }

    // If no wallet or Base App token, try to get Supabase session
    try {
      const { supabase } = await import('../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch (e) {
      console.error('Error getting Supabase session:', e);
    }

    return headers;
  }, []);

  // Load inventory from API
  const loadInventory = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const headers = await generateAuthHeaders();
      const response = await fetch('/api/inventory', { 
        headers, 
        credentials: 'include',
        cache: 'no-cache' // Ensure fresh data
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.data && Array.isArray(result.data)) {
          setInventory(result.data);
          console.log('📦 Inventory loaded in context:', result.data.length, 'items');
        } else {
          setInventory([]);
        }
      } else {
        setError('Failed to load inventory');
        console.error('Failed to load inventory:', response.status);
      }
    } catch (error) {
      setError('Error loading inventory');
      console.error('Error loading inventory:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, generateAuthHeaders]);

  // Refresh inventory (public method for components to call)
  const refreshInventory = useCallback(async () => {
    await loadInventory();
  }, [loadInventory]);

  // Add item to inventory (called after successful purchase)
  const addItem = useCallback(async (item: Omit<InventoryItem, 'id' | 'user_id' | 'acquired_at'>) => {
    if (!user) return;

    try {
      const newItem: InventoryItem = {
        ...item,
        id: `${item.item_id}-${Date.now()}`, // Temporary ID
        user_id: user.id!,
        acquired_at: new Date().toISOString()
      };

      // Optimistically update local state
      setInventory(prev => [...prev, newItem]);
      
      // Refresh from server to get the real ID and ensure consistency
      await loadInventory();
      
      console.log('📦 Item added to inventory:', item.item_id);
    } catch (error) {
      console.error('Error adding item to inventory:', error);
      // Revert optimistic update on error
      await loadInventory();
    }
  }, [user, loadInventory]);

  // Update item in inventory
  const updateItem = useCallback(async (itemId: string, updates: Partial<InventoryItem>) => {
    setInventory(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      )
    );
  }, []);

  // Remove item from inventory
  const removeItem = useCallback(async (itemId: string) => {
    setInventory(prev => prev.filter(item => item.id !== itemId));
  }, []);

  // Check if user owns an item
  const isItemOwned = useCallback((itemId: string, itemType: string) => {
    return inventory.some(item => 
      item.item_id === itemId && item.item_type === itemType
    );
  }, [inventory]);

  // Load inventory when user changes or component mounts
  useEffect(() => {
    if (user) {
      loadInventory();
    } else {
      setInventory([]);
    }
  }, [user, loadInventory]);

  const value: InventoryContextType = {
    inventory,
    isLoading,
    error,
    refreshInventory,
    addItem,
    updateItem,
    removeItem,
    isItemOwned
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}
