"""
================================================================================
                    METRICS & KPIs DOCUMENTATION
                    MindNeedAI Speech/Audio Analysis System
================================================================================

This document provides comprehensive documentation of the scoring systems, 
evaluation metrics, and decision logic used in the MindNeedAI speech emotion 
analysis pipeline. All scores are evidence-based and designed to quantify 
vocal emotional patterns and clinical risk from speech audio.

================================================================================
                    SPEECH EMOTION DETECTION SYSTEM
================================================================================

Overview
--------
The system analyzes speech audio to detect emotional states using a Wav2Vec2 
deep learning model. The model processes vocal patterns including pitch, tone, 
speed, and acoustic features to identify 8 distinct emotions with confidence 
scores.


EMOTION CATEGORIES
------------------
The model detects 8 speech emotions with probability scores (0.0 - 1.0):

    • Angry: Frustration, agitation, irritability in voice
    • Calm: Peaceful, relaxed, composed vocal tone
    • Disgust: Aversion, discomfort, pain indicators in voice
    • Fearful: Anxiety, worry, stress evident in speech
    • Happy: Joy, pleasure, positive engagement in voice
    • Neutral: Baseline emotional state, no strong affect
    • Sad: Low mood, distress, depression markers in voice
    • Surprised: Astonishment, unexpected reaction in voice

Classification Confidence:
    • 0.8-1.0: Very high confidence, clear vocal indicators
    • 0.6-0.8: High confidence, strong emotional patterns
    • 0.4-0.6: Moderate confidence, identifiable markers
    • 0.0-0.4: Low confidence, ambiguous patterns (triggers review)

Rationale:
Speech audio captures emotional prosody - the "music" of speech including 
pitch, rhythm, volume, and tempo. These paralinguistic features reveal 
emotional states that may differ from spoken words, providing unique clinical 
insights especially for elderly care monitoring.


================================================================================
                    AUDIO QUALITY METRICS
================================================================================

Overview
--------
Audio quality directly affects emotion detection accuracy. These metrics assess 
whether the recording provides sufficient signal quality for reliable analysis.


1. ENERGY LEVEL (VOLUME CONSISTENCY)
-------------------------------------
Range: 0.0 - 1.0
Description: Measures overall audio volume and consistency

Scoring Guidelines:
    • 0.8-1.0: Excellent volume, clear voice signal
    • 0.6-0.8: Good volume, adequate for analysis
    • 0.4-0.6: Low volume, may affect accuracy
    • 0.0-0.4: Very quiet, poor signal quality

Calculation:
energy_score = min(1.0, mean(audio^2) × 1000)

Rationale:
Consistent, adequate volume is essential for capturing subtle vocal emotion 
cues. Very quiet recordings lose emotional prosody information. We amplify the 
raw energy measurement (×1000) to scale it appropriately for the 0-1 range.


2. SPECTRAL CENTROID (CLARITY & BRIGHTNESS)
--------------------------------------------
Range: 0.0 - 1.0
Description: Measures speech clarity and frequency distribution

Scoring Guidelines:
    • 0.8-1.0: Crystal clear speech, excellent clarity
    • 0.6-0.8: Good clarity, minor background noise
    • 0.4-0.6: Moderate clarity, noticeable interference
    • 0.0-0.4: Poor clarity, muffled or distorted

Calculation:
centroid_score = min(1.0, spectral_centroid / 4000)

Rationale:
Speech clarity affects emotion detection. Muffled recordings lose high-frequency 
prosodic information critical for emotion analysis. The spectral centroid 
measures the "brightness" of the sound - clearer speech has appropriate high 
frequencies (around 2000-4000 Hz).


3. OVERALL AUDIO QUALITY SCORE
-------------------------------
Range: 0.1 - 1.0
Description: Composite audio quality metric

Scoring Guidelines:
    • 0.8-1.0: Excellent recording quality
    • 0.6-0.8: Good quality, reliable analysis
    • 0.4-0.6: Fair quality, caution needed
    • 0.1-0.4: Poor quality, review recommended

Calculation:
quality_score = (energy_score × 0.6) + (centroid_score × 0.4)
Final score capped between 0.1 and 1.0

Rationale:
Volume matters more than clarity (60% vs 40% weight) because adequate loudness 
is prerequisite for any analysis. Minimum score of 0.1 acknowledges that even 
poor recordings contain some information. Quality threshold of 0.6 ensures 
reliable emotion detection.


================================================================================
                    SPEECH HEALTH METRICS
================================================================================

Overview
--------
These metrics quantify vocal and emotional health patterns derived from speech 
analysis. All scores use 0.0-1.0 scale where values indicate health status.


1. VOCAL ENERGY VARIABILITY
----------------------------
Range: 0.0 - 1.0
Description: Variation in vocal intensity and expressiveness

Scoring Guidelines:
    • 0.7-1.0: Rich vocal dynamics, healthy expression
    • 0.4-0.7: Moderate variation, adequate range
    • 0.2-0.4: Limited variation, concern
    • 0.0-0.2: Flat vocal energy, significant concern

Calculation:
Based on emotional expression range: min(1.0, emotional_range / 4)
Where emotional_range = count of emotions >10%

Rationale:
Healthy speech shows varied vocal energy patterns. Monotone or flat delivery 
may indicate depression, apathy, or neurological concerns - particularly in 
elderly populations where prosodic variation naturally decreases but shouldn't 
be absent.


2. EMOTIONAL PROSODY RICHNESS
------------------------------
Range: 0.0 - 1.0 (higher = richer prosody)
Description: Diversity and richness of emotional expression in voice

Scoring Guidelines:
    • 0.7-1.0: Rich, varied emotional expression
    • 0.5-0.7: Adequate emotional prosody
    • 0.3-0.5: Limited prosodic variation
    • 0.0-0.3: Very limited or flat prosody

Calculation:
min(1.0, (emotional_range / 5) + positive_emotion_ratio)

Rationale:
Emotional prosody reflects social-emotional health. Rich prosody indicates 
engagement, communication effectiveness, and cognitive-emotional integration. 
Elderly individuals with limited prosody may be experiencing depression, 
isolation, or cognitive decline.


3. SPEECH CLARITY INDEX
------------------------
Range: 0.0 - 1.0 (higher = clearer speech)
Description: Technical clarity and intelligibility of speech

Scoring Guidelines:
    • 0.8-1.0: Excellent speech clarity
    • 0.6-0.8: Good clarity, minor issues
    • 0.4-0.6: Moderate clarity concerns
    • 0.0-0.4: Significant clarity problems

Calculation:
Equals audio_quality_score (composite of energy and spectral clarity)

Rationale:
Speech clarity indicates physical voice health, cognitive function (clear 
articulation), and recording conditions. In elderly care, declining speech 
clarity may signal voice disorders, neurological changes, or hearing loss 
affecting speech production.


4. COMMUNICATION EFFECTIVENESS
-------------------------------
Range: 0.0 - 1.0 (higher = more effective)
Description: Overall ability to convey emotional intent through speech

Scoring Guidelines:
    • 0.7-1.0: Highly effective emotional communication
    • 0.5-0.7: Adequate communication
    • 0.3-0.5: Limited effectiveness
    • 0.0-0.3: Poor communication effectiveness

Calculation:
Equals emotion detection confidence (how clearly emotions are expressed)

Rationale:
Communication effectiveness reflects whether the person can successfully convey 
emotions through voice. Low effectiveness may indicate communication disorders, 
emotional suppression, or cognitive-communication challenges.


5. VOICE STABILITY SCORE
-------------------------
Range: 0.0 - 1.0 (higher = more stable)
Description: Consistency and steadiness of voice quality

Scoring Guidelines:
    • 0.8-1.0: Very stable voice quality
    • 0.6-0.8: Good stability
    • 0.4-0.6: Moderate instability
    • 0.0-0.4: Significant voice instability

Calculation:
max(0.3, 1.0 - negative_emotion_ratio)

Rationale:
Voice stability indicates emotional regulation and voice health. High negative 
emotion ratios correlate with voice instability (tremor, shakiness, pitch 
breaks) seen in anxiety, distress, or voice disorders.


6. EMOTIONAL EXPRESSION RANGE
------------------------------
Range: 0.0 - 1.0 (higher = broader range)
Description: Breadth of different emotions expressed

Scoring Guidelines:
    • 0.7-1.0: Broad emotional range (5+ emotions)
    • 0.5-0.7: Moderate range (3-4 emotions)
    • 0.3-0.5: Limited range (2 emotions)
    • 0.0-0.3: Very limited range (≤1 emotion)

Calculation:
min(1.0, emotional_range / 6)
Where emotional_range = count of emotions >10%

Rationale:
Emotional range indicates psychological flexibility and social-emotional health. 
Limited range may suggest depression (flat affect), cognitive decline (reduced 
emotional processing), or severe stress.


7. SOCIAL ENGAGEMENT INDICATORS
--------------------------------
Range: 0.0 - 1.0 (higher = better engagement)
Description: Vocal indicators of social-emotional engagement

Scoring Guidelines:
    • 0.7-1.0: Strong engagement indicators
    • 0.5-0.7: Adequate social-emotional engagement
    • 0.3-0.5: Limited engagement signs
    • 0.0-0.3: Poor engagement indicators

Calculation:
Equals positive emotion ratio (happy + calm + surprise)

Rationale:
Positive vocal expressions indicate social engagement capacity. In elderly care, 
lack of positive vocal affect suggests social withdrawal, depression, or 
declining quality of life.


8. COGNITIVE FLUENCY SCORE
---------------------------
Range: 0.0 - 1.0 (higher = better fluency)
Description: Indicators of cognitive-linguistic function

Scoring Guidelines:
    • 0.7-1.0: Good cognitive fluency indicators
    • 0.5-0.7: Adequate fluency
    • 0.3-0.5: Mild fluency concerns
    • 0.0-0.3: Significant fluency concerns

Calculation:
confidence if audio_quality > 0.5 else 0.5

Rationale:
While we can't directly assess language content from audio emotion models, 
speech confidence combined with quality provides proxy indicators. Poor quality 
or very low confidence may reflect hesitant, disfluent speech patterns 
associated with cognitive concerns. Default to 0.5 (neutral) when quality is 
insufficient for assessment.


================================================================================
                    CLINICAL RISK SCORING SYSTEM
================================================================================

Overview
--------
Clinical risk scores translate vocal emotional patterns into assessments 
aligned with geriatric care protocols. All scores range 0.0-1.0.


1. DEPRESSION VOCAL MARKERS
----------------------------
Range: 0.0 - 1.0
Description: Vocal indicators of depression

Scoring Guidelines:
    • 0.0-0.2: Minimal depression indicators
    • 0.2-0.4: Mild markers, monitoring
    • 0.4-0.6: Moderate risk, assessment recommended
    • 0.6-1.0: High risk, professional evaluation needed

Calculation:
min(1.0, sad_emotion_ratio × 1.2)

Rationale:
Sadness in voice is the primary vocal marker of depression. We amplify (×1.2) 
because even 50% sadness in speech is clinically significant. Research shows 
vocal acoustic features (reduced pitch variation, slower speech, lower energy) 
reliably indicate depressive states in elderly populations.


2. ANXIETY SPEECH PATTERNS
---------------------------
Range: 0.0 - 1.0
Description: Vocal indicators of anxiety

Scoring Guidelines:
    • 0.0-0.2: Minimal anxiety indicators
    • 0.2-0.4: Mild anxiety patterns
    • 0.4-0.6: Moderate anxiety, monitoring needed
    • 0.6-1.0: Significant anxiety, evaluation recommended

Calculation:
min(1.0, fearful_emotion_ratio × 1.1)

Rationale:
Fearful vocal patterns indicate anxiety - voice tremor, increased pitch, rapid 
speech, breathiness. Amplified slightly (×1.1) to ensure clinical threshold 
alignment. Anxiety in elderly often manifests vocally before being consciously 
reported.


3. COGNITIVE DECLINE INDICATORS
--------------------------------
Range: 0.0 - 1.0
Description: Speech patterns suggesting cognitive changes

Scoring Guidelines:
    • 0.0-0.2: No significant indicators
    • 0.2-0.4: Mild indicators, baseline documentation
    • 0.4-0.6: Moderate indicators, assessment recommended
    • 0.6-1.0: Concerning indicators, evaluation needed

Calculation:
0.2 if (confidence < 0.4 AND audio_quality < 0.5) else 0.0

Rationale:
While emotion models can't directly assess cognition, combination of low 
confidence and poor quality may reflect speech production difficulties, 
word-finding pauses, or communication challenges associated with cognitive 
decline. Score of 0.2 flags for further assessment without over-diagnosing. 
This is a conservative indicator requiring clinical follow-up.


4. SOCIAL WITHDRAWAL SIGNS
---------------------------
Range: 0.0 - 1.0
Description: Vocal indicators of social disengagement

Scoring Guidelines:
    • 0.0-0.2: Good social-emotional indicators
    • 0.2-0.4: Mild withdrawal signs
    • 0.4-0.6: Moderate withdrawal, concern
    • 0.6-1.0: Significant withdrawal indicators

Calculation:
If emotional_range ≤ 2:
    max(0.0, 0.8 - positive_emotion_ratio)
Else:
    0.1 (low baseline concern)

Rationale:
Social withdrawal manifests vocally as limited emotional expression range and 
absence of positive affect. When someone shows ≤2 emotions and low happiness, 
they're likely experiencing social-emotional disconnection. Multiple emotions 
with some positivity suggests adequate engagement.


5. EMOTIONAL DISTRESS LEVEL
----------------------------
Range: 0.0 - 1.0
Description: Overall emotional suffering or distress

Scoring Guidelines:
    • 0.0-0.2: Minimal distress
    • 0.2-0.4: Mild distress
    • 0.4-0.6: Moderate distress
    • 0.6-1.0: Severe distress requiring intervention

Calculation:
negative_emotion_ratio = (sad + angry + fearful + disgust) / 4

Rationale:
This is the composite distress score from vocal negative emotions. Unlike text 
or facial analysis, speech captures vocal affect that may be unconsciously 
expressed even when someone is masking distress. The 60% threshold aligns with 
clinical scales for significant emotional distress.


6. VOICE HEALTH CONCERNS
-------------------------
Range: 0.0 - 1.0
Description: Technical voice quality and health indicators

Scoring Guidelines:
    • 0.0-0.2: Healthy voice quality
    • 0.2-0.4: Minor voice health concerns
    • 0.4-0.6: Moderate voice concerns, evaluation suggested
    • 0.6-1.0: Significant voice concerns, referral needed

Calculation:
max(0.0, 0.7 - audio_quality_score)

Rationale:
Poor audio quality may reflect actual voice disorders (hoarseness, weakness, 
breathiness) rather than just recording issues. In elderly care, voice changes 
can indicate neurological issues, voice disorders, or medication side effects. 
Score inverts quality: quality 0.1 → concern 0.6 (high).


7. COMMUNICATION BARRIERS
--------------------------
Range: 0.0 - 1.0
Description: Obstacles to effective communication

Scoring Guidelines:
    • 0.0-0.2: Minimal barriers
    • 0.2-0.4: Mild communication challenges
    • 0.4-0.6: Moderate barriers, support needed
    • 0.6-1.0: Significant barriers, intervention required

Calculation:
max(0.0, 0.6 - emotion_detection_confidence)

Rationale:
Low emotion detection confidence may indicate communication barriers - unclear 
speech, atypical prosody, voice disorders, or cognitive-communication 
difficulties. These barriers affect quality of life and care interactions in 
elderly populations.


8. ACCUMULATED CONCERN SCORE
-----------------------------
Range: 0.0 - 1.0
Description: Overall clinical risk level combining factors

Scoring Guidelines:
    • 0.0-0.2: Low risk, routine monitoring
    • 0.2-0.4: Mild concerns, increased observation
    • 0.4-0.6: Moderate risk, assessment recommended
    • 0.6-1.0: High risk, immediate evaluation needed

Calculation:
min(1.0, negative_emotion_ratio + (0.5 if confidence < 0.4 else 0.0))

Rationale:
Primary risk factor is negative emotional affect (distress). Low confidence 
adds 0.5 to score because it indicates either severe communication issues or 
unreliable analysis - both requiring human review. This ensures concerning 
cases don't slip through due to analysis limitations.


================================================================================
                    DIMENSIONAL EMOTION METRICS
================================================================================

Overview
--------
Beyond categorical emotions, we calculate dimensional metrics used in clinical 
psychology for emotional state assessment.


1. EMOTIONAL VALENCE
---------------------
Range: -1.0 to +1.0
Description: Overall positive vs negative emotional tone

Scoring Guidelines:
    • +0.5 to +1.0: Strongly positive emotional state
    • +0.0 to +0.5: Mildly positive
    • -0.0 to -0.5: Mildly negative
    • -0.5 to -1.0: Strongly negative emotional state

Calculation:
positive_emotions = happy + calm + surprised
negative_emotions = sad + angry + fearful + disgust

valence = (positive_emotions - negative_emotions) / 
          (positive_emotions + negative_emotions)

If denominator is 0, valence = 0.0

Rationale:
Valence is a fundamental dimension in emotion research. It provides a simple, 
clinically meaningful summary: is the person's emotional state predominantly 
positive or negative? Negative valence (<-0.3) correlates with depression risk.


2. EMOTIONAL AROUSAL
---------------------
Range: 0.0 - 1.0
Description: Energy level and activation in emotional state

Scoring Guidelines:
    • 0.8-1.0: Very high arousal/activation
    • 0.5-0.8: Moderate to high arousal
    • 0.3-0.5: Moderate to low arousal
    • 0.0-0.3: Very low arousal/activation

Calculation:
high_arousal = angry + fearful + surprised + happy
low_arousal = sad + neutral + calm

arousal = high_arousal / (high_arousal + low_arousal)

If denominator is 0, arousal = 0.5

Rationale:
Arousal measures emotional intensity. Very low arousal (<0.3) may indicate 
apathy, depression, or sedation. Very high arousal (>0.7) may indicate anxiety, 
agitation, or mania. Helps distinguish different mood states with same valence.


3. EMOTIONAL STABILITY
-----------------------
Range: 0.0 - 1.0 (higher = more stable)
Description: Confidence and consistency of emotional state

Scoring Guidelines:
    • 0.8-1.0: Very stable, confident emotion detection
    • 0.6-0.8: Good stability
    • 0.4-0.6: Moderate stability, some ambiguity
    • 0.0-0.4: Poor stability, inconsistent patterns

Calculation:
If only one emotion detected:
    stability = dominant_confidence
If multiple emotions:
    confidence_gap = dominant_confidence - second_highest_confidence
    stability = min(1.0, dominant_confidence × (1 + confidence_gap))

Rationale:
Stability indicates how clear and consistent the emotional state is. High 
stability means confident detection. Low stability may indicate mixed emotions, 
emotional transition, or analysis limitations. Considers both absolute 
confidence and the gap to second-place emotion.


================================================================================
                    HUMAN REVIEW TRIGGER THRESHOLDS
================================================================================

How Review Triggers Work
-------------------------
Speech analysis uses multi-factor criteria to determine when human clinical 
review (Speech-Language Pathologist or clinician) is needed. Unlike text or 
facial analysis, speech review emphasizes audio quality and confidence.


REVIEW TRIGGER CONDITIONS
--------------------------

Automatic Review Triggers:

1. Low Emotion Detection Confidence
   Trigger: Confidence <0.4 (40%)
   Rationale: Low confidence indicates ambiguous vocal patterns or poor audio 
   quality that limits reliable analysis. Human expert can interpret context 
   and assess whether issue is technical or clinical.

2. Poor Audio Quality
   Trigger: Audio quality score <0.4
   Rationale: Poor quality audio may hide important prosodic information or 
   create false readings. Experts can determine if the underlying speech pattern 
   is concerning despite quality limitations.

3. High Negative Emotional Content
   Trigger: Negative emotions >70% of audio
   Rationale: Sustained vocal distress (sad, angry, fearful, disgust >70%) 
   indicates significant emotional suffering requiring clinical assessment and 
   intervention planning.

4. Clinical Priority Emotions at High Confidence
   Trigger: 
      • Sad >60% with confidence >0.6
      • Fearful >50% with confidence >0.6
      • Angry >60% with confidence >0.6
      • Disgust >50% with confidence >0.6
   
   Rationale: These emotions at high frequency and confidence align with 
   clinical screening thresholds for depression, anxiety, agitation, and pain. 
   Expert review ensures appropriate care planning.

5. Duration Concerns
   Trigger: Audio <2 seconds OR >1200 seconds (20 minutes)
   Rationale: Very short audio limits analysis reliability. Very long audio may 
   indicate testing issues or requires special handling for elderly assessment 
   contexts.

6. Agentic Analysis Recommendation
   Trigger: GPT-4 clinical analysis flags requires_human_review = True
   Rationale: AI reasoner considers complex patterns, context, and subtle 
   indicators that may not trigger simple rules but warrant expert attention.


REVIEW PRIORITY LEVELS
-----------------------

Priority: LOW
    • Confidence 0.4-0.6 with mixed emotions
    • Audio quality 0.4-0.6
    • Negative emotions 30-50%
    • No urgent clinical indicators
    → Review within 1 week, routine assessment

Priority: MEDIUM (Default)
    • Confidence 0.3-0.4
    • Audio quality 0.3-0.4
    • Negative emotions 50-70%
    • Moderate clinical indicators
    → Review within 2-3 days, scheduled assessment

Priority: HIGH
    • Confidence <0.3 with negative emotions OR
    • Negative emotions >70% OR
    • High clinical priority emotions (sad/fearful/angry >60%) OR
    • Multiple concerning indicators
    → Review within 24 hours, priority assessment


EXAMPLE DECISION FLOWS
-----------------------

Example 1: Audio with 75% Sadness, 0.82 confidence, 0.7 quality

    Negative emotion ratio: 0.75 → TRIGGERS (>70%)
    Sadness: 0.75 → TRIGGERS (>60%)
    Confidence: 0.82 → Good (no trigger)
    Quality: 0.70 → Good (no trigger)
    
    → REVIEW TRIGGERED: Priority HIGH
    → Depression risk score: 0.75 × 1.2 = 0.90
    → Recommendation: Urgent depression screening within 24 hours


Example 2: Audio with 55% Happy, 0.88 confidence, 0.75 quality

    Negative emotion ratio: 0.15 → No trigger
    Positive emotions: 0.55 → Good indicators
    Confidence: 0.88 → Good
    Quality: 0.75 → Good
    
    → NO REVIEW TRIGGERED
    → All scores in healthy range
    → Recommendation: Continue current care approach


Example 3: Audio with 45% Neutral, 0.35 confidence, 0.38 quality

    Negative emotion ratio: 0.20 → Below threshold
    Confidence: 0.35 → TRIGGERS (<0.4)
    Quality: 0.38 → TRIGGERS (<0.4)
    
    → REVIEW TRIGGERED: Priority MEDIUM
    → Reason: Poor quality and low confidence limit reliability
    → Recommendation: Repeat recording with better conditions or expert 
                       interpretation of limited data


Example 4: Audio with 2 seconds duration, 0.65 confidence

    Duration: 2.0 seconds → TRIGGERS (<2 seconds)
    Confidence: 0.65 → Moderate
    
    → REVIEW TRIGGERED: Priority LOW
    → Reason: Insufficient audio for comprehensive assessment
    → Recommendation: Obtain longer sample for reliable evaluation


================================================================================
                    DESIGN RATIONALE
================================================================================

Why Speech Analysis Differs from Text/Facial Analysis
------------------------------------------------------

Unique Characteristics:
    • Speech captures unconscious emotional prosody (can't be easily masked)
    • Audio quality critically affects analysis reliability
    • Shorter samples (often <30 seconds vs. minutes for video)
    • Single snapshot vs. temporal evolution (unlike video sessions)
    • More affected by environmental factors (noise, recording equipment)

These differences mean speech analysis prioritizes:
    1. Quality assessment before interpretation
    2. Confidence thresholds over pattern complexity
    3. Clear binary triggers over weighted scoring
    4. Conservative interpretation due to sample brevity


Why Amplify Certain Emotion Scores?
------------------------------------

The Problem with Linear Scaling:
If someone speaks with 50% sadness in their voice, direct mapping to 0.5 
underestimates clinical significance. Research shows even 40-50% vocal sadness 
correlates with clinical depression thresholds.

Our Solution:
We amplify sadness (×1.2) and fear (×1.1) to align with clinical screening 
tools. This matches geriatric depression scales where sustained negative vocal 
affect crosses diagnostic thresholds earlier than 60% frequency.


Why Audio Quality Weighs So Heavily?
-------------------------------------

The Problem:
Poor quality audio can create false positives (noise interpreted as vocal 
tension) or false negatives (missing subtle prosodic cues). Unlike text 
(always clear) or video (visual cues compensate), audio quality directly 
determines signal reliability.

Our Solution:
Quality score <0.4 automatically triggers review regardless of emotions 
detected. Quality assessment combines volume (60% weight) and clarity 
(40% weight) - volume matters more because no volume = no signal at all.


Why Simpler Review Triggers than Text Analysis?
------------------------------------------------

The Problem:
Speech samples are often brief (<30 seconds) snapshots, unlike extended text 
or video sessions. Complex weighted scoring requires more data points to 
avoid oversensitivity.

Our Solution:
We use straightforward threshold triggers (confidence <0.4, quality <0.4, 
negative >70%) that are robust even with limited data. Simple rules reduce 
false triggers while catching genuine concerns.


How Speech Analysis Complements Text/Facial Analysis
-----------------------------------------------------

Unique Value of Speech:
    • Text: Captures conscious thoughts, explicit concerns, cognitive patterns
    • Facial: Shows emotional expressions, real-time affective states
    • Speech: Reveals unconscious emotional prosody, voice health, 
              communication effectiveness

Complementary Insights:
A person might write "I'm fine" (text), smile appropriately (facial), but have 
vocal indicators of depression (monotone, slow, low energy in speech). The 
voice "leaks" true emotional state. Combined modalities provide the most 
complete behavioral health assessment.


Clinical Alignment
------------------
Our metrics align with established clinical tools:
    • Vocal Acoustic Analysis (VAA) protocols for depression
    • Speech Prosody Assessment Tools for emotional health
    • Voice Handicap Index (VHI) for voice health
    • Geriatric speech-language pathology assessment frameworks

This ensures AI-generated scores translate meaningfully to clinical speech 
assessment standards used by speech-language pathologists and geriatricians.

"""

