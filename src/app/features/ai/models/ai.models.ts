// ── AI Models ─────────────────────────────────────────────────────────────────

export interface AiRequest {
  userId: string;
  resumeId?: number;
  targetJobTitle?: string;
  existingContent?: string;
  tone?: string;
  sectionType?: string;
  targetLanguage?: string;
  jobDescription?: string;
}

export interface AiResponse {
  content: string;
  tokensUsed?: number;
  model?: string;
  requestType?: string;
  timestamp?: string;
}

export interface AtsReport {
  score: number;
  suggestions: string[];
  missingKeywords?: string[];
}

export interface QuotaInfo {
  remainingSummary: number;
  summaryLimit: number;
  remainingAts: number;
  atsLimit: number;
  isPremium: boolean;
}

export interface SuggestedSkills {
  skills: string[];
}

export interface CoverLetterRequest extends AiRequest {
  jobDescription: string;
}

export interface TailorRequest extends AiRequest {
  jobDescription: string;
}

export interface AiHistoryRecord {
  id: number;
  requestType: string;
  model: string;
  tokensUsed: number;
  timestamp: string;
  inputPrompt: string;
  response: string;
}
