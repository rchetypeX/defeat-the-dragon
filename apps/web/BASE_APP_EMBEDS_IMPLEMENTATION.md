# 🎯 Base App Embeds & Previews Implementation

## 🎯 Overview

This document outlines our comprehensive implementation of Base App embeds and preview features following the official "Embeds & Previews" documentation. We've implemented dynamic embed generation, strategic sharing points, and viral growth optimization to maximize organic discovery.

## 🏗️ Architecture

### **Embed & Preview Components:**

1. **`useShareAchievement` Hook** (Strategic Sharing)
   - Achievement-based sharing with dynamic text generation
   - Multiple achievement types (level up, session complete, boss defeated, etc.)
   - Embed inclusion for better discovery
   - Analytics tracking for viral growth

2. **Dynamic Embed API** (`/api/embed/[type]/route.ts`)
   - Real-time embed image generation
   - Achievement-specific visual content
   - 3:2 aspect ratio optimization (1200x630)
   - Caching strategy for performance

3. **`ShareAchievementButton` Component** (UI Integration)
   - Strategic share prompts at key moments
   - Visual feedback for sharing states
   - Achievement-specific button styling
   - Integration with game progression

4. **Enhanced Metadata** (`generateMetadata`)
   - Dynamic metadata generation
   - Base App frame integration
   - Open Graph optimization
   - Twitter Card support

## 🔧 Implementation Details

### **Core Hook: `useShareAchievement`**

```typescript
// apps/web/hooks/useShareAchievement.ts
export function useShareAchievement() {
  const { composeCast } = useComposeCast();

  const generateShareText = useCallback((achievement: AchievementShareData, options: ShareOptions = {}) => {
    const { customMessage, hashtags = ['#DefeatTheDragon', '#FocusRPG'] } = options;
    
    switch (achievement.type) {
      case 'level_up':
        return `🎉 Just reached Level ${achievement.level} in Defeat the Dragon! Leveling up my focus game! 🐉⚡ ${hashtags.join(' ')}`;
      
      case 'session_complete':
        return `✅ Completed a ${duration}-minute focus session! +${xp} XP +${coins} coins 🐉⚡ ${hashtags.join(' ')}`;
      
      case 'boss_defeated':
        return `⚔️ Defeated ${bossName}! My focus training is paying off! 🐉⚡ ${hashtags.join(' ')}`;
      
      // ... more achievement types
    }
  }, []);

  const shareAchievement = useCallback(async (achievement: AchievementShareData, options: ShareOptions = {}) => {
    const { includeEmbed = true } = options;
    const shareText = generateShareText(achievement, options);
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://dtd.rchetype.xyz';
    
    const castOptions: any = {
      text: shareText,
    };

    // Include embed for better discovery
    if (includeEmbed) {
      castOptions.embeds = [baseUrl];
    }

    await composeCast(castOptions);
    
    // Track sharing analytics
    console.log('📊 Achievement Share Analytics:', {
      type: achievement.type,
      timestamp: Date.now(),
      includeEmbed,
      customMessage: !!options.customMessage,
    });
    
    return true;
  }, [composeCast, generateShareText]);

  return {
    shareAchievement,
    shareLevelUp,
    shareSessionComplete,
    shareBossDefeated,
    shareMilestone,
    shareStreak,
    generateShareText,
  };
}
```

### **Dynamic Embed Generation: `/api/embed/[type]/route.ts`**

