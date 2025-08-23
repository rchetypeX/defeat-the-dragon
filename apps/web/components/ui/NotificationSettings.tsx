'use client';

import { useState, useEffect } from 'react';
import { useBaseAppNotifications } from '../../hooks/useBaseAppNotifications';
import { usePushNotifications } from '../../hooks/usePushNotifications';

interface NotificationSettings {
  sessionComplete: boolean;
  sessionFailed: boolean;
  softShieldWarning: boolean;
  levelUp: boolean;
  achievements: boolean;

  bossDefeated: boolean;
  dailyReminders: boolean;
  socialAchievements: boolean;
  weeklyChallenges: boolean;
  reEngagement: boolean;
  pushTest: boolean;
}

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationSettings({ isOpen, onClose }: NotificationSettingsProps) {
  const [settings, setSettings] = useState<NotificationSettings>({
    sessionComplete: true,
    sessionFailed: true,
    softShieldWarning: true,
    levelUp: true,
    achievements: true,

    bossDefeated: true,
    dailyReminders: true,
    socialAchievements: true,
    weeklyChallenges: true,
    reEngagement: true,
    pushTest: false,
  });

  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isBaseApp, setIsBaseApp] = useState(false);
  const [stats, setStats] = useState<Record<string, { hourly: number; daily: number }>>({});

  const { getStats, isBaseApp: baseAppDetected } = useBaseAppNotifications();
  const { 
    isSupported: pushSupported, 
    isSubscribed: pushSubscribed, 
    isPermissionGranted: pushPermissionGranted,
    isLoading: pushLoading,
    error: pushError,
    subscribe: pushSubscribe,
    unsubscribe: pushUnsubscribe,
    sendTestNotification: sendPushTest
  } = usePushNotifications();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPermission(Notification.permission);
      setIsBaseApp(baseAppDetected);
    }
  }, [baseAppDetected]);

  useEffect(() => {
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.warn('Failed to parse saved notification settings:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Update stats periodically
    const interval = setInterval(() => {
      setStats(getStats());
    }, 5000);

    return () => clearInterval(interval);
  }, [getStats]);

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    // Save to localStorage
    localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
  };

  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
    }
  };

  const testNotification = async (type: keyof NotificationSettings) => {
    if (permission !== 'granted') {
      await requestPermission();
      return;
    }

    // Show a test notification based on type
    const testNotifications = {
      sessionComplete: () => showTestNotification('🎉 Session Complete!', 'Great focus! You gained 50 XP and 30 coins.'),
      sessionFailed: () => showTestNotification('💪 Don\'t Give Up!', 'Your session was interrupted. Every attempt makes you stronger!'),
      softShieldWarning: () => showTestNotification('⚠️ Focus Interrupted!', 'Return within 10 seconds or your session will fail!'),
      levelUp: () => showTestNotification('🌟 LEVEL UP!', 'Congratulations! You reached Level 5!'),
      achievements: () => showTestNotification('🥉 Achievement Unlocked!', 'First Focus: Complete your first focus session'),

      bossDefeated: () => showTestNotification('⚔️ Boss Defeated!', 'You defeated the Mini-Boss! Rewards: 100 XP, 60 coins'),
      dailyReminders: () => showTestNotification('🐉 Daily Focus Quest', 'Ready for today\'s focus adventure?'),
      socialAchievements: () => showTestNotification('🌟 Social Achievement!', 'You shared your first achievement!'),
             weeklyChallenges: () => showTestNotification('🎯 Weekly Challenge!', 'Complete 5 sessions this week. Reward: 200 XP'),
       reEngagement: () => showTestNotification('🐉 Your Dragon Awaits!', 'Ready to continue your quest?'),
       pushTest: () => sendPushTest(),
    };

    const testFn = testNotifications[type];
    if (testFn) {
      testFn();
    }
  };

  const showTestNotification = (title: string, body: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icon.png',
        badge: '/icon.png',
        tag: 'test-notification',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a2e] border-2 border-[#654321] rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#f2751a]">🔔 Notification Settings</h2>
          <button
            onClick={onClose}
            className="text-[#fbbf24] hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Permission Status */}
        <div className="mb-6 p-4 bg-[#2a2a3e] border border-[#654321] rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#fbbf24] font-medium">Notification Permission</span>
            <span className={`px-2 py-1 rounded text-sm ${
              permission === 'granted' ? 'bg-green-600 text-white' :
              permission === 'denied' ? 'bg-red-600 text-white' :
              'bg-yellow-600 text-black'
            }`}>
              {permission === 'granted' ? '✅ Granted' :
               permission === 'denied' ? '❌ Denied' :
               '⚠️ Default'}
            </span>
          </div>
          
                     {isBaseApp && (
             <div className="flex items-center text-sm text-[#fbbf24] mb-2">
               <span>🔗 Base App Integration: Active</span>
             </div>
           )}
           
           {pushSupported && (
             <div className="flex items-center text-sm text-[#fbbf24] mb-2">
               <span>📱 Push Notifications: {pushSubscribed ? 'Subscribed' : 'Not Subscribed'}</span>
             </div>
           )}
          
                     {permission !== 'granted' && (
             <button
               onClick={requestPermission}
               className="w-full pixel-button text-sm"
             >
               Request Permission
             </button>
           )}
           
           {pushSupported && !pushSubscribed && pushPermissionGranted && (
             <button
               onClick={pushSubscribe}
               disabled={pushLoading}
               className="w-full pixel-button text-sm mt-2"
             >
               {pushLoading ? 'Subscribing...' : 'Subscribe to Push Notifications'}
             </button>
           )}
           
           {pushSupported && pushSubscribed && (
             <button
               onClick={pushUnsubscribe}
               disabled={pushLoading}
               className="w-full pixel-button text-sm mt-2 bg-red-600 hover:bg-red-700"
             >
               {pushLoading ? 'Unsubscribing...' : 'Unsubscribe from Push Notifications'}
             </button>
           )}
           
           {pushError && (
             <div className="text-red-400 text-sm mt-2">
               {pushError}
             </div>
           )}
        </div>

        {/* Notification Types */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[#f2751a] mb-3">Notification Types</h3>
          
          {Object.entries(settings).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-[#2a2a3e] border border-[#654321] rounded-lg">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={key}
                    checked={value}
                    onChange={(e) => handleSettingChange(key as keyof NotificationSettings, e.target.checked)}
                    className="w-4 h-4 text-[#f2751a] bg-[#1a1a2e] border-[#654321] rounded focus:ring-[#f2751a]"
                  />
                  <label htmlFor={key} className="text-[#fbbf24] font-medium">
                    {getNotificationLabel(key as keyof NotificationSettings)}
                  </label>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {getNotificationDescription(key as keyof NotificationSettings)}
                </p>
              </div>
              <button
                onClick={() => testNotification(key as keyof NotificationSettings)}
                disabled={permission !== 'granted'}
                className="ml-2 px-2 py-1 text-xs bg-[#f2751a] text-white rounded hover:bg-[#e65a0a] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Test
              </button>
            </div>
          ))}
        </div>

        {/* Notification Stats */}
        {Object.keys(stats).length > 0 && (
          <div className="mt-6 p-4 bg-[#2a2a3e] border border-[#654321] rounded-lg">
            <h3 className="text-lg font-semibold text-[#f2751a] mb-3">📊 Notification Stats (Last 24h)</h3>
            <div className="space-y-2">
              {Object.entries(stats).map(([type, count]) => (
                <div key={type} className="flex justify-between text-sm">
                  <span className="text-[#fbbf24]">{getNotificationLabel(type as keyof NotificationSettings)}</span>
                  <span className="text-white">
                    {count.hourly}/hour, {count.daily}/day
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-6 flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 pixel-button bg-[#654321] hover:bg-[#543210]"
          >
            Close
          </button>
          <button
            onClick={() => {
              localStorage.setItem('notificationSettings', JSON.stringify(settings));
              onClose();
            }}
            className="flex-1 pixel-button"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

function getNotificationLabel(key: keyof NotificationSettings): string {
  const labels = {
    sessionComplete: 'Session Complete',
    sessionFailed: 'Session Failed',
    softShieldWarning: 'Soft Shield Warning',
    levelUp: 'Level Up',
    achievements: 'Achievements',

    bossDefeated: 'Boss Defeated',
    dailyReminders: 'Daily Reminders',
    socialAchievements: 'Social Achievements',
    weeklyChallenges: 'Weekly Challenges',
    reEngagement: 'Re-engagement',
    pushTest: 'Push Test',
  };
  return labels[key];
}

function getNotificationDescription(key: keyof NotificationSettings): string {
  const descriptions = {
    sessionComplete: 'When you complete a focus session',
    sessionFailed: 'When your session is interrupted',
    softShieldWarning: 'When you\'re away too long during a session',
    levelUp: 'When you gain a new level',
    achievements: 'When you unlock new achievements',

    bossDefeated: 'When you defeat a boss',
    dailyReminders: 'Daily focus reminders',
    socialAchievements: 'Social and sharing achievements',
    weeklyChallenges: 'Weekly challenge updates',
    reEngagement: 'Smart re-engagement messages',
    pushTest: 'Test push notification functionality',
  };
  return descriptions[key];
}
