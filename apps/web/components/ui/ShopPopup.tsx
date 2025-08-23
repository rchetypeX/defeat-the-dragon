'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface ShopItem {
  id: string;
  name: string;
  price: number;
  currency: 'coins' | 'sparks';
  description?: string;
  image?: string;
}

interface InventoryItem {
  id: string;
  user_id: string;
  item_id: string;
  item_type: 'cosmetic' | 'pet' | 'trinket' | 'character' | 'background';
  quantity: number;
  equipped: boolean;
  acquired_at: string;
}

interface ShopPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const shopItems: Record<'character' | 'background', ShopItem[]> = {
  character: [
    { id: 'wizard', name: 'Wizard', price: 150, currency: 'coins', description: 'Powerful magic user', image: '/assets/sprites/wizard.png' },
    { id: 'paladin', name: 'Paladin', price: 6, currency: 'sparks', description: 'Holy warrior with divine powers', image: '/assets/sprites/paladin.png' },
    { id: 'rogue', name: 'Rogue', price: 150, currency: 'coins', description: 'Stealthy and agile fighter', image: '/assets/sprites/rogue.png' }
  ],
  background: [
    { id: 'tundra', name: 'Tundra', price: 3, currency: 'sparks', description: 'Frozen wilderness', image: '/assets/images/tundra-background.png' },
    { id: 'underdark', name: 'Underdark', price: 100, currency: 'coins', description: 'Dark underground realm', image: '/assets/images/underdark-background.png' },
    { id: 'dungeon', name: 'Dungeon', price: 100, currency: 'coins', description: 'Ancient stone corridors', image: '/assets/images/dungeon-background.png' }
  ]
};

