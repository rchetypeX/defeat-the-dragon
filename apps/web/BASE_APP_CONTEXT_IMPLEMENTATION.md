# 🔍 Base App Context Implementation

## 🎯 Overview

This document outlines our comprehensive implementation of Base App context features following the official "Understanding Mini App Context" documentation. We've implemented context-driven experiences, safe area support, viral attribution, and social features to create a native-feeling mini app experience.

## 🏗️ Architecture

### **Context-Aware Components:**

1. **`useContextAware` Hook** (Core Context Management)
   - Entry point detection (`cast_embed`, `launcher`, `messaging`, etc.)
   - Safe area insets for mobile devices
   - Social features (cast composition, profile viewing)
   - Analytics tracking for viral growth

2. **`ContextAwareLayout` Component** (Safe Area Support)
   - Automatic safe area insets application
   - Platform-specific responsive design
   - Loading states for context initialization

3. **`SocialAcknowledgment` Component** (Viral Features)
   - Cast embed acknowledgment
   - Thank sharer functionality
   - Profile viewing integration

4. **`EntryPointExperience` Component** (Personalized UX)
   - Different experiences based on entry point
   - Viral onboarding for new users
   - Returning user welcome messages

## 🔧 Implementation Details

### **Core Hook: `useContextAware`**

```typescript
// apps/web/hooks/useContextAware.ts
export function useContextAware(): ContextAwareState {
  const { context, isFrameReady, setFrameReady } = useMiniKit();
  const { isInMiniApp } = useIsInMiniApp();
  const { composeCast: miniKitComposeCast } = useComposeCast();
  const viewProfile = useViewProfile();
  
  // Entry point detection
  const entryType = location?.type || 'unknown';
  const isViralEntry = entryType === 'cast_embed';
  const isReturningUser = entryType === 'launcher';
  
  // Client information
  const platformType = client?.platformType || 'unknown';
  const safeAreaInsets = client?.safeAreaInsets || { top: 0, bottom: 0, left: 0, right: 0 };
  
  // Social actions
  const thankSharer = useCallback(async () => {
    // Thank the person who shared the app
  }, [castAuthor, castHash, miniKitComposeCast]);
  
  // Analytics tracking
  const trackDiscovery = useCallback(() => {
    // Track how users discover the app
  }, [entryType, platformType, isAdded, isViralEntry, castAuthor, castHash]);
  
  return {
    user, client, location,
    entryType, isViralEntry, isReturningUser,
    platformType, isAdded, safeAreaInsets,
    castAuthor, castText, castHash,
    isLoading, isAvailable,
    thankSharer, viewSharerProfile, composeCast,
    trackDiscovery,
  };
}
```

### **Safe Area Layout: `ContextAwareLayout`**

