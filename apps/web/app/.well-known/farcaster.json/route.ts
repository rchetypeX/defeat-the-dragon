function withValidProperties(properties: Record<string, undefined | string | string[]>) {
  return Object.fromEntries(
    Object.entries(properties).filter(([_, value]) => (Array.isArray(value) ? value.length > 0 : !!value))
  );
}

export async function GET(request: Request) {
  try {
    const URL = process.env.NEXT_PUBLIC_URL || 'https://dtd.rchetype.xyz';
    
    const manifest = {
      accountAssociation: {
        header: process.env.FARCASTER_HEADER || '',
        payload: process.env.FARCASTER_PAYLOAD || '',
        signature: process.env.FARCASTER_SIGNATURE || '',
      },
      baseBuilder: {
        allowedAddresses: ["0xdc05E6f1d506A509C26A33C9Fcd178890DB2a97b"] // Your Base Build wallet address
      },
      frame: withValidProperties({
        version: '1',
        name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'Defeat the Dragon',
        subtitle: process.env.NEXT_PUBLIC_APP_SUBTITLE || 'Focus RPG with Pomodoro',
        description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'A pixel-art, ad-free, Pomodoro-style Focus RPG PWA that gamifies productivity',
        screenshotUrls: [
          `${URL.replace(/\/$/, '')}/screenshots/gameplay-1.png`,
          `${URL.replace(/\/$/, '')}/screenshots/focus-session.png`,
          `${URL.replace(/\/$/, '')}/screenshots/character-select.png`
        ],
        iconUrl: process.env.NEXT_PUBLIC_APP_ICON || `${URL}/icon.png`,
        splashImageUrl: process.env.NEXT_PUBLIC_APP_SPLASH_IMAGE || `${URL}/og-image.webp`,
        splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR || '#1a1a2e',
        homeUrl: URL,
        webhookUrl: `${URL}/api/webhook`,
        primaryCategory: process.env.NEXT_PUBLIC_APP_PRIMARY_CATEGORY || 'gaming',
        tags: ['productivity', 'pomodoro', 'rpg', 'focus', 'gamification'],
        heroImageUrl: process.env.NEXT_PUBLIC_APP_HERO_IMAGE || `${URL}/og-image.webp`,
        tagline: process.env.NEXT_PUBLIC_APP_TAGLINE || 'Turn focus into adventure!',
        ogTitle: process.env.NEXT_PUBLIC_APP_OG_TITLE || 'Defeat the Dragon - Focus RPG',
        ogDescription: process.env.NEXT_PUBLIC_APP_OG_DESCRIPTION || 'Level up your productivity with this pixel-art Pomodoro RPG',
        ogImageUrl: process.env.NEXT_PUBLIC_APP_OG_IMAGE || `${URL}/og-image.webp`,
      }),
      // Set to true for testing, false for production
      noindex: process.env.NODE_ENV === 'development',
    };

    return Response.json(manifest);
  } catch (error) {
    console.error('Error generating Farcaster manifest:', error);
    return Response.json(
      { error: 'Failed to generate manifest' },
      { status: 500 }
    );
  }
}