export function ShopPopup({ isOpen, onClose }: ShopPopupProps) {
  const [activeTab, setActiveTab] = useState<'character' | 'background'>('character');
  const [userInventory, setUserInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState<{ [key: string]: 'idle' | 'loading' | 'success' | 'error' }>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

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
      // Load user inventory when shop opens
      if (user) {
        loadUserInventory();
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, user]);

  const loadUserInventory = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const response = await fetch('/api/user/sync');
      
      if (response.ok) {
        const data = await response.json();
        if (data.inventory) {
          setUserInventory(data.inventory);
        }
      } else {
        console.error('Failed to load inventory');
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isItemOwned = (itemId: string, itemType: string) => {
    return userInventory.some(item => 
      item.item_id === itemId && item.item_type === itemType
    );
  };

  const handlePurchase = async (item: ShopItem) => {
    if (!user) {
      setErrorMessage('Please log in to make purchases');
      return;
    }

    if (isItemOwned(item.id, activeTab === 'character' ? 'character' : 'background')) {
      setErrorMessage('You already own this item');
      return;
    }

    setPurchaseStatus(prev => ({ ...prev, [item.id]: 'loading' }));
    setErrorMessage(null);

    try {
      const response = await fetch('/api/shop/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: item.id,
          itemType: activeTab === 'character' ? 'character' : 'background',
          price: item.price,
          currency: item.currency
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setPurchaseStatus(prev => ({ ...prev, [item.id]: 'success' }));
        // Reload inventory to reflect the new purchase
        await loadUserInventory();
        // Clear success status after 2 seconds
        setTimeout(() => {
          setPurchaseStatus(prev => ({ ...prev, [item.id]: 'idle' }));
        }, 2000);
      } else {
        setPurchaseStatus(prev => ({ ...prev, [item.id]: 'error' }));
        setErrorMessage(result.error || 'Purchase failed');
        // Clear error status after 3 seconds
        setTimeout(() => {
          setPurchaseStatus(prev => ({ ...prev, [item.id]: 'idle' }));
        }, 3000);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      setPurchaseStatus(prev => ({ ...prev, [item.id]: 'error' }));
      setErrorMessage('Network error. Please try again.');
      // Clear error status after 3 seconds
      setTimeout(() => {
        setPurchaseStatus(prev => ({ ...prev, [item.id]: 'idle' }));
      }, 3000);
    }
  };

  const handleSubscription = () => {
    // TODO: Implement Inspiration Boon purchase logic
    console.log('Inspiration Boon purchase clicked');
    alert('Inspiration Boon purchase coming soon! This will allow you to earn Sparks from successful focus sessions.');
  };

  const getButtonText = (item: ShopItem) => {
    const status = purchaseStatus[item.id];
    if (status === 'loading') return 'Buying...';
    if (status === 'success') return '✓ Owned';
    if (status === 'error') return 'Error';
    if (isItemOwned(item.id, activeTab === 'character' ? 'character' : 'background')) {
      return 'Owned';
    }
    return 'Buy';
  };

  const getButtonClass = (item: ShopItem) => {
    const status = purchaseStatus[item.id];
    const isOwned = isItemOwned(item.id, activeTab === 'character' ? 'character' : 'background');
    
    if (status === 'loading') {
      return 'w-full bg-gray-400 text-white px-1 py-1 rounded font-bold cursor-not-allowed text-xs';
    }
    if (status === 'success') {
      return 'w-full bg-green-600 text-white px-1 py-1 rounded font-bold cursor-not-allowed text-xs';
    }
    if (status === 'error') {
      return 'w-full bg-red-600 text-white px-1 py-1 rounded font-bold hover:bg-red-700 transition-colors text-xs';
    }
    if (isOwned) {
      return 'w-full bg-gray-500 text-white px-1 py-1 rounded font-bold cursor-not-allowed text-xs';
    }
    return 'w-full bg-[#8B4513] text-[#f5f5dc] px-1 py-1 rounded font-bold hover:bg-[#654321] transition-colors text-xs';
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
          <h2 className="text-lg font-bold text-[#8B4513]">🏪 Shop</h2>
          <button
            onClick={onClose}
            className="text-[#8B4513] hover:text-[#654321] text-xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-3 flex-shrink-0">
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-xs">
              {errorMessage}
            </div>
          </div>
        )}

        {/* Inspiration Boon Button */}
        <div className="mb-3 flex-shrink-0">
          <button
            onClick={handleSubscription}
            className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] border-2 border-[#8B4513] text-[#8B4513] font-bold py-2 px-3 rounded hover:from-[#FFA500] hover:to-[#FF8C00] transition-all duration-200 shadow-lg text-xs"
          >
            ✨ Inspiration Boon! Earn Sparks from Focus Sessions!
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

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-center items-center py-4">
            <div className="text-[#8B4513] text-sm">Loading inventory...</div>
          </div>
        )}

        {/* Items Grid - Mobile Optimized */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2 pb-2">
            {shopItems[activeTab].map((item) => {
              const isOwned = isItemOwned(item.id, activeTab === 'character' ? 'character' : 'background');
              const isDisabled = isOwned || purchaseStatus[item.id] === 'loading';
              
              return (
                <div
                  key={item.id}
                  className={`min-h-[120px] border-2 border-[#8B4513] rounded p-2 transition-colors flex flex-col justify-between ${
                    isOwned 
                      ? 'bg-gray-200 opacity-75' 
                      : 'bg-[#e8e8d0] hover:bg-[#d8d8c0]'
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
                    <h3 className="font-bold text-[#8B4513] text-xs">
                      {item.name}
                    </h3>
                    {isOwned && (
                      <div className="text-green-600 text-xs font-bold mt-1">
                        ✓ Owned
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center">
                    <div className="flex justify-center items-center space-x-1 mb-1">
                      <span className="text-[#8B4513] font-bold text-xs">
                        {item.price}
                      </span>
                      <span className="text-xs">
                        {item.currency === 'coins' ? '🪙' : '✨'}
                      </span>
                    </div>
                    <button
                      onClick={() => !isDisabled && handlePurchase(item)}
                      disabled={isDisabled}
                      className={getButtonClass(item)}
                    >
                      {getButtonText(item)}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 text-center flex-shrink-0">
          <p className="text-[#654321] text-xs">
            💡 Tip: Get the Inspiration Boon to earn Sparks from your focus sessions!
          </p>
        </div>
      </div>
    </div>
  );
}
