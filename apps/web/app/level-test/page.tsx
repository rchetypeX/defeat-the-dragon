'use client';

import { useState } from 'react';

export default function LevelTestPage() {
  const [testXp, setTestXp] = useState(142);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testLevelCalculation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/test/level-calculation?xp=${testXp}`);
      const data = await response.json();
      
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Test failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fixPlayerLevels = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/fix-player-levels', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Fix failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const checkPlayerLevels = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/fix-player-levels');
      const data = await response.json();
      
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Check failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🐉 Level Calculation Test
          </h1>
          <p className="text-xl text-gray-300">
            Test and fix player level calculations
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Level Calculation Test */}
          <div className="pixel-card p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Test Level Calculation</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Test XP Amount:
              </label>
              <input
                type="number"
                value={testXp}
                onChange={(e) => setTestXp(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
                placeholder="Enter XP amount"
              />
            </div>

            <button
              onClick={testLevelCalculation}
              disabled={loading}
              className="pixel-button w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
            >
              {loading ? 'Testing...' : 'Test Level Calculation'}
            </button>

            {result && result.testXp && (
              <div className="mt-4 p-4 bg-green-900/30 border border-green-500 rounded">
                <h3 className="text-green-400 font-bold mb-2">Test Results:</h3>
                <div className="text-sm text-gray-300 space-y-1">
                  <p>XP: {result.testXp}</p>
                  <p>Calculated Level: {result.result?.currentLevel}</p>
                  <p>Expected Level: {result.expectedLevel}</p>
                  <p>Match: {result.result?.currentLevel === result.expectedLevel ? '✅' : '❌'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Player Level Management */}
          <div className="pixel-card p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Player Level Management</h2>
            
            <div className="space-y-3">
              <button
                onClick={checkPlayerLevels}
                disabled={loading}
                className="pixel-button w-full py-2 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
              >
                {loading ? 'Checking...' : 'Check Player Levels'}
              </button>

              <button
                onClick={fixPlayerLevels}
                disabled={loading}
                className="pixel-button w-full py-2 px-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-600"
              >
                {loading ? 'Fixing...' : 'Fix All Player Levels'}
              </button>
            </div>

            {result && result.total_players && (
              <div className="mt-4 p-4 bg-blue-900/30 border border-blue-500 rounded">
                <h3 className="text-blue-400 font-bold mb-2">Player Status:</h3>
                <div className="text-sm text-gray-300 space-y-1">
                  <p>Total Players: {result.total_players}</p>
                  <p>Need Updates: {result.players_needing_update}</p>
                  {result.summary && (
                    <div>
                      <p className="font-semibold">Level Distribution:</p>
                      {Object.entries(result.summary.level_distribution).map(([level, count]) => (
                        <p key={level} className="ml-2">Level {level}: {count as number} players</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-6 pixel-card p-4">
            <div className="text-red-400 font-bold mb-2">Error:</div>
            <div className="text-red-300">{error}</div>
          </div>
        )}

        {/* Raw Results */}
        {result && (
          <div className="mt-6 pixel-card p-4">
            <h3 className="text-white font-bold mb-2">Raw Results:</h3>
            <pre className="text-xs text-gray-300 bg-gray-800 p-3 rounded overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 pixel-card p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Instructions</h2>
          <div className="space-y-3 text-gray-300">
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <p>Test the level calculation with different XP amounts to verify the logic is working correctly</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <p>Check current player levels to see which players need level corrections</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <p>Fix all player levels to correct any discrepancies</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
              <p>With 142 XP, the player should be at level 3 (requires 133 cumulative XP)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
