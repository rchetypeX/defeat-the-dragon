'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { syncService } from '../../lib/syncService';

export default function TestAuthPage() {
  const { user, loading } = useAuth();
  const [testResult, setTestResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testSync = async () => {
    try {
      setError(null);
      const result = await syncService.loadUserData();
      setTestResult(result);
      console.log('Test auth result:', result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Test auth error:', err);
    }
  };

  const testInventory = async () => {
    try {
      setError(null);
      const response = await fetch('/api/inventory', {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      const result = await response.json();
      setTestResult(result);
      console.log('Test inventory result:', result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Test inventory error:', err);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Authentication Test Page</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Auth Status:</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm">
          {JSON.stringify({ user: user ? { id: user.id, email: user.email } : null, loading }, null, 2)}
        </pre>
      </div>

      <div className="space-y-4">
        <button
          onClick={testSync}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test User Sync
        </button>
        
        <button
          onClick={testInventory}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Test Inventory API
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {testResult && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">Test Result:</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
