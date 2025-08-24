'use client';

import { useState, useEffect } from 'react';
import { 
  runQuickDiagnostic, 
  validateManifest, 
  validateFrameMetadata, 
  collectDebugInfo,
  initializeDebugging,
  debugLog
} from '../../lib/debugging';

/**
 * Debug Panel Component
 * Provides UI for Base App diagnostics and debugging
 */

interface DebugPanelProps {
  className?: string;
}

export function DebugPanel({ className = '' }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // Initialize debugging on mount
  useEffect(() => {
    initializeDebugging();
    setDebugInfo(collectDebugInfo());
  }, []);

  const runDiagnostic = async () => {
    setIsLoading(true);
    try {
      const result = await runQuickDiagnostic();
      setDiagnosticResult(result);
      debugLog('DebugPanel', 'Diagnostic completed', result);
    } catch (error) {
      console.error('Diagnostic failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateManifestOnly = async () => {
    setIsLoading(true);
    try {
      const result = await validateManifest();
      setDiagnosticResult({ manifest: result });
      debugLog('DebugPanel', 'Manifest validation completed', result);
    } catch (error) {
      console.error('Manifest validation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateFrameOnly = () => {
    const result = validateFrameMetadata();
    setDiagnosticResult({ frame: result });
    debugLog('DebugPanel', 'Frame validation completed', result);
  };

  const refreshDebugInfo = () => {
    setDebugInfo(collectDebugInfo());
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'text-green-500';
      case 'fail': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return '✅';
      case 'fail': return '❌';
      case 'warning': return '⚠️';
      default: return '❓';
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg ${className}`}
        title="Open Debug Panel"
      >
        🔧
      </button>
    );
  }

  return (
    <div className={`fixed inset-4 z-50 bg-black/90 text-white p-6 rounded-lg overflow-auto ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">🔧 Base App Debug Panel</h2>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <button
          onClick={runDiagnostic}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 p-3 rounded font-medium"
        >
          {isLoading ? 'Running...' : '🔍 Full Diagnostic'}
        </button>
        
        <button
          onClick={validateManifestOnly}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 p-3 rounded font-medium"
        >
          📋 Validate Manifest
        </button>
        
        <button
          onClick={validateFrameOnly}
          className="bg-purple-600 hover:bg-purple-700 p-3 rounded font-medium"
        >
          🖼️ Validate Frame
        </button>
        
        <button
          onClick={refreshDebugInfo}
          className="bg-orange-600 hover:bg-orange-700 p-3 rounded font-medium"
        >
          🔄 Refresh Info
        </button>
      </div>

      {/* Diagnostic Results */}
      {diagnosticResult && (
        <div className="mb-6 p-4 bg-gray-800 rounded">
          <h3 className="text-lg font-semibold mb-3">Diagnostic Results</h3>
          
          {diagnosticResult.status && (
            <div className="mb-4">
              <div className={`text-lg font-bold ${getStatusColor(diagnosticResult.status)}`}>
                {getStatusIcon(diagnosticResult.status)} Status: {diagnosticResult.status.toUpperCase()}
              </div>
            </div>
          )}

          {diagnosticResult.issues && diagnosticResult.issues.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-red-400 mb-2">❌ Issues:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {diagnosticResult.issues.map((issue: string, index: number) => (
                  <li key={index} className="text-red-300">{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {diagnosticResult.recommendations && diagnosticResult.recommendations.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-yellow-400 mb-2">⚠️ Recommendations:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {diagnosticResult.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="text-yellow-300">{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {diagnosticResult.manifest && (
            <div className="mb-4">
              <h4 className="font-semibold mb-2">📋 Manifest Validation:</h4>
              <div className={`font-bold ${diagnosticResult.manifest.isValid ? 'text-green-400' : 'text-red-400'}`}>
                {diagnosticResult.manifest.isValid ? '✅ Valid' : '❌ Invalid'}
              </div>
              {diagnosticResult.manifest.errors.length > 0 && (
                <ul className="list-disc list-inside mt-2 text-sm">
                  {diagnosticResult.manifest.errors.map((error: string, index: number) => (
                    <li key={index} className="text-red-300">{error}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {diagnosticResult.frame && (
            <div className="mb-4">
              <h4 className="font-semibold mb-2">🖼️ Frame Validation:</h4>
              <div className={`font-bold ${diagnosticResult.frame.isValid ? 'text-green-400' : 'text-red-400'}`}>
                {diagnosticResult.frame.isValid ? '✅ Valid' : '❌ Invalid'}
              </div>
              {diagnosticResult.frame.errors.length > 0 && (
                <ul className="list-disc list-inside mt-2 text-sm">
                  {diagnosticResult.frame.errors.map((error: string, index: number) => (
                    <li key={index} className="text-red-300">{error}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* Debug Information */}
      {debugInfo && (
        <div className="mb-6 p-4 bg-gray-800 rounded">
          <h3 className="text-lg font-semibold mb-3">Environment Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-semibold">Environment:</div>
              <div className="space-y-1">
                <div>Base App: {debugInfo.isBaseApp ? '✅ Yes' : '❌ No'}</div>
                <div>Mobile: {debugInfo.isMobile ? '✅ Yes' : '❌ No'}</div>
                <div>Wallet: {debugInfo.walletConnection ? '✅ Connected' : '❌ Not Connected'}</div>
                <div>Frame Metadata: {debugInfo.frameMetadata ? '✅ Present' : '❌ Missing'}</div>
              </div>
            </div>
            <div>
              <div className="font-semibold">Viewport:</div>
              <div className="space-y-1">
                <div>Width: {debugInfo.viewport.width}px</div>
                <div>Height: {debugInfo.viewport.height}px</div>
                <div>Manifest URL: {debugInfo.manifestUrl}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Agent */}
      {debugInfo && (
        <div className="mb-6 p-4 bg-gray-800 rounded">
          <h3 className="text-lg font-semibold mb-3">User Agent</h3>
          <div className="text-xs bg-gray-900 p-3 rounded overflow-x-auto">
            {debugInfo.userAgent}
          </div>
        </div>
      )}

      {/* Logs */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">Logs</h3>
          <button
            onClick={clearLogs}
            className="text-sm bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded"
          >
            Clear
          </button>
        </div>
        <div className="bg-gray-900 p-4 rounded h-32 overflow-y-auto text-xs">
          {logs.length === 0 ? (
            <div className="text-gray-500">No logs yet...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">{log}</div>
            ))
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <a
          href="/.well-known/farcaster.json"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blue-600 hover:bg-blue-700 p-3 rounded text-center font-medium"
        >
          📋 View Manifest
        </a>
        <a
          href="https://farcaster.xyz/~/developers/mini-apps/debug"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-600 hover:bg-green-700 p-3 rounded text-center font-medium"
        >
          🔧 Farcaster Debug
        </a>
        <a
          href="https://jsonlint.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-purple-600 hover:bg-purple-700 p-3 rounded text-center font-medium"
        >
          📝 JSON Lint
        </a>
      </div>
    </div>
  );
}

export default DebugPanel;
