'use client';

import { useState } from 'react';
import { useShareExtensionActions, SharedCast } from '../hooks/useShareExtension';

interface ShareExtensionUIProps {
  sharedCast: SharedCast;
  className?: string;
}

export function ShareExtensionUI({ sharedCast, className = '' }: ShareExtensionUIProps) {
  const { createFocusChallenge, shareAchievement, analyzeCastContent } = useShareExtensionActions();
  const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);
  const [isSharingAchievement, setIsSharingAchievement] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const handleCreateChallenge = async () => {
    try {
      setIsCreatingChallenge(true);
      const challenge = await createFocusChallenge(sharedCast);
      console.log('✅ Challenge created:', challenge);
      alert(`Focus challenge created for @${sharedCast.author.username}!`);
    } catch (error) {
      console.error('❌ Failed to create challenge:', error);
      alert('Failed to create focus challenge');
    } finally {
      setIsCreatingChallenge(false);
    }
  };

  const handleShareAchievement = async () => {
    try {
      setIsSharingAchievement(true);
      const achievement = await shareAchievement(sharedCast, 'Focus Master');
      console.log('✅ Achievement shared:', achievement);
      alert(`Achievement shared for @${sharedCast.author.username}!`);
    } catch (error) {
      console.error('❌ Failed to share achievement:', error);
      alert('Failed to share achievement');
    } finally {
      setIsSharingAchievement(false);
    }
  };

  const handleAnalyzeContent = async () => {
    try {
      setIsAnalyzing(true);
      const result = await analyzeCastContent(sharedCast);
      setAnalysis(result);
      console.log('✅ Analysis completed:', result);
    } catch (error) {
      console.error('❌ Failed to analyze content:', error);
      alert('Failed to analyze cast content');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className={`bg-white/10 backdrop-blur-sm rounded-lg p-6 ${className}`}>
      {/* Cast Information */}
      <div className="mb-6">
        <h3 className="text-white font-semibold text-lg mb-4">📱 Shared Cast</h3>
        
        <div className="flex items-center space-x-4 mb-4">
          {sharedCast.author.pfpUrl && (
            <img
              src={sharedCast.author.pfpUrl}
              alt={sharedCast.author.displayName || sharedCast.author.username}
              className="w-12 h-12 rounded-full"
            />
          )}
          <div>
            <h4 className="text-white font-medium">
              {sharedCast.author.displayName || `@${sharedCast.author.username}`}
            </h4>
            <p className="text-gray-300 text-sm">FID: {sharedCast.author.fid}</p>
          </div>
        </div>
        
        <div className="bg-black/20 rounded-lg p-4 mb-4">
          <p className="text-white text-sm">{sharedCast.text}</p>
        </div>
        
        <div className="text-gray-300 text-xs">
          <p>Cast Hash: {sharedCast.hash.slice(0, 10)}...</p>
          {sharedCast.timestamp && (
            <p>Shared: {new Date(sharedCast.timestamp).toLocaleString()}</p>
          )}
        </div>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="mb-6">
          <h3 className="text-white font-semibold text-lg mb-4">📊 Focus Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-purple-500/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-300">{analysis.focusScore}%</div>
              <div className="text-gray-300 text-sm">Focus Score</div>
            </div>
            <div className="bg-blue-500/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-300">{analysis.recommendedSessionDuration}min</div>
              <div className="text-gray-300 text-sm">Recommended Session</div>
            </div>
            <div className="bg-green-500/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-300">{analysis.focusStreak}</div>
              <div className="text-gray-300 text-sm">Focus Streak</div>
            </div>
          </div>
          
          {analysis.recommendations && (
            <div className="mt-4">
              <h4 className="text-white font-medium mb-2">💡 Recommendations</h4>
              <ul className="space-y-1">
                {analysis.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="text-gray-300 text-sm">• {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={handleAnalyzeContent}
          disabled={isAnalyzing}
          className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          {isAnalyzing ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Analyzing...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <span>📊</span>
              <span>Analyze Focus Patterns</span>
            </div>
          )}
        </button>

        <button
          onClick={handleCreateChallenge}
          disabled={isCreatingChallenge}
          className="w-full bg-green-500 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          {isCreatingChallenge ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Creating...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <span>🎯</span>
              <span>Create Focus Challenge</span>
            </div>
          )}
        </button>

        <button
          onClick={handleShareAchievement}
          disabled={isSharingAchievement}
          className="w-full bg-yellow-500 text-white px-4 py-3 rounded-lg font-semibold hover:bg-yellow-600 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          {isSharingAchievement ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Sharing...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <span>🏆</span>
              <span>Share Achievement</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}

// Component for share extension loading state
export function ShareExtensionLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <h2 className="text-white text-xl font-bold mb-2">Analyzing Cast...</h2>
        <p className="text-gray-300">Creating personalized focus experience</p>
      </div>
    </div>
  );
}

// Component for share extension error state
export function ShareExtensionError({ error }: { error: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 to-pink-900 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="text-red-400 text-6xl mb-4">⚠️</div>
        <h2 className="text-white text-xl font-bold mb-2">Share Extension Error</h2>
        <p className="text-gray-300 mb-4">{error}</p>
        <button
          onClick={() => window.location.href = '/'}
          className="bg-white text-red-900 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
        >
          Go to Main App
        </button>
      </div>
    </div>
  );
}
