# Speech Emotion Analysis System - Documentation

## How the System Works (Step by Step)

```
┌─────────────────────────────────────────────────────────────────┐
│                    STEP 1: USER UPLOADS AUDIO                   │
│                                                                 │
│  • User records their voice or uploads an audio file            │
│  • Supported formats: WAV, MP3, M4A, FLAC, OGG, WebM            │
│  • Allowed length: 1 second to 20 minutes                       │
│  • File size limit: 100 MB                                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│            STEP 2: PREPARE THE AUDIO FILE                       │
│                                                                 │
│  What happens behind the scenes:                                │
│  • Load the audio file into memory                              │
│  • Convert to standard format (mono - single channel)           │
│  • Resample to 16,000 Hz (industry standard for speech)         │
│  • Normalize volume (make it consistent)                        │
│  • Remove complete silence sections                             │
│                                                                 │
│  Why this matters: The emotion detection model needs audio      │
│  in a specific format to work properly.                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│         STEP 3: BREAK AUDIO INTO MANAGEABLE PIECES              │
│                                                                 │
│  If audio is LONGER than 30 seconds:                            │
│  • Split into 30-second chunks                                  │
│  • Add 5-second overlap between chunks                          │
│  • This keeps emotional context consistent                      │
│                                                                 │
│  Example: 60-second audio becomes:                              │
│    Chunk 1: 0-30 seconds                                        │
│    Chunk 2: 25-55 seconds                                       │
│    Chunk 3: 50-60 seconds                                       │
│                                                                 │
│  If audio is 30 seconds or SHORTER:                             │
│  • Process as one complete piece                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│       STEP 4: DETECT EMOTIONS (Wav2Vec2 AI Model)               │
│                                                                 │
│  The AI model analyzes each chunk:                              │
│  • Listens to the audio patterns (pitch, speed, tone, etc.)     │
│  • Calculates probability of 8 emotions                         │
│  • Produces emotion scores for each chunk                       │
│                                                                 │
│  The 8 Emotions Detected:                                       │
│  ✓ Angry      (frustrated, upset)                               │
│  ✓ Calm       (peaceful, relaxed)                               │
│  ✓ Disgust    (repulsed, offended)                              │
│  ✓ Fearful    (anxious, scared)                                 │
│  ✓ Happy      (joyful, pleased)                                 │
│  ✓ Neutral    (no emotion, flat)                                │
│  ✓ Sad        (depressed, unhappy)                              │
│  ✓ Surprised  (shocked, astonished)                             │
│                                                                 │
│  Output per chunk (example):                                    │
│    angry: 8%, calm: 15%, disgust: 3%, fearful: 12%              │
│    happy: 42%, neutral: 12%, sad: 5%, surprised: 3%             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│     STEP 5: COMBINE RESULTS INTO OVERALL EMOTION                │
│                                                                 │
│  Why combine? If we analyzed 5 chunks, we get 5 different       │
│  emotion detections. We need to combine them smartly.           │
│                                                                 │
│  Smart Combination Method:                                      │
│  • Longer chunks get more weight (more representative)          │
│  • Higher confidence emotions get more weight                   │
│  • Formula: Weight = chunk_length × (0.5 + 0.5 × confidence)    │
│                                                                 │
│  Result: Single overall emotion + confidence score              │
│    Final Emotion: HAPPY (42% overall)                           │
│    Confidence: High (0.85 out of 1.0)                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│           STEP 6: ASSESS AUDIO QUALITY ⭐ HOW IT WORKS          │
│                                                                 │
│  Audio quality affects emotion detection accuracy. Poor         │
│  quality audio = less reliable results.                         │
│                                                                 │
│  THREE QUALITY CHECKS:                                          │
│                                                                 │
│  1️⃣  ENERGY LEVEL (Volume Consistency)                          │
│  ├─ What: Measure how loud the audio is                         │
│  ├─ Why: Consistent volume = clearer voice signals              │
│  ├─ How: Calculate mean energy across audio                     │
│  ├─ Formula: energy_score = min(1.0, energy × 1000)             │
│  └─ Result: 0.0 (very quiet) to 1.0 (very loud)                 │
│                                                                 │
│  2️⃣  SPECTRAL CENTROID (Clarity & Brightness)                   │
│  ├─ What: Measure clarity of speech (high frequencies)          │
│  ├─ Why: Speech should have balanced frequencies                │
│  ├─ How: Analyze frequency distribution                         │
│  ├─ Formula: centroid_score = min(1.0, centroid / 4000)         │
│  └─ Result: 0.0 (very muffled) to 1.0 (crystal clear)           │
│                                                                 │
│  3️⃣  NOISE ESTIMATION (Background Noise)                        │
│  ├─ What: Detect unwanted background sounds                     │
│  ├─ Why: Noise interferes with emotion detection                │
│  ├─ How: Compare quiet parts to loud parts                      │
│  └─ Result: Noise level estimate                                │
│                                                                 │
│  FINAL QUALITY SCORE:                                           │
│  • Combines energy (60% weight) + clarity (40% weight)          │
│  • Quality = (energy_score × 0.6) + (centroid_score × 0.4)      │
│  • Range: 0.1 (poor) to 1.0 (excellent)                         │
│  • Threshold for acceptance: ≥ 0.6 (60%)                        │
│                                                                 │
│  ❌ Low Quality Triggers:                                       │
│     - Too much background noise (coffee shop, traffic)          │
│     - Very quiet recording (can't hear well)                    │
│     - Robotic or distorted audio                                │
│     - Disconnected or choppy recording                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│      STEP 7: GENERATE CLINICAL INSIGHTS                         │
│                                                                 │
│  Based on emotions detected, calculate:                         │
│                                                                 │
│  • Emotional Valence (positive vs negative):                    │
│    Range: -1 (very negative) to +1 (very positive)              │
│    Formula: (positive_emotions - negative_emotions) /           │
│             (positive_emotions + negative_emotions)             │
│                                                                 │
│  • Emotional Arousal (energetic vs calm):                       │
│    Range: 0 (very calm) to 1 (very energetic)                   │
│    Formula: high_energy_emotions / (high + low energy)          │
│                                                                 │
│  • Emotional Stability (confidence level):                      │
│    Range: 0 (very uncertain) to 1 (very certain)                │
│    How dominant emotion is compared to others                   │
│                                                                 │
│  • Clinical Risk Indicators:                                    │
│    ✓ Depression risk (high sadness)                             │
│    ✓ Anxiety risk (high fear, rapid speech)                     │
│    ✓ Social engagement level (emotional variety)                │
│    ✓ Cognitive health markers (speech clarity, fluency)         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│     STEP 8: ADVANCED AI ANALYSIS (GPT-4) - Optional             │
│                                                                 │
│  If API key available:                                          │
│  • Deep analysis of vocal patterns                              │
│  • Speech coherence evaluation                                  │
│  • Detailed clinical risk assessment                            │
│  • Personalized care recommendations                            │
│                                                                 │
│  If API not available:                                          │
│  • System still works with basic analysis above                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│      STEP 9: DECIDE IF EXPERT REVIEW NEEDED                     │
│                                                                 │
│  Automatic Review Trigger if ANY of these:                      │
│  ✓ Low emotion confidence (< 40%)                               │
│  ✓ Poor audio quality (< 40%)                                   │
│  ✓ Very high negative emotions (> 70% sad/scared/angry)         │
│  ✓ High clinical priority emotions detected (≥ 60%)             │
│  ✓ Audio very short (< 2 seconds) or too long (> 20 min)        │
│  ✓ High-risk indicators detected (depression, anxiety)          │
│  ✓ AI suggests human review is needed                           │
│                                                                 │
│  If flagged: Human expert (Speech-Language Pathologist)         │
│             will manually review the analysis                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│         STEP 10: SAVE RESULTS & SHOW TO USER                    │
│                                                                 │
│  • Save complete session data as JSON file                      │
│  • Store in database for future reference                       │
│  • Create review request if needed                              │
│  • Generate audit log (for compliance/tracking)                 │
│  • Send results back to user/healthcare provider                │
│  • Show detected emotions, confidence, quality score            │
└─────────────────────────────────────────────────────────────────┘
```
