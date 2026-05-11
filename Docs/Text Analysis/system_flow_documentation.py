"""
================================================================================
                    SYSTEM WORKFLOW DOCUMENTATION
                    MindNeedAI Text Analysis System
================================================================================

This document describes, in plain language, how the MindNeedAI Text Analysis
system processes user text end-to-end. It mirrors the System Flow shown in the
Streamlit application and serves as a standalone reference and backup.

================================================================================
                    SYSTEM OVERVIEW
================================================================================

MindNeedAI uses multiple layers of AI analysis working together to understand
emotional wellness:

• Base Emotion Detection — A trained model (RoBERTa) quickly identifies the
  overall emotional tone (positive/neutral/negative) and confidence scores.
• Deep Risk Analysis — A large language model evaluates clinical risk factors
  such as depression, anxiety, social isolation, and suicide risk.
• Quality Double-Check — The system validates that both analyses are coherent
  and consistent (e.g., positive tone should align with low depression).
• Smart Review Decision — Weighted logic determines whether a clinical human
  review is needed.
• Continuous Learning — Feedback from clinical reviewers improves future model
  performance via periodic fine-tuning.

================================================================================
                    STEP-BY-STEP ANALYSIS PROCESS
================================================================================

The following block mirrors the flow diagram in the app (ASCII representation).

```
                                        ┌─────────────────────────────────────────────────────┐
                                        │              STEP 1: TEXT INPUT                     │
                                        │                                                     │
                                        │  User submits text expressing thoughts or feelings  │
                                        │  Example: "Today was hectic. I could not meet       │
                                        │            my grandchildren"                        │
                                        └──────────────────────┬──────────────────────────────┘
                                                               │
                                                               ▼
                                        ┌─────────────────────────────────────────────────────┐
                                        │        STEP 2: INPUT VALIDATION                     │
                                        │                                                     │
                                        │  • Verify text length within acceptable range       │
                                        │  • Validate consent token (if applicable)           │
                                        │  • Generate unique request ID for tracking          │
                                        └──────────────────────┬──────────────────────────────┘
                                                               │
                                                               ▼
                                        ┌─────────────────────────────────────────────────────┐
                                        │    STEP 3: SENTIMENT CLASSIFICATION (RoBERTa)      │
                                        │                                                     │
                                        │  First-layer analysis determines emotional tone:    │
                                        │  • Classification: Positive/Neutral/Negative        │
                                        │  • Confidence score for each category (0-100%)      │
                                        │                                                     │
                                        │  Example output:                                    │
                                        │    → Negative: 91.8% confidence (primary)           │
                                        │      Neutral: 6.4%                                  │
                                        │      Positive: 1.8%                                 │
                                        └──────────────────────┬──────────────────────────────┘
                                                               │
                                                               ▼
                                        ┌─────────────────────────────────────────────────────┐
                                        │     STEP 4: CLINICAL ASSESSMENT (GPT-4)            │
                                        │                                                     │
                                        │  Second-layer analysis evaluates clinical factors:  │
                                        │  • Depression indicators (mood, energy, interest)   │
                                        │  • Anxiety markers (worry, stress, nervousness)     │
                                        │  • Social isolation (loneliness, disconnection)     │
                                        │  • Suicide risk (hopelessness, self-harm ideation)  │
                                        │  • Protective factors (support system, coping)      │
                                        │                                                     │
                                        │  Risk scoring: 0.0 (minimal) to 1.0 (severe)        │
                                        └──────────────────────┬──────────────────────────────┘
                                                               │
                                                               ▼
                                        ┌─────────────────────────────────────────────────────┐
                                        │       STEP 5: QUALITY VALIDATION                    │
                                        │                                                     │
                                        │  System validates consistency between analyses:     │
                                        │  • Positive sentiment → low depression/isolation    │
                                        │  • Social activity mentioned → low isolation        │
                                        │  • Multiple risks → calculate accumulated risk      │
                                        │  • Protective factors → reduce overall risk         │
                                        └──────────────────────┬──────────────────────────────┘
                                                               │
                                                               ▼
                                        ┌─────────────────────────────────────────────────────┐
                                        │   STEP 6: REVIEW TRIGGER CALCULATION                │
                                        │                                                     │
                                        │  Weighted scoring determines review necessity:      │
                                        │  • AI confidence level (low confidence = review)    │
                                        │  • Risk severity scores and thresholds              │
                                        │  • Multiple concurrent concerns present             │
                                        │  • Signal quality and consistency metrics           │
                                        │  • Protective factor offset calculations            │
                                        │                                                     │
                                        │  Decision threshold: Score ≥ 0.65 triggers review   │
                                        └──────────────────────┬──────────────────────────────┘
                                                               │
                                            ┌──────────────────┴──────────────────┐
                                            │                                     │
                                            ▼                                     ▼
                                   NO REVIEW REQUIRED                    REVIEW REQUIRED
                                            │                                     │
                                            │                                     ▼
                                            │              ┌─────────────────────────────────┐
                                            │              │  Generate Reviewer Summary:     │
                                            │              │  • Primary emotion & confidence │
                                            │              │  • Key risk factors identified  │
                                            │              │  • Care urgency classification  │
                                            │              │  • Original text excerpt        │
                                            │              └───────────┬─────────────────────┘
                                            │                          │
                                            │                          ▼
                                            │              ┌─────────────────────────────────┐
                                            │              │  Assign to Clinical Reviewer:   │
                                            │              │  • Determine priority level     │
                                            │              │  • Match to available reviewer  │
                                            │              │  • Queue for review             │
                                            │              │  • Send notification            │
                                            │              └───────────┬─────────────────────┘
                                            │                          │
                                            └──────────────┬───────────┘
                                                           │
                                                           ▼
                                        ┌─────────────────────────────────────────────────────┐
                                        │      STEP 7: RESPONSE GENERATION                    │
                                        │                                                     │
                                        │  System produces three outputs:                     │
                                        │                                                     │
                                        │  1) Care Recommendations                            │
                                        │     Actionable suggestions based on assessment      │
                                        │     Example: "Consider connecting with friends"     │
                                        │                                                     │
                                        │  2) Personalized Response                           │
                                        │     Empathetic message acknowledging emotions       │
                                        │                                                     │
                                        │  3) Confidence Assessment                           │
                                        │     AI certainty level for this analysis            │
                                        └──────────────────────┬──────────────────────────────┘
                                                               │
                                                               ▼
                                        ┌─────────────────────────────────────────────────────┐
                                        │           STEP 8: DATA STORAGE                      │
                                        │                                                     │
                                        │  With consent:                                      │
                                        │  • Encrypt text using Fernet encryption             │
                                        │  • Store analysis results and risk scores           │
                                        │  • Mark as training-eligible data                   │
                                        │                                                     │
                                        │  Without consent:                                   │
                                        │  • Store only aggregated statistics                 │
                                        │  • Original text discarded                          │
                                        └──────────────────────┬──────────────────────────────┘
                                                               │
                                                               ▼
                                        ┌─────────────────────────────────────────────────────┐
                                        │          STEP 9: RESULT DELIVERY                    │
                                        │                                                     │
                                        │  User receives:            Reviewer receives:       │
                                        │  • Emotional analysis      • Case summary           │
                                        │  • Risk assessment         • Priority level         │
                                        │  • Care recommendations    • Full analysis details  │
                                        │  • Personalized response   • Original text          │
                                        │  • Review status           • Assignment notification│
                                        └──────────────────────┬──────────────────────────────┘
                                                               │
                                              (If Review Triggered)
                                                               │
                                                               ▼
                                               ┌───────────────────────────┐
                                               │  STEP 10: HUMAN REVIEW    │
                                               │                           │
                                               │  Clinical reviewer:       │
                                               │  • Reviews AI assessment  │
                                               │  • Evaluates accuracy     │
                                               │  • Documents findings     │
                                               │  • Corrects if necessary  │
                                               │  • Completes review       │
                                               └────────────┬──────────────┘
                                                            │
                                                            ▼
                                               ┌─────────────────────────────┐
                                               │  STEP 11: MODEL IMPROVEMENT │
                                               │                             │
                                               │  Periodic training cycle:   │
                                               │  • Aggregate reviewed cases │
                                               │  • Apply expert corrections │
                                               │  • Retrain RoBERTa model    │
                                               │  • Improve future accuracy  │
                                               └─────────────────────────────┘
```

================================================================================
                    PRIVACY & SECURITY
================================================================================

Data Protection Measures
------------------------
• Encryption: All stored text is encrypted using Fernet (AES 128-bit).
• Consent-Based Storage: Text storage requires explicit user consent.
• Secure Training Pipeline: Encrypted data is used for model training only
  with consent.
• No Plain Text Persistence: Original messages are never stored in readable
  format.
• Audit Logging: Complete activity trail for access tracking and compliance.

Data Usage Policy
-----------------
• With Consent: Text encrypted and securely stored for future model training.
• Without Consent: Only anonymized metrics stored (no text content).
• Training Process: Expert-reviewed cases used to fine-tune the RoBERTa model.
• User Rights: Consent can be withdrawn at any time, triggering data deletion.

================================================================================
                    DESIGN PRINCIPLES
================================================================================

1) Dual-Layer AI Architecture
   • First Layer (RoBERTa): Fast sentiment classification for emotional tone.
   • Second Layer (LLM): Deep clinical analysis for specific risk assessment.
   • Validation Layer: Cross-checks consistency between both analyses.
   • Combined approach provides more accurate results than single-model systems.

2) Evidence-Based Review Triggers
   • Multi-factor weighted scoring instead of single-rule thresholds.
   • Risk severity determines weight contribution to the trigger score.
   • Protective factors (social support, coping skills) offset risk scores.
   • Target review rate: 12–18% of cases (balances sensitivity with capacity).

3) Separation of AI and Clinical Judgment
   • AI-generated summary provides context and preliminary assessment.
   • Clinician notes provide professional judgment and final determination.
   • Maintains clear distinction between automated assistance and human expertise.

4) Gradient Risk Scoring System
   • Continuous scale (0.0–1.0) instead of binary classification.
   • Differentiates between mild (0.2–0.3), moderate (0.4–0.6), and severe (0.7+).
   • Multiple moderate risks accumulate into higher overall concern scores.

5) Quality Assurance and Safety
   • Self-validating system checks analysis consistency.
   • Low confidence or signal conflicts trigger automatic human review.
   • Complete audit trail for all decisions and actions.
   • Privacy-by-design with encryption and consent management.

================================================================================
                            END OF DOCUMENT
================================================================================
"""


