'use client';

import { useState, useRef, useEffect } from 'react';

interface ShopItem {
  id: string;
  name: string;
  price: number;
  currency: 'coins' | 'sparks';
  description?: string;
  image?: string;
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
  const popupRef = useRef<HTMLDivElement>(null);

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

  const handlePurchase = (item: ShopItem) => {
    // TODO: Implement purchase logic
    console.log(`Purchasing ${item.name} for ${item.price} ${item.currency}`);
  };

  const handleSubscription = () => {
    // TODO: Implement Inspiration Boon purchase logic
    console.log('Inspiration Boon purchase clicked');
    alert('Inspiration Boon purchase coming soon! This will allow you to earn Sparks from successful focus sessions.');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div 
        ref={popupRef}
        className="bg-[#f5f5dc] border-4 border-[#8B4513] rounded-lg p-3 sm:p-6 w-full max-w-sm sm:max-w-2xl h-[90vh] sm:h-auto flex flex-col pixel-art"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-3 sm:mb-6 flex-shrink-0">
          <h2 className="text-lg sm:text-2xl font-bold text-[#8B4513]">🏪 Shop</h2>
          <button
            onClick={onClose}
            className="text-[#8B4513] hover:text-[#654321] text-xl sm:text-2xl font-bold"
          >
            ×
          </button>
        </div>

                   {/* Inspiration Boon Button */}
           <div className="mb-3 sm:mb-6 flex-shrink-0">
             <button
               onClick={handleSubscription}
               className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] border-2 border-[#8B4513] text-[#8B4513] font-bold py-2 sm:py-3 px-3 sm:px-4 rounded hover:from-[#FFA500] hover:to-[#FF8C00] transition-all duration-200 shadow-lg text-xs sm:text-sm"
             >
                               ✨ Inspiration Boon! Earn Sparks from Focus Sessions!
             </button>
           </div>

                 {/* Tabs */}
         <div className="flex justify-center space-x-1 sm:space-x-2 mb-3 sm:mb-6 flex-shrink-0">
          <button
            onClick={() => setActiveTab('character')}
            className={`px-2 sm:px-4 py-1 sm:py-2 font-bold rounded border-2 transition-all text-xs sm:text-sm ${
              activeTab === 'character'
                ? 'bg-[#8B4513] text-[#f5f5dc] border-[#8B4513]'
                : 'bg-[#f5f5dc] text-[#8B4513] border-[#8B4513] hover:bg-[#e8e8d0]'
            }`}
          >
            🧙‍♂️ Character
          </button>
          <button
            onClick={() => setActiveTab('background')}
            className={`px-2 sm:px-4 py-1 sm:py-2 font-bold rounded border-2 transition-all text-xs sm:text-sm ${
              activeTab === 'background'
                ? 'bg-[#8B4513] text-[#f5f5dc] border-[#8B4513]'
                : 'bg-[#f5f5dc] text-[#8B4513] border-[#8B4513] hover:bg-[#e8e8d0]'
            }`}
          >
            🖼️ Background
          </button>
        </div>

                 {/* Items Grid - Compact Square Cards */}
         <div className="flex-1">
           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
             {shopItems[activeTab].map((item) => (
               <div
                 key={item.id}
                 className="aspect-square border-2 border-[#8B4513] rounded p-2 sm:p-3 transition-colors flex flex-col justify-between bg-[#e8e8d0] hover:bg-[#d8d8c0]"
               >
                 <div className="text-center flex-1 flex flex-col justify-center">
                   {(activeTab === 'character' || activeTab === 'background') && item.image ? (
                     <div className="mb-2">
                       <img 
                         src={item.image} 
                         alt={item.name}
                         className={`mx-auto object-contain ${
                           activeTab === 'character' 
                             ? 'w-12 h-12 sm:w-16 sm:h-16' 
                             : 'w-16 h-12 sm:w-20 sm:h-16 rounded'
                         }`}
                       />
                     </div>
                   ) : (
                     <div className="text-lg sm:text-xl mb-1">
                       {activeTab === 'character' && '🧙‍♂️'}
                       {activeTab === 'background' && '🖼️'}
                     </div>
                   )}
                   <h3 className="font-bold text-[#8B4513] text-xs sm:text-sm">
                     {item.name}
                   </h3>
                 </div>
                 
                 <div className="text-center">
                   <div className="flex justify-center items-center space-x-1 mb-1">
                     <span className="text-[#8B4513] font-bold text-xs sm:text-sm">
                       {item.price}
                     </span>
                     <span className="text-xs sm:text-sm">
                       {item.currency === 'coins' ? '🪙' : '✨'}
                     </span>
                   </div>
                   <button
                     onClick={() => handlePurchase(item)}
                     className="w-full bg-[#8B4513] text-[#f5f5dc] px-1 py-1 rounded font-bold hover:bg-[#654321] transition-colors text-xs"
                   >
                     Buy
                   </button>
                 </div>
               </div>
             ))}
           </div>
         </div>

                 {/* Footer */}
         <div className="mt-3 sm:mt-6 text-center flex-shrink-0">
           <p className="text-[#654321] text-xs sm:text-sm">
             💡 Tip: Get the Inspiration Boon to earn Sparks from your focus sessions!
           </p>
         </div>
      </div>
    </div>
  );
}
