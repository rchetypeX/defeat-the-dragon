export async function GET() {
  try {
    const URL = process.env.NEXT_PUBLIC_URL || 'https://defeat-the-dragon-app.vercel.app';
    
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
        subtitle: process.env.NEXT_PUBLIC_APP_SUBTITLE || 'Focus RPG with Pomodoro',
        description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'A pixel-art, ad-free, Pomodoro-style Focus RPG PWA that gamifies productivity',
        screenshotUrls: [],
        iconUrl: process.env.NEXT_PUBLIC_APP_ICON || `${URL}/icons/icon-192x192.png`,
        splashImageUrl: process.env.NEXT_PUBLIC_APP_SPLASH_IMAGE || `${URL}/assets/images/forest-background.png`,
        splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR || '#1a1a2e',
        homeUrl: URL,
        webhookUrl: `${URL}/api/webhook`,
        primaryCategory: process.env.NEXT_PUBLIC_APP_PRIMARY_CATEGORY || 'gaming',
        tags: ['productivity', 'pomodoro', 'rpg', 'focus', 'gamification'],
        heroImageUrl: process.env.NEXT_PUBLIC_APP_HERO_IMAGE || `${URL}/assets/images/forest-background.png`,
        tagline: process.env.NEXT_PUBLIC_APP_TAGLINE || 'Defeat procrastination, one focus session at a time',
        ogTitle: process.env.NEXT_PUBLIC_APP_OG_TITLE || 'Defeat the Dragon - Focus RPG',
        ogDescription: process.env.NEXT_PUBLIC_APP_OG_DESCRIPTION || 'Level up your productivity with this pixel-art Pomodoro RPG',
        ogImageUrl: process.env.NEXT_PUBLIC_APP_OG_IMAGE || `${URL}/assets/images/forest-background.png`,
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
