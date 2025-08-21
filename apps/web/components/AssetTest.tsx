'use client';

import { useState } from 'react';

export function AssetTest() {
  const [loadedAssets, setLoadedAssets] = useState<string[]>([]);
  const [failedAssets, setFailedAssets] = useState<string[]>([]);

  const assets = [
    '/assets/images/forest-background.png', // FOREST BACKGROUND - PRIORITY
    '/assets/ui/level-name-card.png',
    '/assets/ui/gold-card.png',
    '/assets/ui/sparks-card.png',
    '/assets/ui/focus-button.png',
    '/assets/icons/settings.png',
    '/assets/icons/sound.png',
    '/assets/icons/shop.png',
    '/assets/icons/inventory.png',
    '/assets/sprites/character.png',
  ];

  console.log('🔍 AssetTest component is rendering!');
  console.log('🔥 ASSET TEST PANEL - COMPONENT UPDATED!');

  const handleImageLoad = (src: string) => {
    console.log(`✅ Asset loaded: ${src}`);
    setLoadedAssets(prev => [...prev, src]);
  };

  const handleImageError = (src: string) => {
    console.error(`❌ Asset failed to load: ${src}`);
    setFailedAssets(prev => [...prev, src]);
  };

  return (
    <div className="fixed top-4 right-4 bg-black bg-opacity-90 text-white p-4 rounded z-50 max-w-xs border-2 border-red-500">
      <h3 className="font-bold mb-2 text-red-400">🔍 ASSET TEST PANEL</h3>
      
      <div className="mb-2">
        <strong>✅ Loaded ({loadedAssets.length}):</strong>
        <ul className="text-xs">
          {loadedAssets.map(asset => (
            <li key={asset} className={`${asset.includes('forest-background') ? 'text-yellow-400 font-bold' : 'text-green-400'}`}>
              {asset.split('/').pop()}
              {asset.includes('forest-background') && ' 🌲'}
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-2">
        <strong>❌ Failed ({failedAssets.length}):</strong>
        <ul className="text-xs">
          {failedAssets.map(asset => (
            <li key={asset} className="text-red-400">{asset.split('/').pop()}</li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {assets.map(asset => (
          <div key={asset} className="text-center">
            <img
              src={asset}
              alt="Test"
              className="w-8 h-8 pixel-art border border-white"
              onLoad={() => handleImageLoad(asset)}
              onError={() => handleImageError(asset)}
            />
            <div className="text-xs mt-1">{asset.split('/').pop()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
