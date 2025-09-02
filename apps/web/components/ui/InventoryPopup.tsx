'use client';

import { useState, useRef, useEffect } from 'react';
import { useCharacterStore } from '../../lib/characterStore';
import { useBackgroundStore } from '../../lib/backgroundStore';
import { useInventory } from '../../contexts/InventoryContext';

interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  isOwned: boolean;
  isEquipped: boolean;
  category: 'character' | 'background';
  image?: string;
}

interface DatabaseInventoryItem {
  id: string;
  user_id: string;
  item_id: string;
  item_type: string;
  quantity: number;
  equipped: boolean;
  acquired_at: string;
}

interface InventoryPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

// Default inventory data - only fighter and forest should be owned by default
const defaultInventoryItems = {
  character: [
    { id: 'fighter', name: 'Fighter', description: 'Default warrior character', isOwned: true, isEquipped: true, category: 'character' as const, image: '/assets/sprites/fighter.png' },
    { id: 'wizard', name: 'Wizard', description: 'Powerful magic user', isOwned: false, isEquipped: false, category: 'character' as const, image: '/assets/sprites/wizard.png' },
    { id: 'paladin', name: 'Paladin', description: 'Holy warrior with divine powers', isOwned: false, isEquipped: false, category: 'character' as const, image: '/assets/sprites/paladin.png' },
    { id: 'rogue', name: 'Rogue', description: 'Stealthy and agile fighter', isOwned: false, isEquipped: false, category: 'character' as const, image: '/assets/sprites/rogue.png' }
  ],
  background: [
    { id: 'forest', name: 'Forest', description: 'Default forest scene', isOwned: true, isEquipped: true, category: 'background' as const, image: '/assets/images/forest-background.png?v=2' },
    { id: 'tundra', name: 'Tundra', description: 'Frozen wilderness', isOwned: false, isEquipped: false, category: 'background' as const, image: '/assets/images/tundra-background.png?v=2' },
    { id: 'underdark', name: 'Underdark', description: 'Dark underground realm', isOwned: false, isEquipped: false, category: 'background' as const, image: '/assets/images/underdark-background.png?v=2' },
    { id: 'dungeon', name: 'Dungeon', description: 'Ancient stone corridors', isOwned: false, isEquipped: false, category: 'background' as const, image: '/assets/images/dungeon-background.png?v=2' }
  ]
};

