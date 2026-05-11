# Video/Facial Emotion Analysis System - Complete Documentation

## 🔄 How the System Works (Step by Step)

```
┌─────────────────────────────────────────────────────────────────┐
│                 STEP 1: START VIDEO SESSION                     │
│                                                                 │
│  • User/Provider starts analysis in UI                          │
│  • Webcam permission requested                                  │
│  • Session ID created                                           │
│  • Temporal state reset (clean slate)                           │
│  • Database session created                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│           STEP 2: OPEN WEBCAM & INITIALIZE                      │
│                                                                 │
│  • Webcam opened at 30 FPS (frames per second)                  │
│  • MediaPipe face mesh loaded                                   │
│  • Resolution detected (e.g., 1280x720)                         │
│  • Real-time processing starts                                  │
│                                                                 │
│  Optimizations enabled:                                         │
│  • Threaded capture (doesn't block main process)                │
│  • Face detection every 2 frames                                │
│  • Inference every 1 frame                                      │
│  • Downscaled detection (50% resolution for speed)              │
│  • GPU acceleration if available                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│         STEP 3: FRAME-BY-FRAME PROCESSING (Loop)                │
│                                                                 │
│  For EACH frame captured:                                       │
│                                                                 │
│  A) FACE DETECTION (every 2 frames)                             │
│  ├─ Downscale frame to 50% for speed                            │
│  ├─ Run MediaPipe face mesh                                     │
│  ├─ Extract facial landmarks (468 points)                       │
│  ├─ Draw bounding box around face                               │
│  └─ Track face position smoothly                                │
│                                                                 │
│  B) EMOTION PREDICTION (every frame)                            │
│  ├─ Extract face region from full-size frame                    │
│  ├─ Resize to 224x224 pixels                                    │
│  ├─ Normalize using ImageNet statistics                         │
│  ├─ Send to ResNet50 model                                      │
│  ├─ Get emotion probabilities for 7 emotions                    │
│  ├─ Apply temporal smoothing (average last 10 frames)           │
│  └─ Return most confident emotion                               │
│                                                                 │
│  C) FRAME LOGGING                                               │
│  ├─ Save to database (VideoFrameRecord)                         │
│  ├─ Store: frame_number, timestamp, emotion, confidence         │
│  ├─ Mark face detected or not                                   │
│  └─ All frames saved (nothing lost)                             │
│                                                                 │
│  D) DISPLAY ON SCREEN                                           │
│  ├─ Draw face rectangle                                         │
│  ├─ Show emotion name + confidence %                            │
│  ├─ Display FPS (frames per second)                             │
│  ├─ Show frame count and elapsed time                           │
│  └─ Instruction: "Press 'q' to finish"                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼ (User presses 'q' or time limit reached)
┌─────────────────────────────────────────────────────────────────┐
│           STEP 4: AGGREGATE RESULTS                             │
│                                                                 │
│  After video capture stops:                                     │
│                                                                 │
│  • Count total frames captured                                  │
│  • Count frames with face detected                              │
│  • Calculate total duration                                     │
│  • Find dominant emotion (most frequent)                        │
│  • Calculate average confidence across all frames               │
│  • Build emotion distribution:                                  │
│    - How many frames were happy? = X%                           │
│    - How many frames were sad? = Y%                             │
│    - etc. for all 7 emotions                                    │
│                                                                 │
│  Example:                                                       │
│    Happy: 60% | Neutral: 20% | Sad: 10% | Others: 10%           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│      STEP 5: CREATE SESSION FILE (JSON)                         │
│                                                                 │
│  Saves complete session data:                                   │
│  • Session ID, user ID, timestamp                               │
│  • Total frames & valid frames                                  │
│  • Duration in seconds                                          │
│  • Dominant emotion & confidence                                │
│  • Emotion distribution (all 7 emotions %)                      │
│  • EVERY SINGLE FRAME DATA:                                     │
│    - Frame number                                               │
│    - Timestamp within session                                   │
│    - Emotion detected                                           │
│    - Confidence score                                           │
│    - Face detected (yes/no)                                     │
│                                                                 │
│  Location: model_cache/facial_analysis/sessions/                │
│  Format: video_session_[ID].json                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│    STEP 6: GENERATE CLINICAL INSIGHTS                           │
│                                                                 │
│  Analyzes emotional patterns:                                   │
│                                                                 │
│  • Emotional Stability:                                         │
│    - How consistent was emotion? (vs jumping around)            │
│    - Range: 0 (chaotic) to 1 (very stable)                      │
│                                                                 │
│  • Mood Trajectory:                                             │
│    - Did mood improve, worsen, or stay same?                    │
│    - Positive emotions at start vs end?                         │
│                                                                 │
│  • Rapid Changes:                                               │
│    - Count sudden emotion switches                              │
│    - High count = emotional volatility                          │
│                                                                 │
│  • Emotional Variability:                                       │
│    - How many different emotions shown?                         │
│    - Low = flat/limited expressiveness                          │
│    - High = rich emotional expression                           │
│                                                                 │
│  • Clinical Risk Scores:                                        │
│    - Depression risk (high sadness)                             │
│    - Anxiety risk (high fear)                                   │
│    - Agitation risk (high anger)                                │
│    - Apathy risk (all neutral/sad)                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│     STEP 7: ADVANCED AI ANALYSIS (GPT-4) - Optional             │
│                                                                 │
│  If OpenAI API available:                                       │
│  • Deep analysis of all 7 emotions detected                     │
│  • Emotional pattern analysis                                   │
│  • Rapid change detection and timing                            │
│  • Clinical risk stratification                                 │
│  • Concerning pattern identification                            │
│  • Personalized care recommendations                            │
│  • Detailed clinical summary                                    │
│  • Priority assessment (low/medium/high)                        │
│                                                                 │
│  If API not available:                                          │
│  • System still works with basic metrics                        │
│  • No AI-powered insights                                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│      STEP 8: DECIDE IF REVIEW NEEDED                            │
│                                                                 │
│  Automatic review triggers if ANY of:                           │
│  ✓ Average confidence < 50% (model uncertain)                   │
│  ✓ Negative emotions > 60% (sad/fear/angry/disgust)             │
│  ✓ Rapid emotional changes detected (volatility)                │
│  ✓ AI analysis flags concerning patterns                        │
│  ✓ High depression/anxiety/agitation scores                     │
│  ✓ Very little emotional expression (flat affect)               │
│                                                                 │
│  If triggered: Creates human review request                     │
│  Reviewer type: Behavioral Psychologist                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│      STEP 9: SAVE & FINALIZE                                    │
│                                                                 │
│  • Save session file to model_cache/facial_analysis/sessions/   │
│  • Update database with session summary                         │
│  • Create review request if needed                              │
│  • Generate audit log entry                                     │
│  • Return results to user                                       │
│  • Display summary on screen                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧠 The 7 Emotions Detected

### Emotion Categories

| Emotion | Meaning | Clinical Concern | Typical Expressions |
|---------|---------|------------------|---------------------|
| **Neutral** | No emotion, blank face | Could indicate depression | Flat face, no expression |
| **Happiness** | Joy, pleasure, contentment | Positive | Smile, raised cheeks |
| **Sadness** | Unhappy, depressed, blue | High concern | Drooping mouth, inner brows up |
| **Fear** | Anxiety, worry, scared | High concern | Wide eyes, raised brows |
| **Anger** | Frustrated, upset, irritated | Medium concern | Furrowed brows, tight lips |
| **Disgust** | Repulsion, offense, contempt | Medium concern | Wrinkled nose, upper lip raised |
| **Surprise** | Shocked, astonished | Low concern | Wide eyes, raised brows, open mouth |

### Grouping by Clinical Importance

**Positive Emotions** (Good sign):
- Happiness, Surprise

**Negative Emotions** (Concerning):
- Sadness, Fear, Anger, Disgust

**Neutral** (Context dependent):
- Could be normal or indicate depression if constant

---

## 📦 System Components

### 1. **Facial Analyzer** (`facial_analyzer.py`)
**What it is:** The AI engine that detects emotions from faces

**What it does:**
- Loads ResNet50 model (emotion detection)
- Loads LSTM model if available (temporal tracking)
- Preprocesses face images (resize, normalize)
- Extracts facial features
- Predicts emotion probabilities
- Applies temporal smoothing
- Smooths face bounding box tracking

**Key optimizations:**
- GPU acceleration (FP16 half precision)
- Face detection every 2 frames
- Inference skipping when face not changing
- Box smoothing (prevents jitter)

### 2. **Video Analysis Service** (`facial_analysis_service.py`)
**What it is:** The main orchestrator for video analysis

**What it does:**
- Manages webcam capture (multithreaded)
- Runs real-time emotion analysis
- Logs every frame to database
- Displays results on screen
- Calculates session statistics
- Calls AI analysis (GPT-4)
- Creates session JSON file
- Determines if review needed

**Key functions:**
- `run_realtime_analysis()` - Main analysis loop
- `_finalize_session()` - Aggregate and save results
- `_determine_review_requirement()` - Check review triggers

### 3. **Agentic Reasoner** (`agentic_reasoner.py`)
**What it is:** Advanced AI analysis using GPT-4 (optional)

**What it does:**
- Deep analysis of emotional patterns
- Detects emotion transitions
- Calculates emotional stability
- Generates clinical risk profiles
- Provides care recommendations
- Identifies concerning patterns

**Output includes:**
- Overall sentiment (positive/negative/mixed)
- Dominant emotions with frequencies
- Concerning patterns found
- Clinical recommendations
- Priority level (low/medium/high)

### 4. **Model Manager** (`model_manager.py`)
**What it is:** Manages facial recognition models and versions

**What it does:**
- Registers available models
- Tracks model performance metrics
- Manages model activation
- Handles model versioning
- Stores model registry (JSON)

### 5. **Continuous Learning** (`continuous_learning.py`)
**What it is:** System for improving models from expert feedback

**What it does:**
- Collects feedback from human reviews
- Prepares fine-tuning datasets
- Retrains model with corrections
- Tracks accuracy improvements
- Monitors learning progress

---

## 🎥 Real-Time Processing Flow

### Frame Processing Cycle

**Timing per frame:**
- Webcam capture: ~1 frame per 33ms (30 FPS)
- Face detection: Every 2 frames = every 67ms
- Emotion inference: Every frame = every 33ms
- Database logging: Instant

**What happens for each frame:**

1. **Capture** - Get frame from webcam (multithreaded)
2. **Downscale** - Reduce to 50% resolution for face detection
3. **Face Detection** - Find face landmarks using MediaPipe
4. **Face Extraction** - Extract face region at full resolution
5. **Preprocess** - Resize to 224x224, normalize
6. **Inference** - Run through ResNet50
7. **Smoothing** - Average with last 10 frames
8. **Display** - Draw box and emotion on screen
9. **Log** - Save to database

**Performance:**
- Processing time: ~30-50ms per frame
- FPS achieved: 20-30 FPS (depending on hardware)
- GPU vs CPU: GPU is 3-5x faster

---

## 📊 Understanding the Results

### Emotion Distribution
Shows what percentage of the session was each emotion:

```
Example session:
Happy:    60%  ████████████░░░░░░░
Neutral:  20%  ████░░░░░░░░░░░░░░░
Sad:      10%  ██░░░░░░░░░░░░░░░░░
Fear:      5%  █░░░░░░░░░░░░░░░░░░
Others:    5%  █░░░░░░░░░░░░░░░░░░
```

### Emotional Stability
- **0.0 to 0.3**: Very unstable (emotions changing rapidly)
- **0.3 to 0.6**: Moderately stable (some emotion changes)
- **0.6 to 1.0**: Very stable (consistent emotion)

**What it means:**
- Very unstable = may indicate anxiety, agitation, or emotional volatility
- Very stable = may indicate either calm or emotional flatness

### Average Confidence
- **0.7 to 1.0**: High confidence (model very sure)
- **0.5 to 0.7**: Moderate confidence (clear emotion but not definite)
- **0.0 to 0.5**: Low confidence (ambiguous expression, triggers review)

### Rapid Changes
Count of emotion switches during session:

- **0-5 switches**: Normal, consistent emotions
- **5-15 switches**: Some emotional variation
- **15+ switches**: High emotional volatility

---

## 💾 Data Storage

### Session JSON File Example

```json
{
  "session_id": "video_session_abc123def456",
  "user_id": "patient_789",
  "duration_seconds": 45.3,
  "total_frames": 1359,
  "valid_frames": 1250,
  "dominant_emotion": "Happiness",
  "average_confidence": 0.82,
  "emotion_distribution": {
    "Happiness": 0.60,
    "Neutral": 0.20,
    "Sadness": 0.08,
    "Fear": 0.05,
    "Surprise": 0.04,
    "Anger": 0.02,
    "Disgust": 0.01
  },
  "frame_emotions": [
    {
      "frame_number": 0,
      "timestamp": 0.033,
      "emotion": "Neutral",
      "confidence": 0.78,
      "face_detected": true
    },
    {
      "frame_number": 1,
      "timestamp": 0.066,
      "emotion": "Happiness",
      "confidence": 0.85,
      "face_detected": true
    },
    ... (ALL 1359 frames)
  ],
  "clinical_insights": {
    "emotional_stability": 0.75,
    "rapid_changes": 8,
    "mood_trajectory": "stable",
    ...
  }
}
```

### Database Records

Every frame is saved to database with:
- Frame ID
- Session ID  
- Frame number
- Timestamp
- Emotion detected
- Confidence score
- Face detected (yes/no)

**Total records:** If 45-second session at 30 FPS = 1350 frame records

---

## 🔧 Configuration & Settings

### Default Configuration

```python
FACIAL_ANALYSIS_CONFIG = {
    # Face detection settings
    "face_detect_interval": 2,          # Every 2 frames
    "inference_interval": 1,            # Every frame
    "detection_scale": 0.5,             # 50% resolution
    "min_face_size": 40,                # pixels
    
    # Model settings
    "history_size": 10,                 # frames to smooth
    "box_smooth_factor": 0.3,           # box tracking smoothness
    
    # Review thresholds
    "min_confidence_threshold": 0.5,    # 50%
    "negative_emotion_threshold": 0.6,  # 60%
    
    # Webcam settings
    "fps_target": 30,                   # frames per second
}
```

---

## 🏥 Clinical Applications

### Depression Detection
**Signs to look for:**
- High sadness (> 40%)
- Neutral emotion dominating (60%+)
- Flat affect (no emotional variety)
- Very stable/emotionless expression

**Action:**
- Flag for review if sadness > 40%
- Recommend depression screening
- Monitor over time

### Anxiety Detection
**Signs to look for:**
- High fear (> 20%)
- High number of rapid changes (> 20)
- High average confidence (>0.8) on negative emotions
- Very unstable emotions

**Action:**
- Flag for review
- Assess anxiety triggers
- Monitor symptoms

### Agitation Detection
**Signs to look for:**
- High anger (> 30%)
- High disgust (> 20%)
- Many rapid emotion changes
- Low stability score

**Action:**
- Alert caregivers
- Investigate stressors
- Provide calming interventions

### Emotional Withdrawal
**Signs to look for:**
- All neutral or sad emotions
- Very low happiness (< 10%)
- Very stable (no emotional variation)
- Low facial expressiveness

**Action:**
- Encourage social activities
- Monitor isolation
- Recommend interventions

---

## 📊 Performance Metrics

### Model Accuracy
- **Accuracy**: 67.57% (on test data)
- **Processing Speed**: Real-time at 20-30 FPS
- **Memory Usage**: ~1.5-2 GB with GPU
- **GPU Acceleration**: 3-5x faster than CPU

### Video Specifications
- **Resolution**: Any (automatically detected)
- **Frame Rate**: 30 FPS (optimal)
- **Duration**: Any (limited by storage/time)
- **Lighting**: Standard room lighting (bright helps)

### Review Triggers
- **Target Review Rate**: 15-20% of sessions
- **Low Confidence**: < 50%
- **High Negative**: > 60%
- **Rapid Changes**: > 20 switches
- **High Concern Emotions**: When combined > 30%

---

## 🎯 Quick Start

### Running Analysis

```python
from src.multimodel.facial_analysis import VideoAnalysisService

