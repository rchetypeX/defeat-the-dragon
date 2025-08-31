import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import './mobile-first.css';
import { AudioProvider } from '../contexts/AudioContext';
import { AuthProvider } from '../contexts/AuthContext';
import { MiniKitContextProvider } from '../providers/MiniKitProvider';
import * as Sentry from '@sentry/nextjs';

import { initWebVitals } from '../lib/web-vitals';
import { appLogger } from '../lib/logger';

// Initialize monitoring
if (typeof window !== 'undefined') {
  // Initialize Web Vitals monitoring
  initWebVitals();
  
  // Log app initialization
  appLogger.info('App initialized in browser', {
    user_agent: navigator.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
  });
}

const inter = Inter({ subsets: ['latin'] });

export function generateMetadata(): Metadata {
  return {
    title: 'Defeat the Dragon: Focus RPG',
    description: 'A Pomodoro-style Focus RPG that gamifies productivity',
    manifest: '/manifest.json',
    icons: {
      icon: '/favicon.png',
      apple: '/apple-touch-icon.png',
    },
    viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
    themeColor: '#221afe',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'Defeat the Dragon: Focus RPG',
    },
    openGraph: {
      title: 'Defeat the Dragon: Focus RPG',
      description: 'Level up your productivity with this pixel-art Pomodoro RPG',
      url: 'https://dtd.rchetype.xyz/',
      siteName: 'Defeat the Dragon: Focus RPG',
      images: [
        {
          url: '/og-image.webp',
          width: 1200,
          height: 630,
          alt: 'Defeat the Dragon: Focus RPG',
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Defeat the Dragon: Focus RPG',
      description: 'Pomodoro-style Focus RPG',
      images: ['/og-image.webp'],
    },
    other: {
      ...Sentry.getTraceData()
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="Defeat the Dragon: Focus RPG" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Defeat the Dragon: Focus RPG" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#221afe" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/favicon.png" color="#221afe" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:creator" content="@yourusername" />
        <meta name="twitter:site" content="@yourusername" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <MiniKitContextProvider>
            <AudioProvider>
              {children}
            </AudioProvider>
          </MiniKitContextProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
