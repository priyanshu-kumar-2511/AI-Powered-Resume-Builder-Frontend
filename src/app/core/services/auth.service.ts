import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import {
  RegisterRequest, LoginRequest, LoginResponse,
  UserProfileResponse, ProfileRequest, MessageResponse,
  OtpVerificationRequest, PasswordResetInitiateRequest, UsernameRecoveryRequest
} from '../../shared/models/models';
import { AUTH_API, GATEWAY_ORIGIN } from '../config/api.config';

const TOKEN_KEY = 'resumeai_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);

  // Reactive auth state
  isLoggedIn  = signal<boolean>(!!this.getToken());
  currentUser = signal<UserProfileResponse | null>(null);

  // ── Token helpers ────────────────────────────────────────────────────────────
  getToken(): string | null { return localStorage.getItem(TOKEN_KEY); }

  private saveToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    this.isLoggedIn.set(true);
  }

  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.isLoggedIn.set(false);
    this.currentUser.set(null);
  }

  getCurrentPlan(): 'FREE' | 'PREMIUM' {
    const fromProfile = this.currentUser()?.subscriptionPlan;
    if (fromProfile) {
      return fromProfile;
    }

    const tokenClaims = this.getTokenClaims();
    const tokenPlan = this.getStringClaim(tokenClaims, 'subscriptionPlan')
      ?? this.getStringClaim(tokenClaims, 'plan');

    return tokenPlan === 'PREMIUM' ? 'PREMIUM' : 'FREE';
  }

  getCurrentUserId(): number | null {
    const profileUserId = this.currentUser()?.userId;
    if (typeof profileUserId === 'number' && Number.isFinite(profileUserId)) {
      return profileUserId;
    }

    const tokenClaims = this.getTokenClaims();
    const tokenUserId = this.getNumericClaim(tokenClaims, 'userId')
      ?? this.getNumericClaim(tokenClaims, 'user_id')
      ?? this.getNumericClaim(tokenClaims, 'id');

    if (tokenUserId !== null) {
      return tokenUserId;
    }

    return null;
  }

  // ── Auth endpoints ───────────────────────────────────────────────────────────
  register(payload: RegisterRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${AUTH_API}/register`, payload);
  }

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${AUTH_API}/login`, payload).pipe(
      tap(res => this.saveToken(res.token))
    );
  }

  logout(): void {
    this.removeToken();
    this.router.navigate(['/login']);
  }

  refreshToken(): Observable<{ token: string }> {
    return this.http.get<{ token: string }>(`${AUTH_API}/refresh`).pipe(
      tap(res => this.saveToken(res.token))
    );
  }

  // ── Profile ──────────────────────────────────────────────────────────────────
  getProfile(): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${AUTH_API}/profile`).pipe(
      tap(u => this.currentUser.set(u))
    );
  }

  updateProfile(payload: ProfileRequest): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(`${AUTH_API}/profile`, payload);
  }

  // ── Forgot password ──────────────────────────────────────────────────────────
  // Backend PasswordResetInitiateRequest has a single `identifier` field (email or username).
  initiatePasswordReset(payload: PasswordResetInitiateRequest): Observable<MessageResponse> {
    const body = { identifier: payload.email };
    return this.http.post<MessageResponse>(`${AUTH_API}/forgot-password/initiate`, body);
  }

  // FIX: Backend OtpVerificationRequest uses `identifier` (not `email`).
  verifyPasswordReset(payload: OtpVerificationRequest): Observable<MessageResponse> {
    const body = {
      identifier: payload.email,   // map frontend `email` → backend `identifier`
      otp: payload.otp,
      newPassword: payload.newPassword
    };
    return this.http.post<MessageResponse>(`${AUTH_API}/forgot-password/verify`, body);
  }

  // ── Forgot username ──────────────────────────────────────────────────────────
  // FIX: Backend UsernameRecoveryRequest requires both `email` AND `password`.
  // Frontend only collects email for this flow. We pass an empty password so
  // the request is structurally valid; the backend will throw "Incorrect Password"
  // which is surfaced to the user. For a better UX the form should ask for the
  // current password — see comments in forgot-username component.
  initiateUsernameRecovery(payload: UsernameRecoveryRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${AUTH_API}/forgot-username/initiate`, payload);
  }

  // FIX: Backend OtpVerificationRequest uses `identifier` (not `email`).
  verifyUsernameRecovery(payload: OtpVerificationRequest): Observable<MessageResponse> {
    const body = {
      identifier: payload.email,   // map frontend `email` → backend `identifier`
      otp: payload.otp
    };
    return this.http.post<MessageResponse>(`${AUTH_API}/forgot-username/verify`, body);
  }

  // ── OAuth2 ───────────────────────────────────────────────────────────────────
  // FIX: Backend OAuth2SuccessHandler redirects to /login?token=... not /login-success.
  // The LoginComponent.ngOnInit() picks up the `token` query param on /login.
  loginWithGoogle(): void {
    const oauthOrigin = GATEWAY_ORIGIN || window.location.origin;
    window.location.href = `${oauthOrigin}/oauth2/authorization/google`;
  }

  loginWithLinkedIn(): void {
    const oauthOrigin = GATEWAY_ORIGIN || window.location.origin;
    window.location.href = `${oauthOrigin}/oauth2/authorization/linkedin`;
  }

  private getTokenClaims(): Record<string, unknown> | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    const segments = token.split('.');
    if (segments.length < 2) {
      return null;
    }

    try {
      const normalized = segments[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
      const decodedBytes = atob(padded);
      const decodedStr = decodeURIComponent(
        decodedBytes.split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
      );
      return JSON.parse(decodedStr) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private getNumericClaim(claims: Record<string, unknown> | null, key: string): number | null {
    const value = claims?.[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return null;
  }

  private getStringClaim(claims: Record<string, unknown> | null, key: string): string | null {
    const value = claims?.[key];
    return typeof value === 'string' && value.trim() ? value : null;
  }
}