```typescript
// apps/web/components/layout/ContextAwareLayout.tsx
export function ContextAwareLayout({ children, className = '' }: ContextAwareLayoutProps) {
  const { safeAreaInsets, platformType, isAvailable, isLoading } = useContextAware();
  
  // Apply safe area insets for mobile devices
  const safeAreaStyle = {
    paddingTop: safeAreaInsets.top,
    paddingBottom: safeAreaInsets.bottom,
    paddingLeft: safeAreaInsets.left,
    paddingRight: safeAreaInsets.right,
  };
  
  return (
    <div 
      className={`min-h-screen bg-[#1a1a2e] ${className}`}
      style={isAvailable ? safeAreaStyle : {}}
    >
      {children}
    </div>
  );
}
```

### **Social Acknowledgment: `SocialAcknowledgment`**

```typescript
// apps/web/components/social/SocialAcknowledgment.tsx
export function SocialAcknowledgment() {
  const { isViralEntry, castAuthor, castText, thankSharer, viewSharerProfile } = useContextAware();
  
  // Only show for viral entries
  if (!isViralEntry || !castAuthor) {
    return null;
  }
  
  return (
    <div className="fixed top-4 left-4 right-4 z-50">
      <div className="pixel-card p-4 border-2 border-[#8B4513] bg-[#f5f5dc] max-w-md mx-auto">
        {/* Sharer Info */}
        <div className="flex items-center mb-3">
          <img src={castAuthor.pfpUrl} alt={castAuthor.displayName} />
          <div>
            <p>@{castAuthor.username}</p>
            <p>shared this focus game</p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <button onClick={thankSharer}>Thank them! 🙏</button>
        <button onClick={viewSharerProfile}>Profile</button>
      </div>
    </div>
  );
}
```

### **Entry Point Experience: `EntryPointExperience`**

```typescript
// apps/web/components/context/EntryPointExperience.tsx
export function EntryPointExperience({ children, className = '' }: EntryPointExperienceProps) {
  const { entryType, isViralEntry, isReturningUser, isAvailable } = useContextAware();
  
  switch (entryType) {
    case 'cast_embed':
      return (
        <div className={className}>
          <div className="mb-4 p-3 bg-gradient-to-r from-[#f2751a] to-[#e65a0a]">
            <h3>🎉 Welcome to Defeat the Dragon!</h3>
            <p>You discovered this focus game through a friend!</p>
          </div>
          {children}
        </div>
      );
      
    case 'launcher':
      return (
        <div className={className}>
          <div className="mb-4 p-3 bg-gradient-to-r from-[#4ade80] to-[#22c55e]">
            <h3>👋 Welcome back, Focus Warrior!</h3>
            <p>Ready to continue your journey?</p>
          </div>
          {children}
        </div>
      );
      
    default:
      return <div className={className}>{children}</div>;
  }
}
```

## 🎯 Entry Point Detection

### **Supported Entry Types:**

| Entry Type | Description | User Journey | Strategy |
|------------|-------------|--------------|----------|
| `cast_embed` | Social feed discovery | Primary viral discovery | Optimize first-time experience |
| `launcher` | Saved app access | Returning user | Focus on retention |
| `messaging` | Private message share | Private discovery | Encourage broader sharing |
| `notification` | Push notification | Re-engagement | Drive immediate action |
| `open_miniapp` | Direct app open | Direct access | Streamlined experience |

### **Entry Point Logic:**

```typescript
// Entry point detection
const entryType = location?.type || 'unknown';
const isViralEntry = entryType === 'cast_embed';
const isReturningUser = entryType === 'launcher';

// Different experiences based on entry point
switch (entryType) {
  case 'cast_embed':
    // Viral onboarding experience
    break;
  case 'launcher':
    // Returning user experience
    break;
  case 'messaging':
    // Private share experience
    break;
  default:
    // Default experience
    break;
}
```

## 📱 Safe Area Support

### **Mobile Optimization:**

```typescript
// Safe area insets from context
const safeAreaInsets = client?.safeAreaInsets || {
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
};

// Apply to layout
const safeAreaStyle = {
  paddingTop: safeAreaInsets.top,
  paddingBottom: safeAreaInsets.bottom,
  paddingLeft: safeAreaInsets.left,
  paddingRight: safeAreaInsets.right,
};
```

### **Platform Detection:**

```typescript
// Platform type detection
const platformType = client?.platformType || 'unknown';
// Values: 'mobile', 'desktop', 'web', 'unknown'

