'use client';

import { useComposeCast } from '@coinbase/onchainkit/minikit';
import { useState } from 'react';

interface CustomShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultText?: string;
  includeAppEmbed?: boolean;
}

export default function CustomShareDialog({ 
  isOpen, 
  onClose, 
  defaultText = '',
  includeAppEmbed = true 
}: CustomShareDialogProps) {
  const { composeCast } = useComposeCast();
  const [shareText, setShareText] = useState(defaultText);
  const [isSharing, setIsSharing] = useState(false);

  const handleCustomShare = async () => {
    if (!shareText.trim()) return;
    
    setIsSharing(true);
    
    try {
      const castOptions: any = { text: shareText };
      
      if (includeAppEmbed) {
        castOptions.embeds = [window.location.href];
      }
      
      await composeCast(castOptions);
      
      // Clear after sharing
      setShareText('');
      onClose();
    } catch (error) {
      console.error('Failed to share cast:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const handleClose = () => {
    setShareText('');
    onClose();
  };

  if (!isOpen) return null;

  const remainingChars = 280 - shareText.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Share Your Thoughts</h3>
            <button 
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
          </div>
          
          <div className="share-dialog">
            <textarea 
              value={shareText}
              onChange={(e) => setShareText(e.target.value)}
              placeholder="What would you like to share?"
              maxLength={280}
              className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <div className="share-actions flex justify-between items-center mt-4">
              <span className={`text-sm ${remainingChars < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                {remainingChars} characters remaining
              </span>
              <div className="flex space-x-2">
                <button 
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCustomShare}
                  disabled={!shareText.trim() || remainingChars < 0 || isSharing}
                  className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                    !shareText.trim() || remainingChars < 0 || isSharing
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {isSharing ? 'Sharing...' : 'Share Cast'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
