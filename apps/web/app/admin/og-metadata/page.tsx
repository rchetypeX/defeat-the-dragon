'use client';

import { useState, useEffect } from 'react';

interface OGMetadata {
  id: string;
  page_path: string;
  title: string;
  description: string;
  keywords: string;
  og_title: string;
  og_description: string;
  og_image_url: string;
  twitter_title: string;
  twitter_description: string;
  twitter_image_url: string;
  twitter_card_type: string;
  created_at: string;
  updated_at: string;
}

export default function OGMetadataAdmin() {
  const [metadata, setMetadata] = useState<OGMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    try {
      const response = await fetch('/api/og-metadata?path=/');
      if (response.ok) {
        const data = await response.json();
        setMetadata(data);
      }
    } catch (error) {
      console.error('Error fetching metadata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/og-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pagePath: '/',
          ...metadata,
        }),
      });

      if (response.ok) {
        setMessage('Metadata updated successfully!');
        await fetchMetadata(); // Refresh the data
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.error}`);
      }
    } catch (error) {
      setMessage('Error updating metadata');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof OGMetadata, value: string) => {
    if (metadata) {
      setMetadata({ ...metadata, [field]: value });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Open Graph Metadata Management
        </h1>

        {message && (
          <div className={`p-4 mb-6 rounded-lg ${
            message.includes('Error') 
              ? 'bg-red-100 text-red-700 border border-red-300' 
              : 'bg-green-100 text-green-700 border border-green-300'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Metadata */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
                Basic Metadata
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Page Path
                </label>
                <input
                  type="text"
                  value={metadata?.page_path || '/'}
                  onChange={(e) => handleChange('page_path', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={metadata?.title || ''}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Page title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={metadata?.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Page description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Keywords
                </label>
                <input
                  type="text"
                  value={metadata?.keywords || ''}
                  onChange={(e) => handleChange('keywords', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="focus, productivity, pomodoro, rpg"
                />
              </div>
            </div>

            {/* Open Graph Metadata */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
                Open Graph Metadata
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  OG Title
                </label>
                <input
                  type="text"
                  value={metadata?.og_title || ''}
                  onChange={(e) => handleChange('og_title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Open Graph title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  OG Description
                </label>
                <textarea
                  value={metadata?.og_description || ''}
                  onChange={(e) => handleChange('og_description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Open Graph description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  OG Image URL
                </label>
                <input
                  type="url"
                  value={metadata?.og_image_url || ''}
                  onChange={(e) => handleChange('og_image_url', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://dtd.rchetype.xyz/opengraph-image"
                />
              </div>
            </div>

            {/* Twitter Metadata */}
            <div className="space-y-4 md:col-span-2">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
                Twitter Card Metadata
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Twitter Title
                  </label>
                  <input
                    type="text"
                    value={metadata?.twitter_title || ''}
                    onChange={(e) => handleChange('twitter_title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Twitter card title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Twitter Card Type
                  </label>
                  <select
                    value={metadata?.twitter_card_type || 'summary_large_image'}
                    onChange={(e) => handleChange('twitter_card_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="summary">Summary</option>
                    <option value="summary_large_image">Summary Large Image</option>
                    <option value="app">App</option>
                    <option value="player">Player</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Twitter Description
                </label>
                <textarea
                  value={metadata?.twitter_description || ''}
                  onChange={(e) => handleChange('twitter_description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Twitter card description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Twitter Image URL
                </label>
                <input
                  type="url"
                  value={metadata?.twitter_image_url || ''}
                  onChange={(e) => handleChange('twitter_image_url', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://dtd.rchetype.xyz/twitter-image"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={fetchMetadata}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Preview Section */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Preview</h2>
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
            <div className="max-w-md">
              <div className="text-sm text-gray-500 mb-2">Open Graph Preview</div>
              <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
                <div className="aspect-video bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">Image Preview</span>
                </div>
                <div className="p-3">
                  <div className="text-sm text-blue-600 mb-1">dtd.rchetype.xyz</div>
                  <div className="font-semibold text-gray-900 mb-1">
                    {metadata?.og_title || 'Title'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {metadata?.og_description || 'Description'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
