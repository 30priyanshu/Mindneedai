import type { EmotionCategory, AnalysisModality } from '@/core/types';

export interface TextAnalysisRequest {
  user_id: string;
  text: string;
  consent_token?: string;
}

export interface Prediction {
  label: EmotionCategory;
  confidence: number;
}

export interface AgenticAnalysis {
  clinical_insight: string;
  cognitive_distortions: string[];
  grounding_techniques: string[];
}

export interface TextAnalysisResponse {
  request_id: string;
  prediction: Prediction;
  all_predictions: Prediction[];
  requires_human_review: boolean;
  confidence_level: string;
  care_recommendations: string[];
  personalized_response: string;
  review_request_id?: string;
  timestamp: string;
  agentic_analysis?: AgenticAnalysis;
}

export interface FeedbackRequest {
  request_id: string;
  rating: number;
  comment?: string;
}

export interface ReviewStatus {
  review_request_id: string;
  status: 'pending' | 'in_progress' | 'completed';
  reviewed_at?: string;
  modality: AnalysisModality;
}

export interface MusicRecommendation {
  success: boolean;
  music_file: string | null;
  emotion: string;
  total_tracks: number;
  played_count: number;
  message: string | null;
}

export interface VideoRecommendation {
  success: boolean;
  video_file: string | null;
  emotion: string;
  total_videos: number;
  played_count: number;
  message: string | null;
}

export interface YouTubeRecommendation {
  success: boolean;
  youtube_video_id: string | null;
  title: string | null;
  emotion: string;
  total_videos: number;
  played_count: number;
  message: string | null;
}