```typescript
// apps/web/app/api/embed/[type]/route.ts
export async function GET(request: NextRequest, { params }: { params: EmbedParams }) {
  const { searchParams } = new URL(request.url);
  const type = params.type;
  
  // Extract parameters for dynamic content
  const level = searchParams.get('level');
  const xp = searchParams.get('xp');
  const coins = searchParams.get('coins');
  const sparks = searchParams.get('sparks');
  const duration = searchParams.get('duration');
  const streak = searchParams.get('streak');
  const bossName = searchParams.get('boss');

  // Generate dynamic content based on type
  let title = 'Defeat the Dragon';
  let subtitle = 'Transform focus into adventure!';
  let emoji = '🐉';
  let color = '#f2751a';

  switch (type) {
    case 'level_up':
      title = `Level ${level} Achieved!`;
      subtitle = `Leveling up the focus game!`;
      emoji = '🎉';
      color = '#4ade80';
      break;
    
    case 'session_complete':
      title = `${duration}min Focus Session`;
      subtitle = `+${xp} XP • +${coins} coins${sparks ? ` • +${sparks} sparks` : ''}`;
      emoji = '✅';
      color = '#3b82f6';
      break;
    
    // ... more types
  }

  return new ImageResponse(
    React.createElement('div', {
      style: {
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a1a2e',
        backgroundImage: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        padding: '40px',
        position: 'relative',
      },
    }, [
      // Background Pattern
      React.createElement('div', {
        key: 'bg',
        style: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(242, 117, 26, 0.1) 0%, transparent 50%)',
          opacity: 0.3,
        },
      }),
      // Main Content
      React.createElement('div', {
        key: 'content',
        style: {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          zIndex: 1,
        },
      }, [
        // Emoji
        React.createElement('div', {
          key: 'emoji',
          style: {
            fontSize: '80px',
            marginBottom: '20px',
            filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))',
          },
        }, emoji),
        // Title
        React.createElement('div', {
          key: 'title',
          style: {
            fontSize: '48px',
            fontWeight: 'bold',
            color: color,
            marginBottom: '16px',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
            maxWidth: '600px',
            lineHeight: 1.2,
          },
        }, title),
        // Subtitle
        React.createElement('div', {
          key: 'subtitle',
          style: {
            fontSize: '24px',
            color: '#fbbf24',
            marginBottom: '32px',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
            maxWidth: '500px',
            lineHeight: 1.3,
          },
        }, subtitle),
        // App Branding
        React.createElement('div', {
          key: 'branding',
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 24px',
            backgroundColor: 'rgba(242, 117, 26, 0.1)',
            border: '2px solid rgba(242, 117, 26, 0.3)',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
          },
        }, [
          React.createElement('div', {
            key: 'brand-text',
            style: {
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#f2751a',
            },
          }, '🐉 Defeat the Dragon'),
        ]),
      ]),
    ]),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300', // 5 minutes cache
      },
    }
  );
}
```

### **Share Button Component: `ShareAchievementButton`**

```typescript
// apps/web/components/sharing/ShareAchievementButton.tsx
export function ShareAchievementButton({
  type,
  level,
  xpGained,
  coinsGained,
  sparksGained,
  streakDays,
  sessionDuration,
  bossName,
  className = '',
  showConfirmation = true,
  customMessage,
}: ShareAchievementButtonProps) {
  const {
    shareLevelUp,
    shareSessionComplete,
    shareBossDefeated,
    shareMilestone,
    shareStreak,
  } = useShareAchievement();

  const [isSharing, setIsSharing] = useState(false);
  const [hasShared, setHasShared] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    
    try {
      let success = false;
      
      switch (type) {
        case 'level_up':
          success = await shareLevelUp(level || 1, { customMessage });
          break;
        
        case 'session_complete':
          success = await shareSessionComplete(
            sessionDuration || 0,
            xpGained || 0,
            coinsGained || 0,
            sparksGained || 0,
            { customMessage }
          );
          break;
        
        // ... more cases
      }
      
      if (success) {
        setHasShared(true);
        if (showConfirmation) {
          console.log('✅ Achievement shared successfully!');
        }
      }
    } catch (error) {
      console.error('❌ Failed to share achievement:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const getButtonText = () => {
    if (hasShared) return 'Shared! 🎉';
    if (isSharing) return 'Sharing...';
    
    switch (type) {
      case 'level_up':
        return 'Share Level Up! 🎉';
      case 'session_complete':
        return 'Share Session! ✅';
      case 'boss_defeated':
        return 'Share Victory! ⚔️';
      case 'milestone':
        return 'Share Milestone! 🏆';
      case 'streak':
        return 'Share Streak! 🔥';
      default:
        return 'Share Achievement! 🎮';
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={isSharing || hasShared}
      className={`
        px-4 py-2 rounded-lg font-bold text-white transition-all duration-200
        ${hasShared 
          ? 'bg-green-600 cursor-not-allowed' 
          : isSharing 
            ? 'bg-gray-600 cursor-not-allowed' 
            : 'bg-gradient-to-r from-[#f2751a] to-[#e65a0a] hover:from-[#e65a0a] hover:to-[#d1450a] active:scale-95'
        }
        ${className}
      `}
    >
      <span className="flex items-center gap-2">
        <span className="text-lg">{getButtonEmoji()}</span>
        <span>{getButtonText()}</span>
      </span>
    </button>
  );
}
```

