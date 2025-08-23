'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface ShopItem {
  id: string;
  sku: string;
  name: string;
  price: number;
  price_sale: number;
  type: string;
  class_lock: string | null;
  is_active: boolean;
  created_at: string;
}

interface Subscription {
  id: string;
  user_id: string;
  subscription_type: string;
  status: string;
  provider: string | null;
  user_tag: string | null;
  auto_tag_enabled: boolean;
  created_at: string;
  players: {
    display_name: string;
    wallet_address: string;
  };
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'shop' | 'subscriptions'>('shop');
  
  // Shop management
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [newShopItem, setNewShopItem] = useState({
    sku: '',
    name: '',
    price: 0,
    price_sale: 0,
    type: '',
    class_lock: '',
    is_active: true
  });
  
  // Subscription management
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [newSubscription, setNewSubscription] = useState({
    user_id: '',
    subscription_type: '',
    status: 'active',
    provider: 'admin',
    auto_tag_enabled: true
  });

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/admin/shop');
      if (response.ok) {
        setIsAdmin(true);
        loadShopItems();
        loadSubscriptions();
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const loadShopItems = async () => {
    try {
      const response = await fetch('/api/admin/shop');
      if (response.ok) {
        const data = await response.json();
        setShopItems(data.data || []);
      }
    } catch (error) {
      console.error('Error loading shop items:', error);
    }
  };

  const loadSubscriptions = async () => {
    try {
      const response = await fetch('/api/admin/subscriptions');
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data.data || []);
      }
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    }
  };

  const addShopItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newShopItem)
      });
      
      if (response.ok) {
        setNewShopItem({
          sku: '',
          name: '',
          price: 0,
          price_sale: 0,
          type: '',
          class_lock: '',
          is_active: true
        });
        loadShopItems();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error adding shop item:', error);
      alert('Failed to add shop item');
    }
  };

  const updateShopItem = async (id: string, updates: Partial<ShopItem>) => {
    try {
      const response = await fetch('/api/admin/shop', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      });
      
      if (response.ok) {
        loadShopItems();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating shop item:', error);
      alert('Failed to update shop item');
    }
  };

  const addSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSubscription)
      });
      
      if (response.ok) {
        setNewSubscription({
          user_id: '',
          subscription_type: '',
          status: 'active',
          provider: 'admin',
          auto_tag_enabled: true
        });
        loadSubscriptions();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error adding subscription:', error);
      alert('Failed to add subscription');
    }
  };

  const updateSubscription = async (id: string, updates: Partial<Subscription>) => {
    try {
      const response = await fetch('/api/admin/subscriptions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      });
      
      if (response.ok) {
        loadSubscriptions();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      alert('Failed to update subscription');
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <p className="text-red-500">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('shop')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'shop'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Shop Management
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'subscriptions'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Subscription Management
        </button>
      </div>

      {/* Shop Management Tab */}
      {activeTab === 'shop' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Add New Shop Item</h2>
            <form onSubmit={addShopItem} className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="SKU"
                value={newShopItem.sku}
                onChange={(e) => setNewShopItem({...newShopItem, sku: e.target.value})}
                className="border rounded px-3 py-2"
                required
              />
              <input
                type="text"
                placeholder="Name"
                value={newShopItem.name}
                onChange={(e) => setNewShopItem({...newShopItem, name: e.target.value})}
                className="border rounded px-3 py-2"
                required
              />
              <input
                type="number"
                placeholder="Price"
                value={newShopItem.price}
                onChange={(e) => setNewShopItem({...newShopItem, price: parseInt(e.target.value)})}
                className="border rounded px-3 py-2"
                required
              />
              <input
                type="number"
                placeholder="Sale Price"
                value={newShopItem.price_sale}
                onChange={(e) => setNewShopItem({...newShopItem, price_sale: parseInt(e.target.value)})}
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Type"
                value={newShopItem.type}
                onChange={(e) => setNewShopItem({...newShopItem, type: e.target.value})}
                className="border rounded px-3 py-2"
                required
              />
              <input
                type="text"
                placeholder="Class Lock (optional)"
                value={newShopItem.class_lock}
                onChange={(e) => setNewShopItem({...newShopItem, class_lock: e.target.value})}
                className="border rounded px-3 py-2"
              />
              <div className="col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newShopItem.is_active}
                    onChange={(e) => setNewShopItem({...newShopItem, is_active: e.target.checked})}
                    className="mr-2"
                  />
                  Active
                </label>
              </div>
              <button
                type="submit"
                className="col-span-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Add Item
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Shop Items</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">SKU</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Price</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shopItems.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="p-2">{item.sku}</td>
                      <td className="p-2">{item.name}</td>
                      <td className="p-2">${item.price}</td>
                      <td className="p-2">{item.type}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-2">
                        <button
                          onClick={() => updateShopItem(item.id, { is_active: !item.is_active })}
                          className="text-blue-600 hover:text-blue-800 mr-2"
                        >
                          Toggle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Management Tab */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Add New Subscription</h2>
            <form onSubmit={addSubscription} className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="User ID"
                value={newSubscription.user_id}
                onChange={(e) => setNewSubscription({...newSubscription, user_id: e.target.value})}
                className="border rounded px-3 py-2"
                required
              />
              <input
                type="text"
                placeholder="Subscription Type"
                value={newSubscription.subscription_type}
                onChange={(e) => setNewSubscription({...newSubscription, subscription_type: e.target.value})}
                className="border rounded px-3 py-2"
                required
              />
              <select
                value={newSubscription.status}
                onChange={(e) => setNewSubscription({...newSubscription, status: e.target.value})}
                className="border rounded px-3 py-2"
              >
                <option value="active">Active</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
              </select>
              <input
                type="text"
                placeholder="Provider"
                value={newSubscription.provider}
                onChange={(e) => setNewSubscription({...newSubscription, provider: e.target.value})}
                className="border rounded px-3 py-2"
              />
              <div className="col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newSubscription.auto_tag_enabled}
                    onChange={(e) => setNewSubscription({...newSubscription, auto_tag_enabled: e.target.checked})}
                    className="mr-2"
                  />
                  Auto-tag enabled
                </label>
              </div>
              <button
                type="submit"
                className="col-span-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Add Subscription
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">User Subscriptions</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">User</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Tag</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="border-b">
                      <td className="p-2">
                        <div>
                          <div className="font-medium">{sub.players?.display_name || 'Unknown'}</div>
                          <div className="text-xs text-gray-500">{sub.user_id.slice(0, 8)}...</div>
                        </div>
                      </td>
                      <td className="p-2">{sub.subscription_type}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          sub.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          sub.user_tag === 'subscriber' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {sub.user_tag || 'free_user'}
                        </span>
                      </td>
                      <td className="p-2">
                        <button
                          onClick={() => updateSubscription(sub.id, { 
                            status: sub.status === 'active' ? 'cancelled' : 'active' 
                          })}
                          className="text-blue-600 hover:text-blue-800 mr-2"
                        >
                          Toggle Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
