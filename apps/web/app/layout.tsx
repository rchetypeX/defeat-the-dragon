import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import './mobile-first.css';
import { AuthProvider } from '../contexts/AuthContext';
import { AudioProvider } from '../contexts/AudioContext';
import { MiniKitContextProvider } from '../providers/MiniKitProvider';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

// Import cleanup utility to clear old cached data
import '../lib/cleanupOldData';


const inter = Inter({ subsets: ['latin'] });

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://dtd.rchetype.xyz';
  
  // Use static metadata to avoid dynamic server usage errors
  const title = process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'Defeat the Dragon';
  const description = process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'A Pomodoro-style Focus RPG that gamifies productivity';
  const ogTitle = title;
  const ogDescription = description;
  const twitterTitle = title;
  const twitterDescription = description;
  
  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    keywords: ['focus', 'productivity', 'pomodoro', 'rpg', 'game', 'pixel art', 'dragon', 'base app'],
    authors: [{ name: 'Defeat the Dragon Team' }],
    creator: 'Defeat the Dragon',
    publisher: 'Defeat the Dragon',
    robots: 'index, follow',
    manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml', sizes: '32x32' },
      { url: '/favicon.ico', type: 'image/x-icon', sizes: '32x32' },
      { url: '/icon-simple.svg', type: 'image/svg+xml', sizes: '192x192' },
      { url: '/icon.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180' },
    ],
    shortcut: '/favicon.svg',
  },
      openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: process.env.NEXT_PUBLIC_URL || 'https://dtd.rchetype.xyz',
      siteName: 'Defeat the Dragon',
      images: [
        {
          url: '/og-image.webp',
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
      title: twitterTitle,
      description: twitterDescription,
      images: ['/og-image.webp'],
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
      // Frame metadata for social sharing (backward compatibility)
      'fc:frame': JSON.stringify({
        version: '1',
        imageUrl: process.env.NEXT_PUBLIC_APP_HERO_IMAGE || `${baseUrl}/og-image.webp`,
        button: {
          title: '🐉 Start Adventure',
          action: {
            type: 'launch_frame',
            name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'Defeat the Dragon',
            url: baseUrl,
            splashImageUrl: process.env.NEXT_PUBLIC_APP_SPLASH_IMAGE || `${baseUrl}/icon.png`,
            splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR || '#221afe',
          },
        },
      }),
      // Mini App metadata for Farcaster Mini Apps
      'fc:miniapp': JSON.stringify({
        version: '1',
        imageUrl: process.env.NEXT_PUBLIC_APP_HERO_IMAGE || `${baseUrl}/og-image.webp`,
        button: {
          title: '🐉 Start Adventure',
          action: {
            type: 'launch_miniapp',
            name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'Defeat the Dragon',
            url: baseUrl,
            splashImageUrl: process.env.NEXT_PUBLIC_APP_SPLASH_IMAGE || `${baseUrl}/icon.png`,
            splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR || '#221afe',
          },
        },
      }),
      // Universal Links domain metadata
      'fc:miniapp:domain': baseUrl,
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
        
        {/* Global error handler script */}
        <script dangerouslySetInnerHTML={{
          __html: `
            // Suppress non-critical network errors in development
            if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
              const originalError = console.error;
              console.error = function(...args) {
                const message = args.join(' ');
                // Filter out Coinbase analytics and other non-critical errors
                if (message.includes('cca-lite.coinbase.com') || 
                    message.includes('net::ERR_ABORTED 401') ||
                    message.includes('analyticsTracker') ||
                    message.includes('POST https://cca-lite.coinbase.com/metrics')) {
                  // Silently ignore these errors in development
                  return;
                }
                originalError.apply(console, args);
              };
            }
          `
        }} />
      </head>
      <body className={inter.className}>
        {/* Orientation warning for mobile landscape */}
        <div className="orientation-warning"></div>
        
        <MiniKitContextProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </MiniKitContextProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
