// Pixel art spacing system - based on 8px grid with pixel-perfect scaling
export const spacing = {
  // Base spacing units (8px grid)
  xs: '4px',    // 0.5 * 8px
  sm: '8px',    // 1 * 8px
  md: '16px',   // 2 * 8px
  lg: '24px',   // 3 * 8px
  xl: '32px',   // 4 * 8px
  '2xl': '48px', // 6 * 8px
  '3xl': '64px', // 8 * 8px
  '4xl': '96px', // 12 * 8px
  
  // Pixel art specific spacing
  pixel: {
    // Character sprite spacing
    spriteSize: '96px',     // 32px * 3 (base sprite at 3x scale)
    spritePadding: '8px',   // Space between sprites
    spriteMargin: '16px',   // Margin around sprite containers
    
    // UI element spacing
    buttonPadding: '12px 16px',
    cardPadding: '16px',
    modalPadding: '24px',
    inputPadding: '8px 12px',
    
    // Layout spacing
    sectionGap: '32px',
    componentGap: '16px',
    elementGap: '8px',
  }
} as const;

// Layout breakpoints for responsive design
export const breakpoints = {
  mobile: '320px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1440px',
} as const;

// Container max widths
export const containers = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Border radius values
export const borderRadius = {
  none: '0px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
  
  // Pixel art specific
  pixel: '0px', // Sharp corners for pixel art aesthetic
} as const;

// Shadow values
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  
  // Pixel art specific shadows
  pixel: {
    // Sharp, pixelated shadows
    sm: '2px 2px 0px rgba(0, 0, 0, 0.3)',
    md: '4px 4px 0px rgba(0, 0, 0, 0.3)',
    lg: '6px 6px 0px rgba(0, 0, 0, 0.3)',
  }
} as const;

// Z-index scale
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const;