### **Enhanced Metadata: `generateMetadata`**

```typescript
// apps/web/app/layout.tsx
export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://dtd.rchetype.xyz';
  
  return {
    metadataBase: new URL(baseUrl),
    title: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'Defeat the Dragon',
    description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'A Pixel-art Pomodoro-style Focus RPG where you train to defeat the dragon through focused work sessions',
    keywords: ['focus', 'productivity', 'pomodoro', 'rpg', 'game', 'pixel art', 'dragon', 'base app'],
    authors: [{ name: 'Defeat the Dragon Team' }],
    creator: 'Defeat the Dragon',
    publisher: 'Defeat the Dragon',
    robots: 'index, follow',
    manifest: '/manifest.json',
    icons: {
      icon: [
        { url: '/favicon.svg', type: 'image/svg+xml', sizes: '32x32' },
        { url: '/icon.png', type: 'image/png', sizes: '192x192' },
      ],
      apple: [
        { url: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180' },
      ],
    },
    openGraph: {
      title: 'Defeat the Dragon',
      description: 'A Pixel-art Pomodoro-style Focus RPG where you train to defeat the dragon through focused work sessions',
      url: baseUrl,
      siteName: 'Defeat the Dragon',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'Defeat the Dragon - Focus RPG',
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Defeat the Dragon',
      description: 'A Pixel-art Pomodoro-style Focus RPG where you train to defeat the dragon through focused work sessions',
      images: ['/og-image.png'],
      creator: '@defeatdragon',
    },
    other: {
      'fc:frame': JSON.stringify({
        version: 'next',
        imageUrl: process.env.NEXT_PUBLIC_APP_HERO_IMAGE || `${baseUrl}/og-image.png`,
        button: {
          title: `Launch ${process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'Defeat the Dragon'}`,
          action: {
            type: 'launch_frame',
            name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'Defeat the Dragon',
            url: baseUrl,
            splashImageUrl: process.env.NEXT_PUBLIC_APP_SPLASH_IMAGE || `${baseUrl}/og-image.png`,
            splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR || '#1a1a2e',
          },
        },
      }),
    },
  };
}
```

## 🎯 Strategic Share Points

### **Achievement Types:**

| Achievement Type | Trigger | Share Text | Embed Type | Viral Potential |
|------------------|---------|------------|------------|-----------------|
| **Level Up** | User reaches new level | "🎉 Just reached Level X!" | `level_up` | High - Progress celebration |
| **Session Complete** | Focus session finished | "✅ Completed X-min session!" | `session_complete` | Medium - Daily activity |
| **Boss Defeated** | Major milestone reached | "⚔️ Defeated [Boss]!" | `boss_defeated` | High - Achievement showcase |
| **Milestone** | Special achievements | "🏆 Major milestone reached!" | `milestone` | Medium - Personal growth |
| **Streak** | Consistent usage | "🔥 X day focus streak!" | `streak` | High - Consistency motivation |

### **Share Integration Points:**

```typescript
// Example: Session completion sharing
const handleSessionComplete = async (sessionData: SessionData) => {
  // Update user progress
  await updateUserProgress(sessionData);
  
  // Show success message with share button
  setShowSuccessMessage({
    xpGained: sessionData.xpGained,
    coinsGained: sessionData.coinsGained,
    sparksGained: sessionData.sparksGained,
    levelUp: sessionData.levelUp,
    newLevel: sessionData.newLevel,
    onShare: () => {
      // Strategic share prompt
      setShowSharePrompt(true);
    },
  });
};

// Example: Level up sharing
const handleLevelUp = async (newLevel: number) => {
  // Update user level
  await updateUserLevel(newLevel);
  
  // Show level up celebration with share button
  setShowLevelUpCelebration({
    newLevel,
    onShare: () => {
      shareLevelUp(newLevel);
    },
  });
};
```

## 📱 Embed Optimization

### **Image Specifications:**

- **Aspect Ratio**: 3:2 (1200x630px)
- **Format**: PNG with transparency support
- **Optimization**: Edge runtime for fast generation
- **Caching**: 5-minute cache for performance
- **Fallback**: Static embed for error cases

### **Visual Design:**

