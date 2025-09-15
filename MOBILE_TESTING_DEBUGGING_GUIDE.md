# Mobile Testing & Debugging Guide for Base App

This guide provides comprehensive instructions for testing and debugging your Defeat the Dragon app on mobile devices, specifically for Base App compatibility.

## 🔧 Mobile Console Debugging Setup

### Eruda Implementation
Your app now includes Eruda mobile console debugging that automatically loads in development environments (excluding localhost).

**Location**: `apps/web/app/page.tsx` (lines 40-46)

**Features**:
- ✅ Automatically loads in development mode
- ✅ Excludes localhost to prevent conflicts
- ✅ Provides mobile console access for debugging
- ✅ Lightweight and non-intrusive

### How to Use Eruda
1. Deploy your app to a staging/production environment
2. Open the app on a mobile device
3. Look for the Eruda console icon (usually a small "v" in the corner)
4. Tap to open the mobile console
5. Use console.log, inspect elements, and debug network requests

## 📱 Mobile Testing Workflow

### 1. Deployment Strategy
```bash
# Deploy to production or staging
npm run build
npm run start

# Or use ngrok for local testing
npx ngrok http 3000
```

### 2. Testing Process
1. **Deploy** your app to a public URL (not localhost)
2. **Share** the mini app in a Farcaster DM to yourself
3. **Open** in mobile client (Base App, Farcaster)
4. **Use** Eruda console for debugging on mobile
5. **Test** across multiple clients for compatibility

### 3. Testing Checklist
- [ ] App loads correctly on mobile devices
- [ ] Touch interactions work properly
- [ ] Viewport is correctly sized
- [ ] Images load and display correctly
- [ ] Console shows no critical errors
- [ ] Authentication flows work properly
- [ ] Game mechanics function correctly
- [ ] Audio plays without issues

## 🎯 Base App Specific Testing

### Authentication Testing
- [ ] SIWF (Sign in with Farcaster) works correctly
- [ ] Wallet connection functions properly
- [ ] User session persists across app restarts
- [ ] No infinite authentication loops

### UI/UX Testing
- [ ] Touch targets are appropriately sized (minimum 44px)
- [ ] Scrolling works smoothly
- [ ] No horizontal scroll issues
- [ ] Text is readable without zooming
- [ ] Buttons respond to touch feedback

### Performance Testing
- [ ] App loads within 3 seconds
- [ ] Smooth animations and transitions
- [ ] No memory leaks during extended use
- [ ] Efficient battery usage

## 🔍 Advanced Troubleshooting

### CBW Validator Tool
Use the Coinbase Wallet validator for Base App compatibility analysis:
- Visit: [CBW Validator](https://validator.coinbase.com/)
- Enter your app URL
- Review compatibility report
- Address any unsupported patterns

### Common Issues & Solutions

#### Authentication Loops
**Problem**: Infinite authentication loops in Base App
**Solution**: Check localStorage handling and user session management

#### Touch Events Not Working
**Problem**: Buttons don't respond to touch
**Solution**: Ensure proper touch event handlers and CSS touch-action properties

#### Viewport Issues
**Problem**: App doesn't fit mobile screen properly
**Solution**: Verify viewport meta tag and responsive CSS

#### Image Loading Issues
**Problem**: Images don't load on mobile
**Solution**: Check image URLs, formats, and loading strategies

## 📋 Farcaster Manifest Configuration

Your app includes a complete `farcaster.json` manifest with:

```json
{
  "accountAssociation": {
    "header": "eyJmaWQiOjc5NTI0NiwidHlwZSI6ImF1dGgiLCJrZXkiOiIweDFhRTk2MDE1QjYxQ0RmMTA2NzRhZWREODE4RDAyNDUwYjIzOTIyNDMifQ",
    "payload": "eyJkb21haW4iOiJkdGQucmNoZXR5cGUueHl6In0", 
    "signature": "/1Z9ekGeTPj5yQ/YGOhdN/954gBR0g7IaS5wnSYA9+Zp8a/T4eA+UnTygsR9FvEZuUBo3CQS+BIKHW4/k5XsRBs="
  },
  "baseBuilder": {
    "allowedAddresses": ["0x1a9Fce96e04ba06D9190339DF817b43837fa0eA9"]
  },
  "frame": {
    "name": "Defeat the Dragon: Focus RPG",
    "iconUrl": "https://dtd.rchetype.xyz/icon.png",
    "homeUrl": "https://dtd.rchetype.xyz",
    "imageUrl": "https://dtd.rchetype.xyz/og-image.webp",
    "buttonTitle": "Launch App", 
    "description": "A Pomodoro-style Focus RPG that gamifies productivity",
    "primaryCategory": "games",
    "tags": ["productivity", "rpg", "focus", "pomodoro", "gamification"]
  }
}
```

## ✅ Success Verification

### Basic Functionality Checklist
- [ ] App loads without errors
- [ ] Images display correctly
- [ ] Wallet connection works
- [ ] Manifest endpoint accessible
- [ ] Embed rendering works
- [ ] Search presence confirmed

### Discovery & Sharing Checklist
- [ ] App appears in Farcaster search
- [ ] Sharing works correctly
- [ ] Deep links function properly
- [ ] Social previews display correctly

## 🚀 Next Steps

1. **Deploy** your app to production
2. **Test** using the mobile testing workflow
3. **Debug** any issues using Eruda console
4. **Validate** using CBW Validator tool
5. **Iterate** based on testing results

## 📞 Support

If you encounter issues:
1. Check the console logs using Eruda
2. Review the troubleshooting section
3. Use the CBW Validator for compatibility issues
4. Test across multiple devices and clients

Remember: Mobile testing is crucial for Base App success. Always test on real devices in the actual Base App environment for the most accurate results.
