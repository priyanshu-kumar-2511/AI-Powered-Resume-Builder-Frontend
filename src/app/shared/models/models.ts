// ── Auth & Identity Models ──────────────────────────────────────────────────
/**
 * Data required for user registration.
 */
export interface RegisterRequest {
  fullName: string;
  age: number;
  mobileNumber: string;
  email: string;
  username: string;
  password: string;
  otp?: string;
}

/**
 * Basic login credentials.
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Response structure after successful authentication.
 */
export interface LoginResponse {
  message: string;
  token: string; // Bearer token for JWT authentication
}

/**
 * Comprehensive user profile data used across the application.
 */
export interface UserProfileResponse {
  userId?: number;
  username: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  location?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  age: number;
  subscriptionPlan: 'FREE' | 'PREMIUM'; // Controls access to AI quotas and templates
  roles: string[];                       // e.g., ['ROLE_USER', 'ROLE_ADMIN']
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
export type TemplateTier = 'FREE' | 'PREMIUM';

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
  customizations?: string;
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
  templateId?: number | null;
  status?: ResumeStatus;
  customizations?: string;
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

// ── Export Service Models ────────────────────────────────────────────────────-

export type ExportFormat = 'PDF';
export type ExportStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface ExportJob {
  jobId: string;
  userId: number;
  resumeId: number;
  format: ExportFormat;
  status: ExportStatus;
  fileUrl: string | null;
  fileSizeKb: number | null;
  requestedAt: string;
  completedAt: string | null;
  expiresAt: string | null;
  templateId: number | null;
  customizations: string | null;
  failureReason?: string | null;
}

export interface ExportStats {
  userId: number;
  totalExports: number;
  todayPdfCount: number;
  countByFormat: Record<ExportFormat, number>;
}

export interface ExportCustomization {
  primaryColor?: string;
  fontFamily?: string;
  fontSize?: number;
  margins?: 'narrow' | 'normal' | 'wide';
}

// ── Notification Models ───────────────────────────────────────────────────────

export type NotificationType = 'INFO' | 'ALERT' | 'PROMO' | 'SYSTEM' | 'SUCCESS' | 'WARNING';
export type NotificationChannel = 'APP' | 'EMAIL';
export type NotificationTier = 'ALL' | 'FREE' | 'PREMIUM';

export interface Notification {
  id: number;
  recipientId: number;
  title: string;
  message: string;
  type: NotificationType;
  tier: NotificationTier;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export interface NotificationPage {
  content: Notification[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
