'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { sdk } from '@farcaster/miniapp-sdk';

interface SharedCast {
  author: {
    fid: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
  };
  hash: string;
  text: string;
  timestamp?: number;
}

// Loading component for Suspense fallback
function SharePageLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <h2 className="text-white text-xl font-bold">Analyzing Cast...</h2>
      </div>
    </div>
  );
}

// Main component that uses useSearchParams
function SharePageContent() {
  const searchParams = useSearchParams();
  const [sharedCast, setSharedCast] = useState<SharedCast | null>(null);
  const [isShareContext, setIsShareContext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const castHash = searchParams.get('castHash');
  const castFid = searchParams.get('castFid');
  const viewerFid = searchParams.get('viewerFid');

  useEffect(() => {
    const handleShareExtension = async () => {
      try {
        // Check URL parameters (immediate access)
        if (castHash && castFid) {
          console.log('🔗 Share Extension via URL:', { castHash, castFid, viewerFid });
          setIsShareContext(true);
          
          // Mock cast data
          const mockCast: SharedCast = {
            author: {
              fid: parseInt(castFid),
              username: `user${castFid}`,
              displayName: `User ${castFid}`,
              pfpUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${castFid}`
            },
            hash: castHash,
            text: `Shared cast from user ${castFid}. Let's create a focus challenge!`,
            timestamp: Date.now()
          };
          setSharedCast(mockCast);
        }

        // Check SDK context
        const context = await sdk.context;
        if (context.location.type === 'cast_share') {
          console.log('🔗 Share Extension via SDK');
          setIsShareContext(true);
          setSharedCast(context.location.cast);
        }
      } catch (err) {
        console.error('❌ Share extension error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    handleShareExtension();
  }, [castHash, castFid, viewerFid]);

  if (isLoading) {
    return <SharePageLoading />;
  }

  if (isShareContext && sharedCast) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 p-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-white text-center mb-8">🐉 Cast Analysis</h1>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-4 mb-4">
              {sharedCast.author.pfpUrl && (
                <img src={sharedCast.author.pfpUrl} alt="Author" className="w-12 h-12 rounded-full" />
              )}
              <div>
                <h3 className="text-white font-semibold">
                  {sharedCast.author.displayName || `@${sharedCast.author.username}`}
                </h3>
                <p className="text-gray-300 text-sm">FID: {sharedCast.author.fid}</p>
              </div>
            </div>
            
            <div className="bg-black/20 rounded-lg p-4 mb-4">
              <p className="text-white">{sharedCast.text}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button className="bg-green-500 text-white px-6 py-4 rounded-lg font-semibold hover:bg-green-600">
              🎯 Create Focus Challenge
            </button>
            <button className="bg-yellow-500 text-white px-6 py-4 rounded-lg font-semibold hover:bg-yellow-600">
              🏆 Share Achievement
            </button>
          </div>

          <div className="text-center">
            <button
              onClick={() => window.location.href = '/'}
              className="bg-white/20 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/30"
            >
              🏠 Go to Main App
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <img 
            src="/logo.svg" 
            alt="Defeat the Dragon Logo" 
            className="h-16 w-16"
          />
        </div>
        <h2 className="text-white text-xl font-bold mb-4">Welcome to Defeat the Dragon</h2>
        <button
          onClick={() => window.location.href = '/'}
          className="bg-white text-purple-900 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100"
        >
          Start Your Adventure
        </button>
      </div>
    </div>
  );
}

// Main export with Suspense boundary
export default function SharePage() {
  return (
    <Suspense fallback={<SharePageLoading />}>
      <SharePageContent />
    </Suspense>
  );
}