# Initialize
service = VideoAnalysisService()

# Run analysis (60 second limit)
response = service.run_realtime_analysis(
    user_id="patient_123",
    duration_limit=60
)

# Check results
print(f"Dominant: {response.dominant_emotion}")
print(f"Confidence: {response.average_confidence:.1%}")
print(f"Total frames: {response.total_frames}")
print(f"Needs review: {response.requires_human_review}")

# AI analysis results (if available)
if response.agentic_analysis:
    print(f"Summary: {response.agentic_analysis.detailed_summary}")
    print(f"Priority: {response.agentic_analysis.review_priority}")
```

---

## 🔒 Privacy & Security

### Data Protection
- ✓ Encrypted storage of session files
- ✓ Consent-based capture and processing
- ✓ Secure model storage
- ✓ Audit logging (who accessed what, when)
- ✓ HIPAA-compliant handling

### Data Retention
- **Default**: 30 days (configurable)
- **Automatic cleanup**: Old sessions deleted
- **With consent**: Can be longer for research
- **Without consent**: Only aggregated statistics kept

---

## ⚙️ System Architecture

### Core Components

```
User/Provider starts analysis
    ↓
VideoAnalysisService (orchestrator)
    ├─ WebcamStream (capture)
    ├─ MediaPipe (face detection)
    ├─ FacialEmotionAnalyzer (emotion prediction)
    ├─ Database (frame logging)
    ├─ VideoAgenticReasoner (AI analysis)
    └─ HumanReviewSystem (review management)
