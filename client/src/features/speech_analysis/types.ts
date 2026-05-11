export interface AudioSessionStartResponse {
  session_id: string;
  user_id: string;
  status: string;
  start_time: string;
}

export interface AudioFileAnalysisResponse {
  session_id: string;
  audio_file: string;
  duration_seconds: number;
  dominant_emotion: string;
  confidence: number;
  emotion_distribution: Record<string, number>;
  audio_quality_score: number;
  requires_human_review: boolean;
  review_request_id?: string;
  clinical_insights: Record<string, unknown>;
  agentic_analysis?: {
    overall_sentiment?: string;
    emotional_stability?: number;
    detailed_summary?: string;
    recommendations?: string[];
    concerning_patterns?: string[];
    quick_actions?: string[];
  };
  timestamp: string;
}
