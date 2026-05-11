"""
================================================================================
                    METRICS & KPIs DOCUMENTATION
                    MindNeedAI Facial/Video Analysis System
================================================================================

This document provides comprehensive documentation of the scoring systems, 
evaluation metrics, and decision logic used in the MindNeedAI video analysis 
pipeline. All scores are evidence-based and designed to quantify behavioral 
health patterns and clinical risk from facial emotion patterns.

================================================================================
                    EMOTION DETECTION SYSTEM
================================================================================

Overview
--------
The system analyzes facial expressions from video to detect 7 distinct emotions 
using a ResNet50 deep learning model. Emotions are tracked across frames to 
identify patterns, temporal dynamics, and concerning behavioral indicators.


EMOTION CATEGORIES
------------------
The model detects 7 primary emotions with confidence scores (0.0 - 1.0):

    • Neutral: Baseline emotional state, no strong affect
    • Happiness: Positive affect, engagement, joy
    • Sadness: Negative affect, low mood, distress
    • Surprise: Alertness, unexpected response
    • Fear: Anxiety, threat response, worry
    • Disgust: Aversion, pain indicators, discomfort
    • Anger: Agitation, frustration, irritability

Classification Confidence:
    • 0.9-1.0: Very high confidence, clear expression
    • 0.7-0.9: High confidence, strong indicators
    • 0.5-0.7: Moderate confidence, identifiable pattern
    • 0.0-0.5: Low confidence, ambiguous expression (triggers review)

Rationale:
Video provides continuous emotional data over time. Unlike text analysis, we 
measure emotion frequency and duration across the session to identify sustained 
patterns versus transient reactions.


================================================================================
                    BEHAVIORAL HEALTH METRICS
================================================================================

Overview
--------
These metrics quantify behavioral health indicators derived from emotional 
patterns observed during video sessions. Each metric uses a 0.0-1.0 scale 
where higher values indicate greater concern (except for positive indicators).


1. EMOTIONAL VARIABILITY SCORE
-------------------------------
Range: 0.0 - 1.0
Description: Measures frequency of emotional switching and instability

Scoring Guidelines:
    • 0.0-0.2: Stable emotions, appropriate continuity
    • 0.2-0.4: Normal variation, situational responses
    • 0.4-0.6: Elevated switching, potential dysregulation
    • 0.6-1.0: Rapid fluctuations, emotional instability

Calculation:
Based on number of rapid emotional changes within 5-second windows. More than 
4 different emotions in a 5-second span indicates high variability.

Rationale:
Excessive emotional switching may indicate anxiety, agitation, or difficulty 
with emotional regulation - particularly concerning in elderly populations.


2. MOOD STABILITY INDEX
------------------------
Range: 0.0 - 1.0 (higher = more stable)
Description: Overall consistency and predictability of emotional state

Scoring Guidelines:
    • 0.8-1.0: Very stable, appropriate emotional continuity
    • 0.6-0.8: Good stability, normal variation
    • 0.4-0.6: Moderate instability, monitoring needed
    • 0.0-0.4: Poor stability, concerning fluctuations

Calculation:
Inverse of emotional variability. Calculated as: 1.0 - (rapid_changes / baseline)

Rationale:
Mood stability is a key indicator of emotional well-being. Low stability may 
suggest underlying mental health concerns requiring intervention.


3. SOCIAL ENGAGEMENT INDICATOR
-------------------------------
Range: 0.0 - 1.0 (higher = better engagement)
Description: Measures positive emotional expression frequency

Scoring Guidelines:
    • 0.7-1.0: Frequent positive affect, good engagement
    • 0.4-0.7: Moderate positive expressions
    • 0.2-0.4: Limited positive affect, concern
    • 0.0-0.2: Minimal positive expressions, high concern

Calculation:
Frequency of Happiness and Surprise emotions (% of session duration)

Rationale:
Positive affect is a key indicator of social-emotional health. Absence of 
positive emotions, especially in elderly care settings, may indicate 
depression, isolation, or declining quality of life.


4. DISTRESS FREQUENCY
----------------------
Range: 0.0 - 1.0 (higher = more distress)
Description: Frequency of negative emotional expressions

Scoring Guidelines:
    • 0.0-0.2: Minimal distress, good emotional state
    • 0.2-0.4: Occasional distress, within normal range
    • 0.4-0.6: Elevated distress, monitoring indicated
    • 0.6-1.0: Sustained distress, intervention needed

Calculation:
Combined frequency of Sadness, Fear, Anger, Disgust (% of session duration)

Rationale:
Sustained negative affect indicates potential depression, anxiety, pain, or 
other conditions requiring clinical assessment. The 60% threshold aligns with 
clinical depression screening protocols.


5. POSITIVE AFFECT DURATION
----------------------------
Range: 0.0 - 1.0 (higher = better)
Description: Proportion of session with positive emotional expressions

Scoring Guidelines:
    • 0.5-1.0: Healthy positive affect present
    • 0.3-0.5: Moderate positive affect
    • 0.1-0.3: Limited positive affect, concern
    • 0.0-0.1: Minimal positive affect, high concern

Calculation:
Duration of Happiness + Surprise emotions / total session duration

Rationale:
Duration matters more than frequency - sustained positive emotions indicate 
better emotional well-being than brief positive flashes.


6. EMOTIONAL RESILIENCE SCORE
------------------------------
Range: 0.0 - 1.0 (higher = better resilience)
Description: Ability to recover from negative emotional states

Scoring Guidelines:
    • 0.7-1.0: Good resilience, returns to baseline
    • 0.5-0.7: Adequate resilience
    • 0.3-0.5: Limited resilience, slow recovery
    • 0.0-0.3: Poor resilience, sustained negativity

Calculation:
1.0 - (distress_frequency). Adjusted based on recovery patterns after negative 
emotional episodes.

Rationale:
Resilience is protective. People who can return to neutral or positive states 
after distress show better emotional regulation and coping.


7. PAIN/DISCOMFORT INDICATORS
------------------------------
Range: 0.0 - 1.0 (higher = more indicators)
Description: Facial expressions suggesting physical pain or discomfort

Scoring Guidelines:
    • 0.0-0.1: No pain indicators
    • 0.1-0.3: Occasional discomfort, assess if persistent
    • 0.3-0.5: Moderate pain indicators, evaluation needed
    • 0.5-1.0: Significant pain signs, immediate assessment

Calculation:
Frequency of Disgust emotion (grimacing, aversion expressions)

Rationale:
Disgust expressions often indicate pain or physical discomfort in elderly 
individuals, especially those with communication difficulties. This is unique 
to facial analysis and not captured by text-based systems.


8. COGNITIVE LOAD SCORE
------------------------
Range: 0.0 - 1.0 (higher = higher load)
Description: Indicators of cognitive strain or confusion

Scoring Guidelines:
    • 0.0-0.3: Normal cognitive state
    • 0.3-0.5: Elevated cognitive load
    • 0.5-0.7: Significant strain
    • 0.7-1.0: Severe cognitive indicators

Calculation:
Currently defaulted to 0.5 (neutral). Future versions will incorporate 
attention metrics, confusion patterns, and facial tension indicators.

Rationale:
Cognitive decline shows in facial expressions. This metric is under development 
to better capture cognitive status indicators.


================================================================================
                    CLINICAL RISK SCORING SYSTEM
================================================================================

Overview
--------
Clinical risk scores translate emotional patterns into actionable assessments 
aligned with geriatric care protocols. All scores range 0.0-1.0.


1. DEPRESSION RISK SCORE
-------------------------
Range: 0.0 - 1.0
Description: Likelihood of depressive symptoms based on emotional patterns

Scoring Guidelines:
    • 0.0-0.2: Minimal depression indicators
    • 0.2-0.4: Mild indicators, watchful waiting
    • 0.4-0.6: Moderate risk, assessment recommended
    • 0.6-1.0: High risk, professional evaluation needed

Calculation:
Sadness frequency × 1.5 (capped at 1.0)

Rationale:
Sustained sadness is the primary facial indicator of depression. We amplify 
the score (1.5×) because even 40% sadness frequency suggests significant 
depressive symptoms requiring attention.


2. ANXIETY MANIFESTATION SCORE
-------------------------------
Range: 0.0 - 1.0
Description: Facial indicators of anxiety and worry

Scoring Guidelines:
    • 0.0-0.2: Minimal anxiety indicators
    • 0.2-0.4: Mild anxiety, within normal range
    • 0.4-0.6: Moderate anxiety, monitoring indicated
    • 0.6-1.0: Severe anxiety, intervention needed

Calculation:
Fear frequency × 1.5 (capped at 1.0)

Rationale:
Fear expressions indicate anxiety states. Like depression, we amplify to catch 
clinically significant patterns earlier. Facial fear is more objective than 
self-reported anxiety.


3. EMOTIONAL DISTRESS LEVEL
----------------------------
Range: 0.0 - 1.0
Description: Overall level of emotional suffering or distress

Scoring Guidelines:
    • 0.0-0.2: Minimal distress
    • 0.2-0.4: Mild distress
    • 0.4-0.6: Moderate distress
    • 0.6-1.0: Severe distress requiring intervention

Calculation:
Total negative emotion frequency (Sadness + Fear + Anger + Disgust) / 4

Rationale:
This is the composite distress metric. It captures overall emotional suffering 
regardless of specific emotion category.


4. SOCIAL WITHDRAWAL INDICATORS
--------------------------------
Range: 0.0 - 1.0
Description: Indicators of social disengagement or isolation

Scoring Guidelines:
    • 0.0-0.2: Good social-emotional engagement
    • 0.2-0.4: Adequate engagement
    • 0.4-0.6: Reduced engagement, concern
    • 0.6-1.0: Significant withdrawal indicators

Calculation:
1.0 - positive_affect_frequency

Rationale:
Lack of positive emotional expression suggests social-emotional withdrawal. 
This is a proxy indicator since video alone can't fully assess social 
engagement, but absence of joy is concerning.


5. AGITATION FREQUENCY
-----------------------
Range: 0.0 - 1.0
Description: Frequency of anger and agitation expressions

Scoring Guidelines:
    • 0.0-0.2: Minimal agitation
    • 0.2-0.4: Occasional frustration, normal
    • 0.4-0.6: Elevated agitation, assess causes
    • 0.6-1.0: Frequent agitation, intervention needed

Calculation:
Anger frequency × 1.5 (capped at 1.0)

Rationale:
Agitation is particularly important in elderly care - it may indicate pain, 
confusion, unmet needs, or behavioral health issues. Early detection prevents 
escalation.


6. APATHY SIGNS
----------------
Range: 0.0 - 1.0
Description: Indicators of emotional flatness or lack of engagement

Scoring Guidelines:
    • 0.0-0.2: Good emotional responsiveness
    • 0.2-0.4: Mild reduction in affect
    • 0.4-0.6: Moderate apathy, assessment needed
    • 0.6-1.0: Severe apathy, immediate evaluation

Calculation:
Currently based on sustained Neutral expression (>70%) combined with low 
emotional variability. Under development for more precise detection.

Rationale:
Apathy is a key indicator of cognitive decline and depression in elderly 
populations. Flat affect with minimal emotional response suggests neurological 
or psychiatric concerns.


7. ACCUMULATED CONCERN SCORE
-----------------------------
Range: 0.0 - 1.0
Description: Overall clinical risk level combining all factors

Scoring Guidelines:
    • 0.0-0.2: Low risk, routine monitoring
    • 0.2-0.4: Mild concerns, increased observation
    • 0.4-0.6: Moderate risk, assessment recommended
    • 0.6-1.0: High risk, immediate evaluation needed

Calculation:
Equals emotional_distress_level (the negative emotion frequency composite)

Rationale:
Unlike text analysis which has complex risk accumulation, video analysis 
primarily focuses on negative affect frequency as the main risk indicator. 
This is validated against geriatric depression and behavioral health scales.


================================================================================
                    HUMAN REVIEW TRIGGER THRESHOLDS
================================================================================

How Review Triggers Work
-------------------------
Video analysis uses a multi-factor approach to determine when human clinical 
review is needed. Unlike text analysis, the decision is primarily driven by 
confidence levels and emotional pattern analysis.


REVIEW TRIGGER CONDITIONS
--------------------------

Automatic Review Triggers:

1. Low Confidence Detection
   Trigger: Average confidence <0.5 across session
   Rationale: When the AI is uncertain about emotion detection, human review 
   ensures accuracy and prevents false positives/negatives.

2. High Negative Emotion Ratio
   Trigger: Negative emotions >60% of session
   Rationale: Sustained negative affect indicates potential depression, anxiety, 
   or distress requiring clinical assessment.

3. Agentic Analysis Recommendation
   Trigger: GPT-4o-mini clinical analysis flags requires_human_review = True
   Rationale: The agentic reasoner considers complex patterns and temporal 
   dynamics that may not be captured by simple thresholds.

4. Critical Emotion Patterns
   Trigger: 
      • Sadness >40% of session
      • Fear >30% of session  
      • Anger >30% of session
      • Pain indicators (Disgust) >20% of session
   
   Rationale: These thresholds align with clinical screening tools for 
   depression, anxiety, agitation, and pain in elderly care settings.

5. Low Detection Quality
   Trigger: <50% of frames with successful face detection
   Rationale: Poor detection suggests technical issues or participant 
   disengagement that requires human review to interpret.


REVIEW PRIORITY LEVELS
-----------------------

Priority: LOW
    • Average confidence 0.5-0.7 with mixed emotions
    • Negative emotions 20-40% of session
    • No critical patterns identified
    → Review within 1 week, routine assessment

Priority: MEDIUM  
    • Average confidence 0.4-0.5
    • Negative emotions 40-60% of session
    • Moderate risk indicators present
    → Review within 2-3 days, scheduled assessment

Priority: HIGH
    • Average confidence <0.4 OR
    • Negative emotions >60% of session OR
    • Sustained sadness >50% OR
    • Multiple critical patterns (3+ risk indicators)
    → Review within 24 hours, priority assessment


EXAMPLE DECISION FLOWS
-----------------------

Example 1: Session with 70% Sadness, 85% avg confidence

    Negative emotion ratio: 0.70 → TRIGGERS (>60%)
    Sadness frequency: 0.70 → TRIGGERS (>40%)
    Confidence: 0.85 → Good (no trigger)
    
    → REVIEW TRIGGERED: Priority HIGH
    → Depression risk score: 0.70 × 1.5 = 1.0 (capped)
    → Recommendation: Mental health assessment within 24 hours


Example 2: Session with 40% Happiness, 35% Neutral, 92% avg confidence

    Negative emotion ratio: 0.25 → No trigger
    Positive affect: 0.40 → Good engagement
    Confidence: 0.92 → Good
    
    → NO REVIEW TRIGGERED
    → All scores in healthy range
    → Recommendation: Routine monitoring


Example 3: Session with 45% Neutral, 30% Fear, 48% avg confidence

    Negative emotion ratio: 0.30 → Below threshold
    Fear frequency: 0.30 → At threshold
    Confidence: 0.48 → TRIGGERS (<0.5)
    
    → REVIEW TRIGGERED: Priority MEDIUM
    → Reason: Low confidence requires validation
    → Recommendation: Review within 2-3 days


================================================================================
                    DESIGN RATIONALE
================================================================================

Why Frequency/Duration Metrics Instead of Single-Frame Analysis?
-----------------------------------------------------------------

The Problem with Single Frames:
One frame showing sadness could be a yawn, a brief thought, or momentary 
expression. Single-frame analysis creates too many false positives.

Our Solution:
We track emotions across the entire video session and measure frequency and 
duration. Only sustained patterns (>30-60% of session) trigger concerns. This 
matches how clinicians assess mood - they look for persistent patterns, not 
momentary expressions.


Why Video-Specific Metrics (Pain, Apathy)?
-------------------------------------------

The Advantage of Facial Analysis:
Video captures information text cannot - physical pain expressions (grimacing), 
apathy (flat affect), and agitation patterns. These are particularly important 
in elderly care where individuals may have communication difficulties.

Our Solution:
We include pain/discomfort indicators (via Disgust detection) and apathy signs 
(via Neutral dominance) that are unique to facial analysis. These metrics help 
identify physical health issues alongside mental health concerns.


Why Amplify Certain Emotions (×1.5 multiplier)?
------------------------------------------------

The Problem with Linear Scaling:
Even 40% sadness frequency in a monitoring session is clinically significant. 
A direct mapping would only score 0.4, which might not trigger appropriate 
concern levels.

Our Solution:
We amplify sadness (depression), fear (anxiety), and anger (agitation) scores 
by 1.5× to align with clinical significance thresholds. This matches validated 
screening tools where sustained negative affect crosses clinical thresholds 
earlier than 60% duration.


Why Focus on Confidence for Review Triggers?
---------------------------------------------

The Problem:
Unlike text where we can analyze words, facial emotion detection depends on 
image quality, lighting, angle, and facial visibility. Low confidence often 
indicates technical issues rather than true emotional state.

Our Solution:
We heavily weight confidence in review decisions. Average confidence <0.5 
automatically triggers review regardless of detected emotions. This prevents 
both false positives and false negatives from poor-quality data.


How Video Analysis Complements Text Analysis
---------------------------------------------

Different Signal, Same Goal:
    • Text: Captures cognitive patterns, explicit concerns, thought content
    • Video: Captures emotional expression, non-verbal signals, affect patterns
    • Together: Provide comprehensive behavioral health assessment

In practice:
A person might say "I'm fine" (text) but display sustained sadness (video). 
Or report distress (text) but show adequate emotional regulation (video). The 
combination gives clinicians a fuller picture than either modality alone.


Target Review Rate
------------------
We aim for 15-20% of video sessions to trigger human review. This is slightly 
higher than text analysis (12-18%) because video data quality varies more based 
on technical factors, and the cost of false negatives in elderly care is high.


Clinical Alignment
------------------
Our metrics align with:
    • Geriatric Depression Scale (GDS) - sustained sadness frequency
    • Cornell Scale for Depression in Dementia - facial expression patterns
    • Cohen-Mansfield Agitation Inventory (CMAI) - agitation frequency
    • PAINAD Scale - pain indicators in facial expressions

This ensures our AI-generated scores translate meaningfully to established 
clinical assessment frameworks.

"""

