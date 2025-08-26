export async function GET() {
  try {
    const URL = process.env.NEXT_PUBLIC_URL || 'https://dtd.rchetype.xyz';
    
    const manifest = {
      accountAssociation: {
        header: process.env.FARCASTER_HEADER || '',
        payload: process.env.FARCASTER_PAYLOAD || '',
        signature: process.env.FARCASTER_SIGNATURE || '',
      },
      baseBuilder: {
        allowedAddresses: ["0x0000000000000000000000000000000000000000"]
      },
      frame: {
        version: '1',
        name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'Defeat the Dragon',
        subtitle: process.env.NEXT_PUBLIC_APP_SUBTITLE || 'Pomodoro-style Focus RPG',
description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'A Pomodoro-style Focus RPG that gamifies productivity',
        screenshotUrls: [],
        iconUrl: process.env.NEXT_PUBLIC_APP_ICON || `${URL}/icon.png`,
        splashImageUrl: process.env.NEXT_PUBLIC_APP_SPLASH_IMAGE || `${URL}/icon.png`,
        splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR || '#221afe',
        homeUrl: URL,
        webhookUrl: `${URL}/api/webhook`,
        primaryCategory: process.env.NEXT_PUBLIC_APP_PRIMARY_CATEGORY || 'gaming',
        tags: ['productivity', 'pomodoro', 'rpg', 'focus', 'gamification'],
        heroImageUrl: process.env.NEXT_PUBLIC_APP_HERO_IMAGE || `${URL}/og-image.webp`,
        tagline: process.env.NEXT_PUBLIC_APP_TAGLINE || 'Turn focus into adventure!',
        ogTitle: process.env.NEXT_PUBLIC_APP_OG_TITLE || 'Defeat the Dragon - Focus RPG',
        ogDescription: process.env.NEXT_PUBLIC_APP_OG_DESCRIPTION || 'Level up your productivity with this pixel-art Pomodoro RPG',
        ogImageUrl: process.env.NEXT_PUBLIC_APP_OG_IMAGE || `${URL}/og-image.webp`,
        noindex: true,
      },
    };

    return Response.json(manifest);
  } catch (error) {
    console.error('Error generating test manifest:', error);
    return Response.json(
      { error: 'Failed to generate manifest', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
