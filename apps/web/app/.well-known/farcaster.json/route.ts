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
        allowedAddresses: [
          "0x1a9Fce96e04ba06D9190339DF817b43837fa0eA9"  // Your Base Account address for mini app ownership
        ]
      },
      miniapp: withValidProperties({
        version: '1',
        name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'Defeat the Dragon: Focus RPG',
        subtitle: process.env.NEXT_PUBLIC_APP_SUBTITLE || 'Focus RPG',
        description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'A Pomodoro-style Focus RPG that gamifies productivity',
        screenshotUrls: [
          `${URL.replace(/\/$/, '')}/screenshots/gameplay-1.png`,
          `${URL.replace(/\/$/, '')}/screenshots/focus-session.png`,
          `${URL.replace(/\/$/, '')}/screenshots/character-select.png`
        ],
        iconUrl: process.env.NEXT_PUBLIC_APP_ICON || `${URL}/icon.png`,
        splashImageUrl: process.env.NEXT_PUBLIC_APP_SPLASH_IMAGE || `${URL}/icon.png`,
        splashBackgroundColor: '#060945',
        homeUrl: URL,
        castShareUrl: `${URL}/share`,
        webhookUrl: `${URL}/api/webhook`,
        primaryCategory: 'games',
        tags: ['focus', 'rpg', 'pomodoro', 'productivity', 'dragon'],
        heroImageUrl: process.env.NEXT_PUBLIC_APP_HERO_IMAGE || `${URL}/og-image.webp`,
        tagline: process.env.NEXT_PUBLIC_APP_TAGLINE || 'Turn focus into adventure!',
        ogTitle: process.env.NEXT_PUBLIC_APP_OG_TITLE || 'Defeat the Dragon: Focus RPG',
        ogDescription: process.env.NEXT_PUBLIC_APP_OG_DESCRIPTION || 'A Pomodoro-style Focus RPG that gamifies productivity',
        ogImageUrl: process.env.NEXT_PUBLIC_APP_OG_IMAGE || `${URL}/og-image.webp`,
        // Required capabilities for wallet integration
        requiredCapabilities: [
          'actions.signIn',
          'wallet.getEthereumProvider',
          'actions.ready'
        ],
        // Required chains (Base network)
        requiredChains: [
          'eip155:8453' // Base mainnet
        ],
        // Canonical domain for frame application
        canonicalDomain: 'dtd.rchetype.xyz'
      }),
              // Set to true for testing, false for production
        // IMPORTANT: Set to false for production to enable search indexing
        noindex: process.env.NODE_ENV === 'development' || process.env.FARCASTER_NOINDEX === 'false',
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
