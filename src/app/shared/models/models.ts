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

// ── Misc ──────────────────────────────────────────────────────────────────────

export interface ApiError {
  message: string;
  status?: number;
}
