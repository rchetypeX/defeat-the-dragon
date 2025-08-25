'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { generateAlphaCodes } from '../../../lib/alphaCodeGenerator';

interface AlphaCode {
  id: string;
  code_hash: string;
  used: boolean;
  reserved_token: string | null;
  reserved_until: string | null;
  used_by: string | null;
  used_at: string | null;
  expires_at: string | null;
  notes: string | null;
  created_at: string;
}

interface AlphaCodeSummary {
  used: boolean | null;
  count: number;
}

export default function AlphaCodesAdmin() {
  const [codes, setCodes] = useState<AlphaCode[]>([]);
  const [summary, setSummary] = useState<AlphaCodeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [codeCount, setCodeCount] = useState(10);
  const [newCodes, setNewCodes] = useState<string[]>([]);
  const [showGenerated, setShowGenerated] = useState(false);
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchCodes();
    fetchSummary();
  }, []);

  const fetchCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('alpha_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCodes(data || []);
    } catch (error) {
      console.error('Error fetching codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const { data, error } = await supabase
        .from('alpha_codes_summary')
        .select('*');

      if (error) throw error;
      setSummary(data || []);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const generateCodes = () => {
    const generated = generateAlphaCodes(codeCount);
    setNewCodes(generated);
    setShowGenerated(true);
  };

  const addCodesToDatabase = async () => {
    if (newCodes.length === 0) return;

    setGenerating(true);
    try {
      // Note: This would require the service role key in a real admin panel
      // For now, we'll just show the codes that would be added
      console.log('Codes to add:', newCodes);
      alert(`Generated ${newCodes.length} codes. In production, these would be added to the database.`);
      
      // Reset
      setNewCodes([]);
      setShowGenerated(false);
    } catch (error) {
      console.error('Error adding codes:', error);
      alert('Error adding codes to database');
    } finally {
      setGenerating(false);
    }
  };

  const cleanupOldAttempts = async () => {
    try {
      const { data, error } = await supabase.rpc('cleanup_old_alpha_attempts');
      if (error) throw error;
      alert(`Cleaned up ${data} old attempts`);
    } catch (error) {
      console.error('Error cleaning up attempts:', error);
      alert('Error cleaning up old attempts');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2">Loading alpha codes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Alpha Code Management</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {summary.map((item) => (
          <div key={item.used?.toString()} className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-lg font-semibold">
              {item.used === null ? 'Total' : item.used ? 'Used' : 'Available'}
            </h3>
            <p className="text-3xl font-bold text-blue-600">{item.count}</p>
          </div>
        ))}
      </div>

      {/* Generate New Codes */}
      <div className="bg-white p-6 rounded-lg shadow border mb-6">
        <h2 className="text-xl font-semibold mb-4">Generate New Codes</h2>
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-2">Number of codes</label>
            <input
              type="number"
              min="1"
              max="100"
              value={codeCount}
              onChange={(e) => setCodeCount(parseInt(e.target.value) || 1)}
              className="border rounded px-3 py-2 w-24"
            />
          </div>
          <button
            onClick={generateCodes}
            disabled={generating}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate Codes'}
          </button>
          <button
            onClick={cleanupOldAttempts}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Cleanup Old Attempts
          </button>
        </div>

        {showGenerated && newCodes.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Generated Codes:</h3>
            <div className="bg-gray-100 p-4 rounded max-h-40 overflow-y-auto">
              {newCodes.map((code, index) => (
                <div key={index} className="font-mono text-sm">
                  {code}
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <button
                onClick={addCodesToDatabase}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Add to Database
              </button>
              <button
                onClick={() => {
                  setNewCodes([]);
                  setShowGenerated(false);
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Codes Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">All Alpha Codes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Used By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Used At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {codes.map((code) => (
                <tr key={code.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      code.used 
                        ? 'bg-red-100 text-red-800' 
                        : code.reserved_until && new Date(code.reserved_until) > new Date()
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {code.used ? 'Used' : 
                       code.reserved_until && new Date(code.reserved_until) > new Date() ? 'Reserved' : 
                       'Available'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(code.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {code.used_by ? code.used_by.slice(0, 8) + '...' : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {code.used_at ? new Date(code.used_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {code.expires_at ? new Date(code.expires_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {code.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
