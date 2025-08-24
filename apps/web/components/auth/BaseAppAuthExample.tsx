'use client';

import { useBaseAppAuth } from '../../hooks/useBaseAppAuth';

export function BaseAppAuthExample() {
  const {
    verifiedUser,
    isAuthenticated,
    contextUser,
    contextFid,
    isLoading,
    isBaseApp,
    signIn,
    signOut,
  } = useBaseAppAuth();

  return (
    <div className="p-4 bg-[#1a1a2e] border border-[#8b4513] rounded-lg">
      <h3 className="text-lg font-bold text-[#f2751a] mb-4">🔐 Base App Authentication</h3>
      
      {/* Base App Detection */}
      <div className="mb-4">
        <span className="text-sm text-[#fbbf24]">Environment: </span>
        <span className={`text-sm font-bold ${isBaseApp ? 'text-green-400' : 'text-gray-400'}`}>
          {isBaseApp ? 'Base App' : 'Web Browser'}
        </span>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="mb-4 text-sm text-[#fbbf24]">
          ⏳ Loading authentication...
        </div>
      )}

      {/* Context Data (Safe for Analytics Only) */}
      <div className="mb-4 p-3 bg-[#2d1b0e] border border-[#654321] rounded">
        <h4 className="text-sm font-bold text-[#f2751a] mb-2">📊 Context Data (Analytics Only)</h4>
        <div className="text-xs text-[#fbbf24] space-y-1">
          <div>FID: {contextFid || 'Not available'}</div>
          <div>User: {contextUser ? 'Available' : 'Not available'}</div>
          <div className="text-gray-400 text-xs mt-2">
            ⚠️ Context data can be spoofed - use for analytics only
          </div>
        </div>
      </div>

      {/* Cryptographic Verification (Safe for Auth) */}
      <div className="mb-4 p-3 bg-[#2d1b0e] border border-[#654321] rounded">
        <h4 className="text-sm font-bold text-[#f2751a] mb-2">🔐 Cryptographic Verification (Auth)</h4>
        <div className="text-xs text-[#fbbf24] space-y-1">
          <div>Authenticated: {isAuthenticated ? '✅ Yes' : '❌ No'}</div>
          <div>Verified User: {verifiedUser ? '✅ Available' : '❌ Not available'}</div>
          <div className="text-green-400 text-xs mt-2">
            ✅ Cryptographically verified - safe for authentication
          </div>
        </div>
      </div>

      {/* Auth Actions */}
      <div className="space-y-2">
        {!isAuthenticated ? (
          <button
            onClick={signIn}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-[#f2751a] hover:bg-[#e65a0a] disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors rounded text-white text-sm font-bold"
          >
            {isLoading ? 'Signing In...' : 'Sign In with Base App'}
          </button>
        ) : (
          <button
            onClick={signOut}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-[#dc2626] hover:bg-[#b91c1c] disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors rounded text-white text-sm font-bold"
          >
            {isLoading ? 'Signing Out...' : 'Sign Out'}
          </button>
        )}
      </div>

      {/* Best Practices Reminder */}
      <div className="mt-4 p-3 bg-[#1a1a2e] border border-[#f2751a] rounded text-xs">
        <h4 className="font-bold text-[#f2751a] mb-2">📋 Best Practices</h4>
        <ul className="text-[#fbbf24] space-y-1">
          <li>✅ Use <code>verifiedUser</code> for authentication</li>
          <li>✅ Use <code>contextFid</code> for analytics only</li>
          <li>❌ Never use context data for primary auth</li>
          <li>✅ Gate wallet only at point of onchain action</li>
        </ul>
      </div>
    </div>
  );
}
