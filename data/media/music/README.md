# Music Library for Emotion-Based Recommendations

This directory contains music files organized by emotion categories for the MindNeedAI music recommendation system.

## Directory Structure

```
music/
├── Happy/
│   ├── song1.mp3
│   ├── song2.mp3
│   └── ...
├── Sad/
│   ├── song1.mp3
│   └── ...
├── Angry/
│   └── ...
├── Neutral/
│   └── ...
├── Fear/
│   └── ...
├── Surprise/
│   └── ...
└── Disgust/
    └── ...
```

## Supported Emotions

- **Happy** - Uplifting, cheerful music for positive emotions
- **Sad** - Calming, melancholic music for sadness and depression
- **Angry** - Intense or calming music for anger management
- **Neutral** - Balanced, ambient music for neutral states
- **Fear** - Soothing, relaxing music for anxiety and fear relief
- **Surprise** - Dynamic music for surprising moments
- **Disgust** - Various music for negative emotions

## Supported Audio Formats

- MP3 (.mp3)
- WAV (.wav)
- OGG (.ogg)
- M4A (.m4a)
- FLAC (.flac)
- AAC (.aac)

## How to Add Music

1. Choose the appropriate emotion folder
2. Add your audio files with descriptive names
3. Use lowercase with underscores (e.g., `peaceful_piano.mp3`)
4. The system will automatically detect new files
5. Music will be recommended in rotation - no repeats until all songs are played

## Naming Conventions

- Use descriptive names: `calm_meditation.mp3`, `uplifting_jazz.mp3`
- Avoid special characters except underscores and hyphens
- Keep filenames reasonably short (< 50 characters)

## Rotation Logic

The system implements intelligent rotation:
- Tracks are selected randomly from unplayed songs
- Once all tracks in an emotion category are played, the history resets
- Each user has independent play history
- Users never hear the same song twice until all songs are played at least once

## Example

```
music/
├── Happy/
│   ├── uplifting_acoustic.mp3
│   ├── cheerful_ukulele.mp3
│   └── joyful_piano.mp3
├── Sad/
│   ├── melancholic_strings.mp3
│   └── gentle_rain.mp3
└── Fear/
    ├── calm_meditation.mp3
    ├── peaceful_waves.mp3
    └── relaxing_ambient.mp3
```

## Notes

- Recommended duration: 2-5 minutes per track
- Audio quality: At least 128kbps for MP3
- Total library size: Keep manageable for quick loading
- Copyright: Ensure you have rights to use all music files
