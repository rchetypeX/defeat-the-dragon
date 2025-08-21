// Typography system for Defeat the Dragon
export const typography = {
  // Font families
  fonts: {
    // Primary font - pixel art style
    primary: '"Press Start 2P", "Courier New", monospace',
    
    // Dyslexia-friendly fonts
    dyslexia: {
      // OpenDyslexic is specifically designed for readers with dyslexia
      primary: '"OpenDyslexic", "Arial", sans-serif',
      // Alternative dyslexia-friendly fonts
      secondary: '"Comic Sans MS", "Arial", sans-serif',
      tertiary: '"Verdana", "Arial", sans-serif',
    },
    
    // Fallback fonts
    fallback: {
      sans: '"Arial", "Helvetica", sans-serif',
      serif: '"Times New Roman", "Georgia", serif',
      mono: '"Courier New", "Monaco", monospace',
    }
  },
  
  // Font sizes - pixel art scale
  fontSizes: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
    '5xl': '48px',
    '6xl': '60px',
    
    // Pixel art specific sizes
    pixel: {
      tiny: '8px',
      small: '12px',
      medium: '16px',
      large: '24px',
      huge: '32px',
    }
  },
  
  // Font weights
  fontWeights: {
    thin: 100,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },
  
  // Line heights
  lineHeights: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
    
    // Dyslexia-friendly line heights (more spacing)
    dyslexia: {
      tight: 1.5,
      normal: 1.75,
      relaxed: 2,
      loose: 2.5,
    }
  },
  
  // Letter spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
    
    // Dyslexia-friendly letter spacing (more space between letters)
    dyslexia: {
      normal: '0.1em',
      wide: '0.15em',
      wider: '0.2em',
    }
  },
  
  // Text styles for common use cases
  textStyles: {
    // Headings
    h1: {
      fontSize: '2.25rem', // 36px
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontSize: '1.875rem', // 30px
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontSize: '1.5rem', // 24px
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '-0.025em',
    },
    h4: {
      fontSize: '1.25rem', // 20px
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '-0.025em',
    },
    
    // Body text
    body: {
      fontSize: '1rem', // 16px
      fontWeight: 400,
      lineHeight: 1.6,
      letterSpacing: '0em',
    },
    bodyLarge: {
      fontSize: '1.125rem', // 18px
      fontWeight: 400,
      lineHeight: 1.6,
      letterSpacing: '0em',
    },
    
    // UI elements
    button: {
      fontSize: '0.875rem', // 14px
      fontWeight: 500,
      lineHeight: 1.4,
      letterSpacing: '0.025em',
    },
    caption: {
      fontSize: '0.75rem', // 12px
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0.025em',
    },
    
    // Pixel art specific
    pixel: {
      title: {
        fontSize: '1.5rem',
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: '0.05em',
        fontFamily: '"Press Start 2P", monospace',
      },
      dialogue: {
        fontSize: '1rem',
        fontWeight: 400,
        lineHeight: 1.5,
        letterSpacing: '0.025em',
        fontFamily: '"Press Start 2P", monospace',
      },
      ui: {
        fontSize: '0.875rem',
        fontWeight: 500,
        lineHeight: 1.4,
        letterSpacing: '0.025em',
        fontFamily: '"Press Start 2P", monospace',
      }
    },
    
    // Dyslexia-friendly styles
    dyslexia: {
      body: {
        fontSize: '1.125rem', // Larger font size
        fontWeight: 400,
        lineHeight: 1.75, // More line spacing
        letterSpacing: '0.1em', // More letter spacing
        fontFamily: '"OpenDyslexic", "Arial", sans-serif',
      },
      heading: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.5,
        letterSpacing: '0.1em',
        fontFamily: '"OpenDyslexic", "Arial", sans-serif',
      }
    }
  }
} as const;

// Utility function to get dyslexia-friendly typography
export const getDyslexiaTypography = (baseStyle: keyof typeof typography.textStyles) => {
  const base = typography.textStyles[baseStyle];
  const dyslexia = typography.textStyles.dyslexia;
  
  if (baseStyle === 'body' || baseStyle === 'bodyLarge') {
    return { ...base, ...dyslexia.body };
  }
  
  if (baseStyle.startsWith('h')) {
    return { ...base, ...dyslexia.heading };
  }
  
  return base;
};