```typescript
// Embed visual hierarchy
const embedDesign = {
  background: {
    color: '#1a1a2e',
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    pattern: 'radial-gradient(circle at 25% 25%, rgba(242, 117, 26, 0.1) 0%, transparent 50%)',
  },
  typography: {
    title: {
      fontSize: '48px',
      fontWeight: 'bold',
      color: 'dynamic based on achievement',
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
    },
    subtitle: {
      fontSize: '24px',
      color: '#fbbf24',
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
    },
  },
  branding: {
    appName: '🐉 Defeat the Dragon',
    color: '#f2751a',
    style: 'backdrop blur with border',
  },
};
```

### **Performance Optimization:**

```typescript
// Caching strategy
const cacheHeaders = {
  'Cache-Control': 'public, max-age=300, s-maxage=300', // 5 minutes
  'CDN-Cache-Control': 'public, max-age=300',
  'Vercel-CDN-Cache-Control': 'public, max-age=300',
};

// Error handling
try {
  return new ImageResponse(/* embed content */, {
    width: 1200,
    height: 630,
    headers: cacheHeaders,
  });
} catch (error) {
  console.error('Error generating embed image:', error);
  
  // Fallback to static embed
  return new ImageResponse(/* static content */, {
    width: 1200,
    height: 630,
    headers: cacheHeaders,
  });
}
```

## 🚀 Viral Growth Strategy

### **Share Timing:**

1. **Immediate**: After session completion
2. **Delayed**: After level up celebration
3. **Scheduled**: Daily streak reminders
4. **Event-based**: Major milestone achievements

### **Share Messaging:**

```typescript
// Achievement-specific messaging
const shareMessages = {
  level_up: {
    text: `🎉 Just reached Level ${level} in Defeat the Dragon! Leveling up my focus game! 🐉⚡`,
    hashtags: ['#DefeatTheDragon', '#FocusRPG', '#LevelUp'],
    emoji: '🎉',
  },
  session_complete: {
    text: `✅ Completed a ${duration}-minute focus session! +${xp} XP +${coins} coins 🐉⚡`,
    hashtags: ['#DefeatTheDragon', '#FocusRPG', '#Productivity'],
    emoji: '✅',
  },
  boss_defeated: {
    text: `⚔️ Defeated ${bossName}! My focus training is paying off! 🐉⚡`,
    hashtags: ['#DefeatTheDragon', '#FocusRPG', '#Achievement'],
    emoji: '⚔️',
  },
  streak: {
    text: `🔥 ${streakDays} day focus streak! Consistency is the key! 🐉⚡`,
    hashtags: ['#DefeatTheDragon', '#FocusRPG', '#Streak'],
    emoji: '🔥',
  },
};
```

### **Viral Mechanics:**

1. **Social Proof**: Show real achievements and progress
2. **FOMO**: Limited-time achievements and streaks
3. **Competition**: Leaderboards and comparisons
4. **Community**: Shared goals and challenges
5. **Recognition**: Public acknowledgment of achievements

## 📊 Analytics & Tracking

### **Share Metrics:**

```typescript
// Share analytics tracking
const trackShareAnalytics = (achievement: AchievementShareData, options: ShareOptions) => {
  const analyticsData = {
    type: achievement.type,
    timestamp: Date.now(),
    includeEmbed: options.includeEmbed,
    customMessage: !!options.customMessage,
    platform: 'farcaster',
    userAgent: navigator.userAgent,
    referrer: document.referrer,
  };

  // Send to analytics service
  console.log('📊 Achievement Share Analytics:', analyticsData);
  // analytics.track('achievement_shared', analyticsData);
};
```

### **Growth Metrics:**

| Metric | Description | Target | Tracking |
|--------|-------------|--------|----------|
| **Share Rate** | % of users who share achievements | >15% | Share button clicks |
| **Viral Coefficient** | New users per share | >1.0 | Referral tracking |
| **Embed Views** | Views of shared embeds | Track via analytics | Embed impression tracking |
| **Click-through Rate** | Clicks on shared embeds | >5% | Link click tracking |
| **Conversion Rate** | Shares that lead to new users | >2% | User registration tracking |

## 🔧 Integration Examples

### **Session Completion Integration:**

