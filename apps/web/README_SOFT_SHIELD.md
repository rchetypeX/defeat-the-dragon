# Soft Shield Implementation - Mobile App Switching Detection

## Overview
The Soft Shield system has been enhanced to properly detect when users switch away from the app on mobile devices and manage focus session interruptions.

## Key Features

### 1. App Switching Detection
- **Immediate Detection**: Detects when user switches to another app or browser tab
- **Mobile Optimized**: Uses multiple event listeners for reliable detection on mobile devices
- **Screen Timeout Protection**: Distinguishes between app switching and screen timeout/lockscreen

### 2. Timing Logic
- **Warning at 10 seconds**: User receives notification when away for 10+ seconds
- **Failure at 15 seconds**: Session fails if user is away for 15+ seconds
- **Real-time Countdown**: Warning shows remaining time until session failure

### 3. Screen Timeout Exception
- **No False Triggers**: Screen timeout and lockscreen don't break the soft shield
- **Session Continues**: Focus session continues normally during screen timeout
- **Smart Detection**: Uses activity patterns to identify screen timeout vs app switching

## Implementation Details

### Event Listeners
```typescript
// Primary detection
document.addEventListener('visibilitychange', ...)

// Mobile-specific detection
window.addEventListener('focus', ...)
window.addEventListener('blur', ...)
window.addEventListener('orientationchange', ...)

// User activity tracking
['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
```

### State Management
```typescript
interface SoftShieldState {
  isActive: boolean;
  isDisturbed: boolean;
  awayStartTime: number | null;
  totalAwayTime: number;
  lastWarningTime: number | null;
  isMobile: boolean;
  lastUserActivity: number;
  lastVisibilityChange: number;
  isScreenTimeout: boolean; // NEW: Prevents false triggers
}
```

### Notification Flow
1. **10 seconds**: `showSoftShieldWarning` - "Return within 5 seconds or session fails"
2. **10-15 seconds**: Countdown updates every second
3. **15 seconds**: `showSessionFailed` - Session fails, progress lost
4. **Screen timeout**: No notifications, session continues normally

## Usage Example

```typescript
const softShield = createSoftShield(
  {
    maxAwayTime: 15,    // Fail after 15 seconds
    warningTime: 10,    // Warn after 10 seconds
    awayStartDelay: 3000, // 3 second delay for mobile protection
  },
  {
    onDisturbance: (awayTime) => {
      // User was away for X seconds
    },
    onWarning: (remainingTime) => {
      // Show warning with countdown
    },
    onFail: (totalAwayTime) => {
      // Session failed, handle cleanup
    }
  }
);
```

## Mobile-Specific Behavior

### App Switching (Soft Shield Broken)
- User switches to another app
- After 2 second delay, away timer starts
- At 10 seconds: Warning notification sent
- At 15 seconds: Session fails, notification sent

### Screen Timeout (Soft Shield Protected)
- User's phone screen goes dark
- No away timer starts
- Session continues normally
- When user returns, session is unaffected

### Detection Logic
```typescript
// Check if this might be a screen timeout
const isLikelyScreenTimeout = !wasRecentlyActive && timeSinceActivity > 10000;

if (isLikelyScreenTimeout) {
  this.state.isScreenTimeout = true;
  return; // Don't start away timer
}
```

## Testing

### Manual Testing
1. Start a focus session
2. Switch to another app for 5 seconds - should return normally
3. Switch to another app for 12 seconds - should see warning
4. Switch to another app for 16 seconds - should fail session
5. Let phone screen timeout - should continue session normally

### Debug Logging
The system provides comprehensive logging:
```
SoftShield: Page hidden for 2000ms, starting away timer (mobile: true, wasRecentlyActive: false)
SoftShield: Warning triggered at 10s - 5s remaining until failure
SoftShield: Warning update - 4s remaining until failure
SoftShield: Max away time reached (15s), failing session
```

## Configuration

### Default Settings
```typescript
{
  maxAwayTime: 15,      // 15 seconds to fail
  warningTime: 10,      // 10 seconds to warn
  checkInterval: 1000,  // Check every second
  awayStartDelay: 2000, // 2 second delay for mobile
}
```

### Customization
```typescript
// More strict
{ maxAwayTime: 10, warningTime: 7, awayStartDelay: 1000 }

// More lenient
{ maxAwayTime: 30, warningTime: 20, awayStartDelay: 5000 }
```

## Troubleshooting

### Common Issues
1. **False positives on mobile**: Increase `awayStartDelay`
2. **Missed app switches**: Check mobile detection logic
3. **Screen timeout triggers**: Verify `isScreenTimeout` logic

### Debug Mode
Enable debug logging to see detailed state changes:
```typescript
console.log('SoftShield State:', softShield.getState());
console.log('Current Away Time:', softShield.getCurrentAwayTime());
```
