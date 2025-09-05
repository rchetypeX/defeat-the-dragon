import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import './mobile-first.css';
import { AudioProvider } from '../contexts/AudioContext';
import { AuthProvider } from '../contexts/AuthContext';
import { InventoryProvider } from '../contexts/InventoryContext';
import { SIWFProvider } from '../contexts/SIWFContext';
import { MiniKitContextProvider } from '../providers/MiniKitProvider';
import { WagmiProvider } from '../providers/WagmiProvider';


import { appLogger } from '../lib/logger';

// Initialize logging
if (typeof window !== 'undefined') {
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
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'Defeat the Dragon: Focus RPG',
    },
    openGraph: {
      title: 'Defeat the Dragon: Focus RPG',
      description: 'A Pomodoro-style Focus RPG that gamifies productivity',
      url: 'https://dtd.rchetype.xyz/',
      siteName: 'Defeat the Dragon: Focus RPG',
      images: [
        {
          url: 'https://dtd.rchetype.xyz/og-image.webp',
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
      description: 'A Pomodoro-style Focus RPG that gamifies productivity',
      images: ['https://dtd.rchetype.xyz/og-image.webp'],
    },
    other: {
      "fc:miniapp": JSON.stringify({
        version: "1",
        imageUrl: "https://dtd.rchetype.xyz/og-image.webp",
        button: {
          title: "Start Adventure",
          action: {
            type: "launch_frame",
            name: "Defeat the Dragon: Focus RPG",
            url: "https://dtd.rchetype.xyz",
            splashImageUrl: "https://dtd.rchetype.xyz/icon.png",
            splashBackgroundColor: "#060945"
          }
        }
      })
    }
  };
}

// Add separate viewport export to fix metadata warnings
export function generateViewport() {
  return {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: 'no',
    themeColor: '#060945',
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
        <meta name="msapplication-TileColor" content="#060945" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/favicon.png" color="#060945" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:creator" content="@yourusername" />
        <meta name="twitter:site" content="@yourusername" />
      </head>
      <body className={inter.className}>
        <WagmiProvider>
          <SIWFProvider>
            <AuthProvider>
              <InventoryProvider>
                <MiniKitContextProvider>
                  <AudioProvider>
                    {children}
                  </AudioProvider>
                </MiniKitContextProvider>
              </InventoryProvider>
            </AuthProvider>
          </SIWFProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}
