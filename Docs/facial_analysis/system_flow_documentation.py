"""

```
                                        ┌─────────────────────────────────────────────────────┐
                                        │          STEP 1: VIDEO SESSION START                │
                                        │                                                     │
                                        │  User initiates video monitoring session:           │
                                        │  • Webcam activation (local) OR                     │
                                        │  • API session creation (web-based)                 │
                                        │  • Generate unique session_id                       │
                                        │  • Reset temporal state for new analysis            │
                                        └──────────────────────┬──────────────────────────────┘
                                                               │
                                                               ▼
                                        ┌─────────────────────────────────────────────────────┐
                                        │       STEP 2: FACE DETECTION (MediaPipe)            │
                                        │                                                     │
                                        │  For each video frame:                              │
                                        │  • Detect faces using MediaPipe Face Mesh           │
                                        │  • Extract facial landmark coordinates (468 points) │
                                        │  • Calculate bounding box around face               │
                                        │  • Apply smoothing for stable tracking              │
                                        │  • Validate face size and aspect ratio              │
                                        │                                                     │
                                        │  Optimization: Detect every 2 frames, use 50%       │
                                        │  resolution for detection to maintain real-time     │
                                        │  performance (~30 FPS)                              │
                                        └──────────────────────┬──────────────────────────────┘
                                                               │
                                                               ▼
                                        ┌─────────────────────────────────────────────────────┐
                                        │    STEP 3: EMOTION CLASSIFICATION (ResNet50)        │
                                        │                                                     │
                                        │  For detected face region:                          │
                                        │  • Extract face image from bounding box             │
                                        │  • Resize to 224×224 pixels (model input)           │
                                        │  • Normalize with ImageNet mean values              │
                                        │  • Pass through ResNet50 model                      │
                                        │                                                     │
                                        │  Model outputs confidence for 7 emotions:           │
                                        │    → Neutral, Happiness, Sadness, Surprise          │
                                        │    → Fear, Disgust, Anger                           │
                                        │                                                     │
                                        │  Optimization: Use FP16 precision on GPU,           │
                                        │  run inference every frame after detection          │
                                        └──────────────────────┬──────────────────────────────┘
                                                               │
                                                               ▼
                                        ┌─────────────────────────────────────────────────────┐
                                        │      STEP 4: TEMPORAL SMOOTHING (LSTM/Moving Avg)   │
                                        │                                                     │
                                        │  Apply temporal consistency:                        │
                                        │  • If LSTM model available:                         │
                                        │    - Maintain 10-frame feature buffer               │
                                        │    - Pass sequence through LSTM layers              │
                                        │    - Output temporally-aware emotion prediction     │
                                        │                                                     │
                                        │  • If LSTM not available (fallback):                │
                                        │    - Maintain 10-frame prediction buffer            │
                                        │    - Calculate moving average of probabilities      │
                                        │    - Smooth emotion predictions across time         │
                                        │                                                     │
                                        │  Result: Stable emotion with confidence score       │
                                        └──────────────────────┬──────────────────────────────┘
                                                               │
                                                               ▼
                                        ┌─────────────────────────────────────────────────────┐
                                        │           STEP 5: FRAME DATA STORAGE                │
                                        │                                                     │
                                        │  Store frame analysis results:                      │
                                        │  • Frame number and timestamp                       │
                                        │  • Detected emotion and confidence                  │
                                        │  • Face detection status                            │
                                        │  • Bounding box coordinates                         │
                                        │                                                     │
                                        │  Storage:                                           │
                                        │  • Database record per frame (for tracking)         │
                                        │  • In-memory buffer (for session processing)        │
                                        │  • No video/image data stored (privacy)             │
                                        └──────────────────────┬──────────────────────────────┘
                                                               │
                                                               ▼
                                        ┌─────────────────────────────────────────────────────┐
                                        │       STEP 6: REAL-TIME DISPLAY (Optional)          │
                                        │                                                     │
                                        │  For local webcam sessions:                         │
                                        │  • Overlay bounding box on face                     │
                                        │  • Display current emotion and confidence           │
                                        │  • Show FPS and frame count                         │
                                        │  • Display session duration                         │
                                        │  • User can press 'q' to end session                │
                                        │                                                     │
                                        │  For web-based sessions:                            │
                                        │  • Return detection results to frontend             │
                                        │  • Frontend displays visual feedback                │
                                        └──────────────────────┬──────────────────────────────┘
                                                               │
                                        (Continues processing frames until session ends)
                                                               │
                                                               ▼
                                        ┌─────────────────────────────────────────────────────┐
                                        │           STEP 7: SESSION TERMINATION               │
                                        │                                                     │
                                        │  Session ends when:                                 │
                                        │  • User stops session manually OR                   │
                                        │  • Duration limit reached OR                        │
                                        │  • API end-session called                           │
                                        │                                                     │
                                        │  Cleanup:                                           │
                                        │  • Release webcam/video resources                   │
                                        │  • Close display windows                            │
                                        │  • Prepare frame data for analysis                  │
                                        └──────────────────────┬──────────────────────────────┘
                                                               │
                                                               ▼
                                        ┌─────────────────────────────────────────────────────┐
                                        │       STEP 8: EMOTIONAL PATTERN ANALYSIS            │
                                        │                                                     │
                                        │  Calculate session-level metrics:                   │
                                        │                                                     │
                                        │  1) Emotion Distribution:                           │
                                        │     • Frequency of each emotion (% of frames)       │
                                        │     • Duration in seconds for each emotion          │
                                        │     • Dominant emotion identification               │
                                        │     • Average confidence across session             │
                                        │                                                     │
                                        │  2) Temporal Patterns:                              │
                                        │     • Emotion transitions (X → Y sequences)         │
                                        │     • Clustering (sustained vs intermittent)        │
                                        │     • Rapid change detection (5-sec windows)        │
                                        │     • Mood trajectory (improving/declining/stable)  │
                                        │                                                     │
                                        │  3) Aggregate Metrics:                              │
                                        │     • Total negative affect duration                │
                                        │     • Total positive affect duration                │
                                        │     • Emotional variability score                   │
                                        │     • Session stability index                       │
                                        └──────────────────────┬──────────────────────────────┘
                                                               │
                                                               ▼
                                        ┌─────────────────────────────────────────────────────┐
                                        │    STEP 9: AGENTIC CLINICAL REASONING (GPT-4o-mini) │
                                        │                                                     │
                                        │  AI clinical analysis (if OpenAI configured):       │
                                        │                                                     │
                                        │  Input to AI:                                       │
                                        │  • Emotional pattern summary                        │
                                        │  • Temporal dynamics data                           │
                                        │  • Session timeline (beginning/middle/end)          │
                                        │  • Transition patterns                              │
                                        │                                                     │
                                        │  AI analyzes using clinical framework:              │
                                        │  • Depression markers (sustained sadness)           │
                                        │  • Anxiety signs (fear patterns, rapid switching)   │
                                        │  • Apathy/cognitive decline (neutral dominance)     │
                                        │  • Pain/discomfort (disgust patterns)               │
                                        │  • Social engagement (happiness frequency)          │
                                        │  • Emotional resilience (recovery patterns)         │
                                        │                                                     │
                                        │  AI generates structured JSON output:               │
                                        │  • Behavioral health metrics (8 scores)             │
                                        │  • Clinical risk profile (7 risk scores)            │
                                        │  • Care insights with recommendations               │
                                        │  • Concerning patterns identified                   │
                                        │  • Review requirement and priority                  │
                                        └──────────────────────┬──────────────────────────────┘
                                                               │
                                                               ▼
                                        ┌─────────────────────────────────────────────────────┐
                                        │       STEP 10: REVIEW REQUIREMENT DETERMINATION     │
                                        │                                                     │
                                        │  Multi-factor review decision:                      │
                                        │                                                     │
                                        │  Automatic triggers:                                │
                                        │  ✓ Average confidence <0.5                          │
                                        │  ✓ Negative emotions >60% of session                │
                                        │  ✓ Agentic analysis flags review needed             │
                                        │  ✓ Sadness >40% of session                          │
                                        │  ✓ Fear/Anger >30% of session                       │
                                        │  ✓ Pain indicators >20% of session                  │
                                        │  ✓ <50% frames with valid face detection            │
                                        │                                                     │
                                        │  Priority assignment:                               │
                                        │  • LOW: Confidence 0.5-0.7, mixed emotions          │
                                        │  • MEDIUM: Confidence 0.4-0.5, moderate concerns    │
                                        │  • HIGH: Confidence <0.4 OR negative >60%           │
                                        └──────────────────────┬──────────────────────────────┘
                                                               │
                                            ┌──────────────────┴──────────────────┐
                                            │                                     │
                                            ▼                                     ▼
                                   NO REVIEW REQUIRED                    REVIEW REQUIRED
                                            │                                     │
                                            │                                     ▼
                                            │              ┌─────────────────────────────────┐
                                            │              │  Create Review Request:         │
                                            │              │  • Generate review_id           │
                                            │              │  • Assign priority level        │
                                            │              │  • Include session summary      │
                                            │              │  • Attach AI analysis results   │
                                            │              │  • Store emotional patterns     │
                                            │              │  • Queue for clinical reviewer  │
                                            │              └───────────┬─────────────────────┘
                                            │                          │
                                            └──────────────┬───────────┘
                                                           │
                                                           ▼
                                        ┌─────────────────────────────────────────────────────┐
                                        │         STEP 11: SESSION DATA PERSISTENCE           │
                                        │                                                     │
                                        │  Save complete session record:                      │
                                        │                                                     │
                                        │  1) Session File (JSON):                            │
                                        │     • Session metadata (ID, user, duration)         │
                                        │     • All frame emotions with timestamps            │
                                        │     • Emotion distribution summary                  │
                                        │     • Dominant emotion and confidence               │
                                        │     • Stored in: model_cache/facial_analysis/       │
                                        │                  sessions/{session_id}.json         │
                                        │                                                     │
                                        │  2) Database Records:                               │
                                        │     • VideoSession table entry                      │
                                        │     • Individual frame records                      │
                                        │     • Review request (if triggered)                 │
                                        │     • Agentic analysis results                      │
                                        │                                                     │
                                        │  Privacy: No video frames or images stored,         │
                                        │  only emotion labels and metadata                   │
                                        └──────────────────────┬──────────────────────────────┘
                                                               │
                                                               ▼
                                        ┌─────────────────────────────────────────────────────┐
                                        │         STEP 12: RESPONSE GENERATION                │
                                        │                                                     │
                                        │  User receives comprehensive report:                │
                                        │                                                     │
                                        │  1) Session Summary:                                │
                                        │     • Dominant emotion and overall sentiment        │
                                        │     • Emotional distribution chart data             │
                                        │     • Session duration and quality metrics          │
                                        │     • Average confidence score                      │
                                        │                                                     │
                                        │  2) Behavioral Health Scores:                       │
                                        │     • Emotional variability (0-1)                   │
                                        │     • Mood stability (0-1)                          │
                                        │     • Social engagement (0-1)                       │
                                        │     • Distress frequency (0-1)                      │
                                        │     • Additional metrics (8 total)                  │
                                        │                                                     │
                                        │  3) Clinical Risk Assessment:                       │
                                        │     • Depression risk score                         │
                                        │     • Anxiety manifestation score                   │
                                        │     • Emotional distress level                      │
                                        │     • Risk indicators list                          │
                                        │     • Protective factors identified                 │
                                        │                                                     │
                                        │  4) Care Recommendations:                           │
                                        │     • Prioritized care insights                     │
                                        │     • Specific recommendations with evidence        │
                                        │     • Urgency levels for each recommendation        │
                                        │     • Clinical reasoning explanations               │
                                        │                                                     │
                                        │  5) Review Status:                                  │
                                        │     • Whether review triggered                      │
                                        │     • Review priority level                         │
                                        │     • Review request ID (if applicable)             │
                                        │     • Expected review timeline                      │
                                        └──────────────────────┬──────────────────────────────┘
                                                               │
                                                (If Review Triggered)
                                                               │
                                                               ▼
                                               ┌───────────────────────────┐
                                               │  STEP 13: HUMAN REVIEW    │
                                               │                           │
                                               │  Clinical reviewer:       │
                                               │  • Views session summary  │
                                               │  • Examines emotion graph │
                                               │  • Reviews AI assessment  │
                                               │  • Validates accuracy     │
                                               │  • Provides corrections   │
                                               │  • Documents findings     │
                                               │  • Completes review       │
                                               └────────────┬──────────────┘
                                                            │
                                                            ▼
                                               ┌─────────────────────────────┐
                                               │  STEP 14: MODEL IMPROVEMENT │
                                               │                             │
                                               │  Continuous learning cycle: │
                                               │  • Collect reviewed sessions│
                                               │  • Apply expert corrections │
                                               │  • Aggregate feedback data  │
                                               │  • Weekly fine-tuning cycle │
                                               │  • Update model weights     │
                                               │  • Validate performance     │
                                               │  • Deploy if improved       │
                                               └─────────────────────────────┘
```

================================================================================
                    DESIGN PRINCIPLES
================================================================================

1) Real-Time Processing Architecture
   • Optimized for 30 FPS performance on consumer hardware
   • Multi-threaded webcam capture prevents frame drops
   • Downscaled face detection (50% resolution) maintains speed
   • Inference interval controls (every 1-2 frames) balance accuracy vs latency
   • GPU acceleration with FP16 precision when available
   • Falls back gracefully to CPU when GPU unavailable

2) Temporal Consistency and Smoothing
   • LSTM model provides sequence-aware predictions (preferred)
   • Moving average fallback ensures temporal stability
   • 10-frame buffer captures ~1 second context window
   • Prevents flickering between emotions on single-frame noise
   • Smoothed bounding boxes reduce visual jitter
   • Maintains emotional state coherence across session

3) Privacy-First Design
   • NO video frames stored permanently
   • NO images saved to disk
   • Only emotion labels and metadata persisted
   • Face detection landmarks not stored
   • Session data encrypted in transit
   • HIPAA/GDPR compliant data handling
   • Audit logs track all access and processing

4) Multi-Modal AI Architecture
   • First Layer: ResNet50 for frame-level emotion detection
   • Second Layer: LSTM for temporal pattern recognition (optional)
   • Third Layer: GPT-4o-mini for clinical interpretation and reasoning
   • Validation Layer: Multi-factor review triggers ensure quality
   • Combined approach provides robust, clinically-meaningful insights

5) Clinical Context Alignment
   • Metrics designed for elderly care monitoring
   • Thresholds based on geriatric assessment scales
   • Pain detection unique to facial analysis (not in text)
   • Apathy detection targets cognitive decline indicators
   • Agitation patterns inform behavioral intervention
   • Aligns with: GDS, Cornell Scale, CMAI, PAINAD

6) Graceful Degradation
   • Works without LSTM (fallback to smoothing)
   • Works without OpenAI API (rule-based analysis)
   • Works with poor detection (<50% frames still processable)
   • Low confidence triggers review rather than failure
   • System remains functional at each fallback level

7) Quality Assurance
   • Confidence scoring on every prediction
   • Face validation (size, aspect ratio checks)
   • Temporal coherence checking
   • Statistical outlier detection
   • Multiple review trigger conditions
   • Audit trail for all decisions

8) Scalability Considerations
   • Stateless API design supports multiple concurrent users
   • Session-based architecture enables distributed processing
   • Model loaded once, serves all sessions
   • Database storage separates from processing
   • Batch processing support for offline analysis
   • Weekly training cycle scales with data volume


================================================================================
                    TECHNICAL OPTIMIZATIONS
================================================================================

Frame Processing Pipeline
--------------------------
• Input: 1920×1080 webcam stream @ 30 FPS
• Downscale: 960×540 for face detection (4× speedup)
• ROI extraction: 224×224 face crop for emotion model
• Batch size: 1 (real-time requirement)
• Processing time: ~15-25ms per frame on GPU, ~50-80ms on CPU
• Target: Maintain 30 FPS (33ms frame budget)

Face Detection Strategy
-----------------------
• MediaPipe Face Mesh: 468 facial landmarks
• Detection interval: Every 2 frames (reuse box between)
• Temporal smoothing: 0.3 smoothing factor on bounding box
• Validity checks: Minimum 40×40 pixels, aspect ratio 0.5-2.0
• Tracking: Maintains last known box when face briefly occluded

Emotion Model Details
---------------------
• Architecture: ResNet50 with custom head
• Parameters: ~23.5 million (base ResNet50)
• Input: 224×224×3 RGB, ImageNet-normalized
• Output: 7-class softmax probabilities
• Training: AffectNet dataset (base), custom elderly care data (fine-tuned)
• Accuracy: 67.57% on validation set
• Inference time: ~8-12ms on GPU (FP16), ~40-60ms on CPU

Memory Footprint
----------------
• Model weights: ~90 MB (ResNet50) + ~15 MB (LSTM if used)
• Frame buffer: ~10 frames × 224×224×3 × 4 bytes = ~6 MB
• Session data: ~1 KB per frame analyzed
• Peak RAM: <500 MB for complete system

"""

