'use client';

import { useState, useRef, useEffect } from 'react';
import { useCharacterStore } from '../../lib/characterStore';
import { useBackgroundStore } from '../../lib/backgroundStore';

interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  isOwned: boolean;
  isEquipped: boolean;
  category: 'character' | 'background';
  image?: string;
}

interface InventoryPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock inventory data - in a real app, this would come from the user's owned items
const inventoryItems = {
  character: [
    { id: 'fighter', name: 'Fighter', description: 'Default warrior character', isOwned: true, isEquipped: false, category: 'character' as const, image: '/assets/sprites/fighter.png' },
    { id: 'wizard', name: 'Wizard', description: 'Powerful magic user', isOwned: true, isEquipped: false, category: 'character' as const, image: '/assets/sprites/wizard.png' },
    { id: 'paladin', name: 'Paladin', description: 'Holy warrior with divine powers', isOwned: true, isEquipped: false, category: 'character' as const, image: '/assets/sprites/paladin.png' },
    { id: 'rogue', name: 'Rogue', description: 'Stealthy and agile fighter', isOwned: true, isEquipped: false, category: 'character' as const, image: '/assets/sprites/rogue.png' }
  ],
  background: [
    { id: 'forest', name: 'Forest', description: 'Default forest scene', isOwned: true, isEquipped: false, category: 'background' as const, image: '/assets/images/forest-background.png' },
    { id: 'tundra', name: 'Tundra', description: 'Frozen wilderness', isOwned: true, isEquipped: false, category: 'background' as const, image: '/assets/images/tundra-background.png' },
    { id: 'underdark', name: 'Underdark', description: 'Dark underground realm', isOwned: true, isEquipped: false, category: 'background' as const, image: '/assets/images/underdark-background.png' },
    { id: 'dungeon', name: 'Dungeon', description: 'Ancient stone corridors', isOwned: true, isEquipped: false, category: 'background' as const, image: '/assets/images/dungeon-background.png' }
  ]
};

export function InventoryPopup({ isOpen, onClose }: InventoryPopupProps) {
  const [activeTab, setActiveTab] = useState<'character' | 'background'>('character');
  const [equippedItems, setEquippedItems] = useState({
    character: 'fighter',
    background: 'bg_default'
  });
  const popupRef = useRef<HTMLDivElement>(null);
  const { equippedCharacter, setEquippedCharacter } = useCharacterStore();
  const { equippedBackground, setEquippedBackground } = useBackgroundStore();

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

  const handleEquip = (item: InventoryItem) => {
    if (!item.isOwned) return;
    
    if (item.category === 'character') {
      setEquippedCharacter(item.id);
    } else if (item.category === 'background') {
      setEquippedBackground(item.id);
    }
    
    setEquippedItems(prev => ({
      ...prev,
      [item.category]: item.id
    }));
    
    console.log(`Equipped ${item.name} for ${item.category}`);
  };

  const getEquippedItem = (category: 'character' | 'background') => {
    const equippedId = equippedItems[category];
    return inventoryItems[category].find(item => item.id === equippedId);
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

                         {/* Items Grid - Mobile Optimized */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2 pb-2">
            {inventoryItems[activeTab]
              .filter(item => item.isOwned) // Only show owned items
              .map((item) => (
                <div
                  key={item.id}
                  className={`min-h-[120px] border-2 rounded p-2 transition-colors flex flex-col justify-between ${
                    (item.category === 'character' && item.id === equippedCharacter) || 
                    (item.category === 'background' && item.id === equippedBackground) || 
                    item.isEquipped
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
                      (item.category === 'character' && item.id === equippedCharacter) || 
                      (item.category === 'background' && item.id === equippedBackground) || 
                      item.isEquipped ? 'text-[#f5f5dc]' : 'text-[#8B4513]'
                    }`}>
                      {item.name}
                    </h3>
                  </div>
                  
                  <div className="text-center">
                    {!((item.category === 'character' && item.id === equippedCharacter) || 
                       (item.category === 'background' && item.id === equippedBackground) || 
                       item.isEquipped) && (
                      <button
                        onClick={() => handleEquip(item)}
                        className="w-full bg-[#8B4513] text-[#f5f5dc] px-1 py-1 rounded font-bold hover:bg-[#654321] transition-colors text-xs"
                      >
                        Equip
                      </button>
                    )}
                    {((item.category === 'character' && item.id === equippedCharacter) || 
                      (item.category === 'background' && item.id === equippedBackground) || 
                      item.isEquipped) && (
                      <span className="text-[#f5f5dc] text-xs font-bold">
                        ✓ Equipped
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>

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
