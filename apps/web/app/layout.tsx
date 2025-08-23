import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import { MiniKitContextProvider } from '../providers/MiniKitProvider';


const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
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
      { url: '/icon', type: 'image/png', sizes: '32x32' },
      { url: '/icon', type: 'image/png', sizes: '16x16' },
    ],
    apple: [
      { url: '/apple-icon', type: 'image/png', sizes: '180x180' },
    ],
    shortcut: '/icon',
  },
  openGraph: {
    title: 'Defeat the Dragon',
    description: 'A Pixel-art Pomodoro-style Focus RPG where you train to defeat the dragon through focused work sessions',
    url: process.env.NEXT_PUBLIC_URL || 'https://your-app.vercel.app',
    siteName: 'Defeat the Dragon',
    images: [
      {
        url: '/opengraph-image',
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
    images: ['/twitter-image'],
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
      imageUrl: process.env.NEXT_PUBLIC_APP_HERO_IMAGE,
      button: {
        title: `Launch ${process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'Defeat the Dragon'}`,
        action: {
          type: 'launch_frame',
          name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'Defeat the Dragon',
          url: process.env.NEXT_PUBLIC_URL || 'https://your-app.vercel.app',
          splashImageUrl: process.env.NEXT_PUBLIC_APP_SPLASH_IMAGE,
          splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR,
        },
      },
    }),
  },
};

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
        <link rel="icon" href="/icon" />
        <link rel="apple-touch-icon" href="/apple-icon" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Defeat the Dragon" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#7c2d12" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#7c2d12" />
      </head>
      <body className={inter.className}>
        <MiniKitContextProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </MiniKitContextProvider>
      </body>
    </html>
  );
}
