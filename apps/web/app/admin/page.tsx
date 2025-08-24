'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface ShopItem {
  id: string;
  item_key: string;
  name: string;
  price: number;
  currency: 'coins' | 'sparks';
  description: string | null;
  image_url: string | null;
  category: 'character' | 'background';
  is_active: boolean;
  sort_order: number;
}

interface DialogueItem {
  id: string;
  dialogue_text: string;
  dialogue_type: 'general' | 'motivational' | 'achievement' | 'greeting';
  weight: number;
  is_active: boolean;
}

interface RewardItem {
  id: string;
  session_type: string;
  duration_minutes: number;
  base_xp: number;
  base_coins: number;
  base_sparks: number;
  bonus_multiplier: number;
  is_active: boolean;
}

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'shop' | 'dialogue' | 'rewards'>('shop');
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [dialogueItems, setDialogueItems] = useState<DialogueItem[]>([]);
  const [rewardItems, setRewardItems] = useState<RewardItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is admin (you should implement proper admin role checking)
  const isAdmin = user?.email === 'admin@defeatthedragon.com' || user?.email?.includes('admin');

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin, activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      switch (activeTab) {
        case 'shop':
          const shopResponse = await fetch('/api/master/shop-items');
          if (shopResponse.ok) {
            const shopData = await shopResponse.json();
            setShopItems(shopData.data);
          }
          break;
        case 'dialogue':
          const dialogueResponse = await fetch('/api/master/character-dialogue');
          if (dialogueResponse.ok) {
            const dialogueData = await dialogueResponse.json();
            setDialogueItems(dialogueData.data);
          }
          break;
        case 'rewards':
          const rewardsResponse = await fetch('/api/master/session-rewards');
          if (rewardsResponse.ok) {
            const rewardsData = await rewardsResponse.json();
            setRewardItems(rewardsData.data);
          }
          break;
      }
    } catch (err) {
      setError('Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateShopItem = async (id: string, updates: Partial<ShopItem>) => {
    try {
      const response = await fetch('/api/master/shop-items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });

      if (response.ok) {
        loadData(); // Reload data
      } else {
        setError('Failed to update shop item');
      }
    } catch (err) {
      setError('Error updating shop item');
      console.error('Error:', err);
    }
  };

  const updateDialogue = async (id: string, updates: Partial<DialogueItem>) => {
    try {
      const response = await fetch('/api/master/character-dialogue', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });

      if (response.ok) {
        loadData(); // Reload data
      } else {
        setError('Failed to update dialogue');
      }
    } catch (err) {
      setError('Error updating dialogue');
      console.error('Error:', err);
    }
  };

  const updateReward = async (id: string, updates: Partial<RewardItem>) => {
    try {
      const response = await fetch('/api/master/session-rewards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });

      if (response.ok) {
        loadData(); // Reload data
      } else {
        setError('Failed to update reward');
      }
    } catch (err) {
      setError('Error updating reward');
      console.error('Error:', err);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Admin Access Required</h1>
          <p>Please log in to access the admin panel.</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>You don't have permission to access the admin panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-[#fbbf24]">🛠️ Admin Panel</h1>
        
        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('shop')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'shop'
                ? 'bg-[#f2751a] text-white'
                : 'bg-[#2d1b0e] text-gray-300 hover:bg-[#3d2b1e]'
            }`}
          >
            🏪 Shop Items
          </button>
          <button
            onClick={() => setActiveTab('dialogue')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'dialogue'
                ? 'bg-[#f2751a] text-white'
                : 'bg-[#2d1b0e] text-gray-300 hover:bg-[#3d2b1e]'
            }`}
          >
            💬 Character Dialogue
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'rewards'
                ? 'bg-[#f2751a] text-white'
                : 'bg-[#2d1b0e] text-gray-300 hover:bg-[#3d2b1e]'
            }`}
          >
            🏆 Session Rewards
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="text-center py-8">
            <div className="text-[#fbbf24]">Loading...</div>
          </div>
        )}

        {/* Shop Items Tab */}
        {activeTab === 'shop' && !isLoading && (
          <div className="bg-[#2d1b0e] rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6 text-[#fbbf24]">Shop Items Management</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#8b4513]">
                    <th className="text-left p-3">Item Key</th>
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Price</th>
                    <th className="text-left p-3">Currency</th>
                    <th className="text-left p-3">Category</th>
                    <th className="text-left p-3">Active</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shopItems.map((item) => (
                    <tr key={item.id} className="border-b border-[#8b4513]/30">
                      <td className="p-3">{item.item_key}</td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => {
                            const updatedItems = shopItems.map(i => 
                              i.id === item.id ? { ...i, name: e.target.value } : i
                            );
                            setShopItems(updatedItems);
                          }}
                          className="bg-[#1a1a2e] border border-[#8b4513] rounded px-2 py-1 text-white"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => {
                            const updatedItems = shopItems.map(i => 
                              i.id === item.id ? { ...i, price: parseInt(e.target.value) } : i
                            );
                            setShopItems(updatedItems);
                          }}
                          className="bg-[#1a1a2e] border border-[#8b4513] rounded px-2 py-1 text-white w-20"
                        />
                      </td>
                      <td className="p-3">
                        <select
                          value={item.currency}
                          onChange={(e) => {
                            const updatedItems = shopItems.map(i => 
                              i.id === item.id ? { ...i, currency: e.target.value as 'coins' | 'sparks' } : i
                            );
                            setShopItems(updatedItems);
                          }}
                          className="bg-[#1a1a2e] border border-[#8b4513] rounded px-2 py-1 text-white"
                        >
                          <option value="coins">Coins</option>
                          <option value="sparks">Sparks</option>
                        </select>
                      </td>
                      <td className="p-3">{item.category}</td>
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={item.is_active}
                          onChange={(e) => {
                            const updatedItems = shopItems.map(i => 
                              i.id === item.id ? { ...i, is_active: e.target.checked } : i
                            );
                            setShopItems(updatedItems);
                          }}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => updateShopItem(item.id, {
                            name: item.name,
                            price: item.price,
                            currency: item.currency,
                            is_active: item.is_active
                          })}
                          className="bg-[#f2751a] hover:bg-[#e65a0a] px-3 py-1 rounded text-white text-xs"
                        >
                          Save
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Character Dialogue Tab */}
        {activeTab === 'dialogue' && !isLoading && (
          <div className="bg-[#2d1b0e] rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6 text-[#fbbf24]">Character Dialogue Management</h2>
            <div className="space-y-4">
              {dialogueItems.map((dialogue) => (
                <div key={dialogue.id} className="border border-[#8b4513] rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Dialogue Text</label>
                      <textarea
                        value={dialogue.dialogue_text}
                        onChange={(e) => {
                          const updatedDialogues = dialogueItems.map(d => 
                            d.id === dialogue.id ? { ...d, dialogue_text: e.target.value } : d
                          );
                          setDialogueItems(updatedDialogues);
                        }}
                        className="w-full bg-[#1a1a2e] border border-[#8b4513] rounded px-3 py-2 text-white"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Type</label>
                      <select
                        value={dialogue.dialogue_type}
                        onChange={(e) => {
                          const updatedDialogues = dialogueItems.map(d => 
                            d.id === dialogue.id ? { ...d, dialogue_type: e.target.value as any } : d
                          );
                          setDialogueItems(updatedDialogues);
                        }}
                        className="w-full bg-[#1a1a2e] border border-[#8b4513] rounded px-3 py-2 text-white"
                      >
                        <option value="general">General</option>
                        <option value="motivational">Motivational</option>
                        <option value="achievement">Achievement</option>
                        <option value="greeting">Greeting</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Weight</label>
                      <input
                        type="number"
                        value={dialogue.weight}
                        onChange={(e) => {
                          const updatedDialogues = dialogueItems.map(d => 
                            d.id === dialogue.id ? { ...d, weight: parseInt(e.target.value) } : d
                          );
                          setDialogueItems(updatedDialogues);
                        }}
                        className="w-full bg-[#1a1a2e] border border-[#8b4513] rounded px-3 py-2 text-white"
                        min="1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={dialogue.is_active}
                        onChange={(e) => {
                          const updatedDialogues = dialogueItems.map(d => 
                            d.id === dialogue.id ? { ...d, is_active: e.target.checked } : d
                          );
                          setDialogueItems(updatedDialogues);
                        }}
                        className="w-4 h-4 mr-2"
                      />
                      Active
                    </label>
                    <button
                      onClick={() => updateDialogue(dialogue.id, {
                        dialogue_text: dialogue.dialogue_text,
                        dialogue_type: dialogue.dialogue_type,
                        weight: dialogue.weight,
                        is_active: dialogue.is_active
                      })}
                      className="bg-[#f2751a] hover:bg-[#e65a0a] px-4 py-2 rounded text-white"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Session Rewards Tab */}
        {activeTab === 'rewards' && !isLoading && (
          <div className="bg-[#2d1b0e] rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6 text-[#fbbf24]">Session Rewards Management</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#8b4513]">
                    <th className="text-left p-3">Session Type</th>
                    <th className="text-left p-3">Duration (min)</th>
                    <th className="text-left p-3">Base XP</th>
                    <th className="text-left p-3">Base Coins</th>
                    <th className="text-left p-3">Base Sparks</th>
                    <th className="text-left p-3">Multiplier</th>
                    <th className="text-left p-3">Active</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rewardItems.map((reward) => (
                    <tr key={reward.id} className="border-b border-[#8b4513]/30">
                      <td className="p-3">{reward.session_type}</td>
                      <td className="p-3">{reward.duration_minutes}</td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={reward.base_xp}
                          onChange={(e) => {
                            const updatedRewards = rewardItems.map(r => 
                              r.id === reward.id ? { ...r, base_xp: parseInt(e.target.value) } : r
                            );
                            setRewardItems(updatedRewards);
                          }}
                          className="bg-[#1a1a2e] border border-[#8b4513] rounded px-2 py-1 text-white w-20"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={reward.base_coins}
                          onChange={(e) => {
                            const updatedRewards = rewardItems.map(r => 
                              r.id === reward.id ? { ...r, base_coins: parseInt(e.target.value) } : r
                            );
                            setRewardItems(updatedRewards);
                          }}
                          className="bg-[#1a1a2e] border border-[#8b4513] rounded px-2 py-1 text-white w-20"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={reward.base_sparks}
                          onChange={(e) => {
                            const updatedRewards = rewardItems.map(r => 
                              r.id === reward.id ? { ...r, base_sparks: parseInt(e.target.value) } : r
                            );
                            setRewardItems(updatedRewards);
                          }}
                          className="bg-[#1a1a2e] border border-[#8b4513] rounded px-2 py-1 text-white w-20"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          step="0.1"
                          value={reward.bonus_multiplier}
                          onChange={(e) => {
                            const updatedRewards = rewardItems.map(r => 
                              r.id === reward.id ? { ...r, bonus_multiplier: parseFloat(e.target.value) } : r
                            );
                            setRewardItems(updatedRewards);
                          }}
                          className="bg-[#1a1a2e] border border-[#8b4513] rounded px-2 py-1 text-white w-20"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={reward.is_active}
                          onChange={(e) => {
                            const updatedRewards = rewardItems.map(r => 
                              r.id === reward.id ? { ...r, is_active: e.target.checked } : r
                            );
                            setRewardItems(updatedRewards);
                          }}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => updateReward(reward.id, {
                            base_xp: reward.base_xp,
                            base_coins: reward.base_coins,
                            base_sparks: reward.base_sparks,
                            bonus_multiplier: reward.bonus_multiplier,
                            is_active: reward.is_active
                          })}
                          className="bg-[#f2751a] hover:bg-[#e65a0a] px-3 py-1 rounded text-white text-xs"
                        >
                          Save
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
