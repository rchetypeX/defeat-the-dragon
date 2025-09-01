'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SubscriptionPopup } from './SubscriptionPopup';

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

interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  isInspired: boolean;
  totalRemainingDays: number;
  totalRemainingHours: number;
  totalRemainingMinutes: number;
  subscriptionDetails: any[];
}

// Shop items are now loaded dynamically from the master table

export function ShopPopup({ isOpen, onClose }: ShopPopupProps) {
  const [activeTab, setActiveTab] = useState<'character' | 'background'>('character');
  const [userInventory, setUserInventory] = useState<InventoryItem[]>([]);
  const [shopItems, setShopItems] = useState<Record<'character' | 'background', ShopItem[]>>({
    character: [],
    background: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState<{ [key: string]: 'idle' | 'loading' | 'success' | 'error' }>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSubscriptionPopup, setShowSubscriptionPopup] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Separate useEffect for data loading to prevent unnecessary re-fetches
  useEffect(() => {
    if (isOpen) {
      // Always reload inventory when shop opens to ensure fresh data
      console.log('🏪 Shop opened, loading fresh data...');
      loadUserInventory(true); // Force refresh
      loadShopItems();
      loadSubscriptionStatus();
    }
  }, [isOpen]); // Only depend on isOpen

  // Separate useEffect for event listeners
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        // Only close if no modal is open
        if (!showSubscriptionPopup) {
          onClose();
        }
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Close subscription modal first, then shop
        if (showSubscriptionPopup) {
          setShowSubscriptionPopup(false);
        } else {
          onClose();
        }
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
  }, [isOpen, onClose, showSubscriptionPopup]);

  // Helper function to generate auth headers
  const generateAuthHeaders = async (): Promise<HeadersInit> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Check if we have a wallet user in localStorage
    const walletUserStr = localStorage.getItem('walletUser');
    if (walletUserStr) {
      try {
        const walletUser = JSON.parse(walletUserStr);
        headers['Authorization'] = `wallet:${JSON.stringify(walletUser)}`;
        console.log('🔑 Generated wallet auth headers:', { walletUser: walletUser.id });
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
        headers['Authorization'] = `baseapp:${JSON.stringify(baseAppUser)}`;
        console.log('🔑 Generated Base App auth headers:', { baseAppUser: baseAppUser.id });
        return headers;
      } catch (e) {
        console.error('Error parsing Base App user:', e);
      }
    }
    
    // If no wallet or Base App token, try to get Supabase session
    try {
      const { supabase } = await import('../../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
        console.log('🔑 Generated Supabase auth headers');
      }
    } catch (e) {
      console.log('Could not get Supabase session token');
    }

    console.log('🔑 Final auth headers:', headers);
    return headers;
  };

  const loadShopItems = async () => {
    try {
      setIsLoading(true);
      
      const headers = await generateAuthHeaders();
      

      
      // Load both character and background items
      const [characterResponse, backgroundResponse] = await Promise.all([
        fetch('/api/master/shop-items?category=character', { headers, credentials: 'include' }),
        fetch('/api/master/shop-items?category=background', { headers, credentials: 'include' })
      ]);

      if (characterResponse.ok && backgroundResponse.ok) {
        const characterData = await characterResponse.json();
        const backgroundData = await backgroundResponse.json();
        
        setShopItems({
          character: characterData.data.map((item: any) => ({
            id: item.item_key,
            name: item.name,
            price: item.price,
            currency: item.currency,
            description: item.description,
            image: item.image_url
          })),
          background: backgroundData.data.map((item: any) => ({
            id: item.item_key,
            name: item.name,
            price: item.price,
            currency: item.currency,
            description: item.description,
            image: item.image_url
          }))
        });
      } else {
        console.error('Failed to load shop items');
        setErrorMessage('Failed to load shop items');
      }
    } catch (error) {
      console.error('Error loading shop items:', error);
      setErrorMessage('Error loading shop items');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubscriptionStatus = async () => {
    try {
      const headers = await generateAuthHeaders();
      
      const response = await fetch('/api/subscriptions/status', { headers, credentials: 'include' });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Subscription status loaded:', result.data);
        if (result.data) {
          setSubscriptionStatus(result.data);
        }
      } else {
        console.error('Failed to load subscription status');
      }
    } catch (error) {
      console.error('Error loading subscription status:', error);
    }
  };

  const loadUserInventory = async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      
      const headers = await generateAuthHeaders();
      console.log('📦 Loading inventory with headers:', headers);
      
      // Add cache-busting parameter if force refresh is requested
      const url = forceRefresh ? `/api/inventory?t=${Date.now()}` : '/api/inventory';
      const response = await fetch(url, { 
        headers, 
        credentials: 'include',
        cache: forceRefresh ? 'no-cache' : 'default'
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('📦 Inventory loaded:', result.data);
        console.log('📦 Inventory count:', result.data?.length || 0);
        
        if (result.data && Array.isArray(result.data)) {
          setUserInventory(result.data);
          console.log('📦 Inventory state updated successfully');
        } else {
          console.warn('📦 No inventory data or invalid format, setting empty array');
          setUserInventory([]);
        }
      } else {
        console.error('❌ Failed to load inventory:', response.status, response.statusText);
        setErrorMessage('Failed to load inventory');
        // Don't clear existing inventory on error
      }
    } catch (error) {
      console.error('❌ Error loading inventory:', error);
      setErrorMessage('Error loading inventory');
      // Don't clear existing inventory on error
    } finally {
      setIsLoading(false);
    }
  };

  // Memoize the ownership check to prevent unnecessary recalculations
  const isItemOwned = (itemId: string, itemType: string) => {
    console.log(`🔍 Checking ownership for ${itemId} (${itemType})`);
    console.log(`🔍 Current inventory count:`, userInventory.length);
    console.log(`🔍 Current inventory items:`, userInventory.map(item => ({ item_id: item.item_id, item_type: item.item_type, quantity: item.quantity })));
    
    if (!userInventory || userInventory.length === 0) {
      console.log(`🔍 No inventory data available, item not owned`);
      return false;
    }
    
    const owned = userInventory.some(item => {
      const matches = item.item_id === itemId && item.item_type === itemType;
      console.log(`🔍 Item ${item.item_id} (${item.item_type}) matches ${itemId} (${itemType}): ${matches}`);
      return matches;
    });
    
    console.log(`🔍 Ownership result for ${itemId} (${itemType}):`, owned);
    return owned;
  };

  const handlePurchase = async (item: ShopItem) => {
    if (!user) {
      setErrorMessage('Please log in to make purchases');
      return;
    }

    setPurchaseStatus(prev => ({ ...prev, [item.id]: 'loading' }));
    setErrorMessage(null);

    try {
      // Use the generateAuthHeaders helper function for consistent authentication
      const headers = await generateAuthHeaders();
      
      // Determine token type for logging
      let tokenType: 'wallet' | 'baseapp' | 'supabase' | null = null;
      const authHeader = (headers as Record<string, string>).Authorization;
      if (authHeader) {
        if (authHeader.startsWith('wallet:')) {
          tokenType = 'wallet';
        } else if (authHeader.startsWith('baseapp:')) {
          tokenType = 'baseapp';
        } else if (authHeader.startsWith('Bearer ')) {
          tokenType = 'supabase';
        }
      }

      const purchaseData = {
        itemId: item.id,
        itemType: activeTab === 'character' ? 'character' : 'background',
        price: item.price,
        currency: item.currency
      };
      
      console.log('🛒 Sending purchase request:', purchaseData);
      console.log('🔑 Auth token type:', tokenType || 'none');
      console.log('🔑 Auth header present:', !!authHeader);
      
      const response = await fetch('/api/shop/purchase', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(purchaseData),
      });

      console.log('📡 Purchase response status:', response.status);
      const result = await response.json();
      console.log('📡 Purchase response data:', result);

      if (response.ok) {
        console.log('✅ Purchase successful for:', item.name);
        setPurchaseStatus(prev => ({ ...prev, [item.id]: 'success' }));
        
        // Force immediate inventory reload to reflect the new purchase
        console.log('🔄 Reloading inventory after purchase...');
        await loadUserInventory(true); // Force refresh
        console.log('🔄 Inventory reloaded, checking ownership again...');
        
        // Force a re-render by updating the inventory state
        setUserInventory(prevInventory => {
          const newInventory = [...prevInventory];
          const existingItemIndex = newInventory.findIndex(
            invItem => invItem.item_id === item.id && invItem.item_type === (activeTab === 'character' ? 'character' : 'background')
          );
          
          if (existingItemIndex === -1) {
            // Add the new item to inventory
            newInventory.push({
              id: `temp-${Date.now()}`, // Temporary ID
              user_id: user.id || 'unknown',
              item_id: item.id,
              item_type: activeTab === 'character' ? 'character' : 'background' as any,
              quantity: 1,
              equipped: false,
              acquired_at: new Date().toISOString()
            });
            console.log('➕ Added item to local inventory state:', item.id);
          } else {
            // Update quantity if item already exists
            newInventory[existingItemIndex].quantity += 1;
            console.log('🔄 Updated quantity for existing item:', item.id);
          }
          
          return newInventory;
        });
        
        // Clear success status after 2 seconds
        setTimeout(() => {
          setPurchaseStatus(prev => ({ ...prev, [item.id]: 'idle' }));
        }, 2000);
      } else {
        console.error('❌ Purchase failed:', result.error);
        setPurchaseStatus(prev => ({ ...prev, [item.id]: 'error' }));
        setErrorMessage(result.error || 'Purchase failed');
        // Clear error status after 3 seconds
        setTimeout(() => {
          setPurchaseStatus(prev => ({ ...prev, [item.id]: 'idle' }));
        }, 3000);
      }
    } catch (error) {
      console.error('❌ Purchase error:', error);
      setPurchaseStatus(prev => ({ ...prev, [item.id]: 'error' }));
      setErrorMessage('Network error. Please try again.');
      // Clear error status after 3 seconds
      setTimeout(() => {
        setPurchaseStatus(prev => ({ ...prev, [item.id]: 'idle' }));
      }, 3000);
    }
  };

  const handleSubscription = () => {
    setShowSubscriptionPopup(true);
  };

  const handleSubscriptionSuccess = () => {
    // Refresh inventory and subscription status to show updated subscription status
    loadUserInventory(true); // Force refresh
    loadSubscriptionStatus();
    // Close the subscription popup but keep the shop open
    setShowSubscriptionPopup(false);
  };

  const handleSubscriptionClose = () => {
    setShowSubscriptionPopup(false);
  };

  // Reset modal states when shop popup closes
  useEffect(() => {
    if (!isOpen) {
      setShowSubscriptionPopup(false);
    }
  }, [isOpen]);

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
          <div className="flex items-center space-x-2">
            <button
              onClick={() => loadUserInventory(true)}
              disabled={isLoading}
              className="text-[#8B4513] hover:text-[#654321] text-sm font-bold px-2 py-1 border border-[#8B4513] rounded hover:bg-[#8B4513] hover:text-[#f5f5dc] transition-colors"
              title="Refresh inventory"
            >
              🔄
            </button>
            <button
              onClick={onClose}
              className="text-[#8B4513] hover:text-[#654321] text-xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-3 flex-shrink-0">
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-xs">
              {errorMessage}
            </div>
          </div>
        )}

        {/* Debug Info - Only show in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-3 flex-shrink-0">
            <details className="bg-gray-100 border border-gray-300 rounded text-xs p-2">
              <summary className="cursor-pointer text-gray-600 font-bold">🐛 Debug Info</summary>
              <div className="mt-2 text-gray-600 space-y-1">
                <div>Inventory Count: {userInventory.length}</div>
                <div>Shop Items: {shopItems[activeTab].length}</div>
                <div>Active Tab: {activeTab}</div>
                <div>User: {user?.id || 'Not logged in'}</div>
                <div className="text-xs">
                  Inventory: {userInventory.map(item => `${item.item_id}(${item.item_type})`).join(', ')}
                </div>
              </div>
            </details>
          </div>
        )}

        {/* Inspiration Boon Button and Status */}
        <div className="mb-3 flex-shrink-0">
          <button
            onClick={handleSubscription}
            className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] border-2 border-[#8B4513] text-[#8B4513] font-bold py-2 px-3 rounded hover:from-[#FFA500] hover:to-[#FF8C00] transition-all duration-200 shadow-lg text-xs"
          >
            ✨ Inspiration Boon! Earn Sparks from Focus Sessions!
          </button>
          
          {/* Subscription Status Indicator */}
          {subscriptionStatus && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
              {subscriptionStatus.hasActiveSubscription ? (
                <div className="text-green-700">
                  <div className="font-bold mb-1">✨ Active Inspiration Boon</div>
                  <div className="text-green-600">
                    {subscriptionStatus.totalRemainingDays > 0 && (
                      <span>{subscriptionStatus.totalRemainingDays} days </span>
                    )}
                    {subscriptionStatus.totalRemainingHours > 0 && (
                      <span>{subscriptionStatus.totalRemainingHours} hours </span>
                    )}
                    {subscriptionStatus.totalRemainingMinutes > 0 && (
                      <span>{subscriptionStatus.totalRemainingMinutes} minutes</span>
                    )}
                    remaining
                  </div>
                  {subscriptionStatus.subscriptionDetails.length > 1 && (
                    <div className="text-green-500 mt-1">
                      🎯 Stacked: {subscriptionStatus.subscriptionDetails.length} subscriptions
                    </div>
                  )}
                  <div className="text-green-500 mt-1 text-xs">
                    💡 You can buy more subscriptions to extend your time!
                  </div>
                </div>
              ) : (
                <div className="text-orange-600">
                  <div className="font-bold">💡 No active subscription</div>
                  <div>Subscribe to start earning Sparks!</div>
                </div>
              )}
            </div>
          )}
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
            {subscriptionStatus?.hasActiveSubscription 
              ? '💡 Tip: Stack multiple subscriptions to extend your Inspiration Boon! (1 month + 1 month = 60 days total)'
              : '💡 Tip: Get the Inspiration Boon to earn Sparks from your focus sessions!'
            }
          </p>
        </div>
      </div>

      {/* Subscription Popup */}
      <SubscriptionPopup
        isOpen={showSubscriptionPopup}
        onClose={handleSubscriptionClose}
        onSuccess={handleSubscriptionSuccess}
      />
    </div>
  );
}
