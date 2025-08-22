# Character Dialogue System

## Overview
The CharacterDialogue component displays randomized motivational quotes from the character on the home screen. The dialogue changes every minute and only appears when the character is visible (not during focus sessions or other overlays).

## Features
- **Randomized Quotes**: 85+ motivational quotes from the provided list
- **Automatic Rotation**: Changes every 60 seconds
- **Click Interaction**: Click the character to generate a new quote instantly
- **Contextual Display**: Only shows when character is visible on home screen
- **Smooth Animation**: Fade-in animation when dialogue appears
- **Responsive Design**: Adapts to different screen sizes

## Usage
```tsx
<CharacterDialogue isVisible={!showSessionTimer && !sessionProgress.isActive && !sessionResult} />
```

## Props
- `isVisible: boolean` - Controls whether the dialogue should be displayed
- `triggerQuoteChangeCount: number` - External trigger to change quotes (for click interactions)

## Behavior
1. When `isVisible` becomes `true`, waits 1 second then shows a random quote
2. Every 60 seconds, automatically changes to a new random quote
3. Click the character to instantly generate a new random quote
4. When `isVisible` becomes `false`, hides the dialogue immediately
5. Uses a speech bubble design that matches the game's pixel art aesthetic

## Styling
- Speech bubble with brown border and cream background
- Positioned above the character
- Responsive text sizing (xs on mobile, sm on desktop)
- Drop shadow for depth
- Fade-in animation on appearance

## Quote Categories
The quotes are motivational and focus-themed, covering:
- Discipline and routine
- Focus and concentration
- Progress and persistence
- Adventure and questing
- Character development
- Gaming metaphors for real life