// Responsive design based on platform
if (platformType === 'mobile') {
  // Mobile-specific optimizations
}
```

## 🚀 Social Features

### **Cast Embed Acknowledgment:**

```typescript
// Thank the person who shared the app
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
```

### **Profile Viewing:**

```typescript
// View sharer's profile
const viewSharerProfile = useCallback(() => {
  if (!castAuthor?.fid) return;
  viewProfile(castAuthor.fid);
}, [castAuthor, viewProfile]);
```

### **Cast Composition:**

```typescript
// Compose new casts
const composeCast = useCallback(async (text: string, parentHash?: string) => {
  const castOptions: any = { text };
  if (parentHash) {
    castOptions.parent = {
      type: 'cast',
      hash: parentHash
    };
  }
  await miniKitComposeCast(castOptions);
}, [miniKitComposeCast]);
```

## 📊 Analytics & Growth Tracking

### **Discovery Tracking:**

```typescript
// Track how users discover the app
const trackDiscovery = useCallback(() => {
  const discoveryData: any = {
    type: entryType,
    platform: platformType,
    userAdded: isAdded,
    timestamp: Date.now(),
  };

  if (isViralEntry && castAuthor) {
    discoveryData.sharedBy = castAuthor.username;
    discoveryData.castHash = castHash;
  }

  console.log('📊 Discovery tracked:', discoveryData);
  // Send to analytics service
}, [entryType, platformType, isAdded, isViralEntry, castAuthor, castHash]);
```

### **Growth Metrics:**

| Metric | Context Source | Optimization Goal |
|--------|----------------|-------------------|
| **Cast Embed Launches** | `location.type === 'cast_embed'` | Maximize viral sharing |
| **Return User Rate** | `location.type === 'launcher'` | Improve retention |
| **Share Attribution** | `cast.author` data | Identify top advocates |
| **Platform Performance** | `client.platformType` | Optimize for mobile/desktop |

## 🔄 Integration with Main App

### **Page Integration:**

```typescript
// apps/web/app/page.tsx
export default function HomePage() {
  // Context-aware features
  const {
    entryType,
    isViralEntry,
    isReturningUser,
    platformType,
    isAvailable: isContextAvailable,
  } = useContextAware();

  return (
    <ContextAwareLayout>
      <SocialAcknowledgment />
      <EntryPointExperience>
        {/* Main app content */}
        <AudioProvider>
          <GameDashboard />
        </AudioProvider>
      </EntryPointExperience>
    </ContextAwareLayout>
  );
}
```

### **Development Logging:**

```typescript
// Development logging for context data
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔐 Base App Auth Status:', {
      isBaseApp,
      isBaseAppAuthenticated,
      contextFid,
      verifiedUser: !!verifiedUser,
      entryType,
      isViralEntry,
      isReturningUser,
      platformType,
    });
  }
}, [isBaseApp, isBaseAppAuthenticated, contextFid, verifiedUser, entryType, isViralEntry, isReturningUser, platformType]);
```

## 🧪 Testing

### **Test Scenarios:**

1. **Viral Entry Testing**: Test cast embed discovery flow
2. **Returning User Testing**: Test launcher entry experience
3. **Safe Area Testing**: Test mobile safe area insets
4. **Social Features Testing**: Test thank sharer and profile viewing
5. **Analytics Testing**: Verify discovery tracking

### **Development Indicators:**

```typescript
// Platform indicator for development
{process.env.NODE_ENV === 'development' && isAvailable && (
  <div className="fixed top-0 left-0 bg-black bg-opacity-75 text-white text-xs p-1 z-50">
    {platformType} • Safe: {safeAreaInsets.top}/{safeAreaInsets.bottom}
  </div>
)}
```

## 🚀 Production Considerations

### **Environment Variables:**

```bash
# Base App Integration
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_api_key
NEXT_PUBLIC_URL=https://your-domain.com

# Analytics (Optional)
NEXT_PUBLIC_ANALYTICS_ENABLED=true
```

### **Performance Optimizations:**

- ✅ Lazy loading of context components
- ✅ Memoized callbacks for social actions
- ✅ Efficient safe area calculations
- ✅ Minimal re-renders with proper dependencies

### **Error Handling:**

- ✅ Graceful fallback when context is unavailable
- ✅ Safe area fallbacks for web browsers
- ✅ Social action error handling
- ✅ Analytics failure tolerance

## 📈 Monitoring & Analytics

### **Key Metrics to Track:**

- **Entry Point Distribution**: Which entry points drive the most users
- **Viral Coefficient**: How many new users each sharer brings
- **Safe Area Usage**: Mobile vs desktop usage patterns
- **Social Engagement**: Thank sharer and profile view rates
- **Context Availability**: Success rate of context data loading

### **Analytics Events:**

- `mini_app_launch`: App discovery tracking
- `social_thank_sharer`: Thank sharer interactions
- `profile_view`: Profile viewing actions
- `cast_compose`: Cast composition attempts
- `safe_area_applied`: Safe area usage tracking

## 🔄 Future Enhancements

### **Planned Improvements:**

1. **Enhanced Social Features**: More social interaction options
2. **Advanced Analytics**: Real-time viral coefficient tracking
3. **A/B Testing**: Test different entry point experiences
4. **Deep Linking**: Enhanced deep linking support
5. **Notification Integration**: Context-aware notifications

### **Base App Features:**

1. **Rich Embeds**: Enhanced cast embed experiences
2. **Social Challenges**: Community-driven features
3. **Viral Mechanics**: Built-in viral growth features
4. **Analytics Dashboard**: Real-time growth metrics

---

**This implementation ensures a native-feeling Base App experience with comprehensive context awareness, social features, and viral growth optimization.** 🔍✨
