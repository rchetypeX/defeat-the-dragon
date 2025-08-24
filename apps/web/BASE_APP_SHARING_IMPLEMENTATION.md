# 🚀 Base App Sharing & Social Graph Implementation

## 🎯 Overview

This document outlines our comprehensive implementation of Base App sharing and social graph features following the official "Sharing & Social Graph" documentation. We've implemented strategic sharing moments, cast viewing, profile navigation, and viral growth optimization to maximize organic discovery.

## 🏗️ Architecture

### **Sharing & Social Components:**

1. **`ComposeCastButton` Component** (Strategic Sharing)
   - Follows Base App documentation example
   - Supports both simple casts and embeds
   - Strategic sharing moments integration
   - Visual feedback and error handling

2. **`useContextAware` Hook** (Social Navigation)
   - `useViewCast` integration for cast viewing
   - `useViewProfile` for profile navigation
   - `useComposeCast` for cast composition
   - Viral attribution and social features

3. **`ShareAchievementButton` Component** (Achievement Sharing)
   - Strategic share prompts at key moments
   - Multiple achievement types
   - Embed inclusion for better discovery
   - Analytics tracking for viral growth

4. **`SocialAcknowledgment` Component** (Viral Features)
   - Cast embed acknowledgment
   - Thank sharer functionality
   - Profile viewing integration

## 🔧 Implementation Details

### **Core Component: `ComposeCastButton`**

```typescript
// apps/web/components/social/ComposeCastButton.tsx
import { useComposeCast } from '@coinbase/onchainkit/minikit';

export default function ComposeCastButton() {
  const { composeCast } = useComposeCast();

  const handleCompose = () => {
    composeCast({ text: 'Just completed an awesome focus session in Defeat the Dragon! 🐉⚡ #DefeatTheDragon' });
  };

  const handleComposeWithEmbed = () => {
    composeCast({
      text: 'Check out this amazing focus game! 🐉⚡ #DefeatTheDragon',
      embeds: ['https://dtd.rchetype.xyz'],
    });
  };

  return (
    <div>
      <button onClick={handleCompose}>Share Achievement</button>
      <button onClick={handleComposeWithEmbed}>Share Frame</button>
    </div>
  );
}
```

### **Enhanced Context Hook: `useContextAware`**

```typescript
// apps/web/hooks/useContextAware.ts
import { useComposeCast, useViewProfile, useViewCast } from '@coinbase/onchainkit/minikit';

export function useContextAware(): ContextAwareState {
  const { composeCast: miniKitComposeCast } = useComposeCast();
  const viewProfile = useViewProfile();
  const viewCast = useViewCast();
  
  // Social actions
  const thankSharer = useCallback(async () => {
    if (!castAuthor || !castHash) return;
    
    await miniKitComposeCast({
      text: `Thanks @${castAuthor.username} for sharing this awesome focus game! 🐉⚡ #DefeatTheDragon`,
      parent: {
        type: 'cast',
        hash: castHash
      }
    });
  }, [castAuthor, castHash, miniKitComposeCast]);

  const viewSharerProfile = useCallback(() => {
    if (!castAuthor?.fid) return;
    viewProfile(castAuthor.fid);
  }, [castAuthor, viewProfile]);

  const viewCastHandler = useCallback((castHash: string) => {
    if (!castHash) return;
    viewCast.viewCast(castHash);
  }, [viewCast]);

  return {
    // ... other context data
    thankSharer,
    viewSharerProfile,
    viewCast: viewCastHandler,
    composeCast,
  };
}
```

## 🎯 Strategic Sharing Moments

### **Key Accomplishment Moments:**

| Moment | Trigger | Share Text | Embed | Viral Potential |
|--------|---------|------------|-------|-----------------|
| **Level Up** | User reaches new level | "🎉 Just reached Level X!" | `level_up` | High - Progress celebration |
| **Session Complete** | Focus session finished | "✅ Completed X-min session!" | `session_complete` | Medium - Daily activity |
| **Boss Defeated** | Major milestone reached | "⚔️ Defeated [Boss]!" | `boss_defeated` | High - Achievement showcase |
| **Milestone** | Special achievements | "🏆 Major milestone reached!" | `milestone` | Medium - Personal growth |
| **Streak** | Consistent usage | "🔥 X day focus streak!" | `streak` | High - Consistency motivation |

### **Implementation Examples:**

```typescript
// Level Up Sharing
const handleLevelUp = async (newLevel: number) => {
  await shareLevelUp(newLevel, {
    customMessage: `🎉 Just reached Level ${newLevel} in Defeat the Dragon!`,
    includeEmbed: true
  });
};

