import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import './mobile-first.css';
import { AuthProvider } from '../contexts/AuthContext';
import { MiniKitContextProvider } from '../providers/MiniKitProvider';



const inter = Inter({ subsets: ['latin'] });

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://dtd.rchetype.xyz';
  
  return {
    metadataBase: new URL(baseUrl),
    title: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'Defeat the Dragon',
    description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'A Pixel-art Pomodoro-style Focus RPG where you train to defeat the dragon through focused work sessions',
    keywords: ['focus', 'productivity', 'pomodoro', 'rpg', 'game', 'pixel art', 'dragon', 'base app'],
    authors: [{ name: 'Defeat the Dragon Team' }],
    creator: 'Defeat the Dragon',
    publisher: 'Defeat the Dragon',
    robots: 'index, follow',
    manifest: '/manifest.json',
  icons: {
    icon: [
      { url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><rect width='32' height='32' rx='4' fill='%23f2751a'/><text x='16' y='22' font-family='Arial' font-size='16' font-weight='bold' text-anchor='middle' fill='white'>D</text></svg>", type: 'image/svg+xml', sizes: '32x32' },
      { url: '/favicon.svg', type: 'image/svg+xml', sizes: '32x32' },
      { url: '/favicon.ico', type: 'image/x-icon', sizes: '32x32' },
      { url: '/icon-simple.svg', type: 'image/svg+xml', sizes: '192x192' },
      { url: '/icon.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180' },
    ],
    shortcut: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><rect width='32' height='32' rx='4' fill='%23f2751a'/><text x='16' y='22' font-family='Arial' font-size='16' font-weight='bold' text-anchor='middle' fill='white'>D</text></svg>",
  },
      openGraph: {
      title: 'Defeat the Dragon',
      description: 'A Pixel-art Pomodoro-style Focus RPG where you train to defeat the dragon through focused work sessions',
      url: process.env.NEXT_PUBLIC_URL || 'https://your-app.vercel.app',
      siteName: 'Defeat the Dragon',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'Defeat the Dragon - Focus RPG',
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
      twitter: {
      card: 'summary_large_image',
      title: 'Defeat the Dragon',
      description: 'A Pixel-art Pomodoro-style Focus RPG where you train to defeat the dragon through focused work sessions',
      images: ['/og-image.png'],
      creator: '@defeatdragon',
    },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'Defeat the Dragon',
  },
  formatDetection: {
    telephone: false,
  },
      other: {
      'fc:frame': JSON.stringify({
        version: 'next',
        imageUrl: process.env.NEXT_PUBLIC_APP_HERO_IMAGE || `${baseUrl}/og-image.png`,
        button: {
          title: `Launch ${process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'Defeat the Dragon'}`,
          action: {
            type: 'launch_frame',
            name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'Defeat the Dragon',
            url: baseUrl,
            splashImageUrl: process.env.NEXT_PUBLIC_APP_SPLASH_IMAGE || `${baseUrl}/og-image.png`,
            splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR || '#1a1a2e',
          },
        },
      }),
    },
  };
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#7c2d12',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
              <head>
          <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><rect width='32' height='32' rx='4' fill='%23f2751a'/><text x='16' y='22' font-family='Arial' font-size='16' font-weight='bold' text-anchor='middle' fill='white'>D</text></svg>" type="image/svg+xml" />
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
          <link rel="icon" href="/favicon.ico" type="image/x-icon" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="Defeat the Dragon" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="msapplication-TileColor" content="#7c2d12" />
          <meta name="msapplication-tap-highlight" content="no" />
          <meta name="theme-color" content="#7c2d12" />
          {/* Lock to portrait mode */}
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <meta name="full-screen" content="yes" />
          <meta name="x5-fullscreen" content="true" />
          <meta name="360-fullscreen" content="true" />

        </head>
      <body className={inter.className}>
        {/* Orientation warning for mobile landscape */}
        <div className="orientation-warning"></div>
        
        <MiniKitContextProvider>
          <AuthProvider>
            {children}

          </AuthProvider>
        </MiniKitContextProvider>
      </body>
    </html>
  );
}
