# 🔔 Enhanced Notification System for Defeat the Dragon

## 🎯 Overview

The enhanced notification system provides comprehensive notification management with Base App integration, smart re-engagement strategies, and user preference controls. This system is designed to maximize user engagement while respecting user preferences and platform limitations.

## ✨ Key Features

### 🚀 Base App Integration
- **Native Base App Detection**: Automatically detects when running in Base App environment
- **MiniKit Integration**: Uses `useMiniKit` hook for Base App-specific functionality
- **Fallback Support**: Gracefully falls back to browser notifications when Base App is not available
- **Frame Ready Integration**: Ensures notifications work properly with Base App's frame system

### 🧠 Smart Re-engagement
- **Intelligent Timing**: Sends re-engagement notifications based on user activity patterns
- **Contextual Messages**: Different messages for different levels of inactivity
- **Streak Protection**: Prioritizes notifications when user streaks are at risk
- **Rate Limiting**: Prevents notification spam with configurable limits

### ⚙️ User Control
- **Granular Preferences**: Users can enable/disable specific notification types
- **Priority Levels**: Notifications are categorized by importance (low, medium, high, urgent)
- **Test Functionality**: Users can test notifications before enabling them
- **Statistics Tracking**: Real-time notification statistics and analytics

### 📊 Analytics & Monitoring
- **Notification Logs**: Comprehensive logging of all notification attempts
- **Success Rates**: Track delivery success rates for optimization
- **User Behavior**: Monitor which notification types drive engagement
- **Performance Metrics**: Track notification performance over time

## 🏗️ Architecture

### Core Components

#### 1. **Enhanced Notification Library** (`lib/notifications.ts`)
```typescript
// Main notification functions
showNotification(config: NotificationConfig): Promise<boolean>
showReEngagementNotification(daysSinceLastSession, playerLevel, streakCount): Promise<boolean>
showSessionCompleteNotification(xpGained, coinsGained, sparksGained?, levelUp?, newLevel?): Promise<boolean>
// ... and more
```

#### 2. **Base App Hook** (`hooks/useBaseAppNotifications.ts`)
```typescript
// Provides Base App integration and enhanced functionality
const {
  showSessionComplete,
  showLevelUp,
  showAchievement,
  isBaseApp,
  isEnabled
} = useBaseAppNotifications({
  enableReEngagement: true,
  enableDailyReminders: true,
  enableSocialNotifications: true
});
```

#### 3. **Settings Component** (`components/ui/NotificationSettings.tsx`)
- User preference management
- Permission handling
- Test notification functionality
- Real-time statistics

#### 4. **Server API** (`app/api/notifications/send/route.ts`)
- Server-side notification sending
- Push notification support
- Analytics logging
- User preference checking

## 🎮 Notification Types

### Core Game Notifications
| Type | Description | Priority | Rate Limit |
|------|-------------|----------|------------|
| `session_complete` | Session completion with rewards | High | 10/hour, 50/day |
| `session_failed` | Session interruption with encouragement | Medium | 5/hour, 20/day |
| `soft_shield_warning` | Focus interruption warning | Urgent | 20/hour, 100/day |
| `level_up` | Level progression celebration | High | 5/hour, 20/day |
| `achievement_unlocked` | Achievement milestones | High | 10/hour, 50/day |

### Engagement Notifications
| Type | Description | Priority | Rate Limit |
|------|-------------|----------|------------|
| `streak_milestone` | Streak achievements | Medium | 2/hour, 5/day |
| `boss_defeated` | Boss battle victories | High | 5/hour, 20/day |
| `daily_reminder` | Daily focus reminders | Medium | 1/hour, 2/day |
| `weekly_challenge` | Weekly challenge updates | Medium | 1/hour, 3/day |
| `re_engagement` | Smart re-engagement | Variable | 1/hour, 1-2/day |

### Social Notifications
| Type | Description | Priority | Rate Limit |
|------|-------------|----------|------------|
| `social_achievement` | Social sharing milestones | Medium | 5/hour, 20/day |

## 🔧 Configuration

### Environment Variables
```bash
# Base App Integration
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_api_key
NEXT_PUBLIC_URL=https://your-app.vercel.app

# Notification Settings
NEXT_PUBLIC_MAX_NOTIFICATIONS_PER_HOUR=20
NEXT_PUBLIC_MAX_NOTIFICATIONS_PER_DAY=100
```

### User Preferences
```typescript
interface NotificationSettings {
  sessionComplete: boolean;
  sessionFailed: boolean;
  softShieldWarning: boolean;
  levelUp: boolean;
  achievements: boolean;
  streakMilestones: boolean;
  bossDefeated: boolean;
  dailyReminders: boolean;
  socialAchievements: boolean;
  weeklyChallenges: boolean;
  reEngagement: boolean;
}
```

## 📱 Base App Integration

### Detection Logic
```typescript
// Automatic Base App detection
isBaseApp = typeof window !== 'undefined' && 
  (window.location.hostname.includes('base.org') || 
   window.navigator.userAgent.includes('BaseApp') ||
   window.location.search.includes('base_app=true'));
```

### MiniKit Integration
```typescript
// Uses MiniKit for Base App functionality
const { isFrameReady } = useMiniKit();

// Base App notification callback
setBaseAppNotificationCallback((notification) => {
  if (isBaseApp && isFrameReady) {
    // Use Base App's native notification system
    console.log('🔔 Sending notification to Base App:', notification);
  }
});
```

## 🎯 Smart Re-engagement Strategy

### Re-engagement Logic
```typescript
// Different messages based on inactivity duration
if (daysSinceLastSession >= 7) {
  // High priority: "Your Dragon Awaits!"
} else if (daysSinceLastSession >= 3) {
  // Medium priority: "Adventure Calls!"
} else {
  // Low priority: "Daily Focus Quest"
}
```

