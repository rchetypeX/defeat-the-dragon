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
  
  // Try to fetch dynamic metadata from database
  let dynamicMetadata = null;
  try {
    const response = await fetch(`${baseUrl}/api/og-metadata?path=/`, {
      cache: 'no-store' // Don't cache this to get fresh data
    });
    if (response.ok) {
      dynamicMetadata = await response.json();
    }
  } catch (error) {
    console.error('Failed to fetch dynamic metadata:', error);
  }
  
  // Use dynamic metadata if available, otherwise fall back to defaults
  const title = dynamicMetadata?.title || process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'Defeat the Dragon';
  const description = dynamicMetadata?.description || process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'A Pomodoro-style Focus RPG that gamifies productivity';
  const ogTitle = dynamicMetadata?.og_title || title;
  const ogDescription = dynamicMetadata?.og_description || description;
  const twitterTitle = dynamicMetadata?.twitter_title || title;
  const twitterDescription = dynamicMetadata?.twitter_description || description;
  
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
          url: dynamicMetadata?.og_image_url || '/og-image.webp',
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
      images: [dynamicMetadata?.twitter_image_url || '/og-image.webp'],
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
        imageUrl: process.env.NEXT_PUBLIC_APP_HERO_IMAGE || `${baseUrl}/og-image.webp`,
        button: {
          title: `Launch ${process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'Defeat the Dragon'}`,
          action: {
            type: 'launch_frame',
            name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'Defeat the Dragon',
            url: baseUrl,
            splashImageUrl: process.env.NEXT_PUBLIC_APP_SPLASH_IMAGE || `${baseUrl}/icon.png`,
            splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR || '#221afe',
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
