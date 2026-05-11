export interface SessionResponse {
  session_id: string;
  status: string;
  start_time: string;
}

export interface FrameAnalysisResponse {
  frame_number: number;
  face_detected: boolean;
  emotion: string;
  confidence: number;
  box_coords?: number[] | null;
  requires_review?: boolean;
}

export interface AgenticAnalysis {
  overall_sentiment: string;
  emotional_stability: number;
  detailed_summary: string;
  recommendations: string[];
  concerning_patterns: string[];
  quick_actions?: string[];
  mood_trajectory?: string;
  confidence_score?: number;
  clinical_risk?: {
    protective_factors?: string[];
    depression_risk_score?: number;
    anxiety_manifestation_score?: number;
  };
}

export interface SessionSummaryResponse {
  session_id: string;
  status: string;
  total_frames: number;
  valid_frames: number;
  duration_seconds: number;
  dominant_emotion: string;
  average_confidence: number;
  emotion_distribution: Record<string, number>;
  requires_human_review: boolean;
  review_request_id?: string;
  agentic_analysis?: AgenticAnalysis;
}
