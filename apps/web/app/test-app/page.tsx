'use client';

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function TestAppPage() {
  const { user, signIn, signOut } = useAuth();
  const [testResult, setTestResult] = useState<string>('');

  const testAPI = async () => {
    try {
      const response = await fetch('/api/test');
      const data = await response.json();
      setTestResult(`API Test: ${JSON.stringify(data)}`);
    } catch (error) {
      setTestResult(`API Test Error: ${error}`);
    }
  };

  const testSupabase = async () => {
    try {
      const response = await fetch('/api/test-supabase');
      const data = await response.json();
      setTestResult(`Supabase Test: ${JSON.stringify(data)}`);
    } catch (error) {
      setTestResult(`Supabase Test Error: ${error}`);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">App Test Page</h1>
      
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          <p>User: {user ? 'Logged in' : 'Not logged in'}</p>
          {user && (
            <div className="mt-2 text-sm text-gray-600">
              <p>Email: {user.email}</p>
              <p>ID: {user.id}</p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">API Tests</h2>
          <div className="space-x-4">
            <button 
              onClick={testAPI}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Test Basic API
            </button>
            <button 
              onClick={testSupabase}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Test Supabase
            </button>
          </div>
          {testResult && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <pre className="text-sm">{testResult}</pre>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Icon Tests</h2>
          <div className="space-x-4">
            <a 
              href="/icon" 
              target="_blank"
              className="inline-block bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            >
              View Favicon
            </a>
            <a 
              href="/opengraph-image" 
              target="_blank"
              className="inline-block bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
            >
              View Social Image
            </a>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Navigation</h2>
          <div className="space-x-4">
            <a 
              href="/" 
              className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Go to Main App
            </a>
            <a 
              href="/admin" 
              className="inline-block bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Go to Admin Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