export function InventoryPopup({ isOpen, onClose }: InventoryPopupProps) {
  const [activeTab, setActiveTab] = useState<'character' | 'background'>('character');
  const [equippedItems, setEquippedItems] = useState({
    character: 'fighter',
    background: 'forest'
  });
  const popupRef = useRef<HTMLDivElement>(null);
  const { equippedCharacter, setEquippedCharacter } = useCharacterStore();
  const { equippedBackground, setEquippedBackground } = useBackgroundStore();
  const { inventory: userInventory, isLoading, error, refreshInventory } = useInventory();



  // Load inventory when popup opens - only if we don't have inventory data
  useEffect(() => {
    if (isOpen && userInventory.length === 0) {
      refreshInventory();
    }
  }, [isOpen, userInventory.length, refreshInventory]); // Include refreshInventory in dependencies

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Check if user owns an item based on database inventory
  const isItemOwned = (itemId: string, itemType: string) => {
    return userInventory.some(item => 
      item.item_id === itemId && item.item_type === itemType
    );
  };

  // Get all available items for the current tab
  const getAvailableItems = (category: 'character' | 'background') => {
    return defaultInventoryItems[category].map(item => ({
      ...item,
      isOwned: isItemOwned(item.id, category),
      isEquipped: isItemEquipped(item) // Use the isItemEquipped function to determine equipped state
    }));
  };

  const handleEquip = async (item: InventoryItem) => {
    if (!item.isOwned) return;
    
    console.log('InventoryPopup: Attempting to equip item:', item);
    
    try {
      // Get auth token for the request
      let token: string | null = null;
      
      // Check if we have a wallet user in localStorage
      const walletUserStr = localStorage.getItem('walletUser');
      if (walletUserStr) {
        try {
          const walletUser = JSON.parse(walletUserStr);
          token = `wallet:${JSON.stringify(walletUser)}`;
        } catch (e) {
          console.error('Error parsing wallet user:', e);
        }
      }
      
      // Check if we have a Base App user in localStorage
      if (!token) {
        const baseAppUserStr = localStorage.getItem('baseAppUser');
        if (baseAppUserStr) {
          try {
            const baseAppUser = JSON.parse(baseAppUserStr);
            token = `baseapp:${JSON.stringify(baseAppUser)}`;
          } catch (e) {
            console.error('Error parsing Base App user:', e);
          }
        }
      }
      
      // If no wallet or Base App token, try to get Supabase session
      if (!token) {
        const { supabase } = await import('../../lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          token = session.access_token;
        }
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
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

      console.log('InventoryPopup: Sending equip request with payload:', {
        itemId: item.id,
        itemType: item.category
      });
      console.log('InventoryPopup: Request headers:', headers);

      const response = await fetch('/api/inventory/equip', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          itemId: item.id,
          itemType: item.category
        })
      });

      console.log('InventoryPopup: Equip response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('InventoryPopup: Equip response data:', result);
        
        // Update local state immediately based on the successful equip
        if (item.category === 'character') {
          setEquippedCharacter(item.id);
          // Update character store
          useCharacterStore.getState().setEquippedCharacter(item.id);
        } else if (item.category === 'background') {
          setEquippedBackground(item.id);
          // Update background store
          useBackgroundStore.getState().setEquippedBackground(item.id);
        }
        
        setEquippedItems(prev => ({
          ...prev,
          [item.category]: item.id
        }));
        
        // Refresh inventory to get the updated equipped status from database
        await refreshInventory();
        
        console.log(`Equipped ${item.name} for ${item.category}`);
      } else {
        const errorData = await response.json();
        console.error('InventoryPopup: Failed to equip item:', errorData);
        console.error('InventoryPopup: Response status:', response.status);
        console.error('Failed to equip item');
      }
    } catch (error) {
      console.error('Error equipping item:', error);
      console.error('Error equipping item');
    }
  };

  const getEquippedItem = (category: 'character' | 'background') => {
    // First check the database inventory for equipped items
    const equippedFromDB = userInventory.find(item => 
      item.item_type === category && item.equipped
    );
    
    if (equippedFromDB) {
      return defaultInventoryItems[category].find(item => item.id === equippedFromDB.item_id);
    }
    
    // Fallback to local state
    const equippedId = equippedItems[category];
    return defaultInventoryItems[category].find(item => item.id === equippedId);
  };

  const isItemEquipped = (item: InventoryItem | { id: string; category: string }) => {
    // First, check if this item is equipped in the database
    const equippedFromDB = userInventory.find(invItem => 
      invItem.item_id === item.id && 
      invItem.item_type === item.category && 
      invItem.equipped === true
    );
    
    if (equippedFromDB) {
      console.log(`InventoryPopup: Item ${item.id} is equipped in database`);
      return true;
    }
    
    // If no equipped item found in database for this category, check if this is the default equipped item
    const categoryItems = userInventory.filter(invItem => 
      invItem.item_type === item.category
    );
    
    // If no items in database for this category, use local state as fallback
    if (categoryItems.length === 0) {
      if (item.category === 'character' && item.id === equippedCharacter) {
        console.log(`InventoryPopup: Item ${item.id} is equipped in character store`);
        return true;
      }
      if (item.category === 'background' && item.id === equippedBackground) {
        console.log(`InventoryPopup: Item ${item.id} is equipped in background store`);
        return true;
      }
    }
    
    console.log(`InventoryPopup: Item ${item.id} is not equipped`);
    return false;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      <div 
        ref={popupRef}
        className="bg-[#f5f5dc] border-4 border-[#8B4513] rounded-lg p-3 w-full max-w-sm h-[95vh] flex flex-col pixel-art"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-3 flex-shrink-0">
          <h2 className="text-lg font-bold text-[#8B4513]">🎒 Inventory</h2>
          <button
            onClick={onClose}
            className="text-[#8B4513] hover:text-[#654321] text-xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-3 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-xs">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex justify-center space-x-1 mb-3 flex-shrink-0">
          <button
            onClick={() => setActiveTab('character')}
            className={`px-3 py-2 font-bold rounded border-2 transition-all text-xs ${
              activeTab === 'character'
                ? 'bg-[#8B4513] text-[#f5f5dc] border-[#8B4513]'
                : 'bg-[#f5f5dc] text-[#8B4513] border-[#8B4513] hover:bg-[#e8e8d0]'
            }`}
          >
            🧙‍♂️ Character
          </button>
          <button
            onClick={() => setActiveTab('background')}
            className={`px-3 py-2 font-bold rounded border-2 transition-all text-xs ${
              activeTab === 'background'
                ? 'bg-[#8B4513] text-[#f5f5dc] border-[#8B4513]'
                : 'bg-[#f5f5dc] text-[#8B4513] border-[#8B4513] hover:bg-[#e8e8d0]'
            }`}
          >
            🖼️ Background
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-[#8B4513] text-sm">Loading inventory...</div>
          </div>
        )}

        {/* Items Grid - Mobile Optimized */}
        {!isLoading && (
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-2 pb-2">
              {getAvailableItems(activeTab)
                .filter(item => item.isOwned) // Only show owned items
                .map((item) => (
                  <div
                    key={item.id}
                    className={`min-h-[120px] border-2 rounded p-2 transition-colors flex flex-col justify-between ${
                      isItemEquipped(item)
                        ? 'bg-[#8B4513] border-[#8B4513] shadow-lg' // Highlight equipped items
                        : 'bg-[#e8e8d0] border-[#8B4513] hover:bg-[#d8d8c0]'
                    }`}
                  >
                    <div className="text-center flex-1 flex flex-col justify-center">
                      {(activeTab === 'character' || activeTab === 'background') && item.image ? (
                        <div className="mb-1">
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className={`mx-auto object-contain ${
                              activeTab === 'character' 
                                ? 'w-10 h-10' 
                                : 'w-12 h-8 rounded'
                            }`}
                          />
                        </div>
                      ) : (
                        <div className="text-lg mb-1">
                          {activeTab === 'character' && '🧙‍♂️'}
                          {activeTab === 'background' && '🖼️'}
                        </div>
                      )}
                      <h3 className={`font-bold text-xs ${
                        isItemEquipped(item) ? 'text-[#f5f5dc]' : 'text-[#8B4513]'
                      }`}>
                        {item.name}
                      </h3>
                    </div>
                    
                    <div className="text-center">
                      {!isItemEquipped(item) && (
                        <button
                          onClick={() => handleEquip(item)}
                          className="w-full bg-[#8B4513] text-[#f5f5dc] px-1 py-1 rounded font-bold hover:bg-[#654321] transition-colors text-xs"
                        >
                          Equip
                        </button>
                      )}
                      {isItemEquipped(item) && (
                        <span className="text-[#f5f5dc] text-xs font-bold">
                          ✓ Equipped
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 text-center flex-shrink-0">
          <p className="text-[#654321] text-xs">
            💡 Tip: Visit the shop to unlock more items and customize your experience!
          </p>
        </div>
      </div>
    </div>
  );
}