```typescript
// In SuccessMessage component
import { ShareAchievementButton } from '../sharing/ShareAchievementButton';

export function SuccessMessage({ xpGained, coinsGained, sparksGained, levelUp, newLevel, onDismiss, onKeepFocusing }) {
  return (
    <div className="pixel-card p-6 border-2 border-[#8B4513] bg-[#f5f5dc]">
      {/* Success content */}
      
      {/* Share button */}
      <div className="mt-4 flex justify-center">
        <ShareAchievementButton
          type="session_complete"
          sessionDuration={sessionDuration}
          xpGained={xpGained}
          coinsGained={coinsGained}
          sparksGained={sparksGained}
          className="mr-2"
        />
      </div>
    </div>
  );
}
```

### **Level Up Integration:**

```typescript
// In level up celebration
const handleLevelUp = (newLevel: number) => {
  setShowLevelUpCelebration({
    newLevel,
    onShare: () => {
      shareLevelUp(newLevel, {
        customMessage: `Just reached Level ${newLevel} in Defeat the Dragon! 🎉`,
      });
    },
  });
};
```

## 🧪 Testing & Debugging

### **Embed Testing:**

```bash
# Test dynamic embeds
curl "https://dtd.rchetype.xyz/api/embed/level_up?level=5"
curl "https://dtd.rchetype.xyz/api/embed/session_complete?duration=25&xp=50&coins=10"
curl "https://dtd.rchetype.xyz/api/embed/boss_defeated?boss=Distraction%20Dragon"

# Test metadata
curl "https://dtd.rchetype.xyz" | grep -A 10 "fc:frame"
```

### **Debug Tools:**

1. **Farcaster Embed Debugger**: https://farcaster.xyz/~/developers/mini-apps/debug
2. **Base App Testing**: Test in Base App environment
3. **Social Preview**: Test in Farcaster feed
4. **Performance Monitoring**: Track embed generation times

### **Common Issues:**

| Issue | Cause | Solution |
|-------|-------|----------|
| **Embed not showing** | Invalid metadata | Check `fc:frame` JSON validity |
| **Slow generation** | Complex embed design | Optimize image generation |
| **Cache issues** | Stale embeds | Clear cache, repost |
| **Wrong aspect ratio** | Incorrect dimensions | Use 1200x630px |

## 🚀 Production Considerations

### **Environment Variables:**

```bash
# Required for embeds
NEXT_PUBLIC_URL=https://dtd.rchetype.xyz
NEXT_PUBLIC_APP_HERO_IMAGE=https://dtd.rchetype.xyz/og-image.png
NEXT_PUBLIC_APP_SPLASH_IMAGE=https://dtd.rchetype.xyz/splash.png
NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR=#1a1a2e

# Optional for customization
NEXT_PUBLIC_APP_TAGLINE=Turn focus into adventure!
NEXT_PUBLIC_APP_DESCRIPTION=Transform focus sessions into an epic adventure
```

### **Performance Optimization:**

- ✅ **Edge Runtime**: Fast embed generation
- ✅ **Caching Strategy**: 5-minute cache for performance
- ✅ **Error Handling**: Graceful fallbacks
- ✅ **Image Optimization**: Compressed PNG output
- ✅ **CDN Integration**: Global content delivery

### **Monitoring:**

```typescript
// Embed performance monitoring
const monitorEmbedPerformance = async (type: string, params: any) => {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`/api/embed/${type}?${new URLSearchParams(params)}`);
    const endTime = Date.now();
    
    console.log(`📊 Embed Performance - ${type}:`, {
      generationTime: endTime - startTime,
      status: response.status,
      params,
    });
  } catch (error) {
    console.error(`❌ Embed Error - ${type}:`, error);
  }
};
```

## 📈 Success Metrics

### **Launch Checklist:**

- [ ] Dynamic embeds generate correctly
- [ ] Share buttons work in Base App
- [ ] Embeds display properly in Farcaster feed
- [ ] Analytics tracking functional
- [ ] Performance meets requirements (<5s generation)
- [ ] Caching strategy working
- [ ] Error handling robust
- [ ] Metadata optimized for discovery

### **Growth Targets:**

- **Share Rate**: >15% of users share achievements
- **Viral Coefficient**: >1.0 new users per share
- **Embed Views**: Track via analytics
- **Conversion Rate**: >2% of embed views convert to users
- **Performance**: <5s embed generation time

---

**This implementation ensures maximum viral growth through strategic sharing, dynamic embeds, and optimized metadata for Base App discovery!** 🎯✨
