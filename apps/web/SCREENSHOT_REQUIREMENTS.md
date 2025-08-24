# 📸 Screenshot Requirements for Base App Discovery

## 🎯 Overview

Screenshots are crucial for Base App discovery and user engagement. They provide visual previews of your app's functionality and help users understand what to expect.

## 📱 Screenshot Specifications

### **Required Format:**
- **Format**: PNG or JPG
- **Dimensions**: 1284×2778px (portrait orientation recommended)
- **Maximum**: 3 screenshots
- **File Size**: Optimize for web (recommended < 500KB each)

### **Placeholder URLs (Ready for Your Images):**
```
https://dtd.rchetype.xyz/screenshots/gameplay-1.png
https://dtd.rchetype.xyz/screenshots/focus-session.png
https://dtd.rchetype.xyz/screenshots/character-select.png
```

## 🎮 Recommended Screenshots

### **1. gameplay-1.png - Main Game Dashboard**
**What to capture:**
- Character selection screen
- Level and XP display
- Shop/Inventory buttons
- Overall game interface

**Purpose:** Shows the main gameplay experience and progression system

### **2. focus-session.png - Active Focus Session**
**What to capture:**
- Timer running during a focus session
- Character in action pose
- Progress indicators
- Session controls

**Purpose:** Demonstrates the core Pomodoro functionality

### **3. character-select.png - Character & Customization**
**What to capture:**
- Character selection interface
- Available characters/backgrounds
- Customization options
- Shop items

**Purpose:** Highlights the RPG and customization elements

## 📂 File Structure

Create this folder structure in your `public` directory:

```
apps/web/public/
├── screenshots/
│   ├── gameplay-1.png
│   ├── focus-session.png
│   └── character-select.png
```

## 🎨 Design Guidelines

### **Best Practices:**
- **High Quality**: Use crisp, clear images
- **Consistent Style**: Match your app's pixel art aesthetic
- **Good Lighting**: Ensure UI elements are clearly visible
- **Proper Framing**: Focus on the most important features
- **Mobile-First**: Remember these will be viewed on mobile devices

### **What to Avoid:**
- ❌ Blurry or low-resolution images
- ❌ Cluttered interfaces
- ❌ Personal information or sensitive data
- ❌ Images that don't represent actual app functionality

## 🚀 Implementation Steps

### **1. Create Screenshots**
Take high-quality screenshots of your app's key features using the specifications above.

### **2. Optimize Images**
- Resize to 1284×2778px
- Compress for web (use tools like TinyPNG)
- Ensure file size < 500KB each

### **3. Upload to Public Directory**
Place the optimized images in:
```
apps/web/public/screenshots/
```

### **4. Verify URLs**
Test that your images are accessible at:
- `https://dtd.rchetype.xyz/screenshots/gameplay-1.png`
- `https://dtd.rchetype.xyz/screenshots/focus-session.png`
- `https://dtd.rchetype.xyz/screenshots/character-select.png`

### **5. Update Manifest**
The manifest will automatically include these screenshots once the files are uploaded.

## 🔍 Testing

### **Verify Screenshots:**
```bash
# Test each screenshot URL
curl -I https://dtd.rchetype.xyz/screenshots/gameplay-1.png
curl -I https://dtd.rchetype.xyz/screenshots/focus-session.png
curl -I https://dtd.rchetype.xyz/screenshots/character-select.png
```

### **Check Manifest:**
```bash
# Verify screenshots appear in manifest
curl https://dtd.rchetype.xyz/.well-known/farcaster.json | jq '.frame.screenshotUrls'
```

## 📊 Impact on Discovery

### **Benefits:**
- ✅ **Better Search Rankings**: Screenshots improve app discoverability
- ✅ **Higher Click-Through Rates**: Visual previews increase user interest
- ✅ **Professional Appearance**: Screenshots make your app look polished
- ✅ **User Expectations**: Clear previews reduce user confusion

### **Base App Integration:**
- Screenshots appear in search results
- Featured in category browsing
- Shown in app recommendations
- Displayed in user's saved apps

## 🎯 Success Metrics

After adding screenshots, monitor:
- **Search Visibility**: App appears in more search results
- **Click-Through Rate**: Higher engagement from search listings
- **User Retention**: Better user expectations lead to higher retention
- **App Store Rankings**: Improved positioning in category listings

---

**Ready to enhance your app's discovery with compelling screenshots!** 📸✨