```

### Data Flow

```
Webcam → Capture → Face Detection → Emotion Inference 
  → Smoothing → Display & Logging → Session Aggregation 
  → AI Analysis → Review Decision → Save Results
```

---

## 🐛 Troubleshooting

### Webcam Not Detected
```python
import cv2
cap = cv2.VideoCapture(0)
if cap.isOpened():
    print("✓ Webcam works")
else:
    print("✗ Webcam not working - try different camera index")
cap.release()
```

### Low Accuracy / Poor Detections
**Common causes:**
- Poor lighting (too dark or glare)
- Face partially visible or turned away
- Distance too far from camera
- Glasses reflecting light

**Solutions:**
- Improve room lighting
- Position face centered in frame
- Sit 1-2 feet from camera
- Remove reflective sunglasses

### GPU Issues
```python
import torch
print(f"GPU available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")
```

### Database Errors
Check database connectivity:
```python
from src.database.models import DatabaseManager
db = DatabaseManager()
db.check_health()  # Returns status
```

---

## 🎯 For Different Audiences

### For Healthcare Providers
- Focus on: Dominant emotion, emotional stability, review flags
- Use: Results to inform care decisions
- Avoid: Technical implementation details

### For Patients
- Focus on: Overall emotional pattern, recommendations
- Avoid: Confidence scores, technical metrics
- Benefit: Simple emotion tracking

### For Researchers
- Focus on: Model accuracy, frame-by-frame data, patterns
- Use: Session files for analysis
- Benefit: Complete dataset for research

### For System Administrators
- Focus on: Performance stats, database health, storage
- Use: For system monitoring
- Benefit: Proactive issue detection

---

## ✨ Key Features

✓ **Real-time Processing** - Instant emotion detection (20-30 FPS)
✓ **Complete Data Capture** - Every frame logged, nothing lost
✓ **Smart Optimizations** - Face detection every 2 frames for speed
✓ **GPU Acceleration** - 3-5x faster on GPU vs CPU
✓ **Temporal Smoothing** - Reduces jitter, accurate tracking
✓ **Clinical Grade** - 7-emotion model for healthcare use
✓ **AI-Powered Analysis** - GPT-4 deep insights (optional)
✓ **Automatic Review** - Flags concerning patterns
✓ **Multi-Session** - Tracks patterns over multiple sessions

---

## 🏆 How It Works Better Than Alternatives

| Feature | Our System | Alternatives |
|---------|-----------|--------------|
| **Real-time** | ✓ 20-30 FPS | ✓ Similar |
| **Emotions** | 7 emotions | Usually 6 or fewer |
| **Smoothing** | Temporal (10 frames) | None or less |
| **GPU Support** | ✓ Full FP16 | Some |
| **Clinical Focus** | ✓ Designed for healthcare | Generic |
| **Complete Logging** | Every frame | Frame summary only |
| **AI Analysis** | GPT-4 optional | None or simple |
| **Integration** | Database + Review system | Limited |

---

## 📖 Technical References

- **Model**: ResNet50 (FER_static_ResNet50_optimized.pt)
- **Temporal Model**: LSTM (FER_dinamic_LSTM_Aff-Wild2.pt) - Optional
- **Face Detection**: MediaPipe Face Mesh (468 landmarks)
- **Framework**: PyTorch + OpenCV + MediaPipe
- **Optimization**: Mixed precision (FP16), GPU acceleration, CuDNN auto-tuning

---

## 🔗 Related Documentation

- Speech Analysis: `Docs/speech_analysis/SPEECH_ANALYSIS_SUMMARY.md`
- Text Analysis: System overview in codebase
- Database Models: `src/database/models.py`
- API Endpoints: `src/multimodel/facial_analysis/api.py`

---

**Last Updated**: 2025
**Version**: 2.0 (Simplified & Enhanced)
**Status**: Production Ready ✅

