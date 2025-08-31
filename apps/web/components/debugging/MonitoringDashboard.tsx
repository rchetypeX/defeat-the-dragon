'use client';

import { useState, useEffect } from 'react';
import { appLogger } from '../../lib/logger';
import { trackGamePerformance } from '../../lib/web-vitals';

interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  service: string;
  external_services: Record<string, string>;
  response_time_ms: number;
  checks: Record<string, string>;
}

interface SystemInfo {
  platform: string;
  arch: string;
  node_version: string;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
}

export function MonitoringDashboard() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // Toggle visibility
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
    if (!isVisible) {
      appLogger.info('Monitoring dashboard opened');
    }
  };

  // Check health status
  const checkHealth = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealthStatus(data);
      
      appLogger.info('Health check performed', {
        status: data.status,
        response_time: data.response_time_ms,
      });
      
      trackGamePerformance('health_check_response_time', data.response_time_ms);
    } catch (error) {
      appLogger.error('Health check failed', error as Error);
    }
  };

  // Get detailed system info
  const getSystemInfo = async () => {
    try {
      const response = await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ detailed: true }),
      });
      const data = await response.json();
      setSystemInfo(data.system);
      
      appLogger.info('System info retrieved', {
        platform: data.system.platform,
        memory_usage: data.system.memory,
      });
    } catch (error) {
      appLogger.error('System info retrieval failed', error as Error);
    }
  };

  // Test logging
  const testLogging = () => {
    appLogger.info('Test info log from monitoring dashboard');
    appLogger.warn('Test warning log from monitoring dashboard');
    appLogger.error('Test error log from monitoring dashboard');
    appLogger.gameEvent('test_event', { test: true });
    appLogger.focusSession('test_session', 300, true);
    appLogger.performance('test_metric', 100);
    appLogger.userAction('test_action', 'test_user');
    
    setLogs(prev => [...prev, 'Test logs generated - check console and Sentry']);
  };

  // Test performance tracking
  const testPerformance = () => {
    trackGamePerformance('test_performance', 150, { test: true });
    trackGamePerformance('test_load_time', 250, { test: true });
    
    setLogs(prev => [...prev, 'Performance metrics sent - check Sentry']);
  };

  // Auto-refresh health status
  useEffect(() => {
    if (isVisible) {
      checkHealth();
      const interval = setInterval(checkHealth, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  if (!isVisible) {
    return (
      <button
        onClick={toggleVisibility}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        title="Open Monitoring Dashboard"
      >
        📊
      </button>
    );
  }

  return (
    <div className="fixed inset-4 bg-black bg-opacity-90 text-white p-6 rounded-lg overflow-auto z-50">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">🔍 Monitoring Dashboard</h2>
        <button
          onClick={toggleVisibility}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition-colors"
        >
          ✕ Close
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Health Status */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">🏥 Health Status</h3>
          {healthStatus ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={`font-bold ${
                  healthStatus.status === 'healthy' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {healthStatus.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Response Time:</span>
                <span className={healthStatus.response_time_ms < 100 ? 'text-green-400' : 'text-yellow-400'}>
                  {healthStatus.response_time_ms}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span>Environment:</span>
                <span>{healthStatus.environment}</span>
              </div>
              <div className="flex justify-between">
                <span>Version:</span>
                <span>{healthStatus.version}</span>
              </div>
              <div className="flex justify-between">
                <span>Uptime:</span>
                <span>{Math.round(healthStatus.uptime)}s</span>
              </div>
            </div>
          ) : (
            <p>Loading health status...</p>
          )}
          <button
            onClick={checkHealth}
            className="mt-3 bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-colors"
          >
            🔄 Refresh
          </button>
        </div>

        {/* System Info */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">💻 System Info</h3>
          {systemInfo ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Platform:</span>
                <span>{systemInfo.platform}</span>
              </div>
              <div className="flex justify-between">
                <span>Architecture:</span>
                <span>{systemInfo.arch}</span>
              </div>
              <div className="flex justify-between">
                <span>Node Version:</span>
                <span>{systemInfo.node_version}</span>
              </div>
              <div className="flex justify-between">
                <span>Memory (RSS):</span>
                <span>{systemInfo.memory.rss}MB</span>
              </div>
              <div className="flex justify-between">
                <span>Heap Used:</span>
                <span>{systemInfo.memory.heapUsed}MB</span>
              </div>
            </div>
          ) : (
            <p>Click to load system info</p>
          )}
          <button
            onClick={getSystemInfo}
            className="mt-3 bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm transition-colors"
          >
            📊 Load System Info
          </button>
        </div>

        {/* Testing Tools */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">🧪 Testing Tools</h3>
          <div className="space-y-2">
            <button
              onClick={testLogging}
              className="w-full bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded transition-colors"
            >
              📝 Test Logging
            </button>
            <button
              onClick={testPerformance}
              className="w-full bg-orange-600 hover:bg-orange-700 px-3 py-2 rounded transition-colors"
            >
              ⚡ Test Performance
            </button>
          </div>
        </div>

        {/* Logs */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">📋 Recent Actions</h3>
          <div className="max-h-32 overflow-y-auto">
            {logs.length > 0 ? (
              <ul className="space-y-1 text-sm">
                {logs.map((log, index) => (
                  <li key={index} className="text-gray-300">• {log}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">No actions yet</p>
            )}
          </div>
          {logs.length > 0 && (
            <button
              onClick={() => setLogs([])}
              className="mt-2 bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm transition-colors"
            >
              🗑️ Clear
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 text-center text-sm text-gray-400">
        <p>🔍 Check browser console and Sentry for detailed logs</p>
        <p>📊 Health checks auto-refresh every 30 seconds when dashboard is open</p>
      </div>
    </div>
  );
}
