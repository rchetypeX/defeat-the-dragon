# App Icons and Branding

This app uses Next.js 13+ App Router's built-in icon generation system to create dynamic icons and branding assets.

## Icon Files

### Generated Icons
- **`/app/icon.tsx`** - Main favicon (32x32) - Shows 🐉⚔️ on gradient background
- **`/app/apple-icon.tsx`** - Apple touch icon (180x180) - Rounded version for iOS
- **`/app/opengraph-image.tsx`** - Social media sharing image (1200x630)
- **`/app/twitter-image.tsx`** - Twitter-specific sharing image (1200x630)

### Static Files
- **`/public/manifest.json`** - PWA manifest with icon references
- **`/public/favicon.ico`** - Fallback favicon (if needed)

## Design Theme

The icons use a consistent dragon battle theme:
- **Background**: Gradient from dark blue (`#1e3a8a`) to dark red (`#7c2d12`)
- **Icons**: Dragon (🐉) and crossed swords (⚔️) emojis
- **Typography**: Clean, bold text for social sharing images
- **Colors**: Fiery orange/red theme matching the dragon concept

## Usage

### Browser Tab
The favicon appears in browser tabs and bookmarks.

### Mobile Home Screen
When users "Add to Home Screen", they'll see the dragon icon.

### Social Media
When sharing links, the Open Graph image shows the dragon battle theme.

### PWA Installation
The manifest provides proper icons for PWA installation prompts.

## Customization

To modify the icons:
1. Edit the respective `.tsx` files in `/app/`
2. Change the emojis, colors, or layout
3. The icons are generated dynamically on each request
4. No need to create static image files

## Environment Variables

Update these in your `.env.local`:
```env
NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME=Defeat the Dragon
NEXT_PUBLIC_APP_DESCRIPTION=A Pixel-art Pomodoro-style Focus RPG where you train to defeat the dragon through focused work sessions
NEXT_PUBLIC_URL=https://your-app.vercel.app
```

## Technical Details

- Uses Next.js `ImageResponse` API
- Generates PNG images dynamically
- Optimized for different sizes and use cases
- Supports PWA installation
- Includes proper metadata for social sharing
