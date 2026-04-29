// ── Auth Models ──────────────────────────────────────────────────────────────

export interface RegisterRequest {
  fullName: string;
  age: number;
  mobileNumber: string;
  email: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
}

export interface UserProfileResponse {
  userId?: number;
  username: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  age: number;
  subscriptionPlan: 'FREE' | 'PREMIUM';
  roles: string[];
  isActive: boolean;
}

export interface ProfileRequest {
  fullName?: string;
  mobileNumber?: string;
  age?: number;
}

/**
 * FIX: Frontend uses `email` as the identifier field.
 * The AuthService maps this to `identifier` before sending to the backend,
 * because the backend OtpVerificationRequest DTO uses `identifier`.
 */
export interface OtpVerificationRequest {
  email: string;       // displayed as "email" in forms; mapped to `identifier` in AuthService
  otp: string;
  newPassword?: string;
}

/**
 * FIX: Backend PasswordResetInitiateRequest requires `username` + `email`.
 * AuthService sends email in both fields so findByUsernameOrEmail() succeeds.
 * The frontend form only collects `email`.
 */
export interface PasswordResetInitiateRequest {
  email: string;
}

/**
 * FIX: Backend UsernameRecoveryRequest requires `email` + `password`.
 * The forgot-username form now collects both.
 */
export interface UsernameRecoveryRequest {
  email: string;
  password: string;
}

export interface MessageResponse {
  message: string;
}

// ── Template Models ───────────────────────────────────────────────────────────

export type TemplateCategory = 'PROFESSIONAL' | 'CREATIVE' | 'MODERN' | 'MINIMALIST' | 'ATS_OPTIMISED';
export type TemplateTier     = 'FREE' | 'PREMIUM';

export interface TemplateResponseDTO {
  templateId: number;
  name: string;
  description: string;
  thumbnailUrl: string;
  category: TemplateCategory;
  tier: TemplateTier;
  usageCount: number;
}

export interface Template extends TemplateResponseDTO {
  htmlLayout: string;
  cssStyles: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Resume Models

export type ResumeStatus = 'DRAFT' | 'COMPLETE';

export interface Resume {
  resumeId: number;
  userId: number;
  title: string;
  targetJobTitle: string;
  templateId: number | null;
  atsScore: number;
  status: ResumeStatus;
  language: string;
  isPublic: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResumeRequest {
  userId: number;
  title: string;
  templateId?: number | null;
  targetJobTitle?: string;
  language?: string;
}

export interface UpdateResumeRequest {
  title?: string;
  targetJobTitle?: string;
  language?: string;
  status?: ResumeStatus;
}

// ── Misc ──────────────────────────────────────────────────────────────────────

export interface ApiError {
  message: string;
  status?: number;
}

// ── Builder / Section Models ──────────────────────────────────────────────────

export type SectionType =
  | 'SUMMARY'
  | 'EXPERIENCE'
  | 'EDUCATION'
  | 'SKILLS'
  | 'CERTIFICATIONS'
  | 'PROJECTS'
  | 'LANGUAGES'
  | 'VOLUNTEER'
  | 'CUSTOM';

export interface ResumeSection {
  sectionId: number;
  resumeId: number;
  sectionType: SectionType;
  title: string;
  content: string;          // JSON string — shape varies by sectionType
  displayOrder: number;
  isVisible: boolean;
  aiGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddSectionRequest {
  resumeId: number;
  sectionType: SectionType;
  title: string;
  content?: string;
  displayOrder?: number;
}

export interface UpdateSectionRequest {
  title?: string;
  content?: string;
  displayOrder?: number;
  isVisible?: boolean;
  aiGenerated?: boolean;
}

export interface ReorderRequest {
  sectionIds: number[];
}

export interface BulkUpdateRequest {
  sections: ResumeSection[];
}

// ── AI Models ─────────────────────────────────────────────────────────────────

export interface AiQuota {
  userId: number;
  used: number;
  limit: number;
  remaining: number;
}

export interface AiSummaryRequest {
  resumeId: number;
  targetJobTitle?: string;
  existingContent?: string;
}

export interface AiBulletsRequest {
  resumeId: number;
  company: string;
  role: string;
  existingBullets?: string[];
}

export interface AiSkillsResponse {
  skills: string[];
}

// ── AI Extended Models (from MODELS_PATCH) ────────────────────────────────────
// NOTE: AiHistoryRecord, AtsReport, AiResponse already exist in features/ai/models/ai.models.ts
// These are added here so shared/models/models.ts is the single source of truth.

export interface AiHistoryRecord {
  id: number;
  requestType: string;
  model: string;
  tokensUsed: number;
  timestamp: string;
  inputPrompt: string;
  response: string;
}

export interface AtsReport {
  score: number;
  suggestions: string[];
  missingKeywords?: string[];
}

export interface AiResponse {
  content: string;
  tokensUsed?: number;
  model?: string;
  requestType?: string;
  timestamp?: string;
}
