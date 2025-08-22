# Defeat the Dragon - Base App Integration Guide 🐉⚡

This guide will help you integrate your Defeat the Dragon PWA with The Base App using their official MiniKit.

## 🎯 What We've Done

### ✅ Completed Integration
- **MiniKit Installation**: Added `@coinbase/onchainkit` dependency
- **Provider Setup**: Created MiniKit provider wrapper
- **Layout Integration**: Updated root layout with Base App metadata
- **Frame Ready**: Added `setFrameReady()` initialization
- **Farcaster Manifest**: Created required `.well-known/farcaster.json` endpoint
- **Environment Variables**: Updated with all required Base App variables

## 🚀 Next Steps to Launch

### 1. **Get Coinbase Developer Platform API Key**
1. Go to [Coinbase Developer Platform](https://developer.coinbase.com/)
2. Sign in and create a new project
3. Get your Client API key
4. Add it to your environment variables

### 2. **Deploy Your App**
```bash
# Deploy to Vercel (recommended)
vercel --prod

# Or deploy to your preferred platform
npm run build
npm run start
```

### 3. **Create Farcaster Manifest**
After deployment, run:
```bash
npx create-onchain --manifest
```

This will generate the required Farcaster authentication values:
- `FARCASTER_HEADER`
- `FARCASTER_PAYLOAD` 
- `FARCASTER_SIGNATURE`

### 4. **Set Environment Variables**
Update your deployment environment with these variables:

#### Required Variables
```bash
NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME=Defeat the Dragon
NEXT_PUBLIC_URL=https://your-app.vercel.app
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_cdp_client_api_key
FARCASTER_HEADER=base64_header_from_manifest
FARCASTER_PAYLOAD=base64_payload_from_manifest
FARCASTER_SIGNATURE=hex_signature_from_manifest
```

#### Optional Variables (for better appearance)
```bash
NEXT_PUBLIC_APP_ICON=https://your-app.vercel.app/icon.png
NEXT_PUBLIC_APP_SUBTITLE=Focus RPG Game
NEXT_PUBLIC_APP_DESCRIPTION=Transform focus sessions into an epic adventure
NEXT_PUBLIC_APP_SPLASH_IMAGE=https://your-app.vercel.app/splash.png
NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR=#1a1a2e
NEXT_PUBLIC_APP_PRIMARY_CATEGORY=gaming
NEXT_PUBLIC_APP_HERO_IMAGE=https://your-app.vercel.app/og.png
NEXT_PUBLIC_APP_TAGLINE=Defeat distractions, level up focus
```

### 5. **Create Required Assets**
Make sure these assets are publicly accessible via HTTPS:

- **App Icon**: 48x48px PNG (recommended)
- **Splash Image**: Loading screen image
- **Hero Image**: For social sharing and previews
- **OG Image**: Open Graph image for social media

### 6. **Test Your Integration**

#### Validate Manifest
Visit: `https://yourdomain.com/.well-known/farcaster.json`
Should return valid JSON with your app metadata.

#### Test Frame Metadata
Share your app URL in a Farcaster cast to see the launch button.

#### Test Launch
Click the launch button to ensure your app opens properly in Base App.

## 🎮 How It Works

### Base App Integration
- **MiniKit Provider**: Wraps your app with Base App functionality
- **Frame Ready**: Tells Base App when your app is ready to launch
- **Farcaster Manifest**: Proves ownership and provides metadata
- **Rich Embeds**: Shows launch button when shared in social feed

### User Experience
1. **Discovery**: Users find your app in Base App or social feed
2. **Launch**: Click launch button to open in Base App
3. **Authentication**: Uses Base App's built-in wallet/auth
4. **Gameplay**: Full focus gaming experience
5. **Sharing**: Users can share achievements and progress

## 🔧 Technical Details

### Files Modified
- `apps/web/providers/MiniKitProvider.tsx` - Base App provider
- `apps/web/app/layout.tsx` - Added metadata and provider wrapper
- `apps/web/app/page.tsx` - Added frame ready initialization
- `apps/web/app/.well-known/farcaster.json/route.ts` - Manifest endpoint
- `apps/web/package.json` - Added MiniKit dependency

### Key Features
- **Hybrid Approach**: Core game logic stays off-chain for performance
- **Base App Auth**: Uses Base App's authentication system
- **Social Integration**: Rich embeds and sharing capabilities
- **Mobile Optimized**: Designed for Base App's mobile interface

## 🐛 Troubleshooting

### Common Issues

1. **Manifest Not Found**
   - Ensure `/.well-known/farcaster.json` returns valid JSON
   - Check that all environment variables are set

2. **Launch Button Not Appearing**
   - Verify `fc:frame` metadata in layout.tsx
   - Check that all image URLs are HTTPS and accessible

3. **App Not Loading in Base App**
   - Ensure `setFrameReady()` is called
   - Check for console errors

4. **Authentication Issues**
   - Verify CDP API key is correct
   - Check Farcaster manifest values

### Debug Mode
Enable debug logging:
```javascript
localStorage.setItem('debug', 'onchainkit:*');
```

## 📊 Analytics & Monitoring

### Base App Metrics
- App launches from Base App
- Social sharing engagement
- User retention in Base App

### Game Metrics
- Focus session completion rates
- User progression and achievements
- Social interactions

## 🎯 Success Metrics

### Launch Checklist
- [ ] App deployed and accessible via HTTPS
- [ ] Environment variables configured
- [ ] Farcaster manifest created and validated
- [ ] Frame metadata working (launch button appears)
- [ ] App launches successfully in Base App
- [ ] Authentication working
- [ ] Core gameplay functional

### Post-Launch
- [ ] Monitor user engagement
- [ ] Gather feedback from Base App community
- [ ] Optimize based on usage patterns
- [ ] Plan feature updates

## 🆘 Support

- **Base App Docs**: [docs.base.org](https://docs.base.org)
- **MiniKit Documentation**: [OnchainKit docs](https://onchainkit.com)
- **Farcaster Manifest**: [Farcaster docs](https://docs.farcaster.xyz)

---

**Your Defeat the Dragon app is now ready for The Base App! 🚀**

The integration maintains your core focus gaming experience while adding the power of Base App's social platform and wallet integration.
