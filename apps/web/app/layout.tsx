import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import './mobile-first.css';
import { AudioProvider } from '../contexts/AudioContext';
import { AuthProvider } from '../contexts/AuthContext';
import { MiniKitContextProvider } from '../providers/MiniKitProvider';

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

export const metadata: Metadata = {
  title: 'Defeat the Dragon - Focus RPG',
  description: 'Transform focus sessions into an epic adventure with pixel art and gamification',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  themeColor: '#7c2d12',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Defeat the Dragon',
  },
  openGraph: {
    title: 'Defeat the Dragon - Focus RPG',
    description: 'Pixel-art Pomodoro-style Focus RPG',
    url: 'https://dtd.rchetype.xyz/',
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
    title: 'Defeat the Dragon - Focus RPG',
    description: 'Pixel-art Pomodoro-style Focus RPG',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="Defeat the Dragon" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Defeat the Dragon" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#7c2d12" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/favicon.svg" color="#7c2d12" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:url" content="https://dtd.rchetype.xyz/" />
        <meta name="twitter:title" content="Defeat the Dragon - Focus RPG" />
        <meta name="twitter:description" content="Pixel-art Pomodoro-style Focus RPG" />
        <meta name="twitter:image" content="/og-image.png" />
        <meta name="twitter:creator" content="@yourusername" />
        <meta name="twitter:site" content="@yourusername" />
        
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Defeat the Dragon - Focus RPG" />
        <meta property="og:description" content="Pixel-art Pomodoro-style Focus RPG" />
        <meta property="og:site_name" content="Defeat the Dragon" />
        <meta property="og:url" content="https://dtd.rchetype.xyz/" />
        <meta property="og:image" content="/og-image.png" />
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
