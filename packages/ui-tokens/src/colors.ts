// Pixel art color palette - Defeat the Dragon theme (based on mockup)
export const colors = {
  // Primary palette (orange/amber - like the START button)
  primary: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f2751a', // Main orange (from mockup START button)
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
  
  // Secondary palette (green/forest - like the background)
  secondary: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e', // Main green (forest background)
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  
  // Success colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  
  // Warning colors
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  // Error colors
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  
  // Neutral grays
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  
  // Pixel art specific colors (from mockup)
  pixel: {
    // Character colors (from the tiny adventurer)
    skin: '#ffdbac',
    hair: '#8b4513',
    armor: '#8B4513', // Brown armor from mockup
    weapon: '#C0C0C0', // Silver sword from mockup
    shield: '#8B4513', // Brown shield with metallic rim
    
    // Environment colors (from forest background)
    grass: '#228B22', // Forest green
    dirt: '#8B4513', // Brown dirt paths
    tree: '#228B22', // Tree foliage
    treeTrunk: '#654321', // Dark brown tree trunks
    hut: '#8B4513', // Brown huts/houses
    
    // UI colors (from mockup)
    ui: {
      background: '#228B22', // Forest green background
      surface: '#8B4513', // Brown UI elements
      border: '#654321', // Dark brown border (thick pixelated border)
      text: '#ffffff', // White text
      textSecondary: '#fbbf24', // Gold text for currency
      button: '#f2751a', // Orange START button
      healthBar: '#ef4444', // Red health bar
    }
  },
  
  // High contrast mode colors
  highContrast: {
    background: '#000000',
    surface: '#1a1a1a',
    text: '#ffffff',
    textSecondary: '#cccccc',
    border: '#ffffff',
    primary: '#ffff00',
    secondary: '#00ffff',
    success: '#00ff00',
    warning: '#ffaa00',
    error: '#ff0000',
  }
} as const;

// Color utility functions
export const getContrastColor = (backgroundColor: string): string => {
  // Simple contrast calculation - in production, use a proper color contrast library
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#ffffff';
};

// Accessibility color utilities
export const getAccessibleTextColor = (
  backgroundColor: string,
  highContrast: boolean = false
): string => {
  if (highContrast) {
    return colors.highContrast.text;
  }
  return getContrastColor(backgroundColor);
};
