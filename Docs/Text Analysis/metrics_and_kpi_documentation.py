"""
================================================================================
                    METRICS & KPIs DOCUMENTATION
                    MindNeedAI Text Analysis System
================================================================================

This document provides comprehensive documentation of the scoring systems, 
evaluation metrics, and decision logic used in the MindNeedAI analysis pipeline.
All scores are evidence-based and designed to quantify clinical risk and 
analysis quality.

================================================================================
                    RISK PROFILE SCORING SYSTEM
================================================================================

Overview
--------
We use scores from 0.0 to 1.0 for all risk types instead of simple yes/no 
answers. This lets us capture mild, moderate, and severe concerns accurately. 
All scores are based on actual words and context in the text.


1. DEPRESSION SCORE
-------------------
Range: 0.0 - 1.0
Description: Quantifies depressive indicators in text

Scoring Guidelines:
    • 0.0-0.1: Positive mood, engagement, enjoyment present
    • 0.2-0.3: Mild negative mood or fatigue in transient context
    • 0.4-0.6: Clear anhedonia, persistent sadness, withdrawal
    • 0.7-0.9: Severe markers (hopelessness, worthlessness, pervasive negativity)

Rationale:
The scale helps us tell the difference between a bad day and serious depression. 
Ranges match standard depression screening tools used by clinicians.


2. ANXIETY SCORE
----------------
Range: 0.0 - 1.0
Description: Measures anxiety-related indicators

Scoring Guidelines:
    • 0.0-0.1: Calm, relaxed, no anxiety indicators
    • 0.2-0.3: Normal stress about specific events (e.g., "busy day")
    • 0.4-0.6: Clear worry, nervousness, overwhelm, tension
    • 0.7-0.9: Severe anxiety, panic symptoms, inability to cope

Rationale:
We separate normal stress (like a busy day) from ongoing anxiety problems. 
This prevents flagging everyday stress as a disorder.


3. SOCIAL ISOLATION SCORE
--------------------------
Range: 0.0 - 1.0
Description: Assesses social engagement and isolation risk

Scoring Guidelines:
    • 0.0-0.1: Mentions friends, activities, social engagement, going places
    • 0.2-0.3: No social mentions but positive/neutral tone
    • 0.4-0.6: Hints of loneliness or reduced social contact
    • 0.7-0.9: Explicit isolation, loneliness, absence of connections

Rationale:
Isolation is especially dangerous for seniors (research shows 50% higher 
mortality risk). When someone mentions friends or activities, the score must 
stay low (under 0.15). Our system double-checks this.


4. SUICIDE RISK SCORE
---------------------
Range: 0.0 - 1.0
Description: Evaluates suicide risk indicators

Scoring Guidelines:
    • 0.0-0.1: Positive/neutral text, no concerning language
    • 0.2-0.3: Subtle concerning language requires evidence
    • 0.4-0.6: Hopelessness, finality language, purpose loss
    • 0.7-1.0: Clear suicidal ideation or self-harm references

Rationale:
We're cautious here - the score requires actual evidence in the text. Even 
small signs (0.2-0.3) matter when combined with other concerns.


5. ACCUMULATED RISK SCORE
--------------------------
Range: 0.0 - 1.0
Description: Composite score reflecting total risk level

Scoring Guidelines:
Intelligent aggregation (not simple average):
    • If all risks <0.2 → accumulated <0.15
    • If 2+ risks >0.4 → accumulated = max_risk + (sum of others × 0.3)
    • Protective factors subtract 0.08-0.2 per factor

Example Calculation:
    Depression 0.5, Anxiety 0.4, Isolation 0.1
    → accumulated = 0.5 + (0.4 × 0.3) + (0.1 × 0.3) = 0.65
    → With 2 protective factors: 0.65 - 0.16 = 0.49

Rationale:
Multiple risks add up to more than their individual scores because they 
reinforce each other. Protective factors like social support lower the total. 
This matches how risk works in real life.


================================================================================
              SIGNAL QUALITY METRICS
      (How Well AI Analysis Aligns with Model Predictions)
================================================================================

Purpose
-------
These metrics check how reliable and consistent the analysis is. They help us 
spot when the AI isn't sure about its assessment or when different signals are 
contradicting each other.


1. SENTIMENT ALIGNMENT
----------------------
Range: 0.0 - 1.0
Description: Agreement between RoBERTa prediction and clinical assessment
Formula: 1.0 = perfect agreement, 0.5 = partial alignment, <0.3 = conflict

Usage:
If the sentiment model says very positive but our clinical analysis finds 
concerns, this score drops. Low alignment means the case needs human review.

Threshold:
Alignment <0.5 with high RoBERTa confidence triggers review


2. EVIDENCE STRENGTH
--------------------
Range: 0.0 - 1.0
Description: Quality and quantity of textual evidence supporting assessment
Formula: Based on number of supporting quotes, clarity of indicators, specificity of language

Usage:
When we have limited evidence and only moderate confidence, a human should 
review the case to be safe.

Threshold:
<0.4 evidence with <0.75 RoBERTa confidence adds to trigger score


3. INSIGHT COHERENCE
--------------------
Range: 0.0 - 1.0
Description: How well multiple insights align with each other
Formula: 1.0 = all insights tell consistent story, <0.5 = contradictory signals

Usage:
Low coherence means the person might have mixed emotions or our analysis is uncertain.

Threshold:
Low coherence flags case for potential review


4. OVERALL QUALITY
------------------
Range: 0.0 - 1.0
Description: Meta-assessment of analysis reliability
Formula: Considers text brevity, clarity, available evidence, signal consistency

Usage:
If our analysis quality is low even with moderate confidence, we trigger review 
to be safe - regardless of risk scores.

Threshold:
<0.4 overall quality contributes 0.3-0.5 to trigger score


================================================================================
                    HUMAN REVIEW TRIGGER THRESHOLDS
================================================================================

How the Weighted Scoring Works
-------------------------------
Instead of simple yes/no rules, we use a point-based system. Different factors 
add points to a trigger score. This lets us consider the full picture when 
deciding if a human should review the case.

Decision Rule:
Human review is triggered when total score reaches 0.65 
(or 0.45 if analysis quality is low)


TRIGGER SCORE CALCULATION
--------------------------

trigger_score = 0.0

# Base triggers (AI uncertainty or strong negative emotion)
+ 1.0  if AI confidence <60%
+ 0.8  if negative emotion with >=80% confidence

# Risk factors (higher scores get more weight)
+ suicide_risk × 1.5  (if >=0.5) or × 0.8 (if >=0.3)
+ depression × 0.7    (if >=0.6) or × 0.4 (if >=0.4)
+ isolation × 0.6     (if >=0.7) or × 0.3 (if >=0.5) or × 0.2 (if >=0.4)
+ accumulated × 0.7   (if >=0.5) or × 0.35 (if >=0.35)

# Additional signals
+ 0.05 per risk_factor (if 3+ different concerns present)
+ ambiguity bonus (when predictions are close)
+ correlation bonus (when sentiment and risk scores align)
+ mismatch penalty × 0.5 (when signals contradict)
+ quality penalty × 1.5 (when analysis is unreliable)

# Protective factors reduce total
- 0.1 per protective_factor (max reduction: -0.3)

# Decision
if trigger_score >= 0.65 → HUMAN REVIEW
or if trigger_score >= 0.45 AND quality <0.5 → HUMAN REVIEW


WHY THESE SPECIFIC WEIGHTS?
----------------------------

Low AI Confidence (<60%)
    Weight: + 1.0
    Reason: When the AI is unsure (below 60% confidence), it's basically 
    guessing. We need a human to decide instead.

Strong Negative Emotion (≥80%)
    Weight: + 0.8
    Reason: High-confidence negative feelings are important to catch early. 
    The 80% threshold ensures we're only reacting to clear signals.

Suicide Risk
    Weight: × 1.5 (≥0.5) or × 0.8 (≥0.3)
    Reason: This gets the highest weight because it's the most critical. Even 
    small signs (0.3) need attention. Higher scores multiply more strongly.

Depression Score
    Weight: × 0.7 (≥0.6) or × 0.4 (≥0.4)
    Reason: Depression is serious but not immediately life-threatening. Higher 
    scores add more points to reflect severity.

Social Isolation
    Weight: × 0.6 (≥0.7) or × 0.3 (≥0.5) or × 0.2 (≥0.4)
    Reason: For seniors, isolation is dangerous (linked to 50% higher mortality). 
    We now catch moderate isolation earlier with the 0.2× tier.

Accumulated Risk
    Weight: × 0.7 (≥0.5) or × 0.35 (≥0.35)
    Reason: This combines all risks into one score. We use a moderate weight to 
    avoid double-counting since we already consider individual risks.

Multiple Risk Factors (≥3)
    Weight: + 0.05 each
    Reason: Having many different concerns is itself worrying, even if each is 
    mild. Small weight prevents over-counting.

Sentiment-Risk Agreement
    Weight: + 0.2 to 0.5
    Reason: When the emotion detector and risk assessment both point the same 
    direction, we're more confident. Adds bonus points.

Signal Mismatch
    Weight: + mismatch × 0.5
    Reason: When different parts of our analysis disagree, a human should 
    investigate. Half the mismatch value is added.

Low Analysis Quality
    Weight: + (0.4 - quality) × 1.5
    Reason: Unreliable analysis needs human validation. Stronger penalty ensures 
    quality concerns trigger review.

Protective Factors
    Weight: - 0.1 each (max -0.3)
    Reason: Social support and coping skills do help, so we subtract points. 
    Capped at -0.3 so risk isn't completely ignored.


EXAMPLE CALCULATIONS
---------------------

Example 1: Text "very lonely and sad" with 91% negative confidence

    + 0.8   (negative ≥80%)
    + 0.42  (depression 0.6 × 0.7)
    + 0.36  (isolation 0.6 × 0.6)
    + 0.48  (suicide_risk 0.6 × 0.8)
    + 0.42  (accumulated 0.6 × 0.7)
    + 0.15  (3 risk_factors × 0.05)
    + 0.25  (sentiment-risk alignment bonus)
    - 0.00  (no protective factors)
    ─────────
    = 2.88 total → REVIEW TRIGGERED ✓


Example 2: Text "great day with friends" with 99% positive confidence

    + 0.0   (confidence is high)
    + 0.0   (positive sentiment)
    + 0.04  (depression 0.1 × 0.4 = 0.04)
    + 0.0   (isolation 0.05, below all thresholds)
    + 0.0   (accumulated 0.08 < 0.35)
    + 0.0   (only 0-1 risk factors)
    - 0.2   (2 protective factors × 0.1)
    ─────────
    = -0.16 total → NO REVIEW ✓

The weighted approach works well: concerning text triggers review, clearly 
positive text doesn't.


================================================================================
                    DESIGN RATIONALE
================================================================================

Why Use 0-1 Scores Instead of Yes/No?
--------------------------------------

The Problem with Yes/No:
Real mental health concerns exist on a spectrum. Simple yes/no classification 
misses important differences between "mildly stressed" and "severely depressed." 
Also, several moderate concerns together can be more serious than any single one.

Our Solution:
We use 0.0 to 1.0 scales that capture mild (0.2), moderate (0.5), and severe 
(0.8) levels. This lets us add up multiple concerns accurately and see the full 
picture.


Why Use Weighted Points Instead of Simple Rules?
-------------------------------------------------

The Problem with Simple Rules:
If we just used rules like "trigger review if negative," we'd miss cases where 
someone is masking distress with positive words. And we'd also over-trigger on 
normal bad days.

Our Solution:
Different factors contribute points based on their importance. Suicide risk adds 
the most points. Multiple moderate concerns add up. Protective factors subtract 
points. The threshold (0.65) is calibrated so we catch concerning cases without 
overwhelming human reviewers.


Why Check Analysis Quality?
----------------------------

The Problem:
Sometimes the AI is confident but wrong. Brief text doesn't give much to work 
with. Different parts of the analysis might contradict each other.

Our Solution:
We measure how reliable and consistent the analysis is. When quality is low, we 
lower the trigger threshold (0.45 instead of 0.65) to be extra cautious.


Why Double-Check the Scores?
-----------------------------

The Problem:
GPT-4 can be inconsistent. It might score someone as depressed even when they're 
clearly happy, or rate isolation high when they just mentioned friends.

Our Solution:
A validation layer catches these mistakes. For example, very positive text (>90%) 
caps depression at 0.10, and mentioning social activities forces isolation below 
0.15.


How Our Scores Match Clinical Standards
----------------------------------------

Depression Scale (matches PHQ-9 questionnaire):
    • 0.0-0.1: Minimal symptoms (PHQ-9: 0-4)
    • 0.2-0.3: Mild (PHQ-9: 5-9)
    • 0.4-0.6: Moderate (PHQ-9: 10-14)
    • 0.7+: Severe (PHQ-9: 15+)

Target Review Rate: 12-18% of cases
We aim to catch all concerning cases while keeping the human review workload 
reasonable.


Why These Specific Weights?
----------------------------

Suicide Risk Gets Highest Weight (1.5×):
This is the most critical concern. Even subtle signs (score 0.3) need attention. 
Research shows immediate professional assessment saves lives.

Isolation Weight for Seniors (up to 0.6×):
Studies show severe isolation increases senior mortality by 50%+ and accelerates 
cognitive decline. We now catch moderate isolation earlier with our three-tier 
approach.

Protective Factors Get Modest Reduction (-0.1 each):
Research shows social support reduces depression risk by 20-30%. We subtract 
points but cap the reduction at -0.3 so significant risks aren't dismissed just 
because someone has friends.


================================================================================
                            NOTE
================================================================================

All our metrics and thresholds come from clinical research, testing on real 
cases, and careful safety margins. The system is designed to catch real concerns 
while avoiding false alarms through its multi-factor weighted approach.

================================================================================
                        END OF DOCUMENT
================================================================================
"""

