'use client';

import { useState } from 'react';
import { useFarcasterAuth, FarcasterUser } from '../../hooks/useFarcasterAuth';

interface FarcasterAuthProps {
  onSuccess?: (user: FarcasterUser) => void;
  onError?: (error: string) => void;
  className?: string;
  showUserInfo?: boolean;
}

export function FarcasterAuth({ 
  onSuccess, 
  onError, 
  className = '',
  showUserInfo = true 
}: FarcasterAuthProps) {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    quickAuth,
    signIn,
    signOut,
  } = useFarcasterAuth();

  const [isQuickAuthLoading, setIsQuickAuthLoading] = useState(false);
  const [isSignInLoading, setIsSignInLoading] = useState(false);

  const handleQuickAuth = async () => {
    try {
      setIsQuickAuthLoading(true);
      const user = await quickAuth();
      if (user) {
        onSuccess?.(user);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Quick Auth failed';
      onError?.(errorMessage);
    } finally {
      setIsQuickAuthLoading(false);
    }
  };

  const handleSignIn = async () => {
    try {
      setIsSignInLoading(true);
      const user = await signIn();
      if (user) {
        onSuccess?.(user);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign In failed';
      onError?.(errorMessage);
    } finally {
      setIsSignInLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign Out failed';
      onError?.(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-sm text-gray-600">Loading...</span>
      </div>
    );
  }

  if (isAuthenticated && user && showUserInfo) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-3">
          {user.pfp && (
            <img
              src={user.pfp}
              alt={user.displayName || user.username || 'User'}
              className="w-10 h-10 rounded-full"
            />
          )}
          <div className="flex-1">
            <div className="font-medium text-gray-900">
              {user.displayName || user.username || `FID: ${user.fid}`}
            </div>
            {user.username && (
              <div className="text-sm text-gray-500">@{user.username}</div>
            )}
            <div className="text-xs text-gray-400">FID: {user.fid}</div>
          </div>
          <button
            onClick={handleSignOut}
            className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
          >
            Sign Out
          </button>
        </div>
        
        {user.verifiedAddresses && user.verifiedAddresses.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500 mb-1">Verified Addresses:</div>
            <div className="space-y-1">
              {user.verifiedAddresses.map((address, index) => (
                <div key={index} className="text-xs font-mono text-gray-600">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-sm text-red-600">{error}</div>
        </div>
      )}

      <div className="space-y-2">
        <button
          onClick={handleQuickAuth}
          disabled={isQuickAuthLoading}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {isQuickAuthLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <span>🔐</span>
          )}
          <span>{isQuickAuthLoading ? 'Authenticating...' : 'Quick Auth with Farcaster'}</span>
        </button>

        <div className="text-center text-xs text-gray-500">or</div>

        <button
          onClick={handleSignIn}
          disabled={isSignInLoading}
          className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {isSignInLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <span>⚡</span>
          )}
          <span>{isSignInLoading ? 'Signing In...' : 'Sign In with Farcaster'}</span>
        </button>
      </div>

      <div className="text-xs text-gray-500 text-center space-y-1">
        <div>Quick Auth: Instant authentication with JWT</div>
        <div>Sign In: Traditional Sign in with Farcaster flow</div>
      </div>
    </div>
  );
}

// Hook to get Farcaster user context
export function useFarcasterUser() {
  const { user, isAuthenticated, isLoading } = useFarcasterAuth();
  
  return {
    user,
    isAuthenticated,
    isLoading,
    fid: user?.fid,
    username: user?.username,
    displayName: user?.displayName,
    pfp: user?.pfp,
    verifiedAddresses: user?.verifiedAddresses,
    authAddress: user?.authAddress,
  };
}
