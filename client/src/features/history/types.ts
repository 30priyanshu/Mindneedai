
export interface AnalysisHistoryEntry {
  request_id: string;
  prediction_label: string;
  confidence: number;
  requires_human_review: boolean;
  created_at: string;
  modality?: string;
  summary?: string;
}

export interface AnalysisHistoryResponse {
  items: AnalysisHistoryEntry[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