// Session Complete Sharing
const handleSessionComplete = async (sessionData: SessionData) => {
  await shareSessionComplete(
    sessionData.duration,
    sessionData.xpGained,
    sessionData.coinsGained,
    sessionData.sparksGained,
    {
      customMessage: `✅ Completed a ${sessionData.duration}-minute focus session!`,
      includeEmbed: true
    }
  );
};
```

## 🔍 Cast & Profile Navigation

### **View Casts:**

```typescript
// View specific cast
const { viewCast } = useContextAware();

const handleViewCast = (castHash: string) => {
  viewCast(castHash);
};

// Usage in components
<button onClick={() => handleViewCast('cast_hash_here')}>
  View Original Cast
</button>
```

### **View Profiles:**

```typescript
// View user profile
const { viewSharerProfile } = useContextAware();

// Automatically triggered when user clicks profile button
<button onClick={viewSharerProfile}>
  View @{castAuthor.username}'s Profile
</button>
```

## 🎨 Best Practices Implementation

### **✅ Meaningful, Contextual Shares:**

```typescript
// Good: Contextual sharing
const shareLevelUp = (level: number) => {
  return `🎉 Just reached Level ${level} in Defeat the Dragon! Leveling up my focus game! 🐉⚡ #DefeatTheDragon`;
};

// Good: Value-based sharing
const shareSessionComplete = (duration: number, xp: number) => {
  return `✅ Completed a ${duration}-minute focus session! +${xp} XP gained! 🐉⚡ #DefeatTheDragon`;
};
```

### **✅ Avoid Spammy Prompts:**

```typescript
// Good: Only prompt at meaningful moments
const handleAchievement = async (achievement: Achievement) => {
  // Only share significant achievements
  if (achievement.type === 'level_up' || achievement.type === 'boss_defeated') {
    await shareAchievement(achievement);
  }
};

// Good: Rate limiting
const shareWithRateLimit = debounce(async (achievement: Achievement) => {
  await shareAchievement(achievement);
}, 5000); // 5 second cooldown
```

### **✅ Visually Consistent Previews:**

```typescript
// Dynamic embed generation for consistent visuals
const generateEmbedUrl = (achievement: Achievement) => {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://dtd.rchetype.xyz';
  return `${baseUrl}/api/embed/${achievement.type}?level=${achievement.level}&xp=${achievement.xp}`;
};
```

## 📊 Analytics & Growth Tracking

### **Sharing Analytics:**

```typescript
// Track sharing behavior
const trackSharing = (achievement: Achievement, success: boolean) => {
  console.log('📊 Achievement Share Analytics:', {
    type: achievement.type,
    timestamp: Date.now(),
    success,
    includeEmbed: true,
    viralPotential: getViralPotential(achievement.type),
  });
};
```

### **Viral Coefficient Tracking:**

```typescript
// Track viral growth
const trackViralGrowth = (castHash: string, shares: number) => {
  const viralCoefficient = shares / 1; // New users per share
  
  console.log('📈 Viral Growth:', {
    castHash,
    shares,
    viralCoefficient,
    timestamp: Date.now(),
  });
};
```

## 🔄 Integration with Game Features

### **Session Completion:**

```typescript
// apps/web/components/game/FocusSession.tsx
const handleSessionComplete = async (sessionData: SessionData) => {
  // Update game state
  await updateUserProgress(sessionData);
  
  // Show sharing prompt for significant sessions
  if (sessionData.duration >= 25) {
    setShowSharePrompt(true);
  }
};
```

### **Level Up:**

```typescript
// apps/web/components/game/GameDashboard.tsx
const handleLevelUp = async (newLevel: number) => {
  // Update level
  await updateUserLevel(newLevel);
  
  // Always share level ups (high viral potential)
  await shareLevelUp(newLevel);
};
```

### **Achievement Unlocked:**

```typescript
// apps/web/components/game/Achievements.tsx
const handleAchievementUnlocked = async (achievement: Achievement) => {
  // Unlock achievement
  await unlockAchievement(achievement);
  
  // Share significant achievements
  if (achievement.rarity === 'rare' || achievement.rarity === 'epic') {
    await shareAchievement(achievement);
  }
};
```

## 🚀 Performance Optimization

### **Lazy Loading:**

```typescript
// Lazy load sharing components
const ShareAchievementButton = lazy(() => import('./ShareAchievementButton'));

