# Audio Assets

This directory contains audio files for the Defeat the Dragon game.

## Background Music

Place your background music files here in MP3 format. The recommended file structure:

### Focus Session Music

The `focus-session-music.mp3` file is specifically for when a focus session is active. This music will:
- Automatically start when a focus session begins
- Automatically stop when the session ends
- Have different volume settings than regular background music
- Show separate controls during development

```
audio/
├── background-music.mp3        # Main background music
├── focus-session-music.mp3     # Music for active focus sessions
├── menu-music.mp3             # Menu/UI background music
├── battle-music.mp3           # Battle/action music
└── victory-music.mp3          # Victory/completion music
```

## File Naming Convention

- Use lowercase letters and hyphens for file names
- Keep file names descriptive but concise
- Example: `forest-ambience.mp3`, `dungeon-theme.mp3`

## Supported Formats

- **MP3** (recommended for web compatibility)
- **OGG** (alternative for better compression)
- **WAV** (uncompressed, larger file size)

## Usage in Code

Audio files can be referenced in your React components like this:

```typescript
const backgroundMusic = '/assets/audio/background-music.mp3';
```

## File Size Considerations

- Keep background music files under 5MB for optimal loading
- Consider using compressed MP3 files (128-192 kbps) for web
- For longer tracks, consider looping shorter segments


