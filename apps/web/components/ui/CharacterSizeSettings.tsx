'use client';

import { useState } from 'react';
import { useCharacterSize, CharacterSize } from '../../hooks/useCharacterSize';

interface CharacterSizeSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CharacterSizeSettings({ isOpen, onClose }: CharacterSizeSettingsProps) {
  const { characterSize, setCharacterSize, resetToDefault, isLoading, error } = useCharacterSize();
  const [selectedSize, setSelectedSize] = useState<CharacterSize>(characterSize);

  if (!isOpen) return null;

  const handleSave = async () => {
    await setCharacterSize(selectedSize);
    onClose();
  };

  const handleReset = async () => {
    await resetToDefault();
    setSelectedSize('small');
    onClose();
  };

  const sizeOptions: { value: CharacterSize; label: string; description: string }[] = [
    {
      value: 'small',
      label: 'Small',
      description: 'New default size - characters take up less screen space'
    },
    {
      value: 'medium',
      label: 'Medium',
      description: 'Current size - characters are larger and more prominent'
    },
    {
      value: 'large',
      label: 'Large',
      description: 'Accessibility size - characters are very large for better visibility'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="pixel-card p-6 max-w-md w-full bg-white">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Character Size</h2>
          <p className="text-gray-600 text-sm">
            Choose how large your character appears on screen
          </p>
        </div>

        {/* Size Options */}
        <div className="space-y-3 mb-6">
          {sizeOptions.map((option) => (
            <label
              key={option.value}
              className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                selectedSize === option.value
                  ? 'border-[#8B4513] bg-[#f5f5dc]'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                name="characterSize"
                value={option.value}
                checked={selectedSize === option.value}
                onChange={(e) => setSelectedSize(e.target.value as CharacterSize)}
                className="mr-3 mt-1"
              />
              <div>
                <div className="font-semibold text-gray-800">{option.label}</div>
                <div className="text-sm text-gray-600">{option.description}</div>
              </div>
            </label>
          ))}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleReset}
            disabled={isLoading}
            className="pixel-button bg-[#6b7280] hover:bg-[#4b5563] text-white px-4 py-2 text-sm"
          >
            Reset to Default
          </button>
          <button
            onClick={onClose}
            className="pixel-button bg-[#6b7280] hover:bg-[#4b5563] text-white px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || selectedSize === characterSize}
            className="pixel-button bg-[#059669] hover:bg-[#047857] text-white px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-4 text-center text-xs text-gray-500">
          <p>💡 Tip: Small size is recommended for most users</p>
          <p>🔧 Old accounts can reset to use the new default size</p>
        </div>
      </div>
    </div>
  );
}