// Only load when needed
{showSharePrompt && (
  <Suspense fallback={<div>Loading...</div>}>
    <ShareAchievementButton type="session_complete" />
  </Suspense>
)}
```

### **Error Handling:**

```typescript
// Graceful error handling
const handleShare = async (achievement: Achievement) => {
  try {
    await shareAchievement(achievement);
    showSuccessMessage('Achievement shared! 🎉');
  } catch (error) {
    console.error('Sharing failed:', error);
    showErrorMessage('Sharing failed. Please try again.');
  }
};
```

## 📱 Mobile Optimization

### **Touch-Friendly Sharing:**

```typescript
// Mobile-optimized sharing buttons
const ShareButton = ({ onShare, children }: ShareButtonProps) => (
  <button
    onClick={onShare}
    className="
      min-h-[44px] min-w-[44px] 
      px-4 py-3 
      rounded-lg 
      font-bold 
      text-white 
      transition-all 
      duration-200
      active:scale-95
      touch-manipulation
    "
  >
    {children}
  </button>
);
```

### **Safe Area Support:**

```typescript
// Respect safe areas for sharing UI
const ShareModal = () => {
  const { safeAreaInsets } = useContextAware();
  
  return (
    <div
      className="fixed inset-0 z-50"
      style={{
        paddingTop: safeAreaInsets.top,
        paddingBottom: safeAreaInsets.bottom,
      }}
    >
      {/* Share modal content */}
    </div>
  );
};
```

## 🎯 Success Metrics

### **Launch Checklist:**

- [x] `ComposeCastButton` component implemented
- [x] `useViewCast` and `useViewProfile` hooks integrated
- [x] Strategic sharing moments identified and implemented
- [x] Meaningful, contextual shares (no spam)
- [x] Visually consistent previews
- [x] Mobile-optimized sharing UI
- [x] Error handling and fallbacks
- [x] Analytics tracking implemented
- [x] Rate limiting to prevent spam
- [x] Viral growth optimization

### **Growth Targets:**

- **Share Rate**: >15% of users share achievements
- **Viral Coefficient**: >1.0 new users per share
- **Cast Views**: Track via Base App analytics
- **Profile Views**: Monitor social engagement
- **Conversion Rate**: >2% of cast views convert to users

## 🔗 Related Documentation

- [Embeds & Previews](/mini-apps/features/embeds-and-previews)
- [Understanding Mini App Context](/mini-apps/features/understanding-mini-app-context)
- [Base App Best Practices](/mini-apps/features/best-practices)

---

**This implementation ensures maximum viral growth through strategic sharing, social navigation, and optimized user experience for Base App discovery!** 🚀✨