### Streak Protection
```typescript
// Prioritize notifications when streaks are at risk
const isStreakAtRisk = lastSessionDate !== today && streakCount > 0;
if (isStreakAtRisk) {
  // Higher priority notification
}
```

## 📊 Analytics & Monitoring

### Database Schema
```sql
-- Notification logs table
CREATE TABLE notification_logs (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    priority TEXT DEFAULT 'medium',
    sent_count INTEGER DEFAULT 0,
    total_count INTEGER DEFAULT 0,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Statistics Functions
```sql
-- Get user notification statistics
SELECT * FROM get_user_notification_stats(user_uuid);

-- Clean up old logs
SELECT cleanup_old_notification_logs();
```

## 🚀 Usage Examples

### Basic Notification
```typescript
import { useBaseAppNotifications } from '../hooks/useBaseAppNotifications';

const { showSessionComplete } = useBaseAppNotifications();

// Show session completion notification
await showSessionComplete(50, 30, 5, false, 3);
```

### Re-engagement Notification
```typescript
const { showReEngagement } = useBaseAppNotifications();

// Show re-engagement based on user activity
await showReEngagement(daysSinceLastSession, playerLevel, streakCount);
```

### Custom Notification
```typescript
const { showNotification } = useBaseAppNotifications();

await showNotification({
  type: 'custom_event',
  priority: 'high',
  title: '🎉 Special Event!',
  body: 'A limited-time challenge is available!',
  data: { deepLink: '/?action=event' },
  rateLimit: { maxPerHour: 1, maxPerDay: 3 }
});
```

## 🔒 Security & Privacy

### Rate Limiting
- **Per-type limits**: Each notification type has its own rate limits
- **Global limits**: Overall notification limits prevent spam
- **User preferences**: Respects individual user settings
- **Platform limits**: Respects Base App and browser limitations

### Data Protection
- **No personal data**: Notifications don't contain sensitive information
- **User control**: Users can disable any notification type
- **Analytics only**: Logs contain only aggregate statistics
- **GDPR compliant**: Users can export/delete their notification data

## 🎨 UI Components

### Notification Settings Modal
- **Permission status**: Shows current notification permission
- **Base App integration**: Indicates Base App detection status
- **Type toggles**: Individual switches for each notification type
- **Test buttons**: Test each notification type
- **Statistics**: Real-time notification statistics
- **Save functionality**: Persist user preferences

### Integration Points
- **Game Dashboard**: Enhanced session completion notifications
- **Session Progress**: Soft shield warning notifications
- **Settings**: Notification preference management
- **Achievements**: Achievement unlock notifications

## 📈 Performance Optimization

### Rate Limiting Strategy
```typescript
// Per-type rate limiting
const rateLimit = {
  session_complete: { maxPerHour: 10, maxPerDay: 50 },
  re_engagement: { maxPerHour: 1, maxPerDay: 2 },
  // ... other types
};

// Global rate limiting
const globalLimits = {
  maxPerHour: 20,
  maxPerDay: 100
};
```

### Caching Strategy
- **User preferences**: Cached in localStorage
- **Permission status**: Cached to avoid repeated checks
- **Base App detection**: Cached for performance
- **Statistics**: Updated every 5 seconds

## 🔮 Future Enhancements

### Planned Features
- **Push Notifications**: Server-side push notification support
- **Scheduled Notifications**: Time-based notification scheduling
- **A/B Testing**: Test different notification strategies
- **Machine Learning**: Smart timing based on user behavior
- **Cross-platform**: Support for mobile app notifications

### Base App Enhancements
- **Native Integration**: Direct integration with Base App's notification system
- **Rich Notifications**: Support for rich media in notifications
- **Action Buttons**: Interactive notification actions
- **Deep Linking**: Seamless navigation from notifications

## 🐛 Troubleshooting

### Common Issues

#### Notifications Not Showing
1. Check notification permission status
2. Verify Base App detection
3. Check rate limiting settings
4. Review user preferences

#### Base App Integration Issues
1. Verify MiniKit installation
2. Check API key configuration
3. Ensure frame ready state
4. Review console for errors

#### Rate Limiting Issues
1. Check notification statistics
2. Review rate limit configuration
3. Clear rate limit cache if needed
4. Monitor notification logs

### Debug Mode
```typescript
// Enable debug logging
localStorage.setItem('debug', 'notifications:*');

// Clear rate limits for testing
clearNotificationRateLimits();

// Get notification statistics
const stats = getNotificationStats();
console.log('Notification stats:', stats);
```

## 📚 API Reference

### Core Functions
- `showNotification(config)`: Show a custom notification
- `showReEngagement(days, level, streak)`: Smart re-engagement
- `showSessionComplete(xp, coins, sparks?, levelUp?, newLevel?)`: Session completion
- `showLevelUp(level, features?)`: Level up celebration
- `showAchievement(name, description, rarity?)`: Achievement unlock
- `showStreakMilestone(count, milestone)`: Streak milestone
- `showBossDefeated(name, rewards)`: Boss defeat celebration
- `showDailyReminder(lastSession?, streak?)`: Daily reminder
- `showSocialAchievement(type, details)`: Social achievement
- `showWeeklyChallenge(name, description, reward)`: Weekly challenge

### Management Functions
- `getStats()`: Get notification statistics
- `clearRateLimits()`: Clear rate limit cache
- `isBaseApp`: Check if running in Base App
- `isEnabled`: Check if notifications are enabled

---

**The enhanced notification system provides a comprehensive, user-friendly, and Base App-optimized notification experience that maximizes engagement while respecting user preferences and platform limitations.** 🚀
