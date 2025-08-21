# Pixel Art Assets for Defeat the Dragon

This directory contains the pixel art assets for the Defeat the Dragon PWA.

## Directory Structure

```
public/assets/
├── images/          # Background images and UI elements
├── sprites/         # Character sprites and animations
└── icons/           # Menu and UI icons
```

## Required Assets

### Character Sprites (`sprites/`)
- `character.png` - Main character sprite with blue scarf

### Menu Icons (`icons/`)
- `settings.png` - Settings menu icon
- `sound.png` - Sound toggle icon
- `shop.png` - Shop/inventory icon
- `inventory.png` - Inventory/bag icon

### UI Elements (`ui/`)
- `level-name-card.png` - Level and Name display card
- `gold-card.png` - Gold/Coins display card
- `sparks-card.png` - Sparks/XP display card
- `focus-button.png` - Main FOCUS button

### Background Images (`images/`)
- `forest-background.png` - Forest scene background

## Asset Specifications

- **Format**: PNG with transparency
- **Style**: Pixel art with crisp edges
- **Size**: Optimized for mobile and desktop display
- **Color Palette**: Consistent with the game's pixel art theme

## How to Add Assets

1. Replace the placeholder files with your actual pixel art assets
2. Ensure the filenames match exactly (case-sensitive)
3. The app will automatically use the assets with fallback to CSS shapes if images fail to load

## Fallback System

The app includes a fallback system that will display CSS-generated shapes if the image assets fail to load, ensuring the app remains functional even without the assets.
